from fastapi import APIRouter, HTTPException, Depends, File, UploadFile, Form, Body, status
from fastapi.responses import FileResponse
from typing import List, Optional, Dict, Any
import uuid
import shutil
from datetime import datetime

from models import Invoice, InvoiceCreate, User, InvoiceStatus
from auth import get_current_user, get_admin_user, verify_supplier_access, verify_company_access
from utils import db, INVOICES_DIR, create_notification

router = APIRouter(prefix="/invoices", tags=["invoices"])

# Upload invoice
@router.post("", response_model=Invoice)
async def upload_invoice(
    supplier_id: str = Form(...),
    amount: float = Form(...),
    due_date: str = Form(...),
    purchase_order_id: Optional[str] = Form(None),
    notes: Optional[str] = Form(None),
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    # Verify access
    await verify_supplier_access(supplier_id, current_user)
    
    # Get supplier
    supplier = await db.suppliers.find_one({"id": supplier_id})
    if not supplier:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Supplier not found"
        )
    
    # Check if supplier has accepted general conditions (if they are a supplier user)
    if current_user.role == "supplier":
        gc = await db.general_conditions.find_one({
            "is_active": True,
            "client_company_id": supplier.get("client_company_id")
        })
        
        if gc:
            acceptance = await db.gc_acceptances.find_one({
                "supplier_id": supplier_id,
                "gc_id": gc["id"]
            })
            
            if not acceptance:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="You must accept the general conditions before uploading invoices"
                )
    
    # Check purchase order if provided
    if purchase_order_id:
        po = await db.purchase_orders.find_one({"id": purchase_order_id})
        if not po:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Purchase order not found"
            )
        
        # Check if PO belongs to this supplier
        if po.get("supplier_id") != supplier_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Purchase order does not belong to this supplier"
            )
        
        # Check if PO is signed (if required)
        if po.get("require_signature") and po.get("status") != "signed":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Purchase order requires signature before invoicing"
            )
    
    # Parse due date
    try:
        due_date_obj = datetime.fromisoformat(due_date)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid due date format. Use ISO format (YYYY-MM-DD)"
        )
    
    # Save file
    filename = f"invoice_{supplier_id}_{uuid.uuid4()}_{file.filename}"
    file_path = INVOICES_DIR / filename
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # Create invoice
    invoice = Invoice(
        id=str(uuid.uuid4()),
        supplier_id=supplier_id,
        file_path=str(file_path),
        amount=amount,
        due_date=due_date_obj,
        status=InvoiceStatus.PENDING,
        purchase_order_id=purchase_order_id,
        notes=notes,
        client_company_id=supplier.get("client_company_id"),
        uploaded_by=current_user.id,
        upload_date=datetime.utcnow()
    )
    
    # Save to database
    await db.invoices.insert_one(invoice.dict())
    
    # Notify admin users
    admin_users = await db.users.find({
        "role": "admin",
        "company_id": supplier.get("client_company_id")
    }).to_list(length=100)
    
    for admin in admin_users:
        notification = create_notification(
            user_id=admin["id"],
            type="invoice_uploaded",
            title="New Invoice Uploaded",
            message=f"Supplier {supplier.get('name')} has uploaded a new invoice for {amount} €",
            target_id=invoice.id,
            target_type="invoice",
            client_company_id=supplier.get("client_company_id")
        )
        await db.notifications.insert_one(notification)
    
    # Auto-forward to email if configured
    company = await db.client_companies.find_one({"id": supplier.get("client_company_id")})
    if company and company.get("settings", {}).get("forward_invoices_email"):
        # This would send an email with the invoice attachment
        # For now we'll just log it
        print(f"Would forward invoice to {company.get('settings').get('forward_invoices_email')}")
    
    return invoice

# Get invoices
@router.get("", response_model=List[Invoice])
async def get_invoices(
    supplier_id: Optional[str] = None,
    status: Optional[InvoiceStatus] = None,
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
        # Supplier can only see their own invoices
        query["supplier_id"] = current_user.supplier_id
    elif current_user.role == "admin":
        # Admin can only see invoices in their company
        query["client_company_id"] = current_user.company_id
    
    # Filter by status if provided
    if status:
        query["status"] = status
    
    # Query database
    invoices = await db.invoices.find(query).to_list(length=100)
    
    return invoices

# Get invoice by ID
@router.get("/{invoice_id}", response_model=Invoice)
async def get_invoice(
    invoice_id: str,
    current_user: User = Depends(get_current_user)
):
    # Get invoice
    invoice = await db.invoices.find_one({"id": invoice_id})
    if not invoice:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invoice not found"
        )
    
    # Verify access
    if current_user.role == "supplier":
        if current_user.supplier_id != invoice.get("supplier_id"):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to access this invoice"
            )
    elif current_user.role == "admin":
        if current_user.company_id != invoice.get("client_company_id"):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to access this invoice"
            )
    
    return invoice

