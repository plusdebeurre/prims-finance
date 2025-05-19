from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any, Union
from datetime import datetime
import uuid

# User Models
class UserBase(BaseModel):
    email: EmailStr
    name: Optional[str] = None
    role: str = "supplier"  # supplier, admin, super_admin

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    name: Optional[str] = None
    role: Optional[str] = None
    password: Optional[str] = None

class UserInDB(UserBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    password_hash: str
    company_id: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    is_active: bool = True

class User(UserBase):
    id: str
    company_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    is_active: bool

# Token Models
class Token(BaseModel):
    access_token: str
    token_type: str
    user_id: str
    is_admin: bool
    name: Optional[str] = None

class TokenData(BaseModel):
    user_id: Optional[str] = None

# Company Models
class CompanyBase(BaseModel):
    name: str
    siret: Optional[str] = None
    address: Optional[str] = None
    postal_code: Optional[str] = None
    city: Optional[str] = None
    country: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None

class CompanyCreate(CompanyBase):
    pass

class CompanyUpdate(BaseModel):
    name: Optional[str] = None
    siret: Optional[str] = None
    address: Optional[str] = None
    postal_code: Optional[str] = None
    city: Optional[str] = None
    country: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None

class Company(CompanyBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    is_active: bool = True

# Supplier Models
class SupplierBase(BaseModel):
    company_name: str
    siret: Optional[str] = None
    contact_name: Optional[str] = None
    email: EmailStr
    phone: Optional[str] = None
    address: Optional[str] = None
    postal_code: Optional[str] = None
    city: Optional[str] = None
    country: Optional[str] = None
    status: str = "pending"  # pending, active, inactive, blocked

class SupplierCreate(SupplierBase):
    company_id: str

class SupplierUpdate(BaseModel):
    company_name: Optional[str] = None
    siret: Optional[str] = None
    contact_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    postal_code: Optional[str] = None
    city: Optional[str] = None
    country: Optional[str] = None
    status: Optional[str] = None

class Supplier(SupplierBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    company_id: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    documents: List[Dict[str, Any]] = []
    user_id: Optional[str] = None

# Template Models
class TemplateBase(BaseModel):
    name: str
    description: Optional[str] = None
    file_path: str
    variables: List[str] = []
    type: str = "contract"  # contract, invoice, purchase_order

class TemplateCreate(TemplateBase):
    company_id: str

class TemplateUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    file_path: Optional[str] = None
    variables: Optional[List[str]] = None
    type: Optional[str] = None

class Template(TemplateBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    company_id: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    is_active: bool = True

# Contract Models
class ContractBase(BaseModel):
    name: str
    supplier_id: str
    template_id: str
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    variable_values: Dict[str, str] = {}
    status: str = "draft"  # draft, pending_signature, signed, expired, cancelled

class ContractCreate(ContractBase):
    company_id: str

class ContractUpdate(BaseModel):
    name: Optional[str] = None
    supplier_id: Optional[str] = None
    template_id: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    variable_values: Optional[Dict[str, str]] = None
    status: Optional[str] = None
    file_path: Optional[str] = None

class Contract(ContractBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    company_id: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    file_path: Optional[str] = None
    signed_at: Optional[datetime] = None
    signed_by: Optional[str] = None

# Document Models
class DocumentBase(BaseModel):
    name: str
    description: Optional[str] = None
    category: str
    file_path: str
    supplier_id: Optional[str] = None
    contract_id: Optional[str] = None
    status: str = "pending"  # pending, approved, rejected

class DocumentCreate(DocumentBase):
    company_id: str

class DocumentUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    status: Optional[str] = None

class Document(DocumentBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    company_id: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    uploaded_by: str

# Purchase Order Models
class PurchaseOrderItem(BaseModel):
    description: str
    quantity: int
    unit_price: float
    total_price: float
    tax_rate: Optional[float] = 0.0
    tax_amount: Optional[float] = 0.0

class PurchaseOrderBase(BaseModel):
    po_number: str
    supplier_id: str
    issue_date: datetime = Field(default_factory=datetime.utcnow)
    due_date: Optional[datetime] = None
    items: List[PurchaseOrderItem] = []
    subtotal: float
    tax_total: float
    total: float
    status: str = "draft"  # draft, sent, accepted, fulfilled, cancelled

class PurchaseOrderCreate(PurchaseOrderBase):
    company_id: str

class PurchaseOrderUpdate(BaseModel):
    issue_date: Optional[datetime] = None
    due_date: Optional[datetime] = None
    items: Optional[List[PurchaseOrderItem]] = None
    subtotal: Optional[float] = None
    tax_total: Optional[float] = None
    total: Optional[float] = None
    status: Optional[str] = None

class PurchaseOrder(PurchaseOrderBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    company_id: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    created_by: str

# Notification Models
class NotificationBase(BaseModel):
    user_id: str
    title: str
    message: str
    type: str  # info, warning, error, success
    related_id: Optional[str] = None
    related_type: Optional[str] = None  # supplier, contract, document, etc.

class NotificationCreate(NotificationBase):
    company_id: str

class NotificationUpdate(BaseModel):
    read: bool = True

class Notification(NotificationBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    company_id: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    read: bool = False

# General Conditions Model
class GeneralConditionsBase(BaseModel):
    content: str
    version: str

class GeneralConditionsCreate(GeneralConditionsBase):
    company_id: str

class GeneralConditionsUpdate(BaseModel):
    content: Optional[str] = None
    version: Optional[str] = None
    is_active: Optional[bool] = None

class GeneralConditions(GeneralConditionsBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    company_id: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    is_active: bool = True
