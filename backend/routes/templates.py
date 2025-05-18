from fastapi import APIRouter, HTTPException, Depends, File, UploadFile, Form, status
from fastapi.responses import FileResponse
from typing import List, Optional
import uuid
import shutil
from datetime import datetime

from models import ContractTemplate, User
from auth import get_current_user, get_admin_user, verify_company_access
from utils import db, TEMPLATES_DIR, extract_variables_from_docx

router = APIRouter(prefix="/templates", tags=["templates"])

# Upload template
@router.post("", response_model=ContractTemplate)
async def upload_template(
    name: str = Form(...),
    validity_period: Optional[int] = Form(None),
    client_company_id: str = Form(...),
    file: UploadFile = File(...),
    current_user: User = Depends(get_admin_user)
):
    # Verify company access
    await verify_company_access(client_company_id, current_user)
    
    # Create unique filename
    filename = f"{uuid.uuid4()}_{file.filename}"
    file_path = TEMPLATES_DIR / filename
    
    # Save file
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # Extract variables from file
    variables = await extract_variables_from_docx(file_path)
    
    # Create template
    template = ContractTemplate(
        id=str(uuid.uuid4()),
        name=name,
        file_path=str(file_path),
        variables=variables,
        validity_period=validity_period,
        client_company_id=client_company_id,
        created_by=current_user.id,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    
    # Save to database
    await db.contract_templates.insert_one(template.dict())
    
    return template

# Get all templates
@router.get("", response_model=List[ContractTemplate])
async def get_templates(
    client_company_id: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    # Build query
    query = {}
    
    # Filter by company if provided
    if client_company_id:
        # Verify company access
        await verify_company_access(client_company_id, current_user)
        query["client_company_id"] = client_company_id
    elif current_user.role == "admin":
        # Admin can only see templates in their company
        query["client_company_id"] = current_user.company_id
    elif current_user.role == "supplier":
        # Supplier can only see templates for their company
        supplier = await db.suppliers.find_one({"id": current_user.supplier_id})
        if supplier:
            query["client_company_id"] = supplier.get("client_company_id")
        else:
            return []
    
    # Query database
    templates = await db.contract_templates.find(query).to_list(length=100)
    
    return templates

# Get template by ID
@router.get("/{template_id}", response_model=ContractTemplate)
async def get_template(
    template_id: str,
    current_user: User = Depends(get_current_user)
):
    # Get template
    template = await db.contract_templates.find_one({"id": template_id})
    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Template not found"
        )
    
    # Verify company access
    await verify_company_access(template.get("client_company_id"), current_user)
    
    return template

# Download template file
@router.get("/{template_id}/download")
async def download_template(
    template_id: str,
    current_user: User = Depends(get_current_user)
):
    # Get template
    template = await db.contract_templates.find_one({"id": template_id})
    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Template not found"
        )
    
    # Verify company access
    await verify_company_access(template.get("client_company_id"), current_user)
    
    # Return file
    return FileResponse(
        path=template.get("file_path"),
        filename=template.get("file_path").split('/')[-1],
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    )

# Update template
@router.put("/{template_id}", response_model=ContractTemplate)
async def update_template(
    template_id: str,
    name: Optional[str] = Form(None),
    validity_period: Optional[int] = Form(None),
    file: Optional[UploadFile] = File(None),
    current_user: User = Depends(get_admin_user)
):
    # Get template
    template = await db.contract_templates.find_one({"id": template_id})
    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Template not found"
        )
    
    # Verify company access
    await verify_company_access(template.get("client_company_id"), current_user)
    
    # Prepare update data
    update_data = {"updated_at": datetime.utcnow()}
    
    if name:
        update_data["name"] = name
    
    if validity_period is not None:
        update_data["validity_period"] = validity_period
    
    # Update file if provided
    if file:
        # Create unique filename
        filename = f"{uuid.uuid4()}_{file.filename}"
        file_path = TEMPLATES_DIR / filename
        
        # Save file
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Extract variables from file
        variables = await extract_variables_from_docx(file_path)
        
        update_data["file_path"] = str(file_path)
        update_data["variables"] = variables
    
    # Update template
    await db.contract_templates.update_one(
        {"id": template_id},
        {"$set": update_data}
    )
    
    # Get updated template
    updated_template = await db.contract_templates.find_one({"id": template_id})
    
    return updated_template

# Delete template
@router.delete("/{template_id}")
async def delete_template(
    template_id: str,
    current_user: User = Depends(get_admin_user)
):
    # Get template
    template = await db.contract_templates.find_one({"id": template_id})
    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Template not found"
        )
    
    # Verify company access
    await verify_company_access(template.get("client_company_id"), current_user)
    
    # Check if template is used in any contracts
    contracts = await db.contracts.find_one({"template_id": template_id})
    if contracts:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete template that is used in contracts"
        )
    
    # Delete template
    await db.contract_templates.delete_one({"id": template_id})
    
    # Delete file
    try:
        import os
        if os.path.exists(template.get("file_path")):
            os.remove(template.get("file_path"))
    except Exception as e:
        # Log error but continue
        print(f"Error deleting file: {e}")
    
    return {"message": "Template deleted successfully"}
