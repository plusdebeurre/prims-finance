from fastapi import FastAPI, APIRouter, HTTPException, Depends, File, UploadFile, Form, Body
from fastapi.responses import JSONResponse, FileResponse
from starlette.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any, Union
from dotenv import load_dotenv
from pathlib import Path
import os
import logging
import uuid
import shutil
import re
import json
import io
import base64
from datetime import datetime, timedelta
import mammoth
import jwt
from passlib.context import CryptContext

# Import our models
from models import *

# Set up root directory and load environment variables
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Configure MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get('DB_NAME', 'prism_finance_db')]

# Create storage directories if they don't exist
UPLOAD_DIR = ROOT_DIR / 'uploads'
TEMPLATES_DIR = UPLOAD_DIR / 'templates'
DOCUMENTS_DIR = UPLOAD_DIR / 'documents'
CONTRACTS_DIR = UPLOAD_DIR / 'contracts'

for directory in [UPLOAD_DIR, TEMPLATES_DIR, DOCUMENTS_DIR, CONTRACTS_DIR]:
    directory.mkdir(exist_ok=True, parents=True)

# JWT Configuration
SECRET_KEY = os.environ.get("SECRET_KEY", "mysecretkey")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 1 day

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# OAuth2 scheme
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/token")

# Setup app and routers
app = FastAPI(title="PRISM'FINANCE API", docs_url="/api/docs")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create routers
auth_router = APIRouter(prefix="/api/auth", tags=["Authentication"])
users_router = APIRouter(prefix="/api/users", tags=["Users"])
companies_router = APIRouter(prefix="/api/companies", tags=["Companies"])
suppliers_router = APIRouter(prefix="/api/suppliers", tags=["Suppliers"])
templates_router = APIRouter(prefix="/api/templates", tags=["Templates"])
contracts_router = APIRouter(prefix="/api/contracts", tags=["Contracts"])
documents_router = APIRouter(prefix="/api/documents", tags=["Documents"])
purchase_orders_router = APIRouter(prefix="/api/purchase-orders", tags=["Purchase Orders"])
notifications_router = APIRouter(prefix="/api/notifications", tags=["Notifications"])
general_conditions_router = APIRouter(prefix="/api/general-conditions", tags=["General Conditions"])

# Helper functions
def verify_password(plain_password, password_hash):
    return pwd_context.verify(plain_password, password_hash)

def get_password_hash(password):
    return pwd_context.hash(password)

async def get_user_by_email(email: str):
    user = await db.users.find_one({"email": email})
    if user:
        return UserInDB(**user)
    return None

async def authenticate_user(email: str, password: str):
    user = await get_user_by_email(email)
    if not user:
        return False
    if not verify_password(password, user.password_hash):
        return False
    return user

def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=401,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
        token_data = TokenData(user_id=user_id)
    except jwt.PyJWTError:
        raise credentials_exception
    user = await db.users.find_one({"id": token_data.user_id})
    if user is None:
        raise credentials_exception
    return UserInDB(**user)

async def get_admin_user(current_user: UserInDB = Depends(get_current_user)):
    if current_user.role not in ["admin", "super_admin"]:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    return current_user

# Extract variables from template
def extract_variables_from_docx(file_path):
    with open(file_path, "rb") as docx_file:
        result = mammoth.extract_raw_text(docx_file)
        text = result.value
        # Look for variables in {{variable_name}} format
        variables = re.findall(r'{{([^}]+)}}', text)
        return list(set(variables))  # Remove duplicates

# Replace variables in template
async def replace_variables_in_docx(template_path, output_path, variable_values):
    try:
        with open(template_path, "rb") as docx_file:
            result = mammoth.convert_to_html(docx_file)
            html = result.value
            
        # Replace variables in HTML
        for var_name, var_value in variable_values.items():
            html = html.replace(f"{{{{{var_name}}}}}", var_value)
            
        # Convert HTML to DOCX (simplified)
        # In a real implementation, you would use a library like python-docx or htmldocx
        with open(output_path, "w") as output_file:
            output_file.write(html)
            
        return True
    except Exception as e:
        logging.error(f"Error replacing variables: {str(e)}")
        return False

