from fastapi import APIRouter, HTTPException, Depends, File, UploadFile, Form, Body, status, Response
from fastapi.responses import FileResponse
from typing import List, Optional, Dict, Any
import uuid
import json
import shutil
import base64
import io
import mammoth
from datetime import datetime

from models import Contract, ContractCreate, User, ContractStatus
from auth import get_current_user, get_admin_user, verify_supplier_access, verify_company_access
from utils import (
    db, 
    CONTRACTS_DIR, 
    TEMPLATES_DIR, 
    extract_variables_from_docx, 
    replace_variables_in_html, 
    supplier_to_variables_dict,
    create_notification
)

router = APIRouter(prefix="/contracts", tags=["contracts"])

# Generate contract
@router.post("/generate", response_model=Contract)
async def generate_contract(
    contract_data: ContractCreate,
    current_user: User = Depends(get_admin_user)
):
    # Verify access to company
    supplier = await db.suppliers.find_one({"id": contract_data.supplier_id})
    if not supplier:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Supplier not found"
        )
    
    company_id = supplier.get("client_company_id")
    if current_user.role != "super_admin" and current_user.company_id != company_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this company"
        )
    
    # Verify template exists
    template = await db.contract_templates.find_one({"id": contract_data.template_id})
    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Contract template not found"
        )
    
    # Check if template belongs to the same company
    if template.get("client_company_id") != company_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Template does not belong to this company"
        )
    
    try:
        # Read template content
        template_path = template.get("file_path")
        with open(template_path, "rb") as f:
            template_content = f.read()
        
        # Convert to HTML
        result = mammoth.convert_to_html(io.BytesIO(template_content))
        html_content = result.value
        
        # Get supplier variable defaults
        supplier_variables = supplier_to_variables_dict(supplier)
        
        # Combine with provided variables, giving priority to provided variables
        all_variables = {**supplier_variables, **contract_data.variables}
        
        # Replace variables in HTML
        html_content = await replace_variables_in_html(html_content, all_variables)
        
        # Encode content as base64 for storage
        content_b64 = base64.b64encode(html_content.encode('utf-8')).decode('utf-8')
        
        # Create contract file
        contract_filename = f"contract_{contract_data.supplier_id}_{contract_data.template_id}_{uuid.uuid4()}.html"
        contract_path = str(CONTRACTS_DIR / contract_filename)
        
        with open(CONTRACTS_DIR / contract_filename, "w", encoding='utf-8') as f:
            f.write(html_content)
        
        # Set expiry date based on template validity period
        expiry_date = None
        if template.get("validity_period"):
            expiry_date = datetime.utcnow() + datetime.timedelta(days=template.get("validity_period"))
        
        # Create contract
        contract = Contract(
            id=str(uuid.uuid4()),
            supplier_id=contract_data.supplier_id,
            template_id=contract_data.template_id,
            file_path=contract_path,
            variables=all_variables,
            status=ContractStatus.DRAFT,
            expiry_date=expiry_date,
            client_company_id=company_id,
            created_by=current_user.id,
            created_at=datetime.utcnow(),
            content=content_b64
        )
        
        # Save to database
        await db.contracts.insert_one(contract.dict())
        
        # Create notification for supplier
        # Find users associated with this supplier
        supplier_users = await db.users.find({
            "supplier_id": contract_data.supplier_id,
            "role": "supplier"
        }).to_list(length=100)
        
        for user in supplier_users:
            notification = create_notification(
                user_id=user["id"],
                type="contract_created",
                title="New Contract Available",
                message=f"A new contract has been created for you: {template.get('name')}",
                target_id=contract.id,
                target_type="contract",
                client_company_id=company_id
            )
            await db.notifications.insert_one(notification)
        
        return contract
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generating contract: {str(e)}"
        )

# Get contracts
@router.get("", response_model=List[Contract])
async def get_contracts(
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
        # Supplier can only see their own contracts
        query["supplier_id"] = current_user.supplier_id
    elif current_user.role == "admin":
        # Admin can only see contracts in their company
        query["client_company_id"] = current_user.company_id
    
    # Filter by status if provided
    if status:
        query["status"] = status
    
    # Query database
    contracts = await db.contracts.find(query).to_list(length=100)
    
    return contracts

# Get contract by ID
@router.get("/{contract_id}", response_model=Contract)
async def get_contract(
    contract_id: str,
    current_user: User = Depends(get_current_user)
):
    # Get contract
    contract = await db.contracts.find_one({"id": contract_id})
    if not contract:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Contract not found"
        )
    
    # Verify access
    if current_user.role == "supplier":
        if current_user.supplier_id != contract.get("supplier_id"):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to access this contract"
            )
    elif current_user.role == "admin":
        if current_user.company_id != contract.get("client_company_id"):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to access this contract"
            )
    
    return contract

# Get contract content as HTML
@router.get("/{contract_id}/html")
async def get_contract_html(
    contract_id: str,
    current_user: User = Depends(get_current_user)
):
    # Get contract
    contract = await db.contracts.find_one({"id": contract_id})
    if not contract:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Contract not found"
        )
    
    # Verify access
    if current_user.role == "supplier":
        if current_user.supplier_id != contract.get("supplier_id"):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to access this contract"
            )
    elif current_user.role == "admin":
        if current_user.company_id != contract.get("client_company_id"):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to access this contract"
            )
    
    # Check if contract has content
    if not contract.get("content"):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Contract content not found"
        )
    
    # Decode content
    content = base64.b64decode(contract.get("content")).decode('utf-8')
    
    # Return HTML response
    return Response(content=content, media_type="text/html")

# Get contract as PDF
@router.get("/{contract_id}/pdf")
async def get_contract_pdf(
    contract_id: str,
    current_user: User = Depends(get_current_user)
):
    # Get contract
    contract = await db.contracts.find_one({"id": contract_id})
    if not contract:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Contract not found"
        )
    
    # Verify access
    if current_user.role == "supplier":
        if current_user.supplier_id != contract.get("supplier_id"):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to access this contract"
            )
    elif current_user.role == "admin":
        if current_user.company_id != contract.get("client_company_id"):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to access this contract"
            )
    
    # Check if contract has a file path
    if not contract.get("file_path"):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Contract file not found"
        )
    
    # Return file response
    return FileResponse(
        path=contract.get("file_path"),
        filename=f"contract_{contract_id}.pdf",
        media_type="application/pdf"
    )

# Sign contract as supplier
@router.post("/{contract_id}/sign-supplier", response_model=Contract)
async def sign_contract_supplier(
    contract_id: str,
    signer_name: str = Body(...),
    signer_surname: str = Body(...),
    current_user: User = Depends(get_current_user)
):
    # Get contract
    contract = await db.contracts.find_one({"id": contract_id})
    if not contract:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Contract not found"
        )
    
    # Verify user is the supplier for this contract
    if current_user.role != "supplier" or current_user.supplier_id != contract.get("supplier_id"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the supplier can sign this contract"
        )
    
    # Check if contract can be signed
    if contract.get("status") not in [ContractStatus.DRAFT, ContractStatus.ADMIN_SIGNED]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Contract cannot be signed in status: {contract.get('status')}"
        )
    
    # Determine new status
    new_status = ContractStatus.SUPPLIER_SIGNED
    if contract.get("status") == ContractStatus.ADMIN_SIGNED:
        new_status = ContractStatus.SIGNED
    
    # Update contract
    await db.contracts.update_one(
        {"id": contract_id},
        {"$set": {
            "status": new_status,
            "supplier_signed_at": datetime.utcnow(),
            "supplier_signed_by": {"name": signer_name, "surname": signer_surname}
        }}
    )
    
    # Notify admin users if contract is fully signed
    if new_status == ContractStatus.SIGNED:
        # Get admin users for this company
        admin_users = await db.users.find({
            "role": "admin",
            "company_id": contract.get("client_company_id")
        }).to_list(length=100)
        
        for user in admin_users:
            notification = create_notification(
                user_id=user["id"],
                type="contract_signed",
                title="Contract Signed",
                message=f"Contract has been signed by supplier: {contract.get('id')}",
                target_id=contract_id,
                target_type="contract",
                client_company_id=contract.get("client_company_id")
            )
            await db.notifications.insert_one(notification)
    else:
        # Notify admin users that supplier has signed
        admin_users = await db.users.find({
            "role": "admin",
            "company_id": contract.get("client_company_id")
        }).to_list(length=100)
        
        for user in admin_users:
            notification = create_notification(
                user_id=user["id"],
                type="contract_signed",
                title="Contract Signed by Supplier",
                message=f"Contract has been signed by supplier and is waiting for your signature",
                target_id=contract_id,
                target_type="contract",
                client_company_id=contract.get("client_company_id")
            )
            await db.notifications.insert_one(notification)
    
    # Get updated contract
    updated_contract = await db.contracts.find_one({"id": contract_id})
    
    return updated_contract

# Sign contract as admin
@router.post("/{contract_id}/sign-admin", response_model=Contract)
async def sign_contract_admin(
    contract_id: str,
    signer_name: str = Body(...),
    signer_surname: str = Body(...),
    current_user: User = Depends(get_admin_user)
):
    # Get contract
    contract = await db.contracts.find_one({"id": contract_id})
    if not contract:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Contract not found"
        )
    
    # Verify user has access to this company
    if current_user.role != "super_admin" and current_user.company_id != contract.get("client_company_id"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to sign this contract"
        )
    
    # Check if contract can be signed
    if contract.get("status") not in [ContractStatus.DRAFT, ContractStatus.SUPPLIER_SIGNED]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Contract cannot be signed in status: {contract.get('status')}"
        )
    
    # Determine new status
    new_status = ContractStatus.ADMIN_SIGNED
    if contract.get("status") == ContractStatus.SUPPLIER_SIGNED:
        new_status = ContractStatus.SIGNED
    
    # Update contract
    await db.contracts.update_one(
        {"id": contract_id},
        {"$set": {
            "status": new_status,
            "admin_signed_at": datetime.utcnow(),
            "admin_signed_by": {"name": signer_name, "surname": signer_surname}
        }}
    )
    
    # Notify supplier if contract is fully signed
    if new_status == ContractStatus.SIGNED:
        # Get supplier users
        supplier_users = await db.users.find({
            "role": "supplier",
            "supplier_id": contract.get("supplier_id")
        }).to_list(length=100)
        
        for user in supplier_users:
            notification = create_notification(
                user_id=user["id"],
                type="contract_signed",
                title="Contract Signed",
                message=f"Contract has been signed by all parties and is now active",
                target_id=contract_id,
                target_type="contract",
                client_company_id=contract.get("client_company_id")
            )
            await db.notifications.insert_one(notification)
    else:
        # Notify supplier that admin has signed
        supplier_users = await db.users.find({
            "role": "supplier",
            "supplier_id": contract.get("supplier_id")
        }).to_list(length=100)
        
        for user in supplier_users:
            notification = create_notification(
                user_id=user["id"],
                type="contract_signed",
                title="Contract Signed by Client",
                message=f"Contract has been signed by the client and is waiting for your signature",
                target_id=contract_id,
                target_type="contract",
                client_company_id=contract.get("client_company_id")
            )
            await db.notifications.insert_one(notification)
    
    # Get updated contract
    updated_contract = await db.contracts.find_one({"id": contract_id})
    
    return updated_contract
