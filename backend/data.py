import os
from datetime import datetime, timedelta
from utils.sla import calculate_sla

# Auto Department Assignment
DEPARTMENT_MAP = {
    "Ragging / Bullying": "Anti-Ragging Committee",
    "Harassment": "Student Welfare / Grievance Committee",
    "Classroom / Lab Issues": "Academic / Maintenance Department",
    "Hostel Complaints": "Hostel Administration",
    "Canteen / Food Quality": "Canteen Administration",
    "Water & Sanitation": "Maintenance Department",
    "Electricity / Infrastructure": "Maintenance Department",
    "Transport Complaints": "Transport Department",
    "Faculty / Academic Issues": "Academic Administration",
    "Fee / Payment-Related Grievances": "Accounts Department",
    "Wi-Fi / IT Problems": "IT Department",
    "Other Complaints": "General Administration"
}

# Auto Priority Assignment
DEFAULT_PRIORITY_MAP = {
    "Ragging / Bullying": "Critical",
    "Harassment": "Critical",
    "Hostel Complaints": "High",
    "Faculty / Academic Issues": "Medium",
    "Electricity / Infrastructure": "Medium",
    "Wi-Fi / IT Problems": "Medium",
    "Classroom / Lab Issues": "Medium",
    "Canteen / Food Quality": "Medium",
    "Water & Sanitation": "Medium",
    "Transport Complaints": "Medium",
    "Fee / Payment-Related Grievances": "Medium",
    "Other Complaints": "Low"
}

CATEGORIES = list(DEPARTMENT_MAP.keys())

counter = 1005

def get_next_id():
    global counter
    counter += 1
    return f"CMP-{counter}"

