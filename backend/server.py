from fastapi import FastAPI, APIRouter, HTTPException, Depends, File, UploadFile, Form, Body
from fastapi.responses import JSONResponse, FileResponse
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any
from dotenv import load_dotenv
from pathlib import Path
import os
import logging
import uuid
import shutil
import re
import json
from datetime import datetime

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

# Create the main app without a prefix
app = FastAPI(title="PRISM'FINANCE API", version="1.0.0")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Models
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

# Function to extract variables from template content
def extract_variables(content: str) -> List[str]:
    pattern = r'\{\{([^}]+)\}\}'
    matches = re.findall(pattern, content)
    return list(set(matches))

# Supplier Endpoints
@api_router.post("/suppliers", response_model=Supplier)
async def create_supplier(supplier: SupplierCreate):
    supplier_dict = supplier.dict()
    supplier_obj = Supplier(**supplier_dict)
    
    # Check if supplier with SIRET already exists
    existing = await db.suppliers.find_one({"siret": supplier.siret})
    if existing:
        raise HTTPException(status_code=400, detail="Supplier with this SIRET already exists")
    
    await db.suppliers.insert_one(supplier_obj.dict())
    return supplier_obj

@api_router.get("/suppliers", response_model=List[Supplier])
async def get_suppliers():
    suppliers = await db.suppliers.find().to_list(1000)
    return [Supplier(**supplier) for supplier in suppliers]

@api_router.get("/suppliers/{supplier_id}", response_model=Supplier)
async def get_supplier(supplier_id: str):
    supplier = await db.suppliers.find_one({"id": supplier_id})
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")
    return Supplier(**supplier)

@api_router.put("/suppliers/{supplier_id}", response_model=Supplier)
async def update_supplier(supplier_id: str, supplier: SupplierCreate):
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
    file: UploadFile = File(...)
):
    # Create a unique filename
    filename = f"{uuid.uuid4()}_{file.filename}"
    file_path = TEMPLATES_DIR / filename
    
    # Save the file
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # Basic detection of variables from file content (simplified for demo)
    # In a real app, you'd use a library like mammoth to convert docx to html first
    content = await file.read()
    file.file.seek(0)  # Reset file position after reading
    
    # Extract variables
    variables = extract_variables(content.decode('utf-8', errors='ignore'))
    
    template = ContractTemplate(
        name=name,
        file_path=str(file_path),
        variables=variables
    )
    
    await db.contract_templates.insert_one(template.dict())
    return template

@api_router.get("/contract-templates", response_model=List[ContractTemplate])
async def get_contract_templates():
    templates = await db.contract_templates.find().to_list(1000)
    return [ContractTemplate(**template) for template in templates]

@api_router.get("/contract-templates/{template_id}", response_model=ContractTemplate)
async def get_contract_template(template_id: str):
    template = await db.contract_templates.find_one({"id": template_id})
    if not template:
        raise HTTPException(status_code=404, detail="Contract template not found")
    return ContractTemplate(**template)

# Contract Generation Endpoint
@api_router.post("/contracts/generate", response_model=Contract)
async def generate_contract(
    supplier_id: str = Form(...),
    template_id: str = Form(...),
    variables: str = Form(...)
):
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
    
    # Create a contract with generated file path
    # In a real app, you'd generate the PDF here using the template and variables
    contract_filename = f"contract_{supplier_id}_{template_id}_{uuid.uuid4()}.pdf"
    contract_path = str(CONTRACTS_DIR / contract_filename)
    
    contract = Contract(
        supplier_id=supplier_id,
        template_id=template_id,
        file_path=contract_path,
        variables=variables_dict
    )
    
    await db.contracts.insert_one(contract.dict())
    return contract

@api_router.get("/contracts", response_model=List[Contract])
async def get_contracts(supplier_id: Optional[str] = None):
    query = {}
    if supplier_id:
        query["supplier_id"] = supplier_id
    
    contracts = await db.contracts.find(query).to_list(1000)
    return [Contract(**contract) for contract in contracts]

@api_router.get("/contracts/{contract_id}", response_model=Contract)
async def get_contract(contract_id: str):
    contract = await db.contracts.find_one({"id": contract_id})
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")
    return Contract(**contract)

# General Conditions Endpoints
@api_router.post("/general-conditions", response_model=GeneralConditions)
async def create_general_conditions(gc: GeneralConditions):
    if gc.is_active:
        # Deactivate all other general conditions if this one is active
        await db.general_conditions.update_many(
            {"is_active": True},
            {"$set": {"is_active": False}}
        )
    
    await db.general_conditions.insert_one(gc.dict())
    return gc

@api_router.get("/general-conditions/active", response_model=GeneralConditions)
async def get_active_general_conditions():
    gc = await db.general_conditions.find_one({"is_active": True})
    if not gc:
        raise HTTPException(status_code=404, detail="No active general conditions found")
    return GeneralConditions(**gc)

@api_router.post("/suppliers/{supplier_id}/accept-gc", response_model=SupplierGCAcceptance)
async def accept_general_conditions(
    supplier_id: str,
    gc_id: str = Body(...),
    ip_address: Optional[str] = Body(None)
):
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
async def check_gc_acceptance(supplier_id: str):
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

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
