from pydantic import BaseModel, Field, EmailStr, validator, root_validator
from typing import List, Dict, Optional, Any, Union
from enum import Enum
from datetime import datetime
import uuid
import re

# User roles
class UserRole(str, Enum):
    ADMIN = "admin"
    SUPPLIER = "supplier"
    SUPER_ADMIN = "super_admin"

# Token data model for JWT
class TokenData(BaseModel):
    sub: str  # User ID
    email: str
    role: str
    company_id: Optional[str] = None
    supplier_id: Optional[str] = None
    exp: Optional[int] = None  # Expiration timestamp

# Base user model
class UserBase(BaseModel):
    email: EmailStr
    name: Optional[str] = None
    role: UserRole = UserRole.SUPPLIER
    company_id: Optional[str] = None
    supplier_id: Optional[str] = None
    is_active: bool = True

# Company data model
class CompanyData(BaseModel):
    name: str
    company_type: Optional[str] = None
    address: Optional[str] = None
    postal_code: Optional[str] = None
    city: Optional[str] = None
    country: Optional[str] = "France"
    registration_number: Optional[str] = None
    registration_city: Optional[str] = None
    representative_name: Optional[str] = None
    representative_role: Optional[str] = None
    phone: Optional[str] = None

# User creation model
class UserCreate(UserBase):
    password: str
    company_data: Optional[CompanyData] = None
    accepted_conditions_id: Optional[str] = None

# User update model
class UserUpdate(BaseModel):
    name: Optional[str] = None
    current_password: Optional[str] = None
    new_password: Optional[str] = None
    company_data: Optional[CompanyData] = None

# Password update model
class UserPasswordUpdate(BaseModel):
    current_password: str
    new_password: str

