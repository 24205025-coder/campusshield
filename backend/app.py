import os
import pymongo
from flask import Flask, request, jsonify, send_from_directory, g
from flask_cors import CORS
from datetime import datetime
from werkzeug.utils import secure_filename
from dotenv import load_dotenv

load_dotenv()

from data import (
    DEPARTMENT_MAP, 
    DEFAULT_PRIORITY_MAP,
    CATEGORIES
)

from utils.auth import require_auth, require_admin, ADMIN_EMAIL
from utils.sla import calculate_sla, get_sla_info
from utils.activity import log_admin_activity, get_activity_logs
from database.mongodb import get_db, check_db_health, get_next_complaint_id


app = Flask(__name__)
CORS(app, supports_credentials=True, resources={r"/api/*": {"origins": "*"}})


@app.route('/api/health', methods=['GET'])
def health_check():
    is_ok, msg = check_db_health()
    if is_ok:
        return jsonify({"status": "ok", "database": "connected"}), 200
    return jsonify({"status": "error", "database": "disconnected", "error": msg}), 500

UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'uploads')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16 MB limit

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'pdf'}
FORBIDDEN_EXTENSIONS = {'exe', 'bat', 'sh', 'js', 'vbs', 'cmd', 'py', 'php', 'msi'}

def allowed_file(filename):
    if '.' not in filename:
        return False
    ext = filename.rsplit('.', 1)[1].lower()
    if ext in FORBIDDEN_EXTENSIONS:
        return False
    return ext in ALLOWED_EXTENSIONS

# Helper to format PyMongo document for JSON response
def clean_doc(doc):
    if not doc:
        return None
    d = dict(doc)
    if '_id' in d:
        d['_id'] = str(d['_id'])
    if 'complaint_id' in d and 'id' not in d:
        d['id'] = d['complaint_id']
    elif 'id' in d and 'complaint_id' not in d:
        d['complaint_id'] = d['id']
    
    # Compute date, day, time if missing
    created_at_val = d.get('created_at', '')
    if created_at_val:
        try:
            dt = datetime.strptime(created_at_val, "%Y-%m-%d %H:%M:%S")
            if 'created_at_date' not in d:
                d['created_at_date'] = dt.strftime("%Y-%m-%d")
            if 'created_at_display_date' not in d:
                d['created_at_display_date'] = dt.strftime("%d %B %Y")
            if 'created_at_day' not in d:
                d['created_at_day'] = dt.strftime("%A")
            if 'created_at_time' not in d:
                d['created_at_time'] = dt.strftime("%H:%M")
        except Exception:
            pass

    # Normalize legacy statuses
    status_val = d.get('status', 'Submitted')
    if status_val in ['PENDING_APPROVAL', 'Pending Approval']:
        d['status'] = 'Submitted'
    elif status_val in ['APPROVED', 'Approved', 'ASSIGNED', 'Assigned']:
        d['status'] = 'Under Investigation'
    elif status_val in ['UNDER_INVESTIGATION']:
        d['status'] = 'Under Investigation'
    elif status_val in ['ACTION_TAKEN']:
        d['status'] = 'Action Taken'
    elif status_val in ['RESOLVED']:
        d['status'] = 'Resolved'

    sla_info = get_sla_info(d)
    d['sla_info'] = sla_info
    return d

