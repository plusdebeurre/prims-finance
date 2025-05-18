from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any, Union
from datetime import datetime, timedelta
from enum import Enum
import uuid

# Enum definitions
class SupplierType(str, Enum):
    INDIVIDUAL = "entreprise_individuelle"
    SAS = "sas"
    SARL = "sarl"
    EURL = "eurl"
    AUTO_ENTREPRENEUR = "auto_entrepreneur"
    ARTISTE_AUTEUR = "artiste_auteur"

class UserRole(str, Enum):
    SUPER_ADMIN = "super_admin"
    ADMIN = "admin"
    SUPPLIER = "supplier"

class ContractStatus(str, Enum):
    DRAFT = "draft"
    SUPPLIER_SIGNED = "supplier_signed"
    ADMIN_SIGNED = "admin_signed"
    SIGNED = "signed"
    EXPIRED = "expired"

class DocumentStatus(str, Enum):
    PENDING = "pending"
    VALIDATED = "validated"
    REJECTED = "rejected"
    EXPIRED = "expired"

class InvoiceStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    PAID = "paid"
    REJECTED = "rejected"

class DocumentCategory(str, Enum):
    JUSTIFICATIF = "justificatif"
    DEVIS = "devis"
    FACTURE = "facture"
    CONTRAT = "contrat"
    AUTRE = "autre"

# Auth models
class UserBase(BaseModel):
    email: str
    name: Optional[str] = None
    role: UserRole
    company_id: Optional[str] = None
    supplier_id: Optional[str] = None

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    name: Optional[str] = None
    password: Optional[str] = None

