from fastapi import FastAPI, APIRouter
from starlette.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path
import logging
import os
from datetime import datetime
import uuid

# Import utilities and models
from utils import db, UPLOAD_DIR, get_password_hash

# Import routes
from routes.auth import router as auth_router
from routes.companies import router as companies_router
from routes.suppliers import router as suppliers_router
from routes.templates import router as templates_router
from routes.contracts import router as contracts_router
from routes.general_conditions import router as general_conditions_router
from routes.notifications import router as notifications_router
from routes.purchase_orders import router as purchase_orders_router
from routes.invoices import router as invoices_router

# Create the main app
app = FastAPI(title="PRISM'FINANCE API", version="1.0.0")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Include all routers
api_router.include_router(auth_router)
api_router.include_router(companies_router)
api_router.include_router(suppliers_router)
api_router.include_router(templates_router)
api_router.include_router(contracts_router)
api_router.include_router(general_conditions_router)
api_router.include_router(notifications_router)
api_router.include_router(purchase_orders_router)
api_router.include_router(invoices_router)

# Include the router in the main app
app.include_router(api_router)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files for uploads
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("startup")
async def startup_db_client():
    logger.info("Starting application")
    
    # Make sure all upload directories exist
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    os.makedirs(UPLOAD_DIR / "templates", exist_ok=True)
    os.makedirs(UPLOAD_DIR / "documents", exist_ok=True)
    os.makedirs(UPLOAD_DIR / "contracts", exist_ok=True)
    os.makedirs(UPLOAD_DIR / "logos", exist_ok=True)
    os.makedirs(UPLOAD_DIR / "invoices", exist_ok=True)
    
    # Create a default super admin user if none exists
    super_admin_count = await db.users.count_documents({"role": "super_admin"})
    if super_admin_count == 0:
        logger.info("Creating default super admin user")
        super_admin = {
            "id": str(uuid.uuid4()),
            "email": "morgan@bleupetrol.com",
            "password_hash": get_password_hash("admin123"),
            "name": "Morgan Cayre",
            "role": "super_admin",
            "created_at": datetime.utcnow()
        }
        await db.users.insert_one(super_admin)
    
    # Create a default company if none exists
    company_count = await db.client_companies.count_documents({})
    if company_count == 0:
        logger.info("Creating default company")
        company = {
            "id": str(uuid.uuid4()),
            "name": "BLEU PETROL",
            "settings": {
                "require_po": True,
                "require_signature": True,
                "default_document_validity": 180
            },
            "created_at": datetime.utcnow()
        }
        await db.client_companies.insert_one(company)
        
        # Create a default admin user for this company
        admin = {
            "id": str(uuid.uuid4()),
            "email": "admin@prismfinance.com",
            "password_hash": get_password_hash("admin123"),
            "name": "Admin User",
            "role": "admin",
            "company_id": company["id"],
            "created_at": datetime.utcnow()
        }
        await db.users.insert_one(admin)

@app.on_event("shutdown")
async def shutdown_db_client():
    logger.info("Shutting down application")