# CREATE COMPLAINT
@app.route('/api/complaints', methods=['POST'])
@require_auth
def create_complaint():
    try:
        db = get_db()
        data = request.json or {}
        user_info = g.current_user
        
        # Enforce rule: Admin cannot submit complaints
        admin_email_lower = ADMIN_EMAIL.lower().strip()
        user_email_lower = (user_info.get('email') or '').lower().strip()
        if user_info.get('role') == 'admin' or (user_email_lower and user_email_lower == admin_email_lower):
            return jsonify({"error": "Admin users are not allowed to submit complaints."}), 403

        category = data.get('category', 'Other Complaints')
        title = data.get('title', '').strip()
        description = data.get('description', '').strip()
        
        if not title or not description:
            return jsonify({"error": "Title and description are required"}), 400
            
        anonymous = bool(data.get('anonymous', False))
        
        if anonymous:
            student_name = "Anonymous Student"
            student_email = ""
        else:
            student_name = data.get('student_name', '').strip() or user_info.get('name', 'Student')
            student_email = user_info.get('email', '') or data.get('student_email', '').strip()
        
        location = data.get('location', 'Campus Grounds').strip()
        
        user_priority = data.get('priority')
        if user_priority in ['Low', 'Medium', 'High', 'Critical']:
            priority = user_priority
        else:
            priority = DEFAULT_PRIORITY_MAP.get(category, 'Low')
            
        department = DEPARTMENT_MAP.get(category, 'General Administration')
        
        complaint_id = get_next_complaint_id()
        now = datetime.now()
        created_at_str = now.strftime("%Y-%m-%d %H:%M:%S")
        date_str = now.strftime("%Y-%m-%d")
        display_date = now.strftime("%d %B %Y")
        day_str = now.strftime("%A")
        time_str = now.strftime("%H:%M")
        
        sla_data = calculate_sla(priority, created_at_str)
        
        evidence_list = []
        if data.get('evidence_url'):
            evidence_list.append({
                "filename": os.path.basename(data.get('evidence_url')),
                "url": data.get('evidence_url'),
                "path": f"uploads/{os.path.basename(data.get('evidence_url'))}",
                "uploaded_at": created_at_str
            })
        
        new_complaint = {
            "id": complaint_id,
            "complaint_id": complaint_id,
            "clerk_user_id": user_info['clerk_user_id'],
            "student_name": student_name,
            "student_email": student_email,
            "category": category,
            "title": title,
            "description": description,
            "location": location,
            "priority": priority,
            "anonymous": anonymous,
            "status": "Submitted",
            "department": department,
            "evidence_url": data.get('evidence_url'),
            "evidence": evidence_list,
            "created_at": created_at_str,
            "created_at_date": date_str,
            "created_at_display_date": display_date,
            "created_at_day": day_str,
            "created_at_time": time_str,
            "updated_at": created_at_str,
            "sla": sla_data,
            "timeline": [
                {
                    "status": "Submitted",
                    "date": date_str,
                    "day": day_str,
                    "time": time_str,
                    "actor": student_name,
                    "message": "Complaint submitted successfully.",
                    "is_internal": False
                }
            ],
            "updates": [
                {
                    "message": "Complaint submitted successfully.",
                    "date": date_str,
                    "day": day_str,
                    "time": time_str
                }
            ]
        }
        
        db.complaints.insert_one(new_complaint)

        return jsonify(clean_doc(new_complaint)), 201
    except Exception as e:
        print(f"[MongoDB Create Complaint Error] {e}")
        return jsonify({"error": "Database operation failed during complaint creation"}), 500

# GET ALL COMPLAINTS (Admin only!)
@app.route('/api/complaints', methods=['GET'])
@app.route('/api/admin/complaints', methods=['GET'])
@require_admin
def get_complaints():
    try:
        db = get_db()
        search = request.args.get('search', '').lower().strip()
        category = request.args.get('category', '').strip()
        priority = request.args.get('priority', '').strip()
        status = request.args.get('status', '').strip()
        sort_order = request.args.get('sort', 'desc').strip()
        
        query = {}
        
        if search:
            regex = {"$regex": search, "$options": "i"}
            query["$or"] = [
                {"complaint_id": regex},
                {"id": regex},
                {"title": regex},
                {"description": regex},
                {"location": regex},
                {"student_name": regex}
            ]
            
        if category and category != 'All':
            query["category"] = category
            
        if priority and priority != 'All':
            query["priority"] = priority
            
        if status and status != 'All':
            query["status"] = status
            
        sort_dir = pymongo.DESCENDING if sort_order == 'desc' else pymongo.ASCENDING
        cursor = db.complaints.find(query).sort("created_at", sort_dir)
        
        results = [clean_doc(c) for c in cursor]
        return jsonify(results), 200
    except Exception as e:
        print(f"[MongoDB Get Complaints Error] {e}")
        return jsonify({"error": "Database operation failed"}), 500



# GET OVERDUE COMPLAINTS (Admin only!)
@app.route('/api/admin/overdue', methods=['GET'])
@require_admin
def get_overdue_complaints():
    try:
        db = get_db()
        query = {"status": {"$nin": ["Resolved", "Rejected"]}}
        cursor = db.complaints.find(query)
        
        overdue_items = []
        for c in cursor:
            cleaned = clean_doc(c)
            if cleaned['sla_info']['is_overdue']:
                overdue_items.append(cleaned)
                
        def overdue_sort_key(item):
            is_crit = 1 if (item.get('priority') == 'Critical' or item.get('category') in ['Ragging / Bullying', 'Harassment']) else 0
            return (is_crit, item['sla_info'].get('overdue_seconds', 0))
            
        overdue_items.sort(key=overdue_sort_key, reverse=True)
        return jsonify(overdue_items), 200
    except Exception as e:
        print(f"[MongoDB Overdue Error] {e}")
        return jsonify({"error": "Database operation failed"}), 500

