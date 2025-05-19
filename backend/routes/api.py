from fastapi import APIRouter

from .auth import router as auth_router
from .suppliers import router as suppliers_router
from .contracts import router as contracts_router
from .templates import router as templates_router
from .purchase_orders import router as purchase_orders_router
from .invoices import router as invoices_router
from .documents import router as documents_router
from .admin import router as admin_router
from .companies import router as companies_router
from .general_conditions import router as general_conditions_router

# Main API router
router = APIRouter(prefix="/api")

# Include all sub-routers
router.include_router(auth_router)
router.include_router(suppliers_router)
router.include_router(contracts_router)
router.include_router(templates_router)
router.include_router(purchase_orders_router)
router.include_router(invoices_router)
router.include_router(documents_router)
router.include_router(admin_router)
router.include_router(companies_router)
router.include_router(general_conditions_router)

# Health check endpoint
@router.get("/health")
async def health_check():
    return {"status": "ok", "message": "PRISM'FINANCE API is running"}