def init_sample_data():
    now = datetime.now()
    
    cmp1_created = (now - timedelta(days=2, hours=10)).strftime("%Y-%m-%d %H:%M:%S")
    cmp2_created = (now - timedelta(days=3, hours=6)).strftime("%Y-%m-%d %H:%M:%S")
    cmp3_created = (now - timedelta(days=6, hours=2)).strftime("%Y-%m-%d %H:%M:%S")
    cmp4_created = (now - timedelta(days=1, hours=8)).strftime("%Y-%m-%d %H:%M:%S")
    cmp5_created = (now - timedelta(hours=3)).strftime("%Y-%m-%d %H:%M:%S")
    
    samples = [
        {
            "id": "CMP-1001",
            "clerk_user_id": "sample_user_1",
            "student_name": "Rohan Sharma",
            "student_email": "rohan.s@campus.edu",
            "category": "Hostel Complaints",
            "title": "Low water pressure and no hot water in Block C",
            "description": "The 3rd floor bathrooms of Hostel Block C have suffered severe water pressure drops and no hot water for 3 consecutive days. Students are facing major issues in the morning hours.",
            "location": "Hostel Block C, 3rd Floor",
            "priority": "High",
            "anonymous": False,
            "status": "Under Investigation",
            "department": "Hostel Administration",
            "evidence_url": None,
            "evidence": [],
            "created_at": cmp1_created,
            "sla": calculate_sla("High", cmp1_created),
            "timeline": [
                {
                    "status": "Submitted",
                    "date": (now - timedelta(days=2, hours=10)).strftime("%Y-%m-%d"),
                    "time": (now - timedelta(days=2, hours=10)).strftime("%H:%M"),
                    "actor": "Student (Rohan Sharma)",
                    "message": "Complaint submitted and reference CMP-1001 generated.",
                    "is_internal": False
                },
                {
                    "status": "Assigned",
                    "date": (now - timedelta(days=2, hours=8)).strftime("%Y-%m-%d"),
                    "time": (now - timedelta(days=2, hours=8)).strftime("%H:%M"),
                    "actor": "mohamedkaisibrahim2@gmail.com",
                    "message": "Assigned to Hostel Administration.",
                    "is_internal": False
                },
                {
                    "status": "Under Investigation",
                    "date": (now - timedelta(days=1, hours=2)).strftime("%Y-%m-%d"),
                    "time": "10:30",
                    "actor": "mohamedkaisibrahim2@gmail.com",
                    "message": "Plumbing inspection team dispatched to check main supply pumps.",
                    "is_internal": False
                }
            ],
            "updates": [
                {
                    "message": "Complaint submitted successfully and logged into system.",
                    "date": (now - timedelta(days=2, hours=10)).strftime("%Y-%m-%d"),
                    "time": (now - timedelta(days=2, hours=10)).strftime("%H:%M")
                },
                {
                    "message": "Assigned to Hostel Administration.",
                    "date": (now - timedelta(days=2, hours=8)).strftime("%Y-%m-%d"),
                    "time": (now - timedelta(days=2, hours=8)).strftime("%H:%M")
                },
                {
                    "message": "Plumbing inspection team dispatched to check main supply pumps.",
                    "date": (now - timedelta(days=1, hours=2)).strftime("%Y-%m-%d"),
                    "time": "10:30"
                }
            ]
        },
        {
            "id": "CMP-1002",
            "clerk_user_id": "sample_user_2",
            "student_name": "Ananya Patel",
            "student_email": "ananya.p@campus.edu",
            "category": "Wi-Fi / IT Problems",
            "title": "Frequent Wi-Fi disconnections in Main Library",
            "description": "Campus Wi-Fi AP-Lib-03 disconnects every 5 minutes on the 2nd floor reading hall. Signal drops completely during peak study hours.",
            "location": "Central Library, 2nd Floor Reading Room",
            "priority": "Medium",
            "anonymous": False,
            "status": "Action Taken",
            "department": "IT Department",
            "evidence_url": None,
            "evidence": [],
            "created_at": cmp2_created,
            "sla": calculate_sla("Medium", cmp2_created),
            "timeline": [
                {
                    "status": "Submitted",
                    "date": (now - timedelta(days=3, hours=6)).strftime("%Y-%m-%d"),
                    "time": (now - timedelta(days=3, hours=6)).strftime("%H:%M"),
                    "actor": "Student (Ananya Patel)",
                    "message": "Complaint submitted.",
                    "is_internal": False
                },
                {
                    "status": "Assigned",
                    "date": (now - timedelta(days=3, hours=4)).strftime("%Y-%m-%d"),
                    "time": (now - timedelta(days=3, hours=4)).strftime("%H:%M"),
                    "actor": "mohamedkaisibrahim2@gmail.com",
                    "message": "Assigned to IT Department.",
                    "is_internal": False
                },
                {
                    "status": "Action Taken",
                    "date": (now - timedelta(days=1)).strftime("%Y-%m-%d"),
                    "time": "14:15",
                    "actor": "mohamedkaisibrahim2@gmail.com",
                    "message": "Access point firmware updated and secondary router installed.",
                    "is_internal": False
                }
            ],
            "updates": [
                {
                    "message": "Complaint submitted.",
                    "date": (now - timedelta(days=3, hours=6)).strftime("%Y-%m-%d"),
                    "time": (now - timedelta(days=3, hours=6)).strftime("%H:%M")
                },
                {
                    "message": "Assigned to IT Department.",
                    "date": (now - timedelta(days=3, hours=4)).strftime("%Y-%m-%d"),
                    "time": (now - timedelta(days=3, hours=4)).strftime("%H:%M")
                },
                {
                    "message": "Access point firmware updated and secondary router installed.",
                    "date": (now - timedelta(days=1)).strftime("%Y-%m-%d"),
                    "time": "14:15"
                }
            ]
        },
        {
            "id": "CMP-1003",
            "clerk_user_id": "sample_user_3",
            "student_name": "Anonymous Student",
            "student_email": "",
            "category": "Ragging / Bullying",
            "title": "Verbal intimidation by seniors near Block B Courtyard",
            "description": "Unchecked ragging and intimidation incidents near Block B after evening classes.",
            "location": "Hostel Block B Courtyard",
            "priority": "Critical",
            "anonymous": True,
            "status": "Under Investigation",
            "department": "Anti-Ragging Committee",
            "evidence_url": None,
            "evidence": [],
            "created_at": (now - timedelta(hours=30)).strftime("%Y-%m-%d %H:%M:%S"),
            "sla": calculate_sla("Critical", (now - timedelta(hours=30)).strftime("%Y-%m-%d %H:%M:%S")),
            "timeline": [
                {
                    "status": "Submitted",
                    "date": (now - timedelta(hours=30)).strftime("%Y-%m-%d"),
                    "time": (now - timedelta(hours=30)).strftime("%H:%M"),
                    "actor": "Anonymous Student",
                    "message": "Complaint logged anonymously under Anti-Ragging Committee.",
                    "is_internal": False
                },
                {
                    "status": "Under Investigation",
                    "date": (now - timedelta(hours=20)).strftime("%Y-%m-%d"),
                    "time": (now - timedelta(hours=20)).strftime("%H:%M"),
                    "actor": "mohamedkaisibrahim2@gmail.com",
                    "message": "Anti-Ragging Squad assigned to review CCTV footage.",
                    "is_internal": False
                }
            ],
            "updates": [
                {
                    "message": "Complaint logged anonymously under Anti-Ragging Committee.",
                    "date": (now - timedelta(hours=30)).strftime("%Y-%m-%d"),
                    "time": (now - timedelta(hours=30)).strftime("%H:%M")
                },
                {
                    "message": "Anti-Ragging Squad assigned to review CCTV footage.",
                    "date": (now - timedelta(hours=20)).strftime("%Y-%m-%d"),
                    "time": (now - timedelta(hours=20)).strftime("%H:%M")
                }
            ]
        },
        {
            "id": "CMP-1004",
            "clerk_user_id": "sample_user_4",
            "student_name": "Vikram Verma",
            "student_email": "v.verma@campus.edu",
            "category": "Canteen / Food Quality",
            "title": "Unforeseen hygiene issues in South Canteen lunch area",
            "description": "Plates served during lunch hour were not properly washed and food items were kept exposed without mesh covers.",
            "location": "South Campus Food Court",
            "priority": "Medium",
            "anonymous": False,
            "status": "Assigned",
            "department": "Canteen Administration",
            "evidence_url": None,
            "evidence": [],
            "created_at": cmp4_created,
            "sla": calculate_sla("Medium", cmp4_created),
            "timeline": [
                {
                    "status": "Submitted",
                    "date": (now - timedelta(days=1, hours=8)).strftime("%Y-%m-%d"),
                    "time": (now - timedelta(days=1, hours=8)).strftime("%H:%M"),
                    "actor": "Student (Vikram Verma)",
                    "message": "Complaint submitted.",
                    "is_internal": False
                },
                {
                    "status": "Assigned",
                    "date": (now - timedelta(hours=12)).strftime("%Y-%m-%d"),
                    "time": (now - timedelta(hours=12)).strftime("%H:%M"),
                    "actor": "mohamedkaisibrahim2@gmail.com",
                    "message": "Routed to Canteen Food Inspector and Manager for notice.",
                    "is_internal": False
                }
            ],
            "updates": [
                {
                    "message": "Complaint submitted.",
                    "date": (now - timedelta(days=1, hours=8)).strftime("%Y-%m-%d"),
                    "time": (now - timedelta(days=1, hours=8)).strftime("%H:%M")
                },
                {
                    "message": "Routed to Canteen Food Inspector and Manager for notice.",
                    "date": (now - timedelta(hours=12)).strftime("%Y-%m-%d"),
                    "time": (now - timedelta(hours=12)).strftime("%H:%M")
                }
            ]
        },
        {
            "id": "CMP-1005",
            "clerk_user_id": "sample_user_5",
            "student_name": "Kavita Rao",
            "student_email": "kavita.r@campus.edu",
            "category": "Transport Complaints",
            "title": "Bus Route 14 morning schedule delayed regularly",
            "description": "Route 14 bus scheduled for 8:15 AM arrives past 8:45 AM daily causing students to miss 1st period lectures.",
            "location": "North Stop (Bus Route 14)",
            "priority": "Medium",
            "anonymous": False,
            "status": "Submitted",
            "department": "Transport Department",
            "evidence_url": None,
            "evidence": [],
            "created_at": cmp5_created,
            "sla": calculate_sla("Medium", cmp5_created),
            "timeline": [
                {
                    "status": "Submitted",
                    "date": now.strftime("%Y-%m-%d"),
                    "time": now.strftime("%H:%M"),
                    "actor": "Student (Kavita Rao)",
                    "message": "Complaint registered successfully.",
                    "is_internal": False
                }
            ],
            "updates": [
                {
                    "message": "Complaint registered successfully.",
                    "date": now.strftime("%Y-%m-%d"),
                    "time": now.strftime("%H:%M")
                }
            ]
        }
    ]
    return samples

complaints = init_sample_data()