# Auth endpoints
@auth_router.post("/token", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    user = await authenticate_user(form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=401,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.id}, expires_delta=access_token_expires
    )
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user_id": user.id,
        "is_admin": user.role in ["admin", "super_admin"],
        "name": user.name
    }

@auth_router.post("/register", response_model=User)
async def register_user(user: UserCreate):
    # Check if email already exists
    existing_user = await get_user_by_email(user.email)
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create new user
    user_dict = user.dict()
    user_dict.pop("password")
    hashed_password = get_password_hash(user.password)
    
    new_user = UserInDB(
        **user_dict,
        id=str(uuid.uuid4()),
        password_hash=hashed_password,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    
    await db.users.insert_one(new_user.dict())
    
    return User(
        id=new_user.id,
        email=new_user.email,
        name=new_user.name,
        role=new_user.role,
        company_id=new_user.company_id,
        created_at=new_user.created_at,
        updated_at=new_user.updated_at,
        is_active=new_user.is_active
    )

@auth_router.post("/reset-password-request")
async def request_password_reset(email: EmailStr = Body(..., embed=True)):
    user = await get_user_by_email(email)
    if not user:
        # Don't reveal that the user doesn't exist
        return {"message": "If your email is registered, you will receive a password reset link"}
    
    # In a real implementation, you would send an email with a reset token
    # For this example, we'll just return a success message
    return {"message": "If your email is registered, you will receive a password reset link"}

@auth_router.post("/reset-password")
async def reset_password(token: str = Body(...), new_password: str = Body(...)):
    # Verify token and update password
    # This is a simplified implementation
    # In a real application, you would validate the token first
    
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=400, detail="Invalid token")
        
        hashed_password = get_password_hash(new_password)
        await db.users.update_one(
            {"id": user_id},
            {"$set": {"password_hash": hashed_password, "updated_at": datetime.utcnow()}}
        )
        
        return {"message": "Password has been reset successfully"}
    except jwt.PyJWTError:
        raise HTTPException(status_code=400, detail="Invalid token")

# User endpoints
@users_router.get("/me", response_model=User)
async def get_current_user_info(current_user: UserInDB = Depends(get_current_user)):
    return current_user

@users_router.put("/me", response_model=User)
async def update_current_user(
    user_update: UserUpdate,
    current_user: UserInDB = Depends(get_current_user)
):
    update_data = user_update.dict(exclude_unset=True)
    if "password" in update_data:
        update_data["password_hash"] = get_password_hash(update_data.pop("password"))
    
    update_data["updated_at"] = datetime.utcnow()
    
    await db.users.update_one(
        {"id": current_user.id},
        {"$set": update_data}
    )
    
    updated_user = await db.users.find_one({"id": current_user.id})
    return UserInDB(**updated_user)

@users_router.get("/", response_model=List[User])
async def get_users(
    skip: int = 0,
    limit: int = 100,
    current_user: UserInDB = Depends(get_admin_user)
):
    users = await db.users.find(
        {"company_id": current_user.company_id}
    ).skip(skip).limit(limit).to_list(limit)
    return users

