from fastapi import APIRouter, HTTPException, Depends, Body, status
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime

from models import PurchaseOrder, PurchaseOrderCreate, PurchaseOrderItem, User
from auth import get_current_user, get_admin_user, verify_supplier_access, verify_company_access
from utils import db, create_notification

router = APIRouter(prefix="/purchase-orders", tags=["purchase-orders"])

# Create purchase order
@router.post("", response_model=PurchaseOrder)
async def create_purchase_order(
    po: PurchaseOrderCreate,
    current_user: User = Depends(get_admin_user)
):
    # Verify company access
    await verify_company_access(po.client_company_id, current_user)
    
    # Check if supplier exists
    supplier = await db.suppliers.find_one({"id": po.supplier_id})
    if not supplier:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Supplier not found"
        )
    
    # Check if supplier belongs to company
    if supplier.get("client_company_id") != po.client_company_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Supplier does not belong to this company"
        )
    
    # Create purchase order
    purchase_order = PurchaseOrder(
        id=str(uuid.uuid4()),
        supplier_id=po.supplier_id,
        items=po.items,
        total_amount=po.total_amount,
        status="draft",
        notes=po.notes,
        require_signature=po.require_signature,
        client_company_id=po.client_company_id,
        created_by=current_user.id,
        created_at=datetime.utcnow()
    )
    
    # Save to database
    await db.purchase_orders.insert_one(purchase_order.dict())
    
    return purchase_order

# Get purchase orders
@router.get("", response_model=List[PurchaseOrder])
async def get_purchase_orders(
    supplier_id: Optional[str] = None,
    status: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    # Build query
    query = {}
    
    # Filter by supplier if provided
    if supplier_id:
        # Verify access to supplier
        await verify_supplier_access(supplier_id, current_user)
        query["supplier_id"] = supplier_id
    elif current_user.role == "supplier":
        # Supplier can only see their own purchase orders
        query["supplier_id"] = current_user.supplier_id
    elif current_user.role == "admin":
        # Admin can only see purchase orders in their company
        query["client_company_id"] = current_user.company_id
    
    # Filter by status if provided
    if status:
        query["status"] = status
    
    # Query database
    purchase_orders = await db.purchase_orders.find(query).to_list(length=100)
    
    return purchase_orders

# Get purchase order by ID
@router.get("/{po_id}", response_model=PurchaseOrder)
async def get_purchase_order(
    po_id: str,
    current_user: User = Depends(get_current_user)
):
    # Get purchase order
    purchase_order = await db.purchase_orders.find_one({"id": po_id})
    if not purchase_order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Purchase order not found"
        )
    
    # Verify access
    if current_user.role == "supplier":
        if current_user.supplier_id != purchase_order.get("supplier_id"):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to access this purchase order"
            )
    elif current_user.role == "admin":
        if current_user.company_id != purchase_order.get("client_company_id"):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to access this purchase order"
            )
    
    return purchase_order

# Update purchase order
@router.put("/{po_id}", response_model=PurchaseOrder)
async def update_purchase_order(
    po_id: str,
    items: Optional[List[PurchaseOrderItem]] = Body(None),
    total_amount: Optional[float] = Body(None),
    notes: Optional[str] = Body(None),
    require_signature: Optional[bool] = Body(None),
    current_user: User = Depends(get_admin_user)
):
    # Get purchase order
    purchase_order = await db.purchase_orders.find_one({"id": po_id})
    if not purchase_order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Purchase order not found"
        )
    
    # Verify company access
    await verify_company_access(purchase_order.get("client_company_id"), current_user)
    
    # Check if purchase order can be updated
    if purchase_order.get("status") != "draft":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot update purchase order that is not in draft status"
        )
    
    # Prepare update data
    update_data = {}
    
    if items is not None:
        update_data["items"] = [item.dict() for item in items]
    
    if total_amount is not None:
        update_data["total_amount"] = total_amount
    
    if notes is not None:
        update_data["notes"] = notes
    
    if require_signature is not None:
        update_data["require_signature"] = require_signature
    
    # Update purchase order
    if update_data:
        await db.purchase_orders.update_one(
            {"id": po_id},
            {"$set": update_data}
        )
    
    # Get updated purchase order
    updated_po = await db.purchase_orders.find_one({"id": po_id})
    
    return updated_po

