from datetime import datetime
from database.mongodb import get_db

def log_admin_activity(admin_email, action_type, complaint_id, description, admin_clerk_user_id=None):
    """
    Creates and records a new admin activity log entry in MongoDB activity_logs collection.
    """
    now = datetime.now()
    now_str = now.strftime("%Y-%m-%d %H:%M:%S")
    
    log_entry = {
        "admin_clerk_user_id": admin_clerk_user_id or "admin_user",
        "admin_email": admin_email or "mohamedkaisibrahim2@gmail.com",
        "action": action_type,
        "action_type": action_type,
        "complaint_id": complaint_id,
        "description": description,
        "created_at": now_str,
        "timestamp": now_str,
        "date": now.strftime("%Y-%m-%d"),
        "time": now.strftime("%H:%M")
    }
    
    try:
        db = get_db()
        res = db.activity_logs.insert_one(log_entry)
        log_entry["_id"] = str(res.inserted_id)
        log_entry["id"] = str(res.inserted_id)
    except Exception as e:
        print(f"[MongoDB Activity Log Error] {e}")
        
    return log_entry

def get_activity_logs(filter_action=None, filter_complaint=None, filter_admin=None, search=None):
    """
    Retrieves and filters admin activity logs from MongoDB.
    """
    try:
        db = get_db()
        query = {}
        
        if filter_action and filter_action != 'All':
            query["action_type"] = filter_action
            
        if filter_complaint and filter_complaint != 'All':
            query["complaint_id"] = {"$regex": f"^{filter_complaint}$", "$options": "i"}
            
        if filter_admin and filter_admin != 'All':
            query["admin_email"] = {"$regex": filter_admin, "$options": "i"}
            
        if search:
            regex = {"$regex": search, "$options": "i"}
            query["$or"] = [
                {"complaint_id": regex},
                {"description": regex},
                {"admin_email": regex},
                {"action_type": regex}
            ]
            
        cursor = db.activity_logs.find(query).sort("created_at", -1).limit(100)
        logs = []
        for doc in cursor:
            doc["_id"] = str(doc["_id"])
            doc["id"] = doc.get("id", doc["_id"])
            logs.append(doc)
        return logs
    except Exception as e:
        print(f"[MongoDB Activity Log Retrieval Error] {e}")
        return []
