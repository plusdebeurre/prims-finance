from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from typing import Optional
import jwt
from datetime import datetime, timedelta
from jwt.exceptions import PyJWTError

from models import User, TokenData, UserRole
from utils import get_user_by_id, SECRET_KEY, ALGORITHM

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/token")

async def get_current_user(token: str = Depends(oauth2_scheme)) -> User:
    """
    Validate token and return the current user
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
        token_data = TokenData(user_id=user_id)
    except PyJWTError:
        raise credentials_exception
    
    user = await get_user_by_id(token_data.user_id)
    if user is None:
        raise credentials_exception
    
    return User(**user)

async def get_current_active_user(current_user: User = Depends(get_current_user)) -> User:
    """
    Check if the current user is active
    """
    return current_user

async def get_admin_user(current_user: User = Depends(get_current_user)) -> User:
    """
    Check if the current user is an admin
    """
    if current_user.role != UserRole.ADMIN and current_user.role != UserRole.SUPER_ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized - Admin privileges required",
        )
    return current_user

async def get_super_admin_user(current_user: User = Depends(get_current_user)) -> User:
    """
    Check if the current user is a super admin
    """
    if current_user.role != UserRole.SUPER_ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized - Super Admin privileges required",
        )
    return current_user

async def check_company_access(user: User, company_id: str) -> bool:
    """
    Check if the user has access to the specified company
    """
    if user.role == UserRole.SUPER_ADMIN:
        return True
    if user.role == UserRole.ADMIN and user.company_id == company_id:
        return True
    return False

async def verify_company_access(company_id: str, current_user: User = Depends(get_current_user)) -> User:
    """
    Verify the user has access to the specified company
    """
    if not await check_company_access(current_user, company_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Not authorized to access company: {company_id}",
        )
    return current_user

async def check_supplier_access(user: User, supplier_id: str) -> bool:
    """
    Check if the user has access to the specified supplier
    """
    # Supplier can only access their own data
    if user.role == UserRole.SUPPLIER and user.supplier_id == supplier_id:
        return True
    
    # Admin can access suppliers in their company
    if user.role == UserRole.ADMIN:
        # TODO: Check if supplier belongs to admin's company
        return True
    
    # Super admin can access all suppliers
    if user.role == UserRole.SUPER_ADMIN:
        return True
    
    return False

async def verify_supplier_access(supplier_id: str, current_user: User = Depends(get_current_user)) -> User:
    """
    Verify the user has access to the specified supplier
    """
    if not await check_supplier_access(current_user, supplier_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Not authorized to access supplier: {supplier_id}",
        )
    return current_user