# Send purchase order
@router.post("/{po_id}/send", response_model=PurchaseOrder)
async def send_purchase_order(
    po_id: str,
    current_user: User = Depends(get_admin_user)
):
    # Get purchase order
    purchase_order = await db.purchase_orders.find_one({"id": po_id})
    if not purchase_order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Purchase order not found"
        )
    
    # Verify company access
    await verify_company_access(purchase_order.get("client_company_id"), current_user)
    
    # Check if purchase order can be sent
    if purchase_order.get("status") != "draft":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Purchase order already sent"
        )
    
    # Update purchase order
    await db.purchase_orders.update_one(
        {"id": po_id},
        {"$set": {
            "status": "sent",
            "sent_at": datetime.utcnow()
        }}
    )
    
    # Get updated purchase order
    updated_po = await db.purchase_orders.find_one({"id": po_id})
    
    # Notify supplier
    supplier_users = await db.users.find({
        "role": "supplier",
        "supplier_id": purchase_order.get("supplier_id")
    }).to_list(length=100)
    
    supplier = await db.suppliers.find_one({"id": purchase_order.get("supplier_id")})
    supplier_name = supplier.get("name") if supplier else "Unknown"
    
    for user in supplier_users:
        notification = create_notification(
            user_id=user["id"],
            type="po_created",
            title="New Purchase Order",
            message=f"You have received a new purchase order for {updated_po.get('total_amount')} €",
            target_id=po_id,
            target_type="purchase_order",
            client_company_id=purchase_order.get("client_company_id")
        )
        await db.notifications.insert_one(notification)
    
    return updated_po

# Cancel purchase order
@router.post("/{po_id}/cancel", response_model=PurchaseOrder)
async def cancel_purchase_order(
    po_id: str,
    current_user: User = Depends(get_admin_user)
):
    # Get purchase order
    purchase_order = await db.purchase_orders.find_one({"id": po_id})
    if not purchase_order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Purchase order not found"
        )
    
    # Verify company access
    await verify_company_access(purchase_order.get("client_company_id"), current_user)
    
    # Check if purchase order can be cancelled
    if purchase_order.get("status") not in ["draft", "sent"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot cancel purchase order that is already signed"
        )
    
    # Update purchase order
    await db.purchase_orders.update_one(
        {"id": po_id},
        {"$set": {
            "status": "cancelled",
            "cancelled_at": datetime.utcnow()
        }}
    )
    
    # Get updated purchase order
    updated_po = await db.purchase_orders.find_one({"id": po_id})
    
    # If was already sent, notify supplier
    if purchase_order.get("status") == "sent":
        supplier_users = await db.users.find({
            "role": "supplier",
            "supplier_id": purchase_order.get("supplier_id")
        }).to_list(length=100)
        
        for user in supplier_users:
            notification = create_notification(
                user_id=user["id"],
                type="po_cancelled",
                title="Purchase Order Cancelled",
                message=f"A purchase order has been cancelled",
                target_id=po_id,
                target_type="purchase_order",
                client_company_id=purchase_order.get("client_company_id")
            )
            await db.notifications.insert_one(notification)
    
    return updated_po

# Sign purchase order (supplier)
@router.post("/{po_id}/sign", response_model=PurchaseOrder)
async def sign_purchase_order(
    po_id: str,
    name: str = Body(...),
    surname: str = Body(...),
    current_user: User = Depends(get_current_user)
):
    # Get purchase order
    purchase_order = await db.purchase_orders.find_one({"id": po_id})
    if not purchase_order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Purchase order not found"
        )
    
    # Verify access
    if current_user.role == "supplier":
        if current_user.supplier_id != purchase_order.get("supplier_id"):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to sign this purchase order"
            )
    else:
        # Only suppliers can sign purchase orders
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only suppliers can sign purchase orders"
        )
    
    # Check if purchase order can be signed
    if purchase_order.get("status") != "sent":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Purchase order cannot be signed in its current status"
        )
    
    # Check if signature is required
    if not purchase_order.get("require_signature"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This purchase order does not require a signature"
        )
    
    # Update purchase order
    await db.purchase_orders.update_one(
        {"id": po_id},
        {"$set": {
            "status": "signed",
            "signed_at": datetime.utcnow(),
            "signer_name": name,
            "signer_surname": surname
        }}
    )
    
    # Get updated purchase order
    updated_po = await db.purchase_orders.find_one({"id": po_id})
    
    # Notify admin users
    admin_users = await db.users.find({
        "role": "admin",
        "company_id": purchase_order.get("client_company_id")
    }).to_list(length=100)
    
    for user in admin_users:
        notification = create_notification(
            user_id=user["id"],
            type="po_signed",
            title="Purchase Order Signed",
            message=f"Purchase order has been signed by supplier",
            target_id=po_id,
            target_type="purchase_order",
            client_company_id=purchase_order.get("client_company_id")
        )
        await db.notifications.insert_one(notification)
    
    return updated_po