# GET ADMIN ANALYTICS (Admin only!)
@app.route('/api/admin/analytics', methods=['GET'])
@require_admin
def get_admin_analytics():
    try:
        db = get_db()
        all_complaints = [clean_doc(c) for c in db.complaints.find()]
        total = len(all_complaints)
        
        cat_counts = {cat: 0 for cat in CATEGORIES}
        for c in all_complaints:
            cat = c.get('category', 'Other Complaints')
            cat_counts[cat] = cat_counts.get(cat, 0) + 1
        category_chart = [{"category": k, "count": v} for k, v in cat_counts.items()]
        
        status_counts = {st: 0 for st in ['Submitted', 'Assigned', 'Under Investigation', 'Action Taken', 'Resolved', 'Rejected']}
        for c in all_complaints:
            st = c.get('status', 'Submitted')
            status_counts[st] = status_counts.get(st, 0) + 1
        status_chart = [{"status": k, "count": v} for k, v in status_counts.items()]
        
        priority_counts = {"Low": 0, "Medium": 0, "High": 0, "Critical": 0}
        for c in all_complaints:
            p = c.get('priority', 'Low')
            priority_counts[p] = priority_counts.get(p, 0) + 1
        priority_chart = [{"priority": k, "count": v} for k, v in priority_counts.items()]
        
        resolved_within_sla = 0
        resolved_after_sla = 0
        currently_overdue = 0
        currently_on_track = 0
        
        for c in all_complaints:
            info = c['sla_info']
            st = c.get('status')
            if st in ['Resolved', 'Rejected']:
                resolved_within_sla += 1
            else:
                if info['is_overdue']:
                    currently_overdue += 1
                else:
                    currently_on_track += 1
                    
        sla_performance = [
            {"name": "Resolved Within SLA", "count": resolved_within_sla},
            {"name": "Resolved After SLA", "count": resolved_after_sla},
            {"name": "Currently On Track", "count": currently_on_track},
            {"name": "Currently Overdue", "count": currently_overdue}
        ]
        
        monthly_trend = [
            {"month": "Jun", "complaints": 12, "resolved": 10},
            {"month": "Jul", "complaints": 18, "resolved": 15},
            {"month": "Aug", "complaints": 25, "resolved": 22},
            {"month": "Sep", "complaints": 31, "resolved": 28},
            {"month": "Oct", "complaints": total, "resolved": status_counts['Resolved']}
        ]
        
        dept_stats = {}
        for c in all_complaints:
            dept = c.get('department', 'General Administration')
            if dept not in dept_stats:
                dept_stats[dept] = {"department": dept, "total": 0, "resolved": 0, "pending": 0, "overdue": 0}
                
            dept_stats[dept]["total"] += 1
            st = c.get('status')
            if st == 'Resolved':
                dept_stats[dept]["resolved"] += 1
            elif st != 'Rejected':
                dept_stats[dept]["pending"] += 1
                
            if c['sla_info']['is_overdue']:
                dept_stats[dept]["overdue"] += 1
                
        department_performance = list(dept_stats.values())
        
        return jsonify({
            "total": total,
            "category_chart": category_chart,
            "status_chart": status_chart,
            "priority_chart": priority_chart,
            "sla_performance": sla_performance,
            "monthly_trend": monthly_trend,
            "department_performance": department_performance
        }), 200
    except Exception as e:
        print(f"[MongoDB Analytics Error] {e}")
        return jsonify({"error": "Database operation failed"}), 500



