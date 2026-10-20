# CampusShield – Smart Campus Complaint & Grievance Portal 🛡️

CampusShield is a presentation-ready college grievance platform built with a React + Vite frontend, Python Flask REST API backend, and **Clerk Authentication**.

## 🎨 Palette & Visual Identity (Muted Blue-Gray Slate Theme)
The entire UI is built on a harmonious muted blue-gray color palette:
- **Primary Dark**: `#2C3A47` (Navbar, Sidebar, Main Headings, Primary Buttons)
- **Muted Slate**: `#5C6F84` (Cards, Borders, Icons, Secondary Buttons)
- **Blue-Gray Accent**: `#A4B4C0` (Badges, Highlight Text, Accent Details)
- **Light Slate Tint**: `#DCE4EC` & `#F4F7F9` (Page Backgrounds, Card Contours, Soft Badges)
- **Dark Text**: `#1C252E`

---

## ⚡ 6 Advanced Admin Portal Features

1. **Critical Complaint Handling (`/admin/critical`)**:
   - Dedicated portal highlighting all Critical priority complaints and sensitive categories (*Ragging / Bullying*, *Harassment*).
   - Real-time SLA Countdown, time remaining, and overdue escalation badges.

2. **Complaint Status Timeline**:
   - Automatic step-by-step history tracking every status change (`Submitted` → `Assigned` → `Under Investigation` → `Action Taken` → `Resolved` / `Rejected`).
   - Stores actor, timestamp, and student-visible vs. internal admin notes.

3. **SLA & Overdue Escalation (`/admin/overdue`)**:
   - Server-calculated SLA deadlines based on priority:
     - **Critical**: 24 Hours
     - **High**: 48 Hours
     - **Medium**: 72 Hours
     - **Low**: 168 Hours (7 Days)
   - Real-time escalation statuses (`ON_TRACK`, `DUE_SOON`, `OVERDUE`).
   - Overdue portal list sorted with critical overdue complaints first.

4. **Analytics Dashboard (`/admin/analytics`)**:
   - Real-time Chart.js / Recharts visualization powered strictly by Flask data:
     - A. Complaints by Category
     - B. Complaints by Status
     - C. Complaints by Priority
     - D. SLA Resolution Efficiency
     - E. Monthly Complaint Trend
     - F. Department Performance Breakdown

5. **Evidence Management**:
   - File attachment support for JPG, PNG, and PDF formats (executable files rejected with security checks).
   - Served securely via `/uploads/` to authorized owners and administrators.

6. **Admin Activity Log (`/admin/activity`)**:
   - Automatic audit trail logging all administrative actions (`STATUS_CHANGED`, `PRIORITY_CHANGED`, `DEPARTMENT_CHANGED`, `ADMIN_UPDATE_ADDED`).
   - Search and filter controls by action type, complaint ID, and admin email.

---

## 🔒 Authentication & Role Architecture (Clerk Integration)

- **Administrator**: `mohamedkaisibrahim2@gmail.com`
  - Full access to `/admin` dashboard, critical portal, overdue escalations, analytics, activity logs, and complaint detail controls.
- **Normal User (Students)**:
  - Access to `/submit`, `/track`, and `/my-complaints` (User Dashboard).
  - Protected backend APIs enforce Clerk token authentication and ownership scoping (`403 Forbidden` for normal users attempting admin endpoints).

---

## 🛠️ Instructions to Run

### 1. Environment Keys
**Frontend (`frontend/.env`)**:
```env
VITE_CLERK_PUBLISHABLE_KEY=pk_test_Y2F1c2FsLWd1cHB5LTk3MTQuY2xlcmsuYWNjb3VudHMuZGV2JA
```

**Backend (`backend/.env`)**:
```env
CLERK_SECRET_KEY=sk_test_eiay3kepL588YYXyYNsD9EsXqzeHy6nJdrQr6mJyiM
```

### 2. Backend (Python Flask)
```bash
cd backend
python app.py
```
*Backend runs on `http://localhost:5000`*

### 3. Frontend (React + Vite)
```bash
cd frontend
npm run dev
```
*Frontend runs on `http://localhost:5173`*

---

## 📋 Protected REST API Endpoints
- `GET /api/admin/critical` - **Admin only** (Critical & sensitive complaints)
- `GET /api/admin/overdue` - **Admin only** (Overdue SLA complaints)
- `GET /api/admin/analytics` - **Admin only** (Full analytics datasets)
- `GET /api/admin/activity` - **Admin only** (Admin audit activity logs)
- `GET /api/complaints/<id>/timeline` - Auth required (Full timeline for admin; student-filtered for users)
- `POST /api/complaints` - Auth required (Binds `clerk_user_id` and calculates initial SLA)
- `GET /api/my-complaints` - Auth required (User dashboard complaints & stats)
- `GET /api/complaints/<id>` - Auth required (Enforces ownership check for normal users)
- `PUT /api/complaints/<id>` - **Admin only** (Auto-logs timeline event & activity)
- `POST /api/complaints/<id>/updates` - **Admin only** (Auto-logs timeline event & activity)
