from fastapi import APIRouter, HTTPException, Depends, File, UploadFile, Form, Body, status
from typing import List, Optional, Dict, Any
import uuid
import json
import shutil
from datetime import datetime

from models import (
    Supplier, 
    SupplierCreate, 
    User, 
    Document, 
    DocumentCategory,
    DocumentStatus
)
from auth import (
    get_current_user, 
    get_admin_user, 
    get_super_admin_user,
    verify_supplier_access,
    verify_company_access
)
from utils import (
    db, 
    DOCUMENTS_DIR,
    create_notification
)

router = APIRouter(prefix="/suppliers", tags=["suppliers"])

# Create supplier
@router.post("", response_model=Supplier)
async def create_supplier(
    supplier: SupplierCreate,
    current_user: User = Depends(get_admin_user)
):
    # Verify company access
    if current_user.role != "super_admin" and current_user.company_id != supplier.client_company_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to create supplier for this company"
        )
    
    # Check if supplier with SIRET already exists
    existing = await db.suppliers.find_one({"siret": supplier.siret})
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Supplier with this SIRET already exists"
        )
    
    # Create supplier object
    db_supplier = Supplier(
        id=str(uuid.uuid4()),
        name=supplier.name,
        type=supplier.type,
        siret=supplier.siret,
        vat_number=supplier.vat_number,
        profession=supplier.profession,
        address=supplier.address,
        postal_code=supplier.postal_code,
        city=supplier.city,
        insee_code=supplier.insee_code,
        country=supplier.country,
        iban=supplier.iban,
        bic=supplier.bic,
        vat_rates=supplier.vat_rates,
        vat_exigibility=supplier.vat_exigibility,
        payment_rule=supplier.payment_rule,
        notes=supplier.notes,
        emails=supplier.emails,
        contract_variables=supplier.contract_variables or {},
        client_company_id=supplier.client_company_id,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    
    # Insert supplier in database
    await db.suppliers.insert_one(db_supplier.dict())
    
    return db_supplier

# Get all suppliers
@router.get("", response_model=List[Supplier])
async def get_suppliers(
    company_id: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    # Build query
    query = {}
    
    # Super admin can see all suppliers or filter by company
    if current_user.role == "super_admin":
        if company_id:
            query["client_company_id"] = company_id
    # Admin can only see suppliers in their company
    elif current_user.role == "admin":
        query["client_company_id"] = current_user.company_id
    # Supplier can only see themselves
    elif current_user.role == "supplier":
        query["id"] = current_user.supplier_id
    
    # Query database
    suppliers = await db.suppliers.find(query).to_list(length=100)
    
    return suppliers

# Get supplier by ID
@router.get("/{supplier_id}", response_model=Supplier)
async def get_supplier(
    supplier_id: str,
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
    
    return supplier

# Update supplier
@router.put("/{supplier_id}", response_model=Supplier)
async def update_supplier(
    supplier_id: str,
    supplier: SupplierCreate,
    current_user: User = Depends(get_current_user)
):
    # Verify access
    await verify_supplier_access(supplier_id, current_user)
    
    # Check if supplier exists
    existing = await db.suppliers.find_one({"id": supplier_id})
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Supplier not found"
        )
    
    # For supplier users, verify company_id is not changed
    if current_user.role == "supplier" and supplier.client_company_id != existing["client_company_id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to change company_id"
        )
    
    # For admin users, verify company_id is their own
    if current_user.role == "admin" and supplier.client_company_id != current_user.company_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to set company_id to another company"
        )
    
    # Update supplier
    supplier_dict = supplier.dict()
    supplier_dict["updated_at"] = datetime.utcnow()
    
    await db.suppliers.update_one(
        {"id": supplier_id},
        {"$set": supplier_dict}
    )
    
    # Get updated supplier
    updated = await db.suppliers.find_one({"id": supplier_id})
    
    # If supplier has changed significantly, notify admin users
    if current_user.role == "supplier":
        # Important fields to check
        important_fields = ["name", "siret", "vat_number", "iban"]
        significant_change = False
        
        for field in important_fields:
            if supplier_dict.get(field) != existing.get(field):
                significant_change = True
                break
        
        if significant_change:
            # Notify admin users
            admin_users = await db.users.find({
                "role": "admin",
                "company_id": existing["client_company_id"]
            }).to_list(length=100)
            
            for admin in admin_users:
                notification = create_notification(
                    user_id=admin["id"],
                    type="supplier_updated",
                    title="Supplier Updated",
                    message=f"Supplier {existing['name']} has made significant changes to their profile",
                    target_id=supplier_id,
                    target_type="supplier",
                    client_company_id=existing["client_company_id"]
                )
                await db.notifications.insert_one(notification)
    
    return updated

# Upload supplier document
@router.post("/{supplier_id}/documents", response_model=Document)
async def upload_supplier_document(
    supplier_id: str,
    category: DocumentCategory = Form(...),
    name: str = Form(...),
    document_type_id: Optional[str] = Form(None),
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    # Verify access
    await verify_supplier_access(supplier_id, current_user)
    
    # Check if supplier exists
    supplier = await db.suppliers.find_one({"id": supplier_id})
    if not supplier:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Supplier not found"
        )
    
    # Check document type if provided
    if document_type_id:
        document_type = await db.document_types.find_one({"id": document_type_id})
        if not document_type:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Document type not found"
            )
        
        # Check document type belongs to same company
        if document_type.get("client_company_id") != supplier.get("client_company_id"):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Document type does not belong to this company"
            )
    
    # Save file
    filename = f"doc_{supplier_id}_{uuid.uuid4()}_{file.filename}"
    file_path = DOCUMENTS_DIR / filename
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # Determine expiry date if applicable
    expiry_date = None
    if document_type_id and document_type.get("validity_period"):
        expiry_date = datetime.utcnow() + datetime.timedelta(days=document_type.get("validity_period"))
    
    # Create document
    document = Document(
        id=str(uuid.uuid4()),
        supplier_id=supplier_id,
        document_type_id=document_type_id,
        category=category,
        name=name,
        file_path=str(file_path),
        expiry_date=expiry_date,
        status=DocumentStatus.PENDING,
        client_company_id=supplier.get("client_company_id"),
        uploaded_by=current_user.id,
        upload_date=datetime.utcnow()
    )
    
    # Save to database
    await db.documents.insert_one(document.dict())
    
    # Notify admins if uploaded by supplier
    if current_user.role == "supplier":
        # Notify admin users
        admin_users = await db.users.find({
            "role": "admin",
            "company_id": supplier.get("client_company_id")
        }).to_list(length=100)
        
        for admin in admin_users:
            notification = create_notification(
                user_id=admin["id"],
                type="document_uploaded",
                title="Document Uploaded",
                message=f"Supplier {supplier.get('name')} has uploaded a new document: {name}",
                target_id=document.id,
                target_type="document",
                client_company_id=supplier.get("client_company_id")
            )
            await db.notifications.insert_one(notification)
    
    return document

