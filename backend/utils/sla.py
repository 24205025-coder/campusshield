from datetime import datetime, timedelta

SLA_HOURS = {
    "Critical": 24,
    "High": 48,
    "Medium": 72,
    "Low": 168
}

def calculate_sla(priority, created_at_str):
    """
    Calculates initial SLA dictionary given priority and creation datetime string.
    """
    hours = SLA_HOURS.get(priority, 72)
    try:
        created_dt = datetime.strptime(created_at_str, "%Y-%m-%d %H:%M:%S")
    except ValueError:
        created_dt = datetime.now()
        
    deadline_dt = created_dt + timedelta(hours=hours)
    
    return {
        "duration_hours": hours,
        "deadline": deadline_dt.strftime("%Y-%m-%d %H:%M:%S"),
        "status": "ON_TRACK"
    }

def get_sla_info(complaint):
    """
    Computes current real-time SLA status and time metrics for a complaint.
    """
    status = complaint.get('status', 'Submitted')
    if status in ['Resolved', 'Rejected']:
        return {
            "status": "RESOLVED",
            "deadline": complaint.get('sla', {}).get('deadline', ''),
            "is_overdue": False,
            "display_text": "Resolved"
        }
        
    sla_data = complaint.get('sla', {})
    deadline_str = sla_data.get('deadline')
    
    if not deadline_str:
        priority = complaint.get('priority', 'Medium')
        created_at = complaint.get('created_at', datetime.now().strftime("%Y-%m-%d %H:%M:%S"))
        sla_data = calculate_sla(priority, created_at)
        complaint['sla'] = sla_data
        deadline_str = sla_data['deadline']
        
    now = datetime.now()
    try:
        deadline_dt = datetime.strptime(deadline_str, "%Y-%m-%d %H:%M:%S")
    except Exception:
        deadline_dt = now + timedelta(hours=24)
        
    diff = deadline_dt - now
    total_seconds = diff.total_seconds()
    
    if total_seconds < 0:
        overdue_seconds = abs(total_seconds)
        hours = int(overdue_seconds // 3600)
        minutes = int((overdue_seconds % 3600) // 60)
        if hours > 24:
            days = hours // 24
            display_text = f"OVERDUE BY {days}d {hours % 24}h"
        elif hours > 0:
            display_text = f"OVERDUE BY {hours}h {minutes}m"
        else:
            display_text = f"OVERDUE BY {minutes}m"
            
        return {
            "status": "OVERDUE",
            "deadline": deadline_str,
            "is_overdue": True,
            "overdue_seconds": overdue_seconds,
            "display_text": display_text
        }
    else:
        hours = int(total_seconds // 3600)
        minutes = int((total_seconds % 3600) // 60)
        
        if hours <= 6:
            sla_state = "DUE_SOON"
        else:
            sla_state = "ON_TRACK"
            
        if hours > 24:
            days = hours // 24
            display_text = f"Due in {days}d {hours % 24}h"
        else:
            display_text = f"Due in {hours}h {minutes}m"
            
        return {
            "status": sla_state,
            "deadline": deadline_str,
            "is_overdue": False,
            "remaining_seconds": total_seconds,
            "display_text": display_text
        }
