# CTRL Construction HR Management System

![CTRL Construction Corp](https://images.unsplash.com/photo-1541888946425-d0fbb18f15f6?auto=format&fit=crop&q=80&w=1200)

**CTRL Construction HR Management System** is a modern, enterprise-grade Construction Workforce & Human Resource Management System specifically built for **CTRL Construction Corp.** to manage 200–500 construction workers, craft designations, site assignments, compliance documents, time logs, and semi-monthly payroll.

---

## 🏗️ Key Highlights & Features

### 1. Construction Workforce Roster (`/employees`)
- **Master 201 File Roster**: Preloaded with 22 detailed sample construction workers (Master Carpenters, Structural Welders NC-II, Heavy Equipment Operators, Foremen, Project Engineers, Riggers, Safety Officers).
- **Multi-Column Filtering & Search**: Filter by Project Site, Craft Designation, Status (Active, On Leave, Suspended), and Pay Type (Hourly, Daily, Monthly).
- **Onboarding Wizard**: Quick hire workflow with photo attachments, statutory numbers (SSS, PhilHealth, Pag-IBIG, TIN), and emergency contacts.
- **Excel Export**: 1-click export of master employee rosters to `.xlsx`.

### 2. Comprehensive 201 Employee Profile Hub (`/employees/:id`)
- **Personal & Contact Info**: Addresses, birthdays, emergency contacts, civil status.
- **Employment & Compensation**: Salary rates, supervisor, crew unit, and employment status.
- **Historical Site Assignment Timeline**: Chronological deployment history (`Project Alpha` ➔ `Project Beta` ➔ `Current Site`) without destructive overwrites.
- **Government Identifiers**: SSS Number, PhilHealth PIN, Pag-IBIG MID, BIR TIN.
- **DOLE Compliance & 201 Document Vault**: Supabase Storage file management with color-coded warning badges (`⚠️ Expired`, `⚠️ Expires in 30 days`), document preview modal, download, and delete.
- **Individual Time Logs & Historical Payslips**: Printable 1-click PDF payslips.

### 3. Construction Sites & Projects (`/sites` & `/sites/:id`)
- **Site Directory**: Budgets, locations, project timelines, PMs, and site supervisors across active infrastructure and high-rise developments (*CTRL Tower One BGC*, *MRT-7 Depot*, *Horizon Luxury Residences Cebu*).
- **Project Labor Cost Allocation**: Aggregated monthly labor cost computation per construction site.
- **Stationed Trade Breakdown**: Live headcount grouped by craft discipline.

### 4. Designation & Position Management (`/designations`)
- Custom trade positions categorized under Civil & Structural, Finishing & Carpentry, Heavy Equipment, MEP, Rigging, Safety & QA, Site Supervision, and Engineering.
- Configurable benchmark suggested daily, hourly, or monthly rates.

### 5. Attendance & Timesheet Engine (`/attendance`)
- Daily check-in/out records, regular hours, overtime, and shift notes.
- **Excel Attendance Import**: Drag-and-drop `.xlsx` timesheet with instant row-by-row validation against master employee IDs before committing.
- Downloadable Excel attendance template.

### 6. Construction Payroll & Statutory Deductions (`/payroll` & `/payroll/:periodId`)
- Automated semi-monthly and monthly calculation runs.
- **Earnings Computation**: Basic Pay + Overtime (1.25x) + Holiday Pay (2.0x) + Rest Day Pay (1.30x) + Night Diff (1.10x) + Site Allowance + Hazard Pay.
- **Configurable Statutory Deductions**: Philippine SSS (2026 table), PhilHealth (5% shared), Pag-IBIG (₱200 cap), BIR Withholding Tax (TRAIN Law), and Cash Advances / Loans.
- **Excel Payroll Batch Import**: Spreadsheets parsed, mapped to Employee IDs, validated with inline error highlighting, and committed.
- **Official Payslip PDF Generator**: Branded jsPDF payslips with company header, earnings/deductions breakdown, and employee signature lines.
- **Payroll Period Locking Workflow**: `Draft` ➔ `For Review` ➔ `Approved` (Locked) ➔ `Paid`.

### 7. Reports & Compliance (`/reports`)
- Project Site Labor Cost Reports.
- Government Statutory Remittance Summaries (SSS, PhilHealth, Pag-IBIG, BIR Tax).
- Worker Safety Cards & License Expiration Radar.

### 8. System Architecture & Demo Credentials
- **Demo HR Admin Account**:
  - **Email**: `hr@ctrlconstruction.ph`
  - **Password**: `Password123!`
  - Includes 1-Click Instant Demo Login on the login screen.
- **Supabase Backend**: Complete PostgreSQL schema in `supabase_schema.sql` with Row Level Security (RLS) policies, storage buckets, and offline persistence fallback.

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Development Server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### 3. Build for Production
```bash
npm run build
```

---

## 🛠️ Technology Stack
- **Frontend**: React 18, Tailwind CSS, React Router DOM, Lucide Icons, Recharts
- **Spreadsheets & Reports**: SheetJS (`xlsx`), jsPDF, jsPDF-AutoTable
- **Backend & Database**: Supabase PostgreSQL, Supabase Storage, Supabase Auth
- **Build Tool**: Vite

---

## 🏢 Corporate Attribution
**CTRL Construction HR Management System**  
*A product by VCS Technologies*