# GET MY COMPLAINTS (Authenticated User dashboard)
@app.route('/api/my-complaints', methods=['GET'])
@require_auth
def get_my_complaints():
    try:
        db = get_db()
        user_info = g.current_user
        user_id = user_info['clerk_user_id']
        user_email = user_info.get('email', '').strip()
        
        # Admin gets all complaints when checking dashboard
        if user_info.get('is_admin'):
            cursor = db.complaints.find().sort("created_at", pymongo.DESCENDING)
        else:
            query = {
                "$or": [
                    {"clerk_user_id": user_id}
                ]
            }
            if user_email:
                query["$or"].append({"student_email": {"$regex": f"^{user_email}$", "$options": "i"}})
            cursor = db.complaints.find(query).sort("created_at", pymongo.DESCENDING)
        
        user_complaints = [clean_doc(c) for c in cursor]
        
        total = len(user_complaints)
        submitted = sum(1 for c in user_complaints if c.get('status') == 'Submitted')
        assigned = sum(1 for c in user_complaints if c.get('status') == 'Assigned')
        pending = submitted + assigned
        under_investigation = sum(1 for c in user_complaints if c.get('status') == 'Under Investigation')
        resolved = sum(1 for c in user_complaints if c.get('status') == 'Resolved')
        
        return jsonify({
            "stats": {
                "total": total,
                "pending": pending,
                "under_investigation": under_investigation,
                "resolved": resolved
            },
            "complaints": user_complaints
        }), 200
    except Exception as e:
        print(f"[MongoDB My Complaints Error] {e}")
        return jsonify({"error": "Database operation failed"}), 500

# GET COMPLAINT BY ID
@app.route('/api/complaints/<complaint_id>', methods=['GET'])
@require_auth
def get_complaint_by_id(complaint_id):
    try:
        db = get_db()
        complaint_id_upper = complaint_id.upper().strip()
        user_info = g.current_user
        
        target = db.complaints.find_one({
            "$or": [
                {"complaint_id": {"$regex": f"^{complaint_id_upper}$", "$options": "i"}},
                {"id": {"$regex": f"^{complaint_id_upper}$", "$options": "i"}}
            ]
        })
        
        if not target:
            return jsonify({"error": f"Complaint {complaint_id} not found"}), 404
            
        if not user_info.get('is_admin'):
            owner_id = target.get('clerk_user_id', '')
            owner_email = target.get('student_email', '').lower().strip()
            curr_email = user_info.get('email', '').lower().strip()
            is_sample = owner_id.startswith('sample_user_')
            
            # Allow access if sample demo complaint or if clerk_user_id / email matches
            if owner_id and not is_sample:
                if owner_id != user_info['clerk_user_id'] and (not owner_email or owner_email != curr_email):
                    return jsonify({"error": "Access denied. You can only access your own complaints."}), 403
                
        return jsonify(clean_doc(target)), 200
    except Exception as e:
        print(f"[MongoDB Get Complaint By ID Error] {e}")
        return jsonify({"error": "Database operation failed"}), 500

@app.route('/api/complaints/search/<complaint_id>', methods=['GET'])
@require_auth
def search_complaint(complaint_id):
    return get_complaint_by_id(complaint_id)

# GET COMPLAINT TIMELINE
@app.route('/api/complaints/<complaint_id>/timeline', methods=['GET'])
@require_auth
def get_complaint_timeline(complaint_id):
    try:
        db = get_db()
        complaint_id_upper = complaint_id.upper().strip()
        user_info = g.current_user
        
        target = db.complaints.find_one({
            "$or": [
                {"complaint_id": {"$regex": f"^{complaint_id_upper}$", "$options": "i"}},
                {"id": {"$regex": f"^{complaint_id_upper}$", "$options": "i"}}
            ]
        })
        
        if not target:
            return jsonify({"error": f"Complaint {complaint_id} not found"}), 404
            
        timeline_events = target.get('timeline', [])
        
        if not user_info.get('is_admin'):
            timeline_events = [t for t in timeline_events if not t.get('is_internal')]
            
        return jsonify(timeline_events), 200
    except Exception as e:
        print(f"[MongoDB Timeline Error] {e}")
        return jsonify({"error": "Database operation failed"}), 500

