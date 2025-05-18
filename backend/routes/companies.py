from fastapi import APIRouter, HTTPException, Depends, File, UploadFile, Form, Body, status
from typing import List, Optional, Dict, Any
import uuid
import shutil
from datetime import datetime

from models import ClientCompany, ClientCompanyCreate, ClientCompanyUpdate, User
from auth import get_current_user, get_admin_user, get_super_admin_user
from utils import db, LOGOS_DIR

router = APIRouter(prefix="/companies", tags=["companies"])

# Create company (super-admin only)
@router.post("", response_model=ClientCompany)
async def create_company(
    company: ClientCompanyCreate,
    current_user: User = Depends(get_super_admin_user)
):
    # Create company object
    db_company = ClientCompany(
        id=str(uuid.uuid4()),
        name=company.name,
        settings=company.settings or {},
        created_at=datetime.utcnow()
    )
    
    # Insert company in database
    await db.client_companies.insert_one(db_company.dict())
    
    return db_company

# Get all companies (super-admin only)
@router.get("", response_model=List[ClientCompany])
async def get_companies(
    current_user: User = Depends(get_super_admin_user)
):
    companies = await db.client_companies.find().to_list(length=100)
    return companies

# Get company by ID (admin or super-admin)
@router.get("/{company_id}", response_model=ClientCompany)
async def get_company(
    company_id: str,
    current_user: User = Depends(get_admin_user)
):
    # Admin can only access their own company
    if current_user.role != "super_admin" and current_user.company_id != company_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this company"
        )
    
    company = await db.client_companies.find_one({"id": company_id})
    if not company:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Company not found"
        )
    
    return company

# Update company (admin or super-admin)
@router.put("/{company_id}", response_model=ClientCompany)
async def update_company(
    company_id: str,
    company: ClientCompanyUpdate,
    current_user: User = Depends(get_admin_user)
):
    # Admin can only update their own company
    if current_user.role != "super_admin" and current_user.company_id != company_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this company"
        )
    
    # Check if company exists
    db_company = await db.client_companies.find_one({"id": company_id})
    if not db_company:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Company not found"
        )
    
    # Prepare update data
    update_data = {}
    if company.name is not None:
        update_data["name"] = company.name
    if company.logo_url is not None:
        update_data["logo_url"] = company.logo_url
    if company.settings is not None:
        update_data["settings"] = company.settings
    
    # Update company in database
    if update_data:
        await db.client_companies.update_one(
            {"id": company_id},
            {"$set": update_data}
        )
    
    # Get updated company
    updated_company = await db.client_companies.find_one({"id": company_id})
    
    return updated_company

# Upload company logo
@router.post("/{company_id}/logo", response_model=Dict[str, str])
async def upload_company_logo(
    company_id: str,
    file: UploadFile = File(...),
    current_user: User = Depends(get_admin_user)
):
    # Admin can only update their own company
    if current_user.role != "super_admin" and current_user.company_id != company_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this company"
        )
    
    # Check if company exists
    company = await db.client_companies.find_one({"id": company_id})
    if not company:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Company not found"
        )
    
    # Check file type (only allow images)
    if not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only image files are allowed"
        )
    
    # Save file
    filename = f"logo_{company_id}_{uuid.uuid4()}{file.filename[file.filename.rfind('.'):]}"
    file_path = LOGOS_DIR / filename
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # Update company with logo URL
    logo_url = f"/uploads/logos/{filename}"
    await db.client_companies.update_one(
        {"id": company_id},
        {"$set": {"logo_url": logo_url}}
    )
    
    return {"logo_url": logo_url}

# Delete company (super-admin only)
@router.delete("/{company_id}")
async def delete_company(
    company_id: str,
    current_user: User = Depends(get_super_admin_user)
):
    # Check if company exists
    company = await db.client_companies.find_one({"id": company_id})
    if not company:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Company not found"
        )
    
    # Delete company
    await db.client_companies.delete_one({"id": company_id})
    
    # NOTE: In a real application, you would also:
    # 1. Delete or reassign all users associated with this company
    # 2. Delete all suppliers, contracts, etc. associated with this company
    # 3. Delete the logo file if it exists
    
    return {"message": "Company deleted successfully"}

# Get company settings
@router.get("/{company_id}/settings", response_model=Dict[str, Any])
async def get_company_settings(
    company_id: str,
    current_user: User = Depends(get_current_user)
):
    # Check if user has access to company
    if current_user.role != "super_admin" and current_user.company_id != company_id and (
        current_user.role != "supplier" or not await check_supplier_company(current_user.supplier_id, company_id)
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this company"
        )
    
    # Get company
    company = await db.client_companies.find_one({"id": company_id})
    if not company:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Company not found"
        )
    
    return company.get("settings", {})

# Update company settings
@router.put("/{company_id}/settings", response_model=Dict[str, Any])
async def update_company_settings(
    company_id: str,
    settings: Dict[str, Any] = Body(...),
    current_user: User = Depends(get_admin_user)
):
    # Admin can only update their own company
    if current_user.role != "super_admin" and current_user.company_id != company_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this company"
        )
    
    # Check if company exists
    company = await db.client_companies.find_one({"id": company_id})
    if not company:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Company not found"
        )
    
    # Update company settings
    await db.client_companies.update_one(
        {"id": company_id},
        {"$set": {"settings": settings}}
    )
    
    # Get updated company
    updated_company = await db.client_companies.find_one({"id": company_id})
    
    return updated_company.get("settings", {})

async def check_supplier_company(supplier_id: str, company_id: str) -> bool:
    """
    Check if a supplier belongs to a company
    """
    supplier = await db.suppliers.find_one({"id": supplier_id})
    if not supplier:
        return False
    
    return supplier.get("client_company_id") == company_id
