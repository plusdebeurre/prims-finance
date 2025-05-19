import os
import logging
import motor.motor_asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo.server_api import ServerApi

# Get MongoDB URI from environment variable
MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.environ.get("DB_NAME", "prism_finance")

# Configure logging
logger = logging.getLogger(__name__)

# Global database client and database instances
client = None
db = None

async def startup_db_client():
    """
    Connect to MongoDB when the application starts.
    This function should be called during the app startup event.
    """
    global client, db
    
    logger.info(f"Connecting to MongoDB at {MONGO_URL}")
    
    try:
        # Create a new client and connect to the server
        client = AsyncIOMotorClient(MONGO_URL, server_api=ServerApi('1'))
        
        # Send a ping to confirm a successful connection
        await client.admin.command('ping')
        logger.info("MongoDB connection successful")
        
        # Get database
        db = client[DB_NAME]
        
        # Initialize collections if needed
        await initialize_collections()
        
        logger.info(f"Connected to database: {DB_NAME}")
    except Exception as e:
        logger.error(f"MongoDB connection error: {e}")
        raise

async def initialize_collections():
    """
    Initialize collections and indexes if they don't exist.
    """
    # Create indexes for users collection
    await db.users.create_index("email", unique=True)
    await db.users.create_index("id", unique=True)
    
    # Create indexes for suppliers collection
    await db.suppliers.create_index("id", unique=True)
    await db.suppliers.create_index("email")
    
    # Create indexes for contracts collection
    await db.contracts.create_index("id", unique=True)
    await db.contracts.create_index("supplier_id")
    await db.contracts.create_index("template_id")
    
    # Create indexes for templates collection
    await db.templates.create_index("id", unique=True)
    
    # Create indexes for documents collection
    await db.documents.create_index("id", unique=True)
    await db.documents.create_index("supplier_id")
    
    # Create indexes for purchase_orders collection
    await db.purchase_orders.create_index("id", unique=True)
    await db.purchase_orders.create_index("supplier_id")
    await db.purchase_orders.create_index("reference", unique=True)
    
    # Create indexes for invoices collection
    await db.invoices.create_index("id", unique=True)
    await db.invoices.create_index("supplier_id")
    await db.invoices.create_index("invoice_number", unique=True)
    
    # Create indexes for notifications collection
    await db.notifications.create_index("id", unique=True)
    await db.notifications.create_index("user_id")
    
    # Create indexes for general_conditions collection
    await db.general_conditions.create_index("id", unique=True)
    await db.general_conditions.create_index("version")
    
    # Create indexes for companies collection
    await db.companies.create_index("id", unique=True)

async def shutdown_db_client():
    """
    Close the MongoDB connection when the application shuts down.
    This function should be called during the app shutdown event.
    """
    global client
    
    if client:
        logger.info("Closing MongoDB connection")
        client.close()
        logger.info("MongoDB connection closed")
