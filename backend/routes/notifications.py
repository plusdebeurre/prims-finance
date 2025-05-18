from fastapi import APIRouter, HTTPException, Depends, status
from typing import List, Optional
from datetime import datetime

from models import User, NotificationType
from auth import get_current_user
from utils import db

router = APIRouter(prefix="/notifications", tags=["notifications"])

# Get user notifications
@router.get("", response_model=List[dict])
async def get_notifications(
    unread_only: bool = False,
    current_user: User = Depends(get_current_user)
):
    # Build query
    query = {"user_id": current_user.id}
    
    if unread_only:
        query["read"] = False
    
    # Query database
    notifications = await db.notifications.find(query).sort("created_at", -1).to_list(length=100)
    
    return notifications

# Mark notification as read
@router.put("/{notification_id}/read")
async def mark_notification_read(
    notification_id: str,
    current_user: User = Depends(get_current_user)
):
    # Get notification
    notification = await db.notifications.find_one({
        "id": notification_id,
        "user_id": current_user.id
    })
    
    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found"
        )
    
    # Mark as read
    await db.notifications.update_one(
        {"id": notification_id},
        {"$set": {"read": True, "read_at": datetime.utcnow()}}
    )
    
    return {"message": "Notification marked as read"}

# Mark all notifications as read
@router.put("/read-all")
async def mark_all_notifications_read(
    current_user: User = Depends(get_current_user)
):
    # Mark all as read
    await db.notifications.update_many(
        {"user_id": current_user.id, "read": False},
        {"$set": {"read": True, "read_at": datetime.utcnow()}}
    )
    
    return {"message": "All notifications marked as read"}

# Delete notification
@router.delete("/{notification_id}")
async def delete_notification(
    notification_id: str,
    current_user: User = Depends(get_current_user)
):
    # Get notification
    notification = await db.notifications.find_one({
        "id": notification_id,
        "user_id": current_user.id
    })
    
    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found"
        )
    
    # Delete notification
    await db.notifications.delete_one({"id": notification_id})
    
    return {"message": "Notification deleted"}

# Get unread notification count
@router.get("/count", response_model=dict)
async def get_notification_count(
    current_user: User = Depends(get_current_user)
):
    # Count unread notifications
    count = await db.notifications.count_documents({
        "user_id": current_user.id,
        "read": False
    })
    
    return {"count": count}
