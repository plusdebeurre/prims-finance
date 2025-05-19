from fastapi import APIRouter, HTTPException, Depends, status, Query
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from datetime import datetime, timedelta
from typing import List, Optional
from bson.objectid import ObjectId
import uuid
import jwt
import re
import os

import sys
import os

# Add the parent directory to the path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from utils import db
from models import User, UserCreate, UserRole, UserUpdate, UserPasswordUpdate
from auth import create_access_token, get_password_hash, verify_password, get_current_user, get_current_active_user

router = APIRouter(prefix="/auth", tags=["auth"])

# Token endpoint
@router.post("/token")
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    # Find user by email
    user = await db.users.find_one({"email": form_data.username})
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Verify password
    if not verify_password(form_data.password, user.get("password_hash", "")):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Check if user is active
    if not user.get("is_active", True):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account is inactive",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Create access token
    token_data = {
        "sub": str(user["id"]),
        "email": user["email"],
        "role": user["role"]
    }
    
    # Add company_id if it exists
    if "company_id" in user and user["company_id"]:
        token_data["company_id"] = str(user["company_id"])
    
    # Add supplier_id if it exists
    if "supplier_id" in user and user["supplier_id"]:
        token_data["supplier_id"] = str(user["supplier_id"])
    
    access_token = create_access_token(data=token_data)
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user_id": user["id"],
        "role": user["role"],
        "name": user.get("name"),
        "company_id": user.get("company_id"),
        "supplier_id": user.get("supplier_id")
    }

# Register a new supplier account
@router.post("/register", response_model=User)
async def register_supplier(user: UserCreate):
    # Check if email is already registered
    existing_user = await db.users.find_one({"email": user.email})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Ensure user is created as a supplier
    if user.role != UserRole.SUPPLIER:
        user.role = UserRole.SUPPLIER  # Force role to be supplier regardless of what was sent
    
    # Generate a supplier ID
    supplier_id = str(uuid.uuid4())
    
    # Create company data document for the supplier
    company_data = user.company_data.dict() if user.company_data else {}
    company_data["id"] = str(uuid.uuid4())
    company_data["supplier_id"] = supplier_id
    company_data["created_at"] = datetime.utcnow()
    
    await db.companies.insert_one(company_data)
    
    # Create supplier document
    supplier_data = {
        "id": supplier_id,
        "name": user.name,
        "email": user.email,
        "company_data": company_data,
        "created_at": datetime.utcnow(),
        "status": "active"
    }
    
    await db.suppliers.insert_one(supplier_data)
    
    # Create user document
    user_data = {
        "id": str(uuid.uuid4()),
        "email": user.email,
        "name": user.name,
        "role": UserRole.SUPPLIER,
        "password_hash": get_password_hash(user.password),
        "supplier_id": supplier_id,
        "company_id": company_data["id"],
        "is_active": True,
        "created_at": datetime.utcnow()
    }
    
    # Store accepted terms & conditions
    if user.accepted_conditions_id:
        user_data["accepted_conditions"] = {
            "conditions_id": user.accepted_conditions_id,
            "accepted_at": datetime.utcnow()
        }
    
    await db.users.insert_one(user_data)
    
    # Remove password_hash for the response
    user_data.pop("password_hash", None)
    
    return user_data

# Create a new admin account (super-admin only)
@router.post("/admin", response_model=User)
async def create_admin(
    user: UserCreate,
    current_user: User = Depends(get_current_active_user)
):
    # Check if current user is a super admin
    if current_user["role"] != UserRole.SUPER_ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to create admin accounts"
        )
    
    # Check if email is already registered
    existing_user = await db.users.find_one({"email": user.email})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create user with admin role
    db_user = User(
        id=str(uuid.uuid4()),
        email=user.email,
        name=user.name,
        role=UserRole.ADMIN,
        company_id=current_user["company_id"],  # Assign to same company as the super admin
        created_at=datetime.utcnow()
    )
    
    # Insert user in database with hashed password
    user_data = db_user.dict()
    user_data["password_hash"] = get_password_hash(user.password)
    
    await db.users.insert_one(user_data)
    
    # Remove password_hash field for response
    user_data.pop("password_hash", None)
    
    return user_data

# Get current user profile
@router.get("/me", response_model=User)
async def get_me(current_user: User = Depends(get_current_active_user)):
    return current_user

