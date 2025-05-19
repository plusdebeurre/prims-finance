import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from datetime import datetime
import uuid
from passlib.context import CryptContext

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

async def create_test_user():
    # Connect to MongoDB
    mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
    db_name = os.environ.get('DB_NAME', 'prism_finance_db')
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    # Test user data
    email = "test@example.com"
    password = "password123"
    
    # Check if user exists
    existing_user = await db.users.find_one({"email": email})
    if existing_user:
        print(f"User {email} already exists, deleting...")
        await db.users.delete_one({"email": email})
    
    # Get existing company
    company = await db.companies.find_one({"name": "PRISM'FINANCE"})
    if not company:
        print("No company found, creating one...")
        company_id = str(uuid.uuid4())
        company = {
            "id": company_id,
            "name": "PRISM'FINANCE",
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "is_active": True
        }
        await db.companies.insert_one(company)
    else:
        company_id = company["id"]
    
    # Create password hash
    hashed_password = pwd_context.hash(password)
    print(f"Password hash: {hashed_password}")
    
    # Create user
    user_id = str(uuid.uuid4())
    user = {
        "id": user_id,
        "email": email,
        "name": "Test User",
        "role": "super_admin",
        "password_hash": hashed_password,
        "company_id": company_id,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
        "is_active": True
    }
    
    result = await db.users.insert_one(user)
    print(f"Created test user with ID: {user_id}")
    
    # Close connection
    client.close()

# Run async function
if __name__ == "__main__":
    asyncio.run(create_test_user())
