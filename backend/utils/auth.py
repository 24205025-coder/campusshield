import os
import jwt
import requests
from datetime import datetime
from functools import wraps
from flask import request, jsonify, g
from dotenv import load_dotenv

from database.mongodb import get_db

load_dotenv()

CLERK_SECRET_KEY = os.getenv('CLERK_SECRET_KEY', '')
ADMIN_EMAIL = "mohamedkaisibrahim2@gmail.com"

def sync_user_to_db(clerk_user_id, email, name, is_admin):
    """
    Synchronizes Clerk user metadata to MongoDB users collection.
    """
    try:
        db = get_db()
        users_col = db.users
        role = "admin" if is_admin else "user"
        now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        
        user_doc = users_col.find_one({"clerk_user_id": clerk_user_id})
        if not user_doc:
            users_col.insert_one({
                "clerk_user_id": clerk_user_id,
                "name": name or "Student",
                "email": email or "",
                "role": role,
                "created_at": now_str,
                "updated_at": now_str
            })
        else:
            update_fields = {
                "role": role,
                "updated_at": now_str
            }
            if email:
                update_fields["email"] = email
            if name and name != "User":
                update_fields["name"] = name
            users_col.update_one(
                {"clerk_user_id": clerk_user_id},
                {"$set": update_fields}
            )
    except Exception as e:
        print(f"[Auth User Sync Warning] Could not sync user to MongoDB: {e}")

def verify_clerk_token(token):
    if not token:
        return None, "Authorization token is missing"
        
    user_id = None
    user_email = request.headers.get('X-User-Email', '').strip()
    user_name = request.headers.get('X-User-Name', '').strip() or "User"

    try:
        if token.count('.') == 2:
            try:
                decoded = jwt.decode(token, options={"verify_signature": False})
                user_id = decoded.get("sub")
                if "email" in decoded:
                    user_email = decoded["email"]
                elif "primary_email_address" in decoded:
                    user_email = decoded["primary_email_address"]
            except Exception:
                pass
                
        if not user_id:
            user_id = token if (token.startswith('usr_') or token.startswith('user_')) else f"usr_{token}"

        db = get_db()
        db_user = db.users.find_one({"clerk_user_id": user_id})
        if db_user:
            if not user_email and db_user.get("email"):
                user_email = db_user.get("email")
            if user_name == "User" and db_user.get("name"):
                user_name = db_user.get("name")
            
        if CLERK_SECRET_KEY and CLERK_SECRET_KEY != 'sk_test_YOUR_CLERK_SECRET_KEY' and user_id.startswith('user_'):
            try:
                headers = {"Authorization": f"Bearer {CLERK_SECRET_KEY}"}
                clerk_res = requests.get(f"https://api.clerk.com/v1/users/{user_id}", headers=headers, timeout=5)
                if clerk_res.status_code == 200:
                    data = clerk_res.json()
                    user_name = f"{data.get('first_name', '')} {data.get('last_name', '')}".strip() or user_name
                    emails = data.get('email_addresses', [])
                    primary_email_id = data.get('primary_email_address_id')
                    for em in emails:
                        if em.get('id') == primary_email_id or not user_email:
                            user_email = em.get('email_address', '')
                            break
            except Exception as e:
                print(f"[Auth Warning] Clerk API lookup error: {e}")

        is_admin = (user_email.lower().strip() == ADMIN_EMAIL.lower().strip())
        if db_user and db_user.get('role') == 'admin':
            is_admin = True
        
        user_info = {
            "clerk_user_id": user_id,
            "email": user_email,
            "name": user_name,
            "is_admin": is_admin
        }
        
        # Sync user to MongoDB
        sync_user_to_db(user_id, user_email, user_name, is_admin)
        
        return user_info, None

    except Exception as e:
        return None, f"Token verification error: {str(e)}"

def require_auth(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get('Authorization', '')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({"error": "Authentication required. Please sign in."}), 401
            
        token = auth_header.split(' ')[1]
        user_info, error = verify_clerk_token(token)
        
        if error or not user_info:
            return jsonify({"error": error or "Unauthorized session"}), 401
            
        g.current_user = user_info
        return f(*args, **kwargs)
    return decorated

def require_admin(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get('Authorization', '')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({"error": "Authentication required. Please sign in."}), 401
            
        token = auth_header.split(' ')[1]
        user_info, error = verify_clerk_token(token)
        
        if error or not user_info:
            return jsonify({"error": error or "Unauthorized session"}), 401
            
        if not user_info.get("is_admin"):
            return jsonify({"error": "Access denied. Administrator privileges required."}), 403
            
        g.current_user = user_info
        return f(*args, **kwargs)
    return decorated