# Update current user profile
@router.put("/me", response_model=User)
async def update_me(
    user_update: UserUpdate,
    current_user: User = Depends(get_current_active_user)
):
    user_id = current_user["id"]
    
    # Prepare update data
    update_data = {k: v for k, v in user_update.dict(exclude_unset=True).items() if k != "password"}
    
    # Handle password change if provided
    if user_update.current_password and user_update.new_password:
        # Verify current password
        if not verify_password(user_update.current_password, current_user.get("password_hash", "")):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Current password is incorrect"
            )
        
        # Update password hash
        update_data["password_hash"] = get_password_hash(user_update.new_password)
    
    # Update user in database
    if update_data:
        update_data["updated_at"] = datetime.utcnow()
        result = await db.users.update_one(
            {"id": user_id},
            {"$set": update_data}
        )
        
        if not result.modified_count:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
    
    # If user is a supplier, also update supplier data
    if current_user["role"] == UserRole.SUPPLIER and current_user.get("supplier_id"):
        supplier_update = {}
        
        if "name" in update_data:
            supplier_update["name"] = update_data["name"]
        
        if user_update.company_data:
            # Update company data for supplier
            company_update = {f"company_data.{k}": v for k, v in user_update.company_data.dict(exclude_unset=True).items()}
            if company_update:
                await db.suppliers.update_one(
                    {"id": current_user["supplier_id"]},
                    {"$set": {**supplier_update, **company_update, "updated_at": datetime.utcnow()}}
                )
    
    # Return updated user
    updated_user = await db.users.find_one({"id": user_id})
    if not updated_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Remove password hash from response
    updated_user.pop("password_hash", None)
    
    return updated_user

# Change password
@router.put("/change-password")
async def change_password(
    password_update: UserPasswordUpdate,
    current_user: User = Depends(get_current_active_user)
):
    # Verify current password
    if not verify_password(password_update.current_password, current_user.get("password_hash", "")):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect"
        )
    
    # Update password
    result = await db.users.update_one(
        {"id": current_user["id"]},
        {
            "$set": {
                "password_hash": get_password_hash(password_update.new_password),
                "updated_at": datetime.utcnow()
            }
        }
    )
    
    if not result.modified_count:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update password"
        )
    
    return {"message": "Password updated successfully"}

# Request password reset
@router.post("/forgot-password")
async def forgot_password(email: str):
    # Find user by email
    user = await db.users.find_one({"email": email})
    if not user:
        # Don't reveal that the user doesn't exist
        return {"message": "If your email is registered, you will receive a password reset link"}
    
    # Generate password reset token
    reset_token = str(uuid.uuid4())
    expiration = datetime.utcnow() + timedelta(hours=24)
    
    # Store reset token in database
    await db.users.update_one(
        {"id": user["id"]},
        {
            "$set": {
                "reset_token": reset_token,
                "reset_token_expires": expiration
            }
        }
    )
    
    # In a real application, send an email with the reset link
    # For now, just return the token for testing
    reset_link = f"{os.getenv('FRONTEND_URL', 'http://localhost:3000')}/reset-password/{reset_token}"
    
    # TODO: Send email with reset link
    
    return {"message": "If your email is registered, you will receive a password reset link"}

# Reset password with token
@router.post("/reset-password")
async def reset_password(token: str, new_password: str):
    # Find user by reset token
    user = await db.users.find_one({
        "reset_token": token,
        "reset_token_expires": {"$gt": datetime.utcnow()}
    })
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token"
        )
    
    # Update password and clear reset token
    result = await db.users.update_one(
        {"id": user["id"]},
        {
            "$set": {
                "password_hash": get_password_hash(new_password),
                "updated_at": datetime.utcnow()
            },
            "$unset": {
                "reset_token": "",
                "reset_token_expires": ""
            }
        }
    )
    
    if not result.modified_count:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to reset password"
        )
    
    return {"message": "Password has been reset successfully"}

# Delete a user (admin only)
@router.delete("/users/{user_id}")
async def delete_user(
    user_id: str,
    current_user: User = Depends(get_current_active_user)
):
    # Check if current user is an admin or super admin
    if current_user["role"] not in [UserRole.ADMIN, UserRole.SUPER_ADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete users"
        )
    
    # Get the user to delete
    user_to_delete = await db.users.find_one({"id": user_id})
    if not user_to_delete:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Super admins can delete any user
    # Admins can only delete users in their own company
    if current_user["role"] == UserRole.ADMIN and current_user["company_id"] != user_to_delete.get("company_id"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete users from other companies"
        )
    
    # Delete the user
    result = await db.users.delete_one({"id": user_id})
    
    if not result.deleted_count:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete user"
        )
    
    return {"message": "User deleted successfully"}
