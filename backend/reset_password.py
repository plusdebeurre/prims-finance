import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from datetime import datetime
from passlib.context import CryptContext

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

async def reset_password():
    # Connect to MongoDB
    mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
    db_name = os.environ.get('DB_NAME', 'prism_finance_db')
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    # User email to reset
    email = "morgan@bleupetrol.com"
    new_password = "w1mRe^QQH6k!Z&QO"
    
    # Generate password hash
    hashed_password = pwd_context.hash(new_password)
    print(f"Generated hash for password: {hashed_password}")
    
    # Find the user
    user = await db.users.find_one({"email": email})
    if not user:
        print(f"User with email {email} not found")
        return
    
    print(f"Found user: {user['id']} - {user['email']}")
    
    # Update password
    result = await db.users.update_one(
        {"email": email},
        {"$set": {
            "password_hash": hashed_password,
            "updated_at": datetime.utcnow()
        }}
    )
    
    if result.modified_count:
        print(f"Password reset successfully for {email}")
    else:
        print(f"Failed to reset password for {email}")
    
    # Verify password hash
    updated_user = await db.users.find_one({"email": email})
    if updated_user:
        print(f"Updated user password hash: {updated_user['password_hash']}")
    
    # Close connection
    client.close()

# Run async function
if __name__ == "__main__":
    asyncio.run(reset_password())
