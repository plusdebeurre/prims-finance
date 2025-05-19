import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from datetime import datetime
from passlib.context import CryptContext

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

async def update_admin():
    # Connect to MongoDB
    mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
    db_name = os.environ.get('DB_NAME', 'prism_finance_db')
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    # Get default admin
    admin = await db.users.find_one({"email": "admin@prismfinance.com"})
    if not admin:
        print("Default admin not found")
        return
    
    # Create new admin
    new_email = "morgan@bleupetrol.com"
    new_password = "w1mRe^QQH6k!Z&QO"
    new_hashed_password = pwd_context.hash(new_password)
    print(f"New hashed password: {new_hashed_password}")
    
    # Update admin
    result = await db.users.update_one(
        {"email": "admin@prismfinance.com"},
        {"$set": {
            "email": new_email,
            "name": "Morgan SuperAdmin",
            "password_hash": new_hashed_password,
            "updated_at": datetime.utcnow()
        }}
    )
    
    if result.modified_count:
        print("Admin updated successfully")
    else:
        print("Failed to update admin")
    
    # Verify
    admin = await db.users.find_one({"email": new_email})
    if admin:
        print(f"Admin verification: {admin['id']} - {admin['email']} - {admin['role']}")
    
    # Close connection
    client.close()

# Run async function
if __name__ == "__main__":
    asyncio.run(update_admin())
