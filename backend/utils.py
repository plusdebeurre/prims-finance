import re
import io
import base64
import mammoth
import os
import uuid
from datetime import datetime, timedelta
from pathlib import Path
from typing import List, Dict, Any, Optional
import jwt
from passlib.context import CryptContext
from fastapi import HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from motor.motor_asyncio import AsyncIOMotorClient
from email.message import EmailMessage
import smtplib
import ssl

# Configuration
SECRET_KEY = os.environ.get("SECRET_KEY", "mysecretkey")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 1 day

# Password context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# OAuth2 scheme
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/token")

# Initialize database
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get('DB_NAME', 'prism_finance_db')]

# Storage paths
ROOT_DIR = Path(__file__).parent
UPLOAD_DIR = ROOT_DIR / 'uploads'
TEMPLATES_DIR = UPLOAD_DIR / 'templates'
DOCUMENTS_DIR = UPLOAD_DIR / 'documents'
CONTRACTS_DIR = UPLOAD_DIR / 'contracts'
LOGOS_DIR = UPLOAD_DIR / 'logos'
INVOICES_DIR = UPLOAD_DIR / 'invoices'

for directory in [UPLOAD_DIR, TEMPLATES_DIR, DOCUMENTS_DIR, CONTRACTS_DIR, LOGOS_DIR, INVOICES_DIR]:
    directory.mkdir(exist_ok=True, parents=True)

# Authentication utils
def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password against hashed version."""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """Generate password hash."""
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create a JWT access token."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_user_by_email(email: str):
    """Get a user by email."""
    return await db.users.find_one({"email": email})

async def get_user_by_id(user_id: str):
    """Get a user by ID."""
    return await db.users.find_one({"id": user_id})

# Template and document utils
def extract_variables(content: str) -> List[str]:
    """Extract variables from template content."""
    pattern = r'\{\{([^}]+)\}\}'
    matches = re.findall(pattern, content)
    return list(set(matches))

async def extract_variables_from_docx(file_path: str) -> List[str]:
    """Extract variables from a DOCX file."""
    try:
        with open(file_path, "rb") as f:
            content_bytes = f.read()
        
        # Convert docx to html
        result = mammoth.convert_to_html(io.BytesIO(content_bytes))
        html_content = result.value
        
        # Extract variables from HTML
        return extract_variables(html_content)
    except Exception as e:
        print(f"Error extracting variables: {str(e)}")
        return []

def supplier_to_variables_dict(supplier: Dict[str, Any]) -> Dict[str, Any]:
    """Convert a supplier object to a mapping for template variables."""
    result = {
        "SupplierName": supplier.get("name", ""),
        "SIRET": supplier.get("siret", ""),
        "TVA": supplier.get("vat_number", ""),
        "Profession": supplier.get("profession", ""),
        "Adresse": supplier.get("address", ""),
        "CodePostal": supplier.get("postal_code", ""),
        "Ville": supplier.get("city", ""),
        "Pays": supplier.get("country", ""),
        "IBAN": supplier.get("iban", ""),
        "BIC": supplier.get("bic", ""),
        "Email": supplier.get("emails", [""])[0] if supplier.get("emails") else "",
    }
    
    # Add any custom variables from contract_variables
    if supplier.get("contract_variables"):
        result.update(supplier["contract_variables"])
    
    return result

async def replace_variables_in_html(html_content: str, variables: Dict[str, Any]) -> str:
    """Replace variables in HTML content with values."""
    for var_name, var_value in variables.items():
        html_content = html_content.replace(f"{{{{{var_name}}}}}", str(var_value))
    return html_content

def create_notification(user_id: str, type: str, title: str, message: str, target_id: Optional[str] = None, 
                       target_type: Optional[str] = None, client_company_id: str = None) -> Dict[str, Any]:
    """Create a notification object."""
    return {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "type": type,
        "title": title,
        "message": message,
        "read": False,
        "target_id": target_id,
        "target_type": target_type,
        "client_company_id": client_company_id,
        "created_at": datetime.utcnow()
    }

async def send_email(to_email: str, subject: str, body: str, html: bool = True) -> bool:
    """Send an email notification."""
    # Email configuration from environment variables
    smtp_server = os.environ.get("SMTP_SERVER")
    smtp_port = int(os.environ.get("SMTP_PORT", 587))
    smtp_username = os.environ.get("SMTP_USERNAME")
    smtp_password = os.environ.get("SMTP_PASSWORD")
    from_email = os.environ.get("FROM_EMAIL")
    
    # If email not configured, just return
    if not all([smtp_server, smtp_username, smtp_password, from_email]):
        print("Email not configured, skipping")
        return False
    
    # Create message
    msg = EmailMessage()
    msg["From"] = from_email
    msg["To"] = to_email
    msg["Subject"] = subject
    
    # Set content based on format
    if html:
        msg.add_alternative(body, subtype="html")
    else:
        msg.set_content(body)
    
    # Send email
    try:
        context = ssl.create_default_context()
        with smtplib.SMTP(smtp_server, smtp_port) as server:
            server.starttls(context=context)
            server.login(smtp_username, smtp_password)
            server.send_message(msg)
        return True
    except Exception as e:
        print(f"Email sending failed: {str(e)}")
        return False
