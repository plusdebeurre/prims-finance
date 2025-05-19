from fastapi import APIRouter, HTTPException, Depends, status, UploadFile, File, Form
from datetime import datetime
from typing import List, Optional
import uuid

from ..db import db
from ..models import User, GeneralConditions
from ..auth import get_current_active_user

router = APIRouter(prefix="/general-conditions", tags=["general-conditions"])

# Get all general conditions (admin only)
@router.get("/", response_model=List[GeneralConditions])
async def get_all_general_conditions(
    current_user: User = Depends(get_current_active_user)
):
    # Check if user is admin or super admin
    if not current_user.get("isAdmin", False) and not current_user.get("isSuperAdmin", False):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access general conditions"
        )
    
    # Get all general conditions, sorted by version
    conditions = await db.general_conditions.find().sort("version", -1).to_list(1000)
    
    return conditions

# Get active general conditions (public)
@router.get("/active", response_model=GeneralConditions)
async def get_active_general_conditions():
    # Get the most recent active general conditions
    conditions = await db.general_conditions.find_one(
        {"is_active": True},
        sort=[("version", -1)]
    )
    
    if not conditions:
        # Return a placeholder if no active conditions exist
        return {
            "id": "placeholder",
            "title": "General Terms and Conditions",
            "content": "General terms and conditions will be provided soon.",
            "version": "1.0",
            "is_active": True,
            "created_at": datetime.utcnow()
        }
    
    return conditions

# Get specific general conditions by ID
@router.get("/{conditions_id}", response_model=GeneralConditions)
async def get_general_conditions(
    conditions_id: str,
    current_user: User = Depends(get_current_active_user)
):
    conditions = await db.general_conditions.find_one({"id": conditions_id})
    
    if not conditions:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="General conditions not found"
        )
    
    return conditions

# Create new general conditions (admin only)
@router.post("/", response_model=GeneralConditions)
async def create_general_conditions(
    title: str = Form(...),
    content: str = Form(...),
    version: str = Form(...),
    is_active: bool = Form(False),
    current_user: User = Depends(get_current_active_user)
):
    # Check if user is admin or super admin
    if not current_user.get("isAdmin", False) and not current_user.get("isSuperAdmin", False):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to create general conditions"
        )
    
    # If setting as active, deactivate all other conditions
    if is_active:
        await db.general_conditions.update_many(
            {},
            {"$set": {"is_active": False}}
        )
    
    # Create new general conditions
    new_conditions = {
        "id": str(uuid.uuid4()),
        "title": title,
        "content": content,
        "version": version,
        "is_active": is_active,
        "created_by": current_user["id"],
        "created_at": datetime.utcnow()
    }
    
    await db.general_conditions.insert_one(new_conditions)
    
    return new_conditions

# Update general conditions (admin only)
@router.put("/{conditions_id}", response_model=GeneralConditions)
async def update_general_conditions(
    conditions_id: str,
    title: str = Form(...),
    content: str = Form(...),
    version: str = Form(...),
    is_active: bool = Form(False),
    current_user: User = Depends(get_current_active_user)
):
    # Check if user is admin or super admin
    if not current_user.get("isAdmin", False) and not current_user.get("isSuperAdmin", False):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update general conditions"
        )
    
    # Check if conditions exist
    existing = await db.general_conditions.find_one({"id": conditions_id})
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="General conditions not found"
        )
    
    # If setting as active, deactivate all other conditions
    if is_active:
        await db.general_conditions.update_many(
            {"id": {"$ne": conditions_id}},
            {"$set": {"is_active": False}}
        )
    
    # Update general conditions
    update_data = {
        "title": title,
        "content": content,
        "version": version,
        "is_active": is_active,
        "updated_by": current_user["id"],
        "updated_at": datetime.utcnow()
    }
    
    await db.general_conditions.update_one(
        {"id": conditions_id},
        {"$set": update_data}
    )
    
    # Get updated conditions
    updated = await db.general_conditions.find_one({"id": conditions_id})
    
    return updated

# Delete general conditions (admin only)
@router.delete("/{conditions_id}")
async def delete_general_conditions(
    conditions_id: str,
    current_user: User = Depends(get_current_active_user)
):
    # Check if user is admin or super admin
    if not current_user.get("isAdmin", False) and not current_user.get("isSuperAdmin", False):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete general conditions"
        )
    
    # Check if conditions exist
    existing = await db.general_conditions.find_one({"id": conditions_id})
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="General conditions not found"
        )
    
    # If conditions are active, prevent deletion
    if existing.get("is_active", False):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete active general conditions. Deactivate first or set another version as active."
        )
    
    # Delete general conditions
    result = await db.general_conditions.delete_one({"id": conditions_id})
    
    if not result.deleted_count:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete general conditions"
        )
    
    return {"message": "General conditions deleted successfully"}
