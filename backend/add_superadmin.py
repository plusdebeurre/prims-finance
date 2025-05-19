from fastapi import FastAPI
from passlib.context import CryptContext
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime
import os
import uuid
import asyncio

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

async def create_superadmin():
    # Connect to MongoDB
    mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
    db_name = os.environ.get('DB_NAME', 'prism_finance_db')
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    # Generate hashed password
    password = "w1mRe^QQH6k!Z&QO"
    hashed_password = pwd_context.hash(password)
    print(f"Hashed password: {hashed_password}")
    
    # Create or get company
    company = await db.companies.find_one({"name": "PRISM'FINANCE"})
    if not company:
        company_id = str(uuid.uuid4())
        company_data = {
            "id": company_id,
            "name": "PRISM'FINANCE",
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "is_active": True
        }
        result = await db.companies.insert_one(company_data)
        print(f"Created company with id: {company_id}")
    else:
        company_id = company["id"]
        print(f"Using existing company with id: {company_id}")
    
    # Check if user exists
    user = await db.users.find_one({"email": "morgan@bleupetrol.com"})
    if user:
        # Update user
        update_result = await db.users.update_one(
            {"email": "morgan@bleupetrol.com"},
            {"$set": {
                "password_hash": hashed_password,
                "role": "super_admin",
                "company_id": company_id,
                "updated_at": datetime.utcnow()
            }}
        )
        print(f"Updated existing user: {user['id']}")
    else:
        # Create new user
        user_id = str(uuid.uuid4())
        user_data = {
            "id": user_id,
            "email": "morgan@bleupetrol.com",
            "name": "Morgan Super Admin",
            "role": "super_admin",
            "password_hash": hashed_password,
            "company_id": company_id,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "is_active": True
        }
        result = await db.users.insert_one(user_data)
        print(f"Created new super admin user with id: {user_id}")
    
    # Verify
    user = await db.users.find_one({"email": "morgan@bleupetrol.com"})
    if user:
        print(f"User verification: {user['id']} - {user['email']} - {user['role']}")
    
    # Close connection
    client.close()

# Run async function
if __name__ == "__main__":
    asyncio.run(create_superadmin())