# Get supplier documents
@router.get("/{supplier_id}/documents", response_model=List[Document])
async def get_supplier_documents(
    supplier_id: str,
    category: Optional[DocumentCategory] = None,
    status: Optional[DocumentStatus] = None,
    current_user: User = Depends(get_current_user)
):
    # Verify access
    await verify_supplier_access(supplier_id, current_user)
    
    # Build query
    query = {"supplier_id": supplier_id}
    
    if category:
        query["category"] = category
    
    if status:
        query["status"] = status
    
    # Query database
    documents = await db.documents.find(query).to_list(length=100)
    
    return documents

# Get supplier document by ID
@router.get("/{supplier_id}/documents/{document_id}", response_model=Document)
async def get_supplier_document(
    supplier_id: str,
    document_id: str,
    current_user: User = Depends(get_current_user)
):
    # Verify access
    await verify_supplier_access(supplier_id, current_user)
    
    # Get document
    document = await db.documents.find_one({
        "id": document_id,
        "supplier_id": supplier_id
    })
    
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )
    
    return document

# Validate or reject supplier document
@router.put("/{supplier_id}/documents/{document_id}/status", response_model=Document)
async def update_document_status(
    supplier_id: str,
    document_id: str,
    status: DocumentStatus = Body(...),
    notes: Optional[str] = Body(None),
    current_user: User = Depends(get_admin_user)
):
    # Check if document exists
    document = await db.documents.find_one({
        "id": document_id,
        "supplier_id": supplier_id
    })
    
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )
    
    # Verify company access
    if current_user.role != "super_admin" and current_user.company_id != document.get("client_company_id"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this document"
        )
    
    # Update document
    await db.documents.update_one(
        {"id": document_id},
        {"$set": {
            "status": status,
            "validated_by": current_user.id,
            "validation_date": datetime.utcnow(),
            "validation_notes": notes
        }}
    )
    
    # Get updated document
    updated_document = await db.documents.find_one({"id": document_id})
    
    # Notify supplier
    supplier = await db.suppliers.find_one({"id": supplier_id})
    if supplier:
        supplier_users = await db.users.find({
            "role": "supplier",
            "supplier_id": supplier_id
        }).to_list(length=100)
        
        for user in supplier_users:
            notification_type = "document_validated" if status == DocumentStatus.VALIDATED else "document_rejected"
            notification_title = "Document Validated" if status == DocumentStatus.VALIDATED else "Document Rejected"
            
            notification = create_notification(
                user_id=user["id"],
                type=notification_type,
                title=notification_title,
                message=f"Your document '{document.get('name')}' has been {status}",
                target_id=document_id,
                target_type="document",
                client_company_id=document.get("client_company_id")
            )
            await db.notifications.insert_one(notification)
    
    return updated_document

