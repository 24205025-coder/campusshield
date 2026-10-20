import os
import pymongo
from pymongo import MongoClient, ReturnDocument
from dotenv import load_dotenv

load_dotenv()

MONGODB_URI = os.getenv('MONGODB_URI', 'mongodb://localhost:27017')
MONGODB_DATABASE = os.getenv('MONGODB_DATABASE', 'campusshield')

_client = None
_db = None

def get_mongo_client():
    global _client
    if _client is None:
        try:
            # Set serverSelectionTimeoutMS to 5000 for fast fail/fallback
            _client = MongoClient(MONGODB_URI, serverSelectionTimeoutMS=5000)
        except Exception as e:
            print(f"[MongoDB Connection Error] Failed to initialize MongoClient: {e}")
            raise e
    return _client

def get_db():
    global _db
    if _db is None:
        client = get_mongo_client()
        _db = client[MONGODB_DATABASE]
        init_indexes(_db)
    return _db

def init_indexes(db):
    try:
        # Users Collection Indexes
        db.users.create_index("clerk_user_id", unique=True)
        db.users.create_index("email")
        
        # Complaints Collection Indexes
        db.complaints.create_index("complaint_id", unique=True)
        db.complaints.create_index("clerk_user_id")
        db.complaints.create_index("status")
        db.complaints.create_index("priority")
        db.complaints.create_index("category")
        db.complaints.create_index("department")
        db.complaints.create_index("created_at")
        db.complaints.create_index("sla.deadline")
        
        # Activity Logs Collection Indexes
        db.activity_logs.create_index("admin_clerk_user_id")
        db.activity_logs.create_index("complaint_id")
        db.activity_logs.create_index("created_at")
        
        # Ensure counter document exists
        if not db.counters.find_one({"_id": "complaint_id"}):
            db.counters.insert_one({"_id": "complaint_id", "seq": 1005})
            
        print("[MongoDB] Database collections and indexes initialized successfully.")
    except Exception as e:
        print(f"[MongoDB Index Warning] Could not initialize indexes: {e}")

def check_db_health():
    try:
        client = get_mongo_client()
        client.admin.command('ping')
        return True, "connected"
    except Exception as e:
        return False, str(e)

def get_next_complaint_id():
    db = get_db()
    # Atomic increment to prevent duplicate IDs permanently across restarts
    counter_doc = db.counters.find_one_and_update(
        {"_id": "complaint_id"},
        {"$inc": {"seq": 1}},
        upsert=True,
        return_document=ReturnDocument.AFTER
    )
    seq = counter_doc.get("seq", 1006)
    return f"CMP-{seq}"