@users_router.post("/", response_model=User)
async def create_user(
    user: UserCreate,
    current_user: UserInDB = Depends(get_admin_user)
):
    # Check if email already exists
    existing_user = await get_user_by_email(user.email)
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create new user
    user_dict = user.dict()
    user_dict.pop("password")
    hashed_password = get_password_hash(user.password)
    
    new_user = UserInDB(
        **user_dict,
        id=str(uuid.uuid4()),
        password_hash=hashed_password,
        company_id=current_user.company_id,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    
    await db.users.insert_one(new_user.dict())
    
    # Return user without password
    return User(
        id=new_user.id,
        email=new_user.email,
        name=new_user.name,
        role=new_user.role,
        company_id=new_user.company_id,
        created_at=new_user.created_at,
        updated_at=new_user.updated_at,
        is_active=new_user.is_active
    )

# Supplier endpoints
@suppliers_router.post("/", response_model=Supplier)
async def create_supplier(
    supplier: SupplierCreate,
    current_user: UserInDB = Depends(get_admin_user)
):
    if supplier.company_id != current_user.company_id:
        raise HTTPException(status_code=403, detail="Not authorized to create supplier for this company")
    
    supplier_dict = supplier.dict()
    supplier_dict["id"] = str(uuid.uuid4())
    supplier_dict["created_at"] = datetime.utcnow()
    supplier_dict["updated_at"] = datetime.utcnow()
    
    await db.suppliers.insert_one(supplier_dict)
    
    return Supplier(**supplier_dict)

@suppliers_router.get("/", response_model=List[Supplier])
async def get_suppliers(
    skip: int = 0,
    limit: int = 100,
    current_user: UserInDB = Depends(get_current_user)
):
    query = {"company_id": current_user.company_id}
    suppliers = await db.suppliers.find(query).skip(skip).limit(limit).to_list(limit)
    return suppliers

@suppliers_router.get("/{supplier_id}", response_model=Supplier)
async def get_supplier(
    supplier_id: str,
    current_user: UserInDB = Depends(get_current_user)
):
    query = {"id": supplier_id, "company_id": current_user.company_id}
    supplier = await db.suppliers.find_one(query)
    
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")
    
    return Supplier(**supplier)

@suppliers_router.put("/{supplier_id}", response_model=Supplier)
async def update_supplier(
    supplier_id: str,
    supplier_update: SupplierUpdate,
    current_user: UserInDB = Depends(get_admin_user)
):
    # Check if supplier exists
    supplier = await db.suppliers.find_one({"id": supplier_id, "company_id": current_user.company_id})
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")
    
    # Update supplier
    update_data = supplier_update.dict(exclude_unset=True)
    update_data["updated_at"] = datetime.utcnow()
    
    await db.suppliers.update_one(
        {"id": supplier_id},
        {"$set": update_data}
    )
    
    updated_supplier = await db.suppliers.find_one({"id": supplier_id})
    return Supplier(**updated_supplier)

@suppliers_router.post("/{supplier_id}/documents", response_model=Supplier)
async def upload_supplier_document(
    supplier_id: str,
    document_name: str = Form(...),
    document_category: str = Form(...),
    document: UploadFile = File(...),
    current_user: UserInDB = Depends(get_admin_user)
):
    # Check if supplier exists
    supplier = await db.suppliers.find_one({"id": supplier_id, "company_id": current_user.company_id})
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")
    
    # Save document
    file_extension = os.path.splitext(document.filename)[1]
    file_name = f"{uuid.uuid4()}{file_extension}"
    file_path = DOCUMENTS_DIR / file_name
    
    with open(file_path, "wb") as f:
        f.write(await document.read())
    
    # Add document to supplier
    document_data = {
        "id": str(uuid.uuid4()),
        "name": document_name,
        "category": document_category,
        "file_path": str(file_path),
        "uploaded_at": datetime.utcnow(),
        "uploaded_by": current_user.id,
        "status": "pending"
    }
    
    await db.suppliers.update_one(
        {"id": supplier_id},
        {"$push": {"documents": document_data}}
    )
    
    updated_supplier = await db.suppliers.find_one({"id": supplier_id})
    return Supplier(**updated_supplier)

# Template endpoints
@templates_router.post("/", response_model=Template)
async def create_template(
    name: str = Form(...),
    description: str = Form(None),
    template_type: str = Form(...),
    template_file: UploadFile = File(...),
    current_user: UserInDB = Depends(get_admin_user)
):
    # Save template file
    file_extension = os.path.splitext(template_file.filename)[1]
    file_name = f"{uuid.uuid4()}{file_extension}"
    file_path = TEMPLATES_DIR / file_name
    
    with open(file_path, "wb") as f:
        f.write(await template_file.read())
    
    # Extract variables from template if it's a DOCX file
    variables = []
    if file_extension.lower() == ".docx":
        variables = extract_variables_from_docx(file_path)
    
    # Create template
    template_dict = {
        "id": str(uuid.uuid4()),
        "name": name,
        "description": description,
        "file_path": str(file_path),
        "variables": variables,
        "type": template_type,
        "company_id": current_user.company_id,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
        "is_active": True
    }
    
    await db.templates.insert_one(template_dict)
    
    return Template(**template_dict)

@templates_router.get("/", response_model=List[Template])
async def get_templates(
    skip: int = 0,
    limit: int = 100,
    current_user: UserInDB = Depends(get_current_user)
):
    query = {"company_id": current_user.company_id, "is_active": True}
    templates = await db.templates.find(query).skip(skip).limit(limit).to_list(limit)
    return templates

@templates_router.get("/{template_id}", response_model=Template)
async def get_template(
    template_id: str,
    current_user: UserInDB = Depends(get_current_user)
):
    query = {"id": template_id, "company_id": current_user.company_id}
    template = await db.templates.find_one(query)
    
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    
    return Template(**template)

@templates_router.delete("/{template_id}")
async def delete_template(
    template_id: str,
    current_user: UserInDB = Depends(get_admin_user)
):
    query = {"id": template_id, "company_id": current_user.company_id}
    template = await db.templates.find_one(query)
    
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    
    # Soft delete - mark as inactive
    await db.templates.update_one(
        {"id": template_id},
        {"$set": {"is_active": False, "updated_at": datetime.utcnow()}}
    )
    
    return {"message": "Template deleted successfully"}

# Contract endpoints
@contracts_router.post("/", response_model=Contract)
async def create_contract(
    contract: ContractCreate,
    current_user: UserInDB = Depends(get_admin_user)
):
    if contract.company_id != current_user.company_id:
        raise HTTPException(status_code=403, detail="Not authorized to create contract for this company")
    
    # Check if supplier exists
    supplier = await db.suppliers.find_one({"id": contract.supplier_id, "company_id": current_user.company_id})
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")
    
    # Check if template exists
    template = await db.templates.find_one({"id": contract.template_id, "company_id": current_user.company_id})
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    
    contract_dict = contract.dict()
    contract_dict["id"] = str(uuid.uuid4())
    contract_dict["created_at"] = datetime.utcnow()
    contract_dict["updated_at"] = datetime.utcnow()
    
    await db.contracts.insert_one(contract_dict)
    
    return Contract(**contract_dict)

@contracts_router.get("/", response_model=List[Contract])
async def get_contracts(
    skip: int = 0,
    limit: int = 100,
    current_user: UserInDB = Depends(get_current_user)
):
    query = {"company_id": current_user.company_id}
    
    # If user is not admin, only show contracts for their supplier account
    if current_user.role == "supplier":
        supplier = await db.suppliers.find_one({"user_id": current_user.id})
        if supplier:
            query["supplier_id"] = supplier["id"]
        else:
            return []
    
    contracts = await db.contracts.find(query).skip(skip).limit(limit).to_list(limit)
    return contracts

@contracts_router.get("/{contract_id}", response_model=Contract)
async def get_contract(
    contract_id: str,
    current_user: UserInDB = Depends(get_current_user)
):
    query = {"id": contract_id, "company_id": current_user.company_id}
    
    # If user is not admin, check if contract belongs to their supplier account
    if current_user.role == "supplier":
        supplier = await db.suppliers.find_one({"user_id": current_user.id})
        if supplier:
            query["supplier_id"] = supplier["id"]
        else:
            raise HTTPException(status_code=404, detail="Contract not found")
    
    contract = await db.contracts.find_one(query)
    
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")
    
    return Contract(**contract)

@contracts_router.put("/{contract_id}", response_model=Contract)
async def update_contract(
    contract_id: str,
    contract_update: ContractUpdate,
    current_user: UserInDB = Depends(get_admin_user)
):
    # Check if contract exists
    contract = await db.contracts.find_one({"id": contract_id, "company_id": current_user.company_id})
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")
    
    # Update contract
    update_data = contract_update.dict(exclude_unset=True)
    update_data["updated_at"] = datetime.utcnow()
    
    await db.contracts.update_one(
        {"id": contract_id},
        {"$set": update_data}
    )
    
    updated_contract = await db.contracts.find_one({"id": contract_id})
    return Contract(**updated_contract)

@contracts_router.post("/{contract_id}/generate", response_model=Contract)
async def generate_contract(
    contract_id: str,
    current_user: UserInDB = Depends(get_admin_user)
):
    # Check if contract exists
    contract = await db.contracts.find_one({"id": contract_id, "company_id": current_user.company_id})
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")
    
    # Check if template exists
    template = await db.templates.find_one({"id": contract["template_id"]})
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    
    # Generate contract file
    output_file_name = f"{contract_id}.docx"
    output_file_path = CONTRACTS_DIR / output_file_name
    
    success = await replace_variables_in_docx(
        template["file_path"],
        output_file_path,
        contract["variable_values"]
    )
    
    if not success:
        raise HTTPException(status_code=500, detail="Failed to generate contract")
    
    # Update contract with file path
    await db.contracts.update_one(
        {"id": contract_id},
        {"$set": {
            "file_path": str(output_file_path),
            "status": "pending_signature",
            "updated_at": datetime.utcnow()
        }}
    )
    
    updated_contract = await db.contracts.find_one({"id": contract_id})
    return Contract(**updated_contract)

@contracts_router.post("/{contract_id}/sign", response_model=Contract)
async def sign_contract(
    contract_id: str,
    current_user: UserInDB = Depends(get_current_user)
):
    # Check if contract exists
    query = {"id": contract_id}
    
    # If user is not admin, check if contract belongs to their supplier account
    if current_user.role == "supplier":
        supplier = await db.suppliers.find_one({"user_id": current_user.id})
        if supplier:
            query["supplier_id"] = supplier["id"]
        else:
            raise HTTPException(status_code=404, detail="Contract not found")
    
    contract = await db.contracts.find_one(query)
    
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")
    
    if contract["status"] != "pending_signature":
        raise HTTPException(status_code=400, detail="Contract is not in pending signature status")
    
    # Update contract with signature
    await db.contracts.update_one(
        {"id": contract_id},
        {"$set": {
            "status": "signed",
            "signed_at": datetime.utcnow(),
            "signed_by": current_user.id,
            "updated_at": datetime.utcnow()
        }}
    )
    
    updated_contract = await db.contracts.find_one({"id": contract_id})
    
    # Create notification for the other party
    notify_user_id = None
    notification_title = ""
    notification_message = ""
    
    if current_user.role == "supplier":
        # Notify company admin
        admins = await db.users.find({"company_id": contract["company_id"], "role": "admin"}).to_list(1)
        if admins:
            notify_user_id = admins[0]["id"]
            notification_title = "Contract Signed"
            notification_message = f"A contract has been signed by supplier {current_user.name}"
    else:
        # Notify supplier
        supplier = await db.suppliers.find_one({"id": contract["supplier_id"]})
        if supplier and supplier.get("user_id"):
            notify_user_id = supplier["user_id"]
            notification_title = "Contract Signed"
            notification_message = f"A contract has been signed by {current_user.name}"
    
    if notify_user_id:
        notification = {
            "id": str(uuid.uuid4()),
            "user_id": notify_user_id,
            "title": notification_title,
            "message": notification_message,
            "type": "info",
            "related_id": contract_id,
            "related_type": "contract",
            "company_id": contract["company_id"],
            "created_at": datetime.utcnow(),
            "read": False
        }
        
        await db.notifications.insert_one(notification)
    
    return Contract(**updated_contract)

@contracts_router.get("/{contract_id}/download")
async def download_contract(
    contract_id: str,
    current_user: UserInDB = Depends(get_current_user)
):
    # Check if contract exists
    query = {"id": contract_id, "company_id": current_user.company_id}
    
    # If user is not admin, check if contract belongs to their supplier account
    if current_user.role == "supplier":
        supplier = await db.suppliers.find_one({"user_id": current_user.id})
        if supplier:
            query["supplier_id"] = supplier["id"]
        else:
            raise HTTPException(status_code=404, detail="Contract not found")
    
    contract = await db.contracts.find_one(query)
    
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")
    
    if not contract.get("file_path"):
        raise HTTPException(status_code=400, detail="Contract file not generated yet")
    
    return FileResponse(
        path=contract["file_path"],
        filename=f"contract_{contract_id}.docx",
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    )

# Notification endpoints
@notifications_router.get("/", response_model=List[Notification])
async def get_notifications(
    skip: int = 0,
    limit: int = 100,
    unread_only: bool = False,
    current_user: UserInDB = Depends(get_current_user)
):
    query = {"user_id": current_user.id}
    
    if unread_only:
        query["read"] = False
    
    notifications = await db.notifications.find(query).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    return notifications

@notifications_router.put("/{notification_id}", response_model=Notification)
async def mark_notification_as_read(
    notification_id: str,
    current_user: UserInDB = Depends(get_current_user)
):
    # Check if notification exists
    notification = await db.notifications.find_one({"id": notification_id, "user_id": current_user.id})
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    # Mark as read
    await db.notifications.update_one(
        {"id": notification_id},
        {"$set": {"read": True}}
    )
    
    updated_notification = await db.notifications.find_one({"id": notification_id})
    return Notification(**updated_notification)

@notifications_router.put("/mark-all-read")
async def mark_all_notifications_as_read(
    current_user: UserInDB = Depends(get_current_user)
):
    # Mark all notifications as read
    await db.notifications.update_many(
        {"user_id": current_user.id, "read": False},
        {"$set": {"read": True}}
    )
    
    return {"message": "All notifications marked as read"}

# General Conditions endpoints
@general_conditions_router.post("/", response_model=GeneralConditions)
async def create_general_conditions(
    general_conditions: GeneralConditionsCreate,
    current_user: UserInDB = Depends(get_admin_user)
):
    if general_conditions.company_id != current_user.company_id:
        raise HTTPException(status_code=403, detail="Not authorized to create general conditions for this company")
    
    # Deactivate all existing general conditions
    await db.general_conditions.update_many(
        {"company_id": current_user.company_id, "is_active": True},
        {"$set": {"is_active": False}}
    )
    
    # Create new general conditions
    general_conditions_dict = general_conditions.dict()
    general_conditions_dict["id"] = str(uuid.uuid4())
    general_conditions_dict["created_at"] = datetime.utcnow()
    general_conditions_dict["updated_at"] = datetime.utcnow()
    general_conditions_dict["is_active"] = True
    
    await db.general_conditions.insert_one(general_conditions_dict)
    
    return GeneralConditions(**general_conditions_dict)

@general_conditions_router.get("/active", response_model=GeneralConditions)
async def get_active_general_conditions(
    current_user: UserInDB = Depends(get_current_user)
):
    query = {"company_id": current_user.company_id, "is_active": True}
    general_conditions = await db.general_conditions.find_one(query)
    
    if not general_conditions:
        raise HTTPException(status_code=404, detail="No active general conditions found")
    
    return GeneralConditions(**general_conditions)

# Health check endpoint
@app.get("/api/health")
async def health_check():
    return {"status": "ok", "version": "1.0.0"}

# Include all routers
app.include_router(auth_router)
app.include_router(users_router)
app.include_router(companies_router)
app.include_router(suppliers_router)
app.include_router(templates_router)
app.include_router(contracts_router)
app.include_router(documents_router)
app.include_router(purchase_orders_router)
app.include_router(notifications_router)
app.include_router(general_conditions_router)

# Database initialization
@app.on_event("startup")
async def startup_db_client():
    # Create indexes
    await db.users.create_index("email", unique=True)
    await db.users.create_index("id", unique=True)
    await db.suppliers.create_index("id", unique=True)
    await db.templates.create_index("id", unique=True)
    await db.contracts.create_index("id", unique=True)
    await db.notifications.create_index("id", unique=True)
    await db.general_conditions.create_index("id", unique=True)
    
    # Create default admin user if no users exist
    user_count = await db.users.count_documents({})
    if user_count == 0:
        default_admin = {
            "id": str(uuid.uuid4()),
            "email": "admin@prismfinance.com",
            "name": "Admin",
            "role": "super_admin",
            "password_hash": get_password_hash("admin123"),
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "is_active": True
        }
        await db.users.insert_one(default_admin)
        print("INFO - Created default admin user")

# Database shutdown
@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