# Complete user model
class User(UserBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None

    class Config:
        orm_mode = True
        from_attributes = True  # V2 replacement for orm_mode

# Supplier status
class SupplierStatus(str, Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    PENDING = "pending"
    BLOCKED = "blocked"

# Supplier base model
class SupplierBase(BaseModel):
    name: str
    email: EmailStr
    company_data: Optional[CompanyData] = None
    status: SupplierStatus = SupplierStatus.ACTIVE

# Supplier creation model
class SupplierCreate(SupplierBase):
    pass

# Supplier update model
class SupplierUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    company_data: Optional[CompanyData] = None
    status: Optional[SupplierStatus] = None

# Complete supplier model
class Supplier(SupplierBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    documents: Optional[List[str]] = None
    contracts: Optional[List[str]] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None

    class Config:
        orm_mode = True
        from_attributes = True  # V2 replacement for orm_mode

# Contract template status
class TemplateStatus(str, Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    DRAFT = "draft"

# Contract template base model
class TemplateBase(BaseModel):
    name: str
    description: Optional[str] = None
    language: str = "fr"
    is_active: bool = True

# Contract template creation model
class TemplateCreate(TemplateBase):
    file_path: str

# Contract template update model
class TemplateUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    language: Optional[str] = None
    is_active: Optional[bool] = None
    file_path: Optional[str] = None

# Complete contract template model
class ContractTemplate(TemplateBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    file_path: str
    created_by: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None
    contracts_count: Optional[int] = 0

    class Config:
        orm_mode = True
        from_attributes = True  # V2 replacement for orm_mode

# Contract status
class ContractStatus(str, Enum):
    DRAFT = "Draft"
    PENDING_SIGNATURE = "Pending Signature"
    SIGNED = "Signed"
    EXPIRED = "Expired"
    CANCELLED = "Cancelled"

# Signature info
class SignatureInfo(BaseModel):
    name: str
    title: str
    date: datetime = Field(default_factory=datetime.utcnow)

# Contract base model
class ContractBase(BaseModel):
    name: str
    template_id: str
    supplier_id: str
    status: ContractStatus = ContractStatus.DRAFT
    variables: Optional[Dict[str, str]] = {}
    expiry_date: Optional[datetime] = None

# Contract creation model
class ContractCreate(ContractBase):
    pass

# Contract update model
class ContractUpdate(BaseModel):
    name: Optional[str] = None
    status: Optional[ContractStatus] = None
    variables: Optional[Dict[str, str]] = None
    expiry_date: Optional[datetime] = None

# Complete contract model
class Contract(ContractBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    file_path: Optional[str] = None
    created_by: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None
    supplier_signature: Optional[SignatureInfo] = None
    admin_signature: Optional[SignatureInfo] = None
    activity_log: Optional[List[Dict[str, Any]]] = None

    class Config:
        orm_mode = True
        from_attributes = True  # V2 replacement for orm_mode

# Document status
class DocumentStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"

# Document category
class DocumentCategory(str, Enum):
    JUSTIFICATIFS = "justificatifs"
    DEVIS = "devis"
    FACTURES = "factures"
    AUTRE = "autre"

# Document base model
class DocumentBase(BaseModel):
    name: str
    supplier_id: str
    type: str
    category: DocumentCategory = DocumentCategory.AUTRE
    status: DocumentStatus = DocumentStatus.PENDING
    comment: Optional[str] = None

# Document creation model
class DocumentCreate(DocumentBase):
    file_path: str

# Document update model
class DocumentUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[str] = None
    category: Optional[DocumentCategory] = None
    status: Optional[DocumentStatus] = None
    comment: Optional[str] = None

# Complete document model
class Document(DocumentBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    file_path: str
    file_name: str
    file_url: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None
    reviewed_by: Optional[str] = None
    reviewed_at: Optional[datetime] = None

    class Config:
        orm_mode = True
        from_attributes = True  # V2 replacement for orm_mode

# Purchase order status
class PurchaseOrderStatus(str, Enum):
    DRAFT = "draft"
    SENT = "sent"
    ACCEPTED = "accepted"
    FULFILLED = "fulfilled"
    CANCELLED = "cancelled"

# Purchase order item
class PurchaseOrderItem(BaseModel):
    description: str
    quantity: float
    unit_price: float
    unit: Optional[str] = None
    tax_rate: Optional[float] = 20.0  # Default VAT rate in France
    total_price: Optional[float] = None

    @validator('total_price', pre=True, always=True)
    def calculate_total_price(cls, v, values):
        if v is not None:
            return v
        if 'quantity' in values and 'unit_price' in values:
            return round(values['quantity'] * values['unit_price'], 2)
        return 0

# Purchase order base model
class PurchaseOrderBase(BaseModel):
    reference: str
    supplier_id: str
    issue_date: datetime = Field(default_factory=datetime.utcnow)
    delivery_date: Optional[datetime] = None
    items: List[PurchaseOrderItem]
    status: PurchaseOrderStatus = PurchaseOrderStatus.DRAFT
    notes: Optional[str] = None
    terms: Optional[str] = None
    total_amount: Optional[float] = None
    tax_amount: Optional[float] = None

    @validator('total_amount', pre=True, always=True)
    def calculate_total_amount(cls, v, values):
        if v is not None:
            return v
        if 'items' in values:
            return round(sum(item.total_price for item in values['items']), 2)
        return 0

    @validator('tax_amount', pre=True, always=True)
    def calculate_tax_amount(cls, v, values):
        if v is not None:
            return v
        if 'items' in values:
            return round(sum(item.total_price * (item.tax_rate / 100) for item in values['items']), 2)
        return 0

# Purchase order creation model
class PurchaseOrderCreate(PurchaseOrderBase):
    pass

# Purchase order update model
class PurchaseOrderUpdate(BaseModel):
    issue_date: Optional[datetime] = None
    delivery_date: Optional[datetime] = None
    items: Optional[List[PurchaseOrderItem]] = None
    status: Optional[PurchaseOrderStatus] = None
    notes: Optional[str] = None
    terms: Optional[str] = None

# Complete purchase order model
class PurchaseOrder(PurchaseOrderBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_by: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None
    signed_by: Optional[str] = None
    signed_at: Optional[datetime] = None

    class Config:
        orm_mode = True
        from_attributes = True  # V2 replacement for orm_mode

# Notification types
class NotificationType(str, Enum):
    CONTRACT_CREATED = "contract_created"
    CONTRACT_SIGNED = "contract_signed"
    CONTRACT_REJECTED = "contract_rejected"
    CONTRACT_EXPIRED = "contract_expired"
    DOCUMENT_APPROVED = "document_approved"
    DOCUMENT_REJECTED = "document_rejected"
    PO_CREATED = "po_created"
    PO_UPDATED = "po_updated"
    PO_ACCEPTED = "po_accepted"
    PO_REJECTED = "po_rejected"
    PO_FULFILLED = "po_fulfilled"
    PO_CANCELLED = "po_cancelled"
    INVOICE_RECEIVED = "invoice_received"
    INVOICE_PAID = "invoice_paid"
    INVOICE_OVERDUE = "invoice_overdue"
    SUPPLIER_REGISTERED = "supplier_registered"
    SUPPLIER_UPDATED = "supplier_updated"
    SUPPLIER_DOCUMENTS_PENDING = "supplier_documents_pending"
    PO_SIGNED = "po_signed"
    GC_ACCEPTANCE_REQUIRED = "gc_acceptance_required"

class NotificationBase(BaseModel):
    user_id: str
    type: NotificationType
    title: str
    message: str
    read: bool = False
    target_id: Optional[str] = None
    target_type: Optional[str] = None
    client_company_id: str

class NotificationCreate(NotificationBase):
    pass

class Notification(NotificationBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: datetime = Field(default_factory=datetime.utcnow)
    read_at: Optional[datetime] = None

    class Config:
        orm_mode = True
        from_attributes = True  # V2 replacement for orm_mode

# General conditions model
class GeneralConditions(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    content: str
    version: str
    is_active: bool = False
    created_by: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_by: Optional[str] = None
    updated_at: Optional[datetime] = None

    class Config:
        orm_mode = True
        from_attributes = True  # V2 replacement for orm_mode