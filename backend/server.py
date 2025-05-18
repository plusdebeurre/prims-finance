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

# Create the main app without a prefix
app = FastAPI(title="PRISM'FINANCE API", version="1.0.0")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Models
class UserBase(BaseModel):
    email: str
    name: Optional[str] = None
    is_admin: bool = False
    supplier_id: Optional[str] = None

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Token(BaseModel):
    access_token: str
    token_type: str
    user_id: str
    is_admin: bool
    name: Optional[str] = None

class TokenData(BaseModel):
    user_id: Optional[str] = None

class SupplierBase(BaseModel):
    name: str
    siret: str
    vat_number: str
    profession: Optional[str] = None
    address: Optional[str] = None
    postal_code: Optional[str] = None
    city: Optional[str] = None
    insee_code: Optional[str] = None
    country: Optional[str] = None
    iban: str
    bic: Optional[str] = None
    vat_rates: List[float] = [20.0]
    vat_exigibility: Optional[str] = None
    payment_rule: Optional[str] = None
    notes: Optional[str] = None
    emails: List[str]
    contract_variables: Optional[Dict[str, Any]] = {}

class SupplierCreate(SupplierBase):
    pass

class Supplier(SupplierBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class DocumentType(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    required_for: str  # 'individual', 'company', or 'both'
    validity_period: int  # in days

class DocumentTypeCreate(BaseModel):
    name: str
    required_for: str
    validity_period: int

class Document(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    supplier_id: str
    document_type_id: str
    file_path: str
    upload_date: datetime = Field(default_factory=datetime.utcnow)
    expiry_date: Optional[datetime] = None
    status: str = "pending"  # 'pending', 'validated', 'expired'

class ContractTemplate(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    file_path: str
    variables: List[str] = []
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class ContractTemplateCreate(BaseModel):
    name: str

class Contract(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    supplier_id: str
    template_id: str
    file_path: str
    variables: Dict[str, Any] = {}
    status: str = "draft"  # 'draft', 'sent', 'signed', 'expired'
    created_at: datetime = Field(default_factory=datetime.utcnow)
    signed_at: Optional[datetime] = None
    content: Optional[str] = None  # Base64 encoded content

class GeneralConditions(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    version: str
    content: str
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)

class SupplierGCAcceptance(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    supplier_id: str
    gc_id: str
    accepted_at: datetime = Field(default_factory=datetime.utcnow)
    ip_address: Optional[str] = None

class Invoice(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    supplier_id: str
    file_path: str
    amount: float
    due_date: datetime
    upload_date: datetime = Field(default_factory=datetime.utcnow)
    status: str = "pending"  # 'pending', 'paid', 'rejected'
    payment_date: Optional[datetime] = None
    notes: Optional[str] = None

# Auth Functions
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

async def get_user(email: str):
    user = await db.users.find_one({"email": email})
    if user:
        return User(**user)
    return None

async def authenticate_user(email: str, password: str):
    user = await get_user(email)
    if not user:
        return False
    user_dict = await db.users.find_one({"email": email})
    if not verify_password(password, user_dict["password"]):
        return False
    return user

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
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
    return User(**user)

async def get_current_admin_user(current_user: User = Depends(get_current_user)):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Not authorized")
    return current_user

# Function to extract variables from template content
def extract_variables(content: str) -> List[str]:
    pattern = r'\{\{([^}]+)\}\}'
    matches = re.findall(pattern, content)
    return list(set(matches))

# Auth Endpoints
@api_router.post("/auth/token", response_model=Token)
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
        "is_admin": user.is_admin,
        "name": user.name
    }

@api_router.post("/users", response_model=User)
async def create_user(user: UserCreate):
    db_user = await get_user(user.email)
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = get_password_hash(user.password)
    user_data = user.dict()
    user_data.pop("password")
    user_obj = User(**user_data)
    user_dict = user_obj.dict()
    user_dict["password"] = hashed_password
    
    await db.users.insert_one(user_dict)
    return user_obj

@api_router.get("/users/me", response_model=User)
async def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user

# Supplier Endpoints
@api_router.post("/suppliers", response_model=Supplier)
async def create_supplier(supplier: SupplierCreate, current_user: User = Depends(get_current_admin_user)):
    supplier_dict = supplier.dict()
    supplier_obj = Supplier(**supplier_dict)
    
    # Check if supplier with SIRET already exists
    existing = await db.suppliers.find_one({"siret": supplier.siret})
    if existing:
        raise HTTPException(status_code=400, detail="Supplier with this SIRET already exists")
    
    await db.suppliers.insert_one(supplier_obj.dict())
    return supplier_obj

@api_router.get("/suppliers", response_model=List[Supplier])
async def get_suppliers(current_user: User = Depends(get_current_user)):
    if current_user.is_admin:
        suppliers = await db.suppliers.find().to_list(1000)
    else:
        # If not admin, only return the supplier associated with this user
        if not current_user.supplier_id:
            return []
        suppliers = await db.suppliers.find({"id": current_user.supplier_id}).to_list(1)
    
    return [Supplier(**supplier) for supplier in suppliers]

@api_router.get("/suppliers/{supplier_id}", response_model=Supplier)
async def get_supplier(supplier_id: str, current_user: User = Depends(get_current_user)):
    # Check permissions - admin can view any supplier, non-admin only their own
    if not current_user.is_admin and current_user.supplier_id != supplier_id:
        raise HTTPException(status_code=403, detail="Not authorized to view this supplier")
    
    supplier = await db.suppliers.find_one({"id": supplier_id})
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")
    return Supplier(**supplier)

@api_router.put("/suppliers/{supplier_id}", response_model=Supplier)
async def update_supplier(supplier_id: str, supplier: SupplierCreate, current_user: User = Depends(get_current_user)):
    # Check permissions - admin can update any supplier, non-admin only their own
    if not current_user.is_admin and current_user.supplier_id != supplier_id:
        raise HTTPException(status_code=403, detail="Not authorized to update this supplier")
    
    existing = await db.suppliers.find_one({"id": supplier_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Supplier not found")
    
    supplier_dict = supplier.dict()
    supplier_dict["updated_at"] = datetime.utcnow()
    
    await db.suppliers.update_one(
        {"id": supplier_id},
        {"$set": supplier_dict}
    )
    
    updated = await db.suppliers.find_one({"id": supplier_id})
    return Supplier(**updated)

# Contract Template Endpoints
@api_router.post("/contract-templates", response_model=ContractTemplate)
async def create_contract_template(
    name: str = Form(...),
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_admin_user)
):
    # Create a unique filename
    filename = f"{uuid.uuid4()}_{file.filename}"
    file_path = TEMPLATES_DIR / filename
    
    # Save the file
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # Extract variables using mammoth (convert docx to html)
    try:
        # Read file content
        with open(file_path, "rb") as f:
            content_bytes = f.read()
        
        # Convert docx to html
        result = mammoth.convert_to_html(io.BytesIO(content_bytes))
        html_content = result.value
        
        # Extract variables from HTML
        variables = extract_variables(html_content)
    except Exception as e:
        logging.error(f"Error processing template: {str(e)}")
        variables = []
    
    template = ContractTemplate(
        name=name,
        file_path=str(file_path),
        variables=variables
    )
    
    await db.contract_templates.insert_one(template.dict())
    return template

@api_router.get("/contract-templates", response_model=List[ContractTemplate])
async def get_contract_templates(current_user: User = Depends(get_current_user)):
    templates = await db.contract_templates.find().to_list(1000)
    return [ContractTemplate(**template) for template in templates]

@api_router.get("/contract-templates/{template_id}", response_model=ContractTemplate)
async def get_contract_template(template_id: str, current_user: User = Depends(get_current_user)):
    template = await db.contract_templates.find_one({"id": template_id})
    if not template:
        raise HTTPException(status_code=404, detail="Contract template not found")
    return ContractTemplate(**template)

@api_router.get("/contract-templates/{template_id}/download")
async def download_contract_template(template_id: str, current_user: User = Depends(get_current_user)):
    template = await db.contract_templates.find_one({"id": template_id})
    if not template:
        raise HTTPException(status_code=404, detail="Contract template not found")
    
    file_path = Path(template["file_path"])
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Template file not found")
    
    return FileResponse(
        path=file_path, 
        filename=file_path.name, 
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    )

# Contract Generation Endpoint
@api_router.post("/contracts/generate", response_model=Contract)
async def generate_contract(
    supplier_id: str = Form(...),
    template_id: str = Form(...),
    variables: str = Form(...),
    current_user: User = Depends(get_current_user)
):
    # Check permissions - admin can generate for any supplier, non-admin only for their own
    if not current_user.is_admin and current_user.supplier_id != supplier_id:
        raise HTTPException(status_code=403, detail="Not authorized to generate contracts for this supplier")
    
    # Validate supplier and template exist
    supplier = await db.suppliers.find_one({"id": supplier_id})
    template = await db.contract_templates.find_one({"id": template_id})
    
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")
    if not template:
        raise HTTPException(status_code=404, detail="Contract template not found")
    
    # Parse variables
    try:
        variables_dict = json.loads(variables)
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid variables format")
    
    # Read template content
    try:
        with open(template["file_path"], "rb") as f:
            template_content = f.read()
        
        # Convert to HTML
        result = mammoth.convert_to_html(io.BytesIO(template_content))
        html_content = result.value
        
        # Replace variables in HTML
        for var_name, var_value in variables_dict.items():
            html_content = html_content.replace(f"{{{{{var_name}}}}}", str(var_value))
        
        # Store as base64 for display in frontend
        content_b64 = base64.b64encode(html_content.encode()).decode()
        
        # Create contract file
        contract_filename = f"contract_{supplier_id}_{template_id}_{uuid.uuid4()}.html"
        contract_path = str(CONTRACTS_DIR / contract_filename)
        
        with open(CONTRACTS_DIR / contract_filename, "w") as f:
            f.write(html_content)
        
        contract = Contract(
            supplier_id=supplier_id,
            template_id=template_id,
            file_path=contract_path,
            variables=variables_dict,
            content=content_b64
        )
        
        await db.contracts.insert_one(contract.dict())
        return contract
    
    except Exception as e:
        logging.error(f"Error generating contract: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error generating contract: {str(e)}")

@api_router.get("/contracts", response_model=List[Contract])
async def get_contracts(supplier_id: Optional[str] = None, current_user: User = Depends(get_current_user)):
    query = {}
    
    # Enforce permissions:
    # - Admin can view all contracts or filter by supplier
    # - Non-admin can only view their own supplier's contracts
    if not current_user.is_admin:
        if not current_user.supplier_id:
            return []
        query["supplier_id"] = current_user.supplier_id
    elif supplier_id:
        query["supplier_id"] = supplier_id
    
    contracts = await db.contracts.find(query).to_list(1000)
    return [Contract(**contract) for contract in contracts]

@api_router.get("/contracts/{contract_id}", response_model=Contract)
async def get_contract(contract_id: str, current_user: User = Depends(get_current_user)):
    contract = await db.contracts.find_one({"id": contract_id})
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")
    
    # Check permissions - admin can view any contract, non-admin only their supplier's
    if not current_user.is_admin and current_user.supplier_id != contract["supplier_id"]:
        raise HTTPException(status_code=403, detail="Not authorized to view this contract")
    
    return Contract(**contract)

@api_router.post("/contracts/{contract_id}/sign", response_model=Contract)
async def sign_contract(contract_id: str, current_user: User = Depends(get_current_user)):
    contract = await db.contracts.find_one({"id": contract_id})
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")
    
    # Check permissions - admin can sign any contract, non-admin only their supplier's
    if not current_user.is_admin and current_user.supplier_id != contract["supplier_id"]:
        raise HTTPException(status_code=403, detail="Not authorized to sign this contract")
    
    # Update contract
    now = datetime.utcnow()
    await db.contracts.update_one(
        {"id": contract_id},
        {"$set": {"status": "signed", "signed_at": now}}
    )
    
    updated = await db.contracts.find_one({"id": contract_id})
    return Contract(**updated)

# General Conditions Endpoints
@api_router.post("/general-conditions", response_model=GeneralConditions)
async def create_general_conditions(gc: GeneralConditions, current_user: User = Depends(get_current_admin_user)):
    if gc.is_active:
        # Deactivate all other general conditions if this one is active
        await db.general_conditions.update_many(
            {"is_active": True},
            {"$set": {"is_active": False}}
        )
    
    await db.general_conditions.insert_one(gc.dict())
    return gc

@api_router.get("/general-conditions/active", response_model=GeneralConditions)
async def get_active_general_conditions(current_user: User = Depends(get_current_user)):
    gc = await db.general_conditions.find_one({"is_active": True})
    if not gc:
        raise HTTPException(status_code=404, detail="No active general conditions found")
    return GeneralConditions(**gc)

@api_router.post("/suppliers/{supplier_id}/accept-gc", response_model=SupplierGCAcceptance)
async def accept_general_conditions(
    supplier_id: str,
    gc_id: str = Body(...),
    ip_address: Optional[str] = Body(None),
    current_user: User = Depends(get_current_user)
):
    # Check permissions - admin or supplier's own user can accept
    if not current_user.is_admin and current_user.supplier_id != supplier_id:
        raise HTTPException(status_code=403, detail="Not authorized to accept for this supplier")
    
    # Validate supplier and GC exist
    supplier = await db.suppliers.find_one({"id": supplier_id})
    gc = await db.general_conditions.find_one({"id": gc_id})
    
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")
    if not gc:
        raise HTTPException(status_code=404, detail="General conditions not found")
    
    acceptance = SupplierGCAcceptance(
        supplier_id=supplier_id,
        gc_id=gc_id,
        ip_address=ip_address
    )
    
    await db.gc_acceptances.insert_one(acceptance.dict())
    return acceptance

@api_router.get("/suppliers/{supplier_id}/gc-status", response_model=bool)
async def check_gc_acceptance(supplier_id: str, current_user: User = Depends(get_current_user)):
    # Check permissions - admin or supplier's own user can check
    if not current_user.is_admin and current_user.supplier_id != supplier_id:
        raise HTTPException(status_code=403, detail="Not authorized to check for this supplier")
    
    # Get most recent active GC
    gc = await db.general_conditions.find_one({"is_active": True})
    if not gc:
        return False
    
    # Check if supplier has accepted this GC
    acceptance = await db.gc_acceptances.find_one({
        "supplier_id": supplier_id,
        "gc_id": gc["id"]
    })
    
    return acceptance is not None

# Invoice Endpoints
@api_router.post("/invoices", response_model=Invoice)
async def create_invoice(
    supplier_id: str = Form(...),
    amount: float = Form(...),
    due_date: str = Form(...),
    notes: Optional[str] = Form(None),
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    # Check permissions - admin or supplier's own user can upload invoices
    if not current_user.is_admin and current_user.supplier_id != supplier_id:
        raise HTTPException(status_code=403, detail="Not authorized to upload invoices for this supplier")
    
    # Check if supplier exists
    supplier = await db.suppliers.find_one({"id": supplier_id})
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")
    
    # Check if supplier has accepted general conditions
    gc = await db.general_conditions.find_one({"is_active": True})
    if gc:
        acceptance = await db.gc_acceptances.find_one({
            "supplier_id": supplier_id,
            "gc_id": gc["id"]
        })
        if not acceptance and not current_user.is_admin:
            raise HTTPException(
                status_code=400, 
                detail="Supplier must accept the general conditions before uploading invoices"
            )
    
    # Save the file
    filename = f"invoice_{supplier_id}_{uuid.uuid4()}_{file.filename}"
    file_path = UPLOAD_DIR / "invoices"
    file_path.mkdir(exist_ok=True)
    
    file_path = file_path / filename
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    try:
        due_date_obj = datetime.fromisoformat(due_date)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid due date format. Use ISO format (YYYY-MM-DD)")
    
    invoice = Invoice(
        supplier_id=supplier_id,
        file_path=str(file_path),
        amount=amount,
        due_date=due_date_obj,
        notes=notes
    )
    
    await db.invoices.insert_one(invoice.dict())
    return invoice

@api_router.get("/invoices", response_model=List[Invoice])
async def get_invoices(supplier_id: Optional[str] = None, current_user: User = Depends(get_current_user)):
    query = {}
    
    # Enforce permissions:
    # - Admin can view all invoices or filter by supplier
    # - Non-admin can only view their own supplier's invoices
    if not current_user.is_admin:
        if not current_user.supplier_id:
            return []
        query["supplier_id"] = current_user.supplier_id
    elif supplier_id:
        query["supplier_id"] = supplier_id
    
    invoices = await db.invoices.find(query).to_list(1000)
    return [Invoice(**invoice) for invoice in invoices]

@api_router.get("/invoices/{invoice_id}", response_model=Invoice)
async def get_invoice(invoice_id: str, current_user: User = Depends(get_current_user)):
    invoice = await db.invoices.find_one({"id": invoice_id})
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    # Check permissions - admin can view any invoice, non-admin only their supplier's
    if not current_user.is_admin and current_user.supplier_id != invoice["supplier_id"]:
        raise HTTPException(status_code=403, detail="Not authorized to view this invoice")
    
    return Invoice(**invoice)

@api_router.put("/invoices/{invoice_id}/status", response_model=Invoice)
async def update_invoice_status(
    invoice_id: str, 
    status: str = Body(...),
    payment_date: Optional[str] = Body(None),
    current_user: User = Depends(get_current_admin_user)
):
    invoice = await db.invoices.find_one({"id": invoice_id})
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    if status not in ["pending", "paid", "rejected"]:
        raise HTTPException(status_code=400, detail="Invalid status. Use 'pending', 'paid', or 'rejected'")
    
    update_data = {"status": status}
    
    if status == "paid" and payment_date:
        try:
            payment_date_obj = datetime.fromisoformat(payment_date)
            update_data["payment_date"] = payment_date_obj
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid payment date format. Use ISO format (YYYY-MM-DD)")
    
    await db.invoices.update_one(
        {"id": invoice_id},
        {"$set": update_data}
    )
    
    updated = await db.invoices.find_one({"id": invoice_id})
    return Invoice(**updated)

@api_router.delete("/invoices/{invoice_id}")
async def delete_invoice(invoice_id: str, current_user: User = Depends(get_current_user)):
    invoice = await db.invoices.find_one({"id": invoice_id})
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    # Check permissions - admin can delete any invoice, non-admin only their supplier's if status is pending
    if not current_user.is_admin:
        if current_user.supplier_id != invoice["supplier_id"]:
            raise HTTPException(status_code=403, detail="Not authorized to delete this invoice")
        if invoice["status"] != "pending":
            raise HTTPException(status_code=400, detail="Cannot delete invoices that are not in 'pending' status")
    
    # Delete the file if it exists
    file_path = Path(invoice["file_path"])
    if file_path.exists():
        file_path.unlink()
    
    # Delete the database record
    await db.invoices.delete_one({"id": invoice_id})
    
    return {"message": "Invoice deleted successfully"}

# Include the router in the main app
app.include_router(api_router)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("startup")
async def startup_db_client():
    # Create a default admin user if none exists
    admin_count = await db.users.count_documents({"is_admin": True})
    if admin_count == 0:
        admin_user = {
            "id": str(uuid.uuid4()),
            "email": "admin@prismfinance.com",
            "password": get_password_hash("admin123"),
            "name": "Admin User",
            "is_admin": True,
            "created_at": datetime.utcnow()
        }
        await db.users.insert_one(admin_user)
        logger.info("Created default admin user")
    
    # Make sure UPLOAD_DIR and all subdirectories exist
    (UPLOAD_DIR / "invoices").mkdir(exist_ok=True, parents=True)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