# Delete supplier document
@router.delete("/{supplier_id}/documents/{document_id}")
async def delete_supplier_document(
    supplier_id: str,
    document_id: str,
    current_user: User = Depends(get_current_user)
):
    # Verify access
    await verify_supplier_access(supplier_id, current_user)
    
    # Get document
    document = await db.documents.find_one({
        "id": document_id,
        "supplier_id": supplier_id
    })
    
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )
    
    # Check if document can be deleted
    if current_user.role == "supplier" and document.get("status") != DocumentStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot delete documents that have been processed"
        )
    
    # Delete document
    await db.documents.delete_one({"id": document_id})
    
    # Attempt to delete file
    try:
        import os
        if os.path.exists(document.get("file_path")):
            os.remove(document.get("file_path"))
    except Exception as e:
        # Log error but continue
        print(f"Error deleting file: {e}")
    
    return {"message": "Document deleted successfully"}

# Check general conditions acceptance
@router.get("/{supplier_id}/gc-status", response_model=bool)
async def check_gc_acceptance(
    supplier_id: str,
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
    
    # Get most recent active GC
    gc = await db.general_conditions.find_one({
        "is_active": True,
        "client_company_id": supplier.get("client_company_id")
    })
    
    if not gc:
        return False
    
    # Check if supplier has accepted this GC
    acceptance = await db.gc_acceptances.find_one({
        "supplier_id": supplier_id,
        "gc_id": gc["id"]
    })
    
    return acceptance is not None

# Accept general conditions
@router.post("/{supplier_id}/accept-gc", response_model=Dict[str, Any])
async def accept_general_conditions(
    supplier_id: str,
    gc_id: str = Body(...),
    ip_address: Optional[str] = Body(None),
    current_user: User = Depends(get_current_user)
):
    # Verify access
    await verify_supplier_access(supplier_id, current_user)
    
    # Check if supplier exists
    supplier = await db.suppliers.find_one({"id": supplier_id})
    if not supplier:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Supplier not found"
        )
    
    # Check if GC exists
    gc = await db.general_conditions.find_one({"id": gc_id})
    if not gc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="General conditions not found"
        )
    
    # Check if GC belongs to supplier's company
    if gc.get("client_company_id") != supplier.get("client_company_id"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="General conditions do not belong to this company"
        )
    
    # Create acceptance record
    acceptance = {
        "id": str(uuid.uuid4()),
        "supplier_id": supplier_id,
        "gc_id": gc_id,
        "accepted_at": datetime.utcnow(),
        "accepted_by": current_user.id,
        "ip_address": ip_address,
        "client_company_id": supplier.get("client_company_id")
    }
    
    # Save to database
    await db.gc_acceptances.insert_one(acceptance)
    
    # Notify admin users
    admin_users = await db.users.find({
        "role": "admin",
        "company_id": supplier.get("client_company_id")
    }).to_list(length=100)
    
    for admin in admin_users:
        notification = create_notification(
            user_id=admin["id"],
            type="gc_accepted",
            title="General Conditions Accepted",
            message=f"Supplier {supplier.get('name')} has accepted the general conditions",
            target_id=supplier_id,
            target_type="supplier",
            client_company_id=supplier.get("client_company_id")
        )
        await db.notifications.insert_one(notification)
    
    return {"message": "General conditions accepted successfully"}

# Get required document types for supplier
@router.get("/{supplier_id}/required-documents", response_model=List[Dict[str, Any]])
async def get_required_documents(
    supplier_id: str,
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
    
    # Get document types for this supplier type
    document_types = await db.document_types.find({
        "client_company_id": supplier.get("client_company_id"),
        "is_active": True,
        "required_for": {"$in": [supplier.get("type"), "all"]}
    }).to_list(length=100)
    
    # Get existing documents for this supplier
    documents = await db.documents.find({
        "supplier_id": supplier_id,
        "document_type_id": {"$ne": None}
    }).to_list(length=100)
    
    # Create response with status information
    results = []
    for doc_type in document_types:
        # Find matching document
        matching_documents = [d for d in documents if d.get("document_type_id") == doc_type.get("id")]
        latest_document = None
        
        if matching_documents:
            # Get the most recent document
            latest_document = sorted(
                matching_documents, 
                key=lambda x: x.get("upload_date", datetime.min), 
                reverse=True
            )[0]
        
        results.append({
            "document_type": doc_type,
            "latest_document": latest_document,
            "status": latest_document.get("status") if latest_document else "missing"
        })
    
    return results
