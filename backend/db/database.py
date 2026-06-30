from motor.motor_asyncio import AsyncIOMotorClient
from core.config import settings

client = None
db = None

async def connect_to_mongo():
    global client, db
    client = AsyncIOMotorClient(settings.mongodb_uri)
    db = client.get_database() # Defaults to db specified in URI
    
async def close_mongo_connection():
    client.close()

def get_db():
    return db