# UPDATE COMPLAINT (Admin only!)
@app.route('/api/complaints/<complaint_id>', methods=['PUT'])
@require_admin
def update_complaint(complaint_id):
    try:
        db = get_db()
        complaint_id_upper = complaint_id.upper().strip()
        data = request.json or {}
        admin_email = g.current_user.get('email') or ADMIN_EMAIL
        admin_clerk_id = g.current_user.get('clerk_user_id')
        
        target = db.complaints.find_one({
            "$or": [
                {"complaint_id": {"$regex": f"^{complaint_id_upper}$", "$options": "i"}},
                {"id": {"$regex": f"^{complaint_id_upper}$", "$options": "i"}}
            ]
        })
        
        if not target:
            return jsonify({"error": f"Complaint {complaint_id} not found"}), 404
            
        now = datetime.now()
        date_str = now.strftime("%Y-%m-%d")
        time_str = now.strftime("%H:%M")
        now_str = now.strftime("%Y-%m-%d %H:%M:%S")
        
        updates_to_set = {"updated_at": now_str}
        timeline_pushes = []
        update_pushes = []
        
        old_status = target.get('status', 'Submitted')
        new_status = data.get('status')
        resolution_summary = data.get('resolution_summary', '').strip()
        
        old_dept = target.get('department', 'General Administration')
        new_dept = data.get('department')
        
        # Auto-promote Submitted -> Assigned if department is changed without explicit status
        if new_dept and new_dept != old_dept and not new_status and old_status == 'Submitted':
            new_status = 'Assigned'
            
        if resolution_summary and new_status == 'Resolved':
            updates_to_set['resolution_summary'] = resolution_summary
            updates_to_set['resolved_at'] = now_str
            updates_to_set['resolved_by'] = admin_email
            
        if new_status and new_status != old_status:
            updates_to_set['status'] = new_status
            if new_status == 'Resolved' and not updates_to_set.get('resolved_at'):
                updates_to_set['resolved_at'] = now_str
                updates_to_set['resolved_by'] = admin_email
                if resolution_summary:
                    updates_to_set['resolution_summary'] = resolution_summary
                    
            status_msg = f"Status updated from '{old_status}' to '{new_status}'."
            if new_status == 'Resolved' and resolution_summary:
                status_msg = f"Complaint Resolved: {resolution_summary}"
                
            event = {
                "status": new_status,
                "date": date_str,
                "time": time_str,
                "actor": admin_email,
                "message": status_msg,
                "is_internal": False
            }
            timeline_pushes.append(event)
            update_pushes.append({
                "message": status_msg,
                "date": date_str,
                "time": time_str
            })
            log_admin_activity(
                admin_email, 
                "STATUS_CHANGED", 
                target['complaint_id'], 
                f"Changed status from '{old_status}' to '{new_status}'.",
                admin_clerk_user_id=admin_clerk_id
            )
            
        if new_dept and new_dept != old_dept:
            updates_to_set['department'] = new_dept
            dept_msg = f"Reassigned complaint to '{new_dept}' department."
            timeline_pushes.append({
                "status": updates_to_set.get('status', target['status']),
                "date": date_str,
                "time": time_str,
                "actor": admin_email,
                "message": dept_msg,
                "is_internal": False
            })
            update_pushes.append({
                "message": dept_msg,
                "date": date_str,
                "time": time_str
            })
            log_admin_activity(
                admin_email, 
                "DEPARTMENT_CHANGED", 
                target['complaint_id'], 
                f"Reassigned department from '{old_dept}' to '{new_dept}'.",
                admin_clerk_user_id=admin_clerk_id
            )
            
        old_priority = target.get('priority', 'Low')
        new_priority = data.get('priority')
        if new_priority and new_priority != old_priority:
            updates_to_set['priority'] = new_priority
            updates_to_set['sla'] = calculate_sla(new_priority, target['created_at'])
            log_admin_activity(
                admin_email, 
                "PRIORITY_CHANGED", 
                target['complaint_id'], 
                f"Changed priority from {old_priority} to {new_priority}.",
                admin_clerk_user_id=admin_clerk_id
            )
            
        update_op = {"$set": updates_to_set}
        if timeline_pushes or update_pushes:
            update_op["$push"] = {}
            if timeline_pushes:
                update_op["$push"]["timeline"] = {"$each": timeline_pushes}
            if update_pushes:
                update_op["$push"]["updates"] = {"$each": update_pushes}
                
        db.complaints.update_one({"_id": target["_id"]}, update_op)
        updated_doc = db.complaints.find_one({"_id": target["_id"]})

        return jsonify(clean_doc(updated_doc)), 200
    except Exception as e:
        print(f"[MongoDB Update Error] {e}")
        return jsonify({"error": "Database operation failed"}), 500

# EXPLICIT ADMIN ACTION ENDPOINTS
@app.route('/api/admin/complaints/<complaint_id>', methods=['GET', 'PUT'])
@require_admin
def admin_complaint_by_id(complaint_id):
    if request.method == 'GET':
        return get_complaint_by_id(complaint_id)
    return update_complaint(complaint_id)

