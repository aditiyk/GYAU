from fastapi import APIRouter, Depends, HTTPException, status, Body
from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime, timedelta
from core.config import settings
import uuid

from core.security import verify_password, get_password_hash, create_access_token, ACCESS_TOKEN_EXPIRE_MINUTES, get_current_user, UserContext
from db.database import get_db

from google.oauth2 import id_token
from google.auth.transport import requests

router = APIRouter()

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user_id: str
    name: str
    provider: Optional[str] = None

class GoogleLogin(BaseModel):
    id_token: str

@router.post("/register", response_model=Token)
async def register_user(user: UserCreate):
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="Database connection error")
        
    existing_user = await db["users"].find_one({"email": user.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
        
    user_id = str(uuid.uuid4())
    hashed_password = get_password_hash(user.password)
    
    new_user = {
        "user_id": user_id,
        "name": user.name,
        "email": user.email,
        "hashed_password": hashed_password,
        "provider": "local",
        "created_at": datetime.utcnow().isoformat()
    }
    
    await db["users"].insert_one(new_user)
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user_id, "email": user.email}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer", "user_id": user_id, "name": user.name, "provider": "local"}

@router.post("/login", response_model=Token)
async def login_user(user: UserLogin):
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="Database connection error")
        
    db_user = await db["users"].find_one({"email": user.email})
    if not db_user or not db_user.get("hashed_password"):
        raise HTTPException(status_code=400, detail="Incorrect email or password")
        
    if not verify_password(user.password, db_user["hashed_password"]):
        raise HTTPException(status_code=400, detail="Incorrect email or password")
        
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": db_user["user_id"], "email": db_user["email"]}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer", "user_id": db_user["user_id"], "name": db_user["name"], "provider": db_user.get("provider", "local")}

@router.post("/google", response_model=Token)
async def google_login(login_data: GoogleLogin):
    # Depending on frontend setup, verify the ID token. 
    # Since the user might not have a client ID yet, we'll try to verify it, 
    # but if they don't have a Google Client ID, this will fail unless we bypass for dev.
    # For production-safe:
    try:
        # We specify requests.Request() to fetch Google's public keys.
        # If client_id is not specified, it just validates the signature.
        idinfo = id_token.verify_oauth2_token(login_data.id_token, requests.Request(),settings.google_client_id)
        
        email = idinfo['email']
        name = idinfo.get('name', 'Google User')
        picture = idinfo.get('picture', '')
        
        db = get_db()
        db_user = await db["users"].find_one({"email": email})
        
        if not db_user:
            user_id = str(uuid.uuid4())
            new_user = {
                "user_id": user_id,
                "name": name,
                "email": email,
                "provider": "google",
                "profile_picture": picture,
                "created_at": datetime.utcnow().isoformat()
            }
            await db["users"].insert_one(new_user)
            db_user = new_user
            
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": db_user["user_id"], "email": db_user["email"]}, expires_delta=access_token_expires
        )
        return {"access_token": access_token, "token_type": "bearer", "user_id": db_user["user_id"], "name": db_user["name"], "provider": db_user.get("provider", "google")}
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Invalid Google token: {str(e)}")

@router.delete("/account")
async def delete_account(current_user: UserContext = Depends(get_current_user)):
    db = get_db()
    result = await db["users"].delete_one({"user_id": current_user.user_id})
    if result.deleted_count == 0:
        return {"status": "success", "message": "Account not found or already deleted"}
    return {"status": "success", "message": "Account deleted successfully"}
