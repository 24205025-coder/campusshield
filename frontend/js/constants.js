/**
 * CampusShield Constants
 */
export const CATEGORY_NAMES = [
  "Ragging / Bullying",
  "Harassment",
  "Classroom / Lab Issues",
  "Hostel Complaints",
  "Canteen / Food Quality",
  "Water & Sanitation",
  "Electricity / Infrastructure",
  "Transport Complaints",
  "Faculty / Academic Issues",
  "Fee / Payment-Related Grievances",
  "Wi-Fi / IT Problems",
  "Other Complaints"
];

export const DEPARTMENT_MAPPING = {
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
};

export const DEFAULT_PRIORITIES = {
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
};

export const DEPARTMENTS = [
  "Anti-Ragging Committee",
  "Student Welfare / Grievance Committee",
  "Academic / Maintenance Department",
  "Hostel Administration",
  "Canteen Administration",
  "Maintenance Department",
  "Transport Department",
  "Academic Administration",
  "Accounts Department",
  "IT Department",
  "General Administration"
];

export const ALL_STATUSES = [
  "Submitted",
  "Under Investigation",
  "Action Taken",
  "Resolved"
];

export const CATEGORY_DESCRIPTIONS = {
  "Ragging / Bullying": "Report any unauthorized physical, verbal, or mental intimidation by senior or peer students.",
  "Harassment": "Strict confidential reporting for any form of harassment, misconduct, or safety violations.",
  "Classroom / Lab Issues": "Report broken projectors, damaged furniture, lab equipment failures, or room allocation problems.",
  "Hostel Complaints": "Issues regarding room allocation, plumbing, hot water, furniture repairs, or hostel warden concerns.",
  "Canteen / Food Quality": "Report unhygienic conditions, poor food quality, pricing discrepancies, or mess service issues.",
  "Water & Sanitation": "Concerns with drinking water purifiers, washroom cleanliness, water supply, or sanitation facilities.",
  "Electricity / Infrastructure": "Report power outages, short circuits, faulty elevators, damaged campus pathways, or AC issues.",
  "Transport Complaints": "Issues with college bus timing, bus condition, driver behavior, or route allocation.",
  "Faculty / Academic Issues": "Feedback or grievances regarding lecture scheduling, grading transparency, or course materials.",
  "Fee / Payment-Related Grievances": "Issues with fee receipt generation, scholarship disbursement, fine waivers, or payment portal errors.",
  "Wi-Fi / IT Problems": "Report campus Wi-Fi outages, network speed drops, portal login bugs, or lab PC glitches.",
  "Other Complaints": "Any general grievance or suggestion not covered by the standard campus categories."
};
