from fastapi import APIRouter, HTTPException, Depends, status, Body
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import EmailStr
from typing import Dict, Optional, Any
import jwt

from datetime import datetime, timedelta
import uuid

from models import User, UserCreate, UserUpdate, Token, UserRole
from utils import (
    get_user_by_email, 
    get_password_hash, 
    verify_password, 
    create_access_token, 
    db,
    ACCESS_TOKEN_EXPIRE_MINUTES,
    send_email,
    SECRET_KEY,
    ALGORITHM
)
from auth import get_current_user, get_admin_user, get_super_admin_user

router = APIRouter(prefix="/auth", tags=["auth"])

# Login endpoint
@router.post("/token", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    user = await get_user_by_email(form_data.username)
    if not user or not verify_password(form_data.password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Update last login time
    await db.users.update_one(
        {"id": user["id"]},
        {"$set": {"last_login": datetime.utcnow()}}
    )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user["id"]}, 
        expires_delta=access_token_expires
    )
    
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
    existing_user = await get_user_by_email(user.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Ensure user is created as a supplier
    if user.role != UserRole.SUPPLIER:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only supplier accounts can be self-registered"
        )
    
    # Create user object
    db_user = User(
        id=str(uuid.uuid4()),
        email=user.email,
        name=user.name,
        role=UserRole.SUPPLIER,
        company_id=user.company_id,
        supplier_id=user.supplier_id,
        created_at=datetime.utcnow()
    )
    
    # Insert user in database with hashed password
    user_data = db_user.dict()
    user_data["password_hash"] = get_password_hash(user.password)
    
    await db.users.insert_one(user_data)
    
    # Remove password_hash field for response
    user_data.pop("password_hash", None)
    
    return user_data

# Create a new admin account (super-admin only)
@router.post("/admin", response_model=User)
async def create_admin(
    user: UserCreate,
    current_user: User = Depends(get_super_admin_user)
):
    # Check if email is already registered
    existing_user = await get_user_by_email(user.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Ensure user is created as an admin
    if user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only admin accounts can be created with this endpoint"
        )
    
    # Create user object
    db_user = User(
        id=str(uuid.uuid4()),
        email=user.email,
        name=user.name,
        role=UserRole.ADMIN,
        company_id=user.company_id,
        created_at=datetime.utcnow()
    )
    
    # Insert user in database with hashed password
    user_data = db_user.dict()
    user_data["password_hash"] = get_password_hash(user.password)
    
    await db.users.insert_one(user_data)
    
    # Remove password_hash field for response
    user_data.pop("password_hash", None)
    
    return user_data

# Get current user info
@router.get("/me", response_model=User)
async def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user

# Update user profile
@router.put("/me", response_model=User)
async def update_me(
    user_update: UserUpdate,
    current_user: User = Depends(get_current_user)
):
    # Prepare update data
    update_data = {}
    if user_update.name is not None:
        update_data["name"] = user_update.name
    
    # Update password if provided
    if user_update.password is not None:
        update_data["password_hash"] = get_password_hash(user_update.password)
    
    # Update user in database
    if update_data:
        await db.users.update_one(
            {"id": current_user.id},
            {"$set": update_data}
        )
    
    # Get updated user
    updated_user = await db.users.find_one({"id": current_user.id})
    
    # Remove password_hash field for response
    updated_user.pop("password_hash", None)
    
    return updated_user

# Request password reset
@router.post("/forgot-password")
async def forgot_password(email: EmailStr = Body(...)):
    user = await get_user_by_email(email)
    if not user:
        # Don't reveal if email exists for security
        return {"message": "If the email exists, a password reset link has been sent"}
    
    # Generate reset token
    token = create_access_token(
        data={"sub": user["id"], "reset": True},
        expires_delta=timedelta(hours=1)
    )
    
    # Generate reset link
    # In a real app, this would be a frontend URL with the token
    reset_link = f"/reset-password?token={token}"
    
    # Send email with reset link
    email_body = f"""
    <p>You requested a password reset for PRISM'FINANCE. Click the link below to reset your password:</p>
    <p><a href="{reset_link}">Reset Password</a></p>
    <p>This link will expire in 1 hour.</p>
    <p>If you didn't request this, please ignore this email.</p>
    """
    
    await send_email(email, "PRISM'FINANCE Password Reset", email_body)
    
    return {"message": "If the email exists, a password reset link has been sent"}

# Reset password with token
@router.post("/reset-password")
async def reset_password(
    token: str = Body(...),
    new_password: str = Body(...)
):
    try:
        # Decode token
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        is_reset = payload.get("reset")
        
        if not user_id or not is_reset:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired token"
            )
        
        # Get user
        user = await db.users.find_one({"id": user_id})
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Update password
        await db.users.update_one(
            {"id": user_id},
            {"$set": {"password_hash": get_password_hash(new_password)}}
        )
        
        return {"message": "Password reset successful"}
    
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired token"
        )

# Change password (authenticated user)
@router.put("/change-password")
async def change_password(
    current_password: str = Body(...),
    new_password: str = Body(...),
    current_user: User = Depends(get_current_user)
):
    # Get user with password hash
    user = await db.users.find_one({"id": current_user.id})
    
    # Verify current password
    if not verify_password(current_password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect"
        )
    
    # Update password
    await db.users.update_one(
        {"id": current_user.id},
        {"$set": {"password_hash": get_password_hash(new_password)}}
    )
    
    return {"message": "Password changed successfully"}

# List all users (super-admin only)
@router.get("/users", response_model=list[User])
async def list_users(
    role: Optional[UserRole] = None,
    current_user: User = Depends(get_super_admin_user)
):
    # Build query
    query = {}
    if role:
        query["role"] = role
    
    # Query database
    users = await db.users.find(query).to_list(length=100)
    
    # Remove password_hash field from all users
    for user in users:
        user.pop("password_hash", None)
    
    return users

# Update user (super-admin only)
@router.put("/users/{user_id}", response_model=User)
async def update_user(
    user_id: str,
    user_update: UserUpdate,
    current_user: User = Depends(get_super_admin_user)
):
    # Check if user exists
    user = await db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Prepare update data
    update_data = {}
    if user_update.name is not None:
        update_data["name"] = user_update.name
    
    # Update password if provided
    if user_update.password is not None:
        update_data["password_hash"] = get_password_hash(user_update.password)
    
    # Update user in database
    if update_data:
        await db.users.update_one(
            {"id": user_id},
            {"$set": update_data}
        )
    
    # Get updated user
    updated_user = await db.users.find_one({"id": user_id})
    
    # Remove password_hash field for response
    updated_user.pop("password_hash", None)
    
    return updated_user

# Delete user (super-admin only)
@router.delete("/users/{user_id}")
async def delete_user(
    user_id: str,
    current_user: User = Depends(get_super_admin_user)
):
    # Check if user exists
    user = await db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Don't allow deleting super-admin
    if user["role"] == UserRole.SUPER_ADMIN:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete super-admin user"
        )
    
    # Delete user
    await db.users.delete_one({"id": user_id})
    
    return {"message": "User deleted successfully"}
