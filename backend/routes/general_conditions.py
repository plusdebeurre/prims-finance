from fastapi import APIRouter, HTTPException, Depends, Body, status
from typing import List, Optional
import uuid
from datetime import datetime

from models import GeneralConditions, GeneralConditionsCreate, User
from auth import get_current_user, get_admin_user, verify_company_access, verify_supplier_access
from utils import db, create_notification

router = APIRouter(prefix="/general-conditions", tags=["general-conditions"])

# Create general conditions
@router.post("", response_model=GeneralConditions)
async def create_general_conditions(
    gc: GeneralConditionsCreate,
    current_user: User = Depends(get_admin_user)
):
    # Verify company access
    await verify_company_access(gc.client_company_id, current_user)
    
    # If active, deactivate other GCs for this company
    if gc.is_active:
        await db.general_conditions.update_many(
            {
                "client_company_id": gc.client_company_id,
                "is_active": True
            },
            {"$set": {"is_active": False}}
        )
    
    # Create GC object
    db_gc = GeneralConditions(
        id=str(uuid.uuid4()),
        version=gc.version,
        issue_date=gc.issue_date or datetime.utcnow(),
        content=gc.content,
        is_active=gc.is_active,
        client_company_id=gc.client_company_id,
        created_by=current_user.id,
        created_at=datetime.utcnow()
    )
    
    # Save to database
    await db.general_conditions.insert_one(db_gc.dict())
    
    # If active, notify all suppliers of this company
    if gc.is_active:
        # Get all suppliers for this company
        suppliers = await db.suppliers.find({
            "client_company_id": gc.client_company_id
        }).to_list(length=1000)
        
        # Get all supplier users
        for supplier in suppliers:
            supplier_users = await db.users.find({
                "role": "supplier",
                "supplier_id": supplier["id"]
            }).to_list(length=100)
            
            for user in supplier_users:
                notification = create_notification(
                    user_id=user["id"],
                    type="gc_acceptance_required",
                    title="New General Conditions",
                    message="New general conditions have been published. Please review and accept them.",
                    target_id=db_gc.id,
                    target_type="general_conditions",
                    client_company_id=gc.client_company_id
                )
                await db.notifications.insert_one(notification)
    
    return db_gc

# Get all general conditions for a company
@router.get("", response_model=List[GeneralConditions])
async def get_general_conditions(
    client_company_id: str,
    active_only: bool = False,
    current_user: User = Depends(get_current_user)
):
    # Verify company access
    await verify_company_access(client_company_id, current_user)
    
    # Build query
    query = {"client_company_id": client_company_id}
    
    if active_only:
        query["is_active"] = True
    
    # Query database
    general_conditions = await db.general_conditions.find(query).to_list(length=100)
    
    return general_conditions

# Get active general conditions for a company
@router.get("/active", response_model=GeneralConditions)
async def get_active_general_conditions(
    client_company_id: str,
    current_user: User = Depends(get_current_user)
):
    # Verify company access
    await verify_company_access(client_company_id, current_user)
    
    # Query database
    gc = await db.general_conditions.find_one({
        "client_company_id": client_company_id,
        "is_active": True
    })
    
    if not gc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No active general conditions found"
        )
    
    return gc

# Get general conditions by ID
@router.get("/{gc_id}", response_model=GeneralConditions)
async def get_general_conditions_by_id(
    gc_id: str,
    current_user: User = Depends(get_current_user)
):
    # Get general conditions
    gc = await db.general_conditions.find_one({"id": gc_id})
    if not gc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="General conditions not found"
        )
    
    # Verify company access
    await verify_company_access(gc.get("client_company_id"), current_user)
    
    return gc

# Update general conditions
@router.put("/{gc_id}", response_model=GeneralConditions)
async def update_general_conditions(
    gc_id: str,
    version: Optional[str] = Body(None),
    content: Optional[str] = Body(None),
    is_active: Optional[bool] = Body(None),
    current_user: User = Depends(get_admin_user)
):
    # Get general conditions
    gc = await db.general_conditions.find_one({"id": gc_id})
    if not gc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="General conditions not found"
        )
    
    # Verify company access
    await verify_company_access(gc.get("client_company_id"), current_user)
    
    # Prepare update data
    update_data = {}
    
    if version is not None:
        update_data["version"] = version
    
    if content is not None:
        update_data["content"] = content
    
    if is_active is not None:
        update_data["is_active"] = is_active
        
        # If setting to active, deactivate other GCs
        if is_active:
            await db.general_conditions.update_many(
                {
                    "client_company_id": gc.get("client_company_id"),
                    "is_active": True,
                    "id": {"$ne": gc_id}
                },
                {"$set": {"is_active": False}}
            )
    
    # Update general conditions
    if update_data:
        await db.general_conditions.update_one(
            {"id": gc_id},
            {"$set": update_data}
        )
    
    # Get updated general conditions
    updated_gc = await db.general_conditions.find_one({"id": gc_id})
    
    # If activated, notify suppliers
    if is_active and is_active != gc.get("is_active"):
        # Get all suppliers for this company
        suppliers = await db.suppliers.find({
            "client_company_id": gc.get("client_company_id")
        }).to_list(length=1000)
        
        # Get all supplier users
        for supplier in suppliers:
            supplier_users = await db.users.find({
                "role": "supplier",
                "supplier_id": supplier["id"]
            }).to_list(length=100)
            
            for user in supplier_users:
                notification = create_notification(
                    user_id=user["id"],
                    type="gc_acceptance_required",
                    title="New General Conditions",
                    message="New general conditions have been published. Please review and accept them.",
                    target_id=gc_id,
                    target_type="general_conditions",
                    client_company_id=gc.get("client_company_id")
                )
                await db.notifications.insert_one(notification)
    
    return updated_gc

# Delete general conditions
@router.delete("/{gc_id}")
async def delete_general_conditions(
    gc_id: str,
    current_user: User = Depends(get_admin_user)
):
    # Get general conditions
    gc = await db.general_conditions.find_one({"id": gc_id})
    if not gc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="General conditions not found"
        )
    
    # Verify company access
    await verify_company_access(gc.get("client_company_id"), current_user)
    
    # Check if GC is used in any acceptances
    acceptances = await db.gc_acceptances.find_one({"gc_id": gc_id})
    if acceptances:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete general conditions that have been accepted"
        )
    
    # Delete general conditions
    await db.general_conditions.delete_one({"id": gc_id})
    
    return {"message": "General conditions deleted successfully"}

# Get supplier GC acceptances
@router.get("/{gc_id}/acceptances", response_model=List[dict])
async def get_gc_acceptances(
    gc_id: str,
    current_user: User = Depends(get_admin_user)
):
    # Get general conditions
    gc = await db.general_conditions.find_one({"id": gc_id})
    if not gc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="General conditions not found"
        )
    
    # Verify company access
    await verify_company_access(gc.get("client_company_id"), current_user)
    
    # Get acceptances
    acceptances = await db.gc_acceptances.find({
        "gc_id": gc_id
    }).to_list(length=1000)
    
    # Get supplier details
    result = []
    for acceptance in acceptances:
        supplier_id = acceptance.get("supplier_id")
        supplier = await db.suppliers.find_one({"id": supplier_id})
        user = await db.users.find_one({"id": acceptance.get("accepted_by")})
        
        result.append({
            "acceptance": acceptance,
            "supplier": supplier,
            "user": {
                "id": user.get("id") if user else None,
                "name": user.get("name") if user else None,
                "email": user.get("email") if user else None
            }
        })
    
    return result
