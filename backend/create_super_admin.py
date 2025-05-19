import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime
import uuid

# Connect to MongoDB
async def create_super_admin():
    # Load MongoDB URL from .env file
    mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
    db_name = os.environ.get('DB_NAME', 'prism_finance_db')
    
    # Connect to MongoDB
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    # Create super admin user
    user_id = str(uuid.uuid4())
    super_admin = {
        "id": user_id,
        "email": "morgan@bleupetrol.com",
        "name": "Morgan Admin",
        "role": "super_admin",
        "password_hash": "$2b$12$oWXUrE2zPv3WmnVMWLKa3eQorz6HniZx6oyWcrJosKQdBL8XifpK6",  # Hashed password for w1mRe^QQH6k!Z&QO
        "company_id": await get_or_create_company(db),
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
        "is_active": True
    }
    
    # Check if user already exists
    existing_user = await db.users.find_one({"email": "morgan@bleupetrol.com"})
    if existing_user:
        print(f"User with email morgan@bleupetrol.com already exists with ID: {existing_user['id']}")
        return
    
    # Insert user
    await db.users.insert_one(super_admin)
    print(f"Super admin created with ID: {user_id}")

async def get_or_create_company(db):
    # Check if a company exists
    company = await db.companies.find_one({"name": "PRISM'FINANCE"})
    if company:
        return company["id"]
    
    # Create a company if none exists
    company_id = str(uuid.uuid4())
    company = {
        "id": company_id,
        "name": "PRISM'FINANCE",
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
        "is_active": True
    }
    await db.companies.insert_one(company)
    print(f"Company created with ID: {company_id}")
    return company_id

# Run the async function
if __name__ == "__main__":
    asyncio.run(create_super_admin())