class User(UserBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: datetime = Field(default_factory=datetime.utcnow)
    last_login: Optional[datetime] = None
    settings: Dict[str, Any] = {}

class Token(BaseModel):
    access_token: str
    token_type: str
    user_id: str
    role: UserRole
    name: Optional[str] = None
    company_id: Optional[str] = None
    supplier_id: Optional[str] = None

class TokenData(BaseModel):
    user_id: Optional[str] = None

# Client company models
class ClientCompany(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    logo_url: Optional[str] = None
    settings: Dict[str, Any] = {
        "require_po": False,
        "require_signature": True,
        "forward_invoices_email": None,
        "default_document_validity": 180,  # days
    }
    created_at: datetime = Field(default_factory=datetime.utcnow)

class ClientCompanyCreate(BaseModel):
    name: str
    settings: Optional[Dict[str, Any]] = None

class ClientCompanyUpdate(BaseModel):
    name: Optional[str] = None
    logo_url: Optional[str] = None
    settings: Optional[Dict[str, Any]] = None

# Supplier models
class SupplierBase(BaseModel):
    name: str
    type: SupplierType = SupplierType.SAS
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
    client_company_id: str

class SupplierCreate(SupplierBase):
    pass

class Supplier(SupplierBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

# Document type models
class DocumentTypeBase(BaseModel):
    name: str
    required_for: List[SupplierType] = []
    validity_period: Optional[int] = None  # in days
    is_active: bool = True
    client_company_id: str

class DocumentTypeCreate(DocumentTypeBase):
    pass

class DocumentType(DocumentTypeBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_by: str  # user_id
    created_at: datetime = Field(default_factory=datetime.utcnow)

# Document models
class DocumentBase(BaseModel):
    supplier_id: str
    document_type_id: Optional[str] = None
    category: DocumentCategory
    name: str
    file_path: str
    expiry_date: Optional[datetime] = None
    status: DocumentStatus = DocumentStatus.PENDING
    client_company_id: str

class DocumentCreate(DocumentBase):
    pass

class Document(DocumentBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    uploaded_by: str  # user_id
    upload_date: datetime = Field(default_factory=datetime.utcnow)
    validated_by: Optional[str] = None  # user_id
    validation_date: Optional[datetime] = None
    validation_notes: Optional[str] = None

# Contract template models
class ContractTemplateBase(BaseModel):
    name: str
    file_path: str
    variables: List[str] = []
    validity_period: Optional[int] = None  # in days
    client_company_id: str

class ContractTemplateCreate(BaseModel):
    name: str

class ContractTemplate(ContractTemplateBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_by: str  # user_id
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

# Contract models
class ContractBase(BaseModel):
    supplier_id: str
    template_id: str
    file_path: str
    variables: Dict[str, Any] = {}
    status: ContractStatus = ContractStatus.DRAFT
    expiry_date: Optional[datetime] = None
    client_company_id: str

class ContractCreate(BaseModel):
    supplier_id: str
    template_id: str
    variables: Dict[str, Any] = {}

class Contract(ContractBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_by: str  # user_id
    created_at: datetime = Field(default_factory=datetime.utcnow)
    supplier_signed_at: Optional[datetime] = None
    supplier_signed_by: Optional[Dict[str, str]] = None  # { name, surname }
    admin_signed_at: Optional[datetime] = None
    admin_signed_by: Optional[Dict[str, str]] = None  # { name, surname }
    content: Optional[str] = None  # Base64 encoded content

# General conditions models
class GeneralConditionsBase(BaseModel):
    version: str
    issue_date: datetime = Field(default_factory=datetime.utcnow)
    content: str
    is_active: bool = True
    client_company_id: str

class GeneralConditionsCreate(GeneralConditionsBase):
    pass

class GeneralConditions(GeneralConditionsBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_by: str  # user_id
    created_at: datetime = Field(default_factory=datetime.utcnow)

# GC acceptance model
class SupplierGCAcceptance(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    supplier_id: str
    gc_id: str
    accepted_at: datetime = Field(default_factory=datetime.utcnow)
    accepted_by: str  # user_id
    ip_address: Optional[str] = None
    client_company_id: str

# Purchase order models
class PurchaseOrderItem(BaseModel):
    description: str
    quantity: float
    unit_price: float
    unit: str = "unité"
    vat_rate: float = 20.0
    total_price: float

class PurchaseOrderBase(BaseModel):
    supplier_id: str
    items: List[PurchaseOrderItem]
    total_amount: float
    status: str = "draft"  # draft, sent, signed, cancelled
    notes: Optional[str] = None
    require_signature: bool = False
    client_company_id: str

class PurchaseOrderCreate(PurchaseOrderBase):
    pass

class PurchaseOrder(PurchaseOrderBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_by: str  # user_id
    created_at: datetime = Field(default_factory=datetime.utcnow)
    sent_at: Optional[datetime] = None
    signed_at: Optional[datetime] = None
    cancelled_at: Optional[datetime] = None
    signer_name: Optional[str] = None
    signer_surname: Optional[str] = None

# Invoice models
class InvoiceBase(BaseModel):
    supplier_id: str
    file_path: str
    amount: float
    due_date: datetime
    status: InvoiceStatus = InvoiceStatus.PENDING
    purchase_order_id: Optional[str] = None
    notes: Optional[str] = None
    client_company_id: str

class InvoiceCreate(InvoiceBase):
    pass

class Invoice(InvoiceBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    uploaded_by: str  # user_id
    upload_date: datetime = Field(default_factory=datetime.utcnow)
    approved_by: Optional[str] = None
    approval_date: Optional[datetime] = None
    payment_date: Optional[datetime] = None
    forwarded: bool = False

# Notification models
class NotificationType(str, Enum):
    CONTRACT_CREATED = "contract_created"
    CONTRACT_SIGNED = "contract_signed"
    DOCUMENT_UPLOADED = "document_uploaded"
    DOCUMENT_VALIDATED = "document_validated"
    DOCUMENT_REJECTED = "document_rejected"
    INVOICE_UPLOADED = "invoice_uploaded"
    INVOICE_APPROVED = "invoice_approved"
    INVOICE_PAID = "invoice_paid"
    PO_CREATED = "po_created"
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