# Download invoice file
@router.get("/{invoice_id}/download")
async def download_invoice(
    invoice_id: str,
    current_user: User = Depends(get_current_user)
):
    # Get invoice
    invoice = await db.invoices.find_one({"id": invoice_id})
    if not invoice:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invoice not found"
        )
    
    # Verify access
    if current_user.role == "supplier":
        if current_user.supplier_id != invoice.get("supplier_id"):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to access this invoice"
            )
    elif current_user.role == "admin":
        if current_user.company_id != invoice.get("client_company_id"):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to access this invoice"
            )
    
    # Return file
    return FileResponse(
        path=invoice.get("file_path"),
        filename=invoice.get("file_path").split('/')[-1]
    )

# Update invoice status (admin only)
@router.put("/{invoice_id}/status", response_model=Invoice)
async def update_invoice_status(
    invoice_id: str,
    status: InvoiceStatus = Body(...),
    payment_date: Optional[str] = Body(None),
    notes: Optional[str] = Body(None),
    current_user: User = Depends(get_admin_user)
):
    # Get invoice
    invoice = await db.invoices.find_one({"id": invoice_id})
    if not invoice:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invoice not found"
        )
    
    # Verify company access
    if current_user.role != "super_admin" and current_user.company_id != invoice.get("client_company_id"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this invoice"
        )
    
    # Prepare update data
    update_data = {"status": status}
    
    # Add payment date if provided and status is paid
    if status == InvoiceStatus.PAID and payment_date:
        try:
            payment_date_obj = datetime.fromisoformat(payment_date)
            update_data["payment_date"] = payment_date_obj
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid payment date format. Use ISO format (YYYY-MM-DD)"
            )
    
    # Add notes if provided
    if notes is not None:
        update_data["notes"] = notes
    
    # Set approval info
    if status in [InvoiceStatus.APPROVED, InvoiceStatus.PAID]:
        update_data["approved_by"] = current_user.id
        update_data["approval_date"] = datetime.utcnow()
    
    # Update invoice
    await db.invoices.update_one(
        {"id": invoice_id},
        {"$set": update_data}
    )
    
    # Get updated invoice
    updated_invoice = await db.invoices.find_one({"id": invoice_id})
    
    # Notify supplier
    supplier_users = await db.users.find({
        "role": "supplier",
        "supplier_id": invoice.get("supplier_id")
    }).to_list(length=100)
    
    notification_type = "invoice_approved" if status == InvoiceStatus.APPROVED else "invoice_paid"
    notification_title = "Invoice Approved" if status == InvoiceStatus.APPROVED else "Invoice Paid"
    notification_message = "Your invoice has been approved" if status == InvoiceStatus.APPROVED else "Your invoice has been paid"
    
    if status in [InvoiceStatus.APPROVED, InvoiceStatus.PAID]:
        for user in supplier_users:
            notification = create_notification(
                user_id=user["id"],
                type=notification_type,
                title=notification_title,
                message=notification_message,
                target_id=invoice_id,
                target_type="invoice",
                client_company_id=invoice.get("client_company_id")
            )
            await db.notifications.insert_one(notification)
    
    return updated_invoice

# Delete invoice
@router.delete("/{invoice_id}")
async def delete_invoice(
    invoice_id: str,
    current_user: User = Depends(get_current_user)
):
    # Get invoice
    invoice = await db.invoices.find_one({"id": invoice_id})
    if not invoice:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invoice not found"
        )
    
    # Verify access
    if current_user.role == "supplier":
        if current_user.supplier_id != invoice.get("supplier_id"):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to delete this invoice"
            )
        
        # Supplier can only delete pending invoices
        if invoice.get("status") != InvoiceStatus.PENDING:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot delete invoices that have been processed"
            )
    elif current_user.role == "admin":
        if current_user.company_id != invoice.get("client_company_id"):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to delete this invoice"
            )
    
    # Delete invoice
    await db.invoices.delete_one({"id": invoice_id})
    
    # Attempt to delete file
    try:
        import os
        if os.path.exists(invoice.get("file_path")):
            os.remove(invoice.get("file_path"))
    except Exception as e:
        # Log error but continue
        print(f"Error deleting file: {e}")
    
    return {"message": "Invoice deleted successfully"}