@app.route('/api/admin/complaints/<complaint_id>/approve', methods=['PUT'])
@require_admin
def admin_approve_complaint(complaint_id):
    try:
        db = get_db()
        complaint_id_upper = complaint_id.upper().strip()
        data = request.json or {}
        admin_email = g.current_user.get('email') or ADMIN_EMAIL
        admin_clerk_id = g.current_user.get('clerk_user_id')
        
        target = db.complaints.find_one({
            "$or": [
                {"complaint_id": {"$regex": f"^{complaint_id_upper}$", "$options": "i"}},
                {"id": {"$regex": f"^{complaint_id_upper}$", "$options": "i"}}
            ]
        })
        if not target:
            return jsonify({"error": f"Complaint {complaint_id} not found"}), 404
            
        now = datetime.now()
        now_str = now.strftime("%Y-%m-%d %H:%M:%S")
        date_str = now.strftime("%Y-%m-%d")
        time_str = now.strftime("%H:%M")
        
        dept = data.get('department') or target.get('department')
        updates_to_set = {
            "status": "APPROVED",
            "approved_by": admin_email,
            "approved_at": now_str,
            "updated_at": now_str
        }
        if dept:
            updates_to_set["department"] = dept
            
        event = {
            "status": "APPROVED",
            "date": date_str,
            "time": time_str,
            "actor": admin_email,
            "message": "Complaint approved by admin.",
            "is_internal": False
        }
        
        db.complaints.update_one(
            {"_id": target["_id"]},
            {
                "$set": updates_to_set,
                "$push": {
                    "timeline": event,
                    "updates": {"message": "Your complaint has been approved by admin.", "date": date_str, "time": time_str}
                }
            }
        )
        log_admin_activity(admin_email, "COMPLAINT_APPROVED", target['complaint_id'], "Approved complaint.", admin_clerk_user_id=admin_clerk_id)
        updated_doc = db.complaints.find_one({"_id": target["_id"]})
        return jsonify(clean_doc(updated_doc)), 200
    except Exception as e:
        return jsonify({"error": f"Approve failed: {str(e)}"}), 500

@app.route('/api/admin/complaints/<complaint_id>/reject', methods=['PUT'])
@require_admin
def admin_reject_complaint(complaint_id):
    try:
        db = get_db()
        complaint_id_upper = complaint_id.upper().strip()
        data = request.json or {}
        reason = data.get('rejection_reason') or data.get('reason', '').strip()
        if not reason:
            return jsonify({"error": "Rejection reason is required"}), 400
            
        admin_email = g.current_user.get('email') or ADMIN_EMAIL
        admin_clerk_id = g.current_user.get('clerk_user_id')
        
        target = db.complaints.find_one({
            "$or": [
                {"complaint_id": {"$regex": f"^{complaint_id_upper}$", "$options": "i"}},
                {"id": {"$regex": f"^{complaint_id_upper}$", "$options": "i"}}
            ]
        })
        if not target:
            return jsonify({"error": f"Complaint {complaint_id} not found"}), 404
            
        now = datetime.now()
        now_str = now.strftime("%Y-%m-%d %H:%M:%S")
        date_str = now.strftime("%Y-%m-%d")
        time_str = now.strftime("%H:%M")
        
        updates_to_set = {
            "status": "REJECTED",
            "rejection_reason": reason,
            "rejected_by": admin_email,
            "rejected_at": now_str,
            "updated_at": now_str
        }
        
        msg = f"Complaint rejected: {reason}"
        event = {
            "status": "REJECTED",
            "date": date_str,
            "time": time_str,
            "actor": admin_email,
            "message": msg,
            "is_internal": False
        }
        
        db.complaints.update_one(
            {"_id": target["_id"]},
            {
                "$set": updates_to_set,
                "$push": {
                    "timeline": event,
                    "updates": {"message": msg, "date": date_str, "time": time_str}
                }
            }
        )
        log_admin_activity(admin_email, "COMPLAINT_REJECTED", target['complaint_id'], f"Rejected complaint: {reason}", admin_clerk_user_id=admin_clerk_id)
        updated_doc = db.complaints.find_one({"_id": target["_id"]})
        return jsonify(clean_doc(updated_doc)), 200
    except Exception as e:
        return jsonify({"error": f"Reject failed: {str(e)}"}), 500

