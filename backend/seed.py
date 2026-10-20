import os
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

from database.mongodb import get_db
from data import init_sample_data

def seed_database():
    print("[Seed] Starting MongoDB database seeding for CampusShield...")
    db = get_db()
    complaints_col = db.complaints
    users_col = db.users
    
    samples = init_sample_data()
    inserted_count = 0
    skipped_count = 0
    
    for s in samples:
        cid = s.get("id") or s.get("complaint_id")
        doc = dict(s)
        doc["complaint_id"] = cid
        
        existing = complaints_col.find_one({"complaint_id": cid})
        if not existing:
            complaints_col.insert_one(doc)
            inserted_count += 1
        else:
            skipped_count += 1
            
    # Seed Admin User if not exists
    admin_user = users_col.find_one({"email": "mohamedkaisibrahim2@gmail.com"})
    if not admin_user:
        users_col.insert_one({
            "clerk_user_id": "admin_clerk_id",
            "name": "Mohamed",
            "email": "mohamedkaisibrahim2@gmail.com",
            "role": "admin",
            "created_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        })
        
    print(f"[Seed Finished] Inserted {inserted_count} new sample complaints, skipped {skipped_count} existing.")

if __name__ == '__main__':
    seed_database()