@app.route('/api/admin/complaints/<complaint_id>/assign', methods=['PUT'])
@require_admin
def admin_assign_complaint(complaint_id):
    data = request.json or {}
    if 'department' not in data and 'assigned_department' in data:
        data['department'] = data['assigned_department']
    data['status'] = 'ASSIGNED'
    request.json = data
    return update_complaint(complaint_id)

@app.route('/api/admin/complaints/<complaint_id>/status', methods=['PUT'])
@require_admin
def admin_status_complaint(complaint_id):
    return update_complaint(complaint_id)

@app.route('/api/admin/complaints/<complaint_id>/resolve', methods=['PUT'])
@require_admin
def admin_resolve_complaint(complaint_id):
    data = request.json or {}
    data['status'] = 'Resolved'
    request.json = data
    return update_complaint(complaint_id)

# ADD TIMELINE UPDATE (Admin only!)
@app.route('/api/complaints/<complaint_id>/updates', methods=['POST'])
@app.route('/api/admin/complaints/<complaint_id>/updates', methods=['POST'])
@require_admin
def add_complaint_update(complaint_id):
    try:
        db = get_db()
        complaint_id_upper = complaint_id.upper().strip()
        data = request.json or {}
        message = data.get('message', '').strip()
        admin_email = g.current_user['email'] or ADMIN_EMAIL
        admin_clerk_id = g.current_user['clerk_user_id']
        
        if not message:
            return jsonify({"error": "Update message is required"}), 400
            
        target = db.complaints.find_one({
            "$or": [
                {"complaint_id": {"$regex": f"^{complaint_id_upper}$", "$options": "i"}},
                {"id": {"$regex": f"^{complaint_id_upper}$", "$options": "i"}}
            ]
        })
        
        if not target:
            return jsonify({"error": f"Complaint {complaint_id} not found"}), 404
            
        now = datetime.now()
        date_str = now.strftime("%Y-%m-%d")
        time_str = now.strftime("%H:%M")
        now_str = now.strftime("%Y-%m-%d %H:%M:%S")
        
        update_entry = {
            "message": message,
            "date": date_str,
            "time": time_str
        }
        
        timeline_event = {
            "status": target['status'],
            "date": date_str,
            "time": time_str,
            "actor": admin_email,
            "message": message,
            "is_internal": bool(data.get('is_internal', False))
        }
        
        updates_to_set = {"updated_at": now_str}
        
        if 'status' in data and data['status'] in ['Submitted', 'Assigned', 'Under Investigation', 'Action Taken', 'Resolved', 'Rejected']:
            old_st = target['status']
            new_st = data['status']
            if old_st != new_st:
                updates_to_set['status'] = new_st
                timeline_event['status'] = new_st
                log_admin_activity(
                    admin_email,
                    "STATUS_CHANGED",
                    target['complaint_id'],
                    f"Changed status from {old_st} to {new_st}.",
                    admin_clerk_user_id=admin_clerk_id
                )
                
        log_admin_activity(
            admin_email,
            "ADMIN_UPDATE_ADDED",
            target['complaint_id'],
            f"Added admin update: \"{message}\"",
            admin_clerk_user_id=admin_clerk_id
        )
        
        db.complaints.update_one(
            {"_id": target["_id"]},
            {
                "$set": updates_to_set,
                "$push": {
                    "updates": update_entry,
                    "timeline": timeline_event
                }
            }
        )
        
        updated_doc = db.complaints.find_one({"_id": target["_id"]})
        return jsonify(clean_doc(updated_doc)), 200
    except Exception as e:
        print(f"[MongoDB Add Update Error] {e}")
        return jsonify({"error": "Database operation failed"}), 500

# DASHBOARD STATS (Admin only!)
@app.route('/api/dashboard/stats', methods=['GET'])
@require_admin
def get_dashboard_stats():
    try:
        db = get_db()
        all_complaints = [clean_doc(c) for c in db.complaints.find()]
        total = len(all_complaints)
        
        submitted = sum(1 for c in all_complaints if c.get('status') == 'Submitted')
        under_investigation = sum(1 for c in all_complaints if c.get('status') in ['Under Investigation', 'UNDER_INVESTIGATION'])
        action_taken = sum(1 for c in all_complaints if c.get('status') in ['Action Taken', 'ACTION_TAKEN'])
        resolved = sum(1 for c in all_complaints if c.get('status') in ['Resolved', 'RESOLVED'])
        
        critical = sum(1 for c in all_complaints if c.get('priority') == 'Critical' or c.get('category') in ['Ragging / Bullying', 'Harassment'])
        overdue = sum(1 for c in all_complaints if c.get('sla_info', {}).get('is_overdue', False))
        
        cat_counts = {cat: 0 for cat in CATEGORIES}
        for c in all_complaints:
            cat = c.get('category', 'Other Complaints')
            cat_counts[cat] = cat_counts.get(cat, 0) + 1
        category_chart = [{"category": k, "count": v} for k, v in cat_counts.items()]
        
        priority_counts = {"Low": 0, "Medium": 0, "High": 0, "Critical": 0}
        for c in all_complaints:
            p = c.get('priority', 'Low')
            priority_counts[p] = priority_counts.get(p, 0) + 1
        priority_chart = [{"priority": k, "count": v} for k, v in priority_counts.items()]
        
        status_chart = [
            {"status": "Submitted", "count": submitted},
            {"status": "Under Investigation", "count": under_investigation},
            {"status": "Action Taken", "count": action_taken},
            {"status": "Resolved", "count": resolved}
        ]
        
        monthly_trend = [
            {"month": "Jun", "complaints": 12, "resolved": 10},
            {"month": "Jul", "complaints": 18, "resolved": 15},
            {"month": "Aug", "complaints": 25, "resolved": 22},
            {"month": "Sep", "complaints": 31, "resolved": 28},
            {"month": "Oct", "complaints": total, "resolved": resolved}
        ]
        
        return jsonify({
            "total": total,
            "submitted": submitted,
            "pending": submitted,
            "under_investigation": under_investigation,
            "action_taken": action_taken,
            "resolved": resolved,
            "critical": critical,
            "overdue": overdue,
            "category_chart": category_chart,
            "priority_chart": priority_chart,
            "status_chart": status_chart,
            "monthly_trend": monthly_trend
        }), 200
    except Exception as e:
        print(f"[MongoDB Stats Error] {e}")
        return jsonify({"error": "Database operation failed"}), 500

# PUBLIC HOME STATS SUMMARY
@app.route('/api/public/stats', methods=['GET'])
def get_public_stats():
    try:
        db = get_db()
        total = db.complaints.count_documents({})
        submitted = db.complaints.count_documents({"status": "Submitted"})
        assigned = db.complaints.count_documents({"status": "Assigned"})
        pending = submitted + assigned
        under_investigation = db.complaints.count_documents({"status": "Under Investigation"})
        resolved = db.complaints.count_documents({"status": "Resolved"})
        
        return jsonify({
            "total": total,
            "pending": pending,
            "under_investigation": under_investigation,
            "resolved": resolved
        }), 200
    except Exception as e:
        print(f"[MongoDB Public Stats Error] {e}")
        return jsonify({"error": "Database operation failed"}), 500

# FILE UPLOAD (Auth required)
@app.route('/api/upload', methods=['POST'])
@require_auth
def upload_file():
    if 'file' not in request.files:
        return jsonify({"error": "No file part in request"}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No file selected"}), 400
        
    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        saved_filename = f"{timestamp}_{filename}"
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], saved_filename)
        file.save(file_path)
        file_url = f"/uploads/{saved_filename}"
        return jsonify({
            "file_url": file_url, 
            "filename": saved_filename,
            "original_name": filename
        }), 201
    return jsonify({"error": "File type not allowed or executable security violation"}), 400

@app.route('/uploads/<filename>')
def serve_upload(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

FRONTEND_FOLDER = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'frontend')

@app.route('/')
def serve_index():
    return send_from_directory(FRONTEND_FOLDER, 'index.html')

@app.route('/<path:path>')
def serve_frontend_static(path):
    if path.startswith('api/'):
        return jsonify({"error": "Not Found"}), 404
    file_path = os.path.join(FRONTEND_FOLDER, path)
    if os.path.exists(file_path) and os.path.isfile(file_path):
        return send_from_directory(FRONTEND_FOLDER, path)
    if os.path.exists(os.path.join(FRONTEND_FOLDER, f"{path}.html")):
        return send_from_directory(FRONTEND_FOLDER, f"{path}.html")
    return send_from_directory(FRONTEND_FOLDER, 'index.html')

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)

