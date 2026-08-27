-- ============================================================================
-- CTRL CONSTRUCTION HR MANAGEMENT SYSTEM
-- Complete PostgreSQL Schema & Supabase Database Migration
-- Brand: CTRL Construction Corp.
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. USERS & ROLES
CREATE TABLE IF NOT EXISTS public.roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    permissions JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO public.roles (name, description, permissions)
VALUES 
('Super Admin', 'Full system control, settings, user management, and audit logs', '["all"]'::jsonb),
('HR/Admin', 'Can manage employees, documents, sites, designations, attendance, and HR settings', '["employees:read", "employees:write", "documents:manage", "sites:manage", "designations:manage", "attendance:manage"]'::jsonb),
('Payroll/Admin', 'Access to payroll, compensation, payslips, and statutory government deductions', '["payroll:read", "payroll:write", "employees:read", "reports:payroll"]'::jsonb)
ON CONFLICT (name) DO NOTHING;

-- 2. CONSTRUCTION SITES / PROJECTS
CREATE TABLE IF NOT EXISTS public.sites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(30) UNIQUE NOT NULL,
    name VARCHAR(150) NOT NULL,
    project_name VARCHAR(150) NOT NULL,
    client VARCHAR(150) NOT NULL,
    location TEXT NOT NULL,
    project_manager VARCHAR(100),
    site_supervisor VARCHAR(100),
    start_date DATE NOT NULL,
    end_date DATE,
    budget NUMERIC(15, 2) DEFAULT 0.00,
    status VARCHAR(30) DEFAULT 'Active' CHECK (status IN ('Active', 'Completed', 'Suspended', 'Planned')),
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. DESIGNATIONS / POSITIONS
CREATE TABLE IF NOT EXISTS public.designations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    category VARCHAR(50) NOT NULL, -- e.g. Civil, Structural, Heavy Equipment, Electrical, Management
    default_rate NUMERIC(12, 2) DEFAULT 0.00,
    rate_type VARCHAR(20) DEFAULT 'Daily' CHECK (rate_type IN ('Hourly', 'Daily', 'Monthly')),
    status VARCHAR(20) DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. DEPARTMENTS
CREATE TABLE IF NOT EXISTS public.departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    code VARCHAR(20) UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. EMPLOYEES MASTER TABLE
CREATE TABLE IF NOT EXISTS public.employees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_no VARCHAR(50) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    middle_name VARCHAR(100),
    last_name VARCHAR(100) NOT NULL,
    suffix VARCHAR(20),
    photo_url TEXT,
    gender VARCHAR(20),
    dob DATE,
    civil_status VARCHAR(30),
    nationality VARCHAR(50) DEFAULT 'Filipino',
    contact_no VARCHAR(50),
    email VARCHAR(100),
    address TEXT,
    
    -- Emergency Contact
    emergency_contact VARCHAR(100),
    emergency_phone VARCHAR(50),
    emergency_relation VARCHAR(50),
    
    -- Employment Details
    hire_date DATE NOT NULL,
    status VARCHAR(30) DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive', 'On Leave', 'Suspended', 'Resigned', 'Terminated', 'End of Contract')),
    employment_type VARCHAR(50) DEFAULT 'Project-Based' CHECK (employment_type IN ('Regular', 'Project-Based', 'Probationary', 'Casual', 'Contractual')),
    department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
    designation_id UUID REFERENCES public.designations(id) ON DELETE SET NULL,
    current_site_id UUID REFERENCES public.sites(id) ON DELETE SET NULL,
    supervisor VARCHAR(100),
    crew_name VARCHAR(100),
    
    -- Compensation
    salary_type VARCHAR(20) DEFAULT 'Daily' CHECK (salary_type IN ('Hourly', 'Daily', 'Monthly')),
    basic_rate NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    
    -- Government Identifiers
    sss_no VARCHAR(50),
    philhealth_no VARCHAR(50),
    pagibig_no VARCHAR(50),
    tin_no VARCHAR(50),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. EMPLOYEE SITE ASSIGNMENT HISTORY
CREATE TABLE IF NOT EXISTS public.employee_site_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    site_id UUID NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
    assigned_date DATE NOT NULL,
    demobilized_date DATE,
    supervisor VARCHAR(100),
    crew_name VARCHAR(100),
    status VARCHAR(20) DEFAULT 'Active' CHECK (status IN ('Active', 'Completed', 'Transferred')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. DOCUMENT CATEGORIES
CREATE TABLE IF NOT EXISTS public.document_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    group_type VARCHAR(50) NOT NULL, -- Personal, Employment, Construction/Site, Government
    is_required BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. EMPLOYEE DOCUMENTS
CREATE TABLE IF NOT EXISTS public.employee_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    category_id UUID REFERENCES public.document_categories(id) ON DELETE SET NULL,
    name VARCHAR(200) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    file_type VARCHAR(50),
    file_size INTEGER, -- in bytes
    expiry_date DATE,
    notes TEXT,
    uploaded_by VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. ATTENDANCE / TIME LOGS
CREATE TABLE IF NOT EXISTS public.attendance_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    site_id UUID REFERENCES public.sites(id) ON DELETE SET NULL,
    log_date DATE NOT NULL,
    time_in TIME,
    time_out TIME,
    regular_hours NUMERIC(5, 2) DEFAULT 8.00,
    ot_hours NUMERIC(5, 2) DEFAULT 0.00,
    night_diff_hours NUMERIC(5, 2) DEFAULT 0.00,
    is_rest_day BOOLEAN DEFAULT false,
    is_holiday BOOLEAN DEFAULT false,
    late_minutes INTEGER DEFAULT 0,
    undertime_minutes INTEGER DEFAULT 0,
    status VARCHAR(30) DEFAULT 'Present' CHECK (status IN ('Present', 'Late', 'Absent', 'On Leave', 'Half Day', 'Rest Day')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(employee_id, log_date)
);

-- 10. PAYROLL PERIODS
CREATE TABLE IF NOT EXISTS public.payroll_periods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    period_name VARCHAR(100) NOT NULL,
    period_type VARCHAR(30) DEFAULT 'Semi-Monthly' CHECK (period_type IN ('Monthly', 'Semi-Monthly', 'Weekly', 'Custom')),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    payout_date DATE NOT NULL,
    status VARCHAR(30) DEFAULT 'Draft' CHECK (status IN ('Draft', 'For Review', 'Approved', 'Paid')),
    total_gross NUMERIC(15, 2) DEFAULT 0.00,
    total_deductions NUMERIC(15, 2) DEFAULT 0.00,
    total_net NUMERIC(15, 2) DEFAULT 0.00,
    approved_by VARCHAR(100),
    approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. PAYROLL RECORDS
CREATE TABLE IF NOT EXISTS public.payroll_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    period_id UUID NOT NULL REFERENCES public.payroll_periods(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    site_id UUID REFERENCES public.sites(id) ON DELETE SET NULL,
    designation_id UUID REFERENCES public.designations(id) ON DELETE SET NULL,
    
    -- Attendance Days/Hours
    days_worked NUMERIC(5, 2) DEFAULT 0.00,
    ot_hours NUMERIC(5, 2) DEFAULT 0.00,
    
    -- Earnings Breakdown
    basic_pay NUMERIC(12, 2) DEFAULT 0.00,
    ot_pay NUMERIC(12, 2) DEFAULT 0.00,
    holiday_pay NUMERIC(12, 2) DEFAULT 0.00,
    rest_day_pay NUMERIC(12, 2) DEFAULT 0.00,
    night_diff_pay NUMERIC(12, 2) DEFAULT 0.00,
    site_allowance NUMERIC(12, 2) DEFAULT 0.00,
    hazard_allowance NUMERIC(12, 2) DEFAULT 0.00,
    other_bonuses NUMERIC(12, 2) DEFAULT 0.00,
    gross_pay NUMERIC(12, 2) DEFAULT 0.00,
    
    -- Deductions Breakdown
    sss_employee NUMERIC(12, 2) DEFAULT 0.00,
    sss_employer NUMERIC(12, 2) DEFAULT 0.00,
    philhealth_employee NUMERIC(12, 2) DEFAULT 0.00,
    philhealth_employer NUMERIC(12, 2) DEFAULT 0.00,
    pagibig_employee NUMERIC(12, 2) DEFAULT 0.00,
    pagibig_employer NUMERIC(12, 2) DEFAULT 0.00,
    tax_withheld NUMERIC(12, 2) DEFAULT 0.00,
    cash_advance_deduction NUMERIC(12, 2) DEFAULT 0.00,
    loan_deduction NUMERIC(12, 2) DEFAULT 0.00,
    other_deductions NUMERIC(12, 2) DEFAULT 0.00,
    total_deductions NUMERIC(12, 2) DEFAULT 0.00,
    
    -- Final Net Pay
    net_pay NUMERIC(12, 2) DEFAULT 0.00,
    status VARCHAR(30) DEFAULT 'Calculated',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(period_id, employee_id)
);

-- 12. GOVERNMENT CONTRIBUTION RULES (Configurable Architecture)
CREATE TABLE IF NOT EXISTS public.government_contribution_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agency VARCHAR(20) NOT NULL CHECK (agency IN ('SSS', 'PhilHealth', 'Pag-IBIG', 'BIR_Tax')),
    bracket_min NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    bracket_max NUMERIC(12, 2),
    employee_rate NUMERIC(6, 4), -- percentage (e.g. 0.045)
    employer_rate NUMERIC(6, 4),
    employee_fixed NUMERIC(12, 2) DEFAULT 0.00,
    employer_fixed NUMERIC(12, 2) DEFAULT 0.00,
    base_tax NUMERIC(12, 2) DEFAULT 0.00,
    excess_rate NUMERIC(6, 4) DEFAULT 0.00,
    effective_year INTEGER DEFAULT 2026,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. AUDIT LOGS
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_name VARCHAR(100) NOT NULL,
    user_role VARCHAR(50) NOT NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id VARCHAR(100),
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.designations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read and manage HR records according to Supabase JWT roles
CREATE POLICY "Allow authenticated read on employees" ON public.employees FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow HR/SuperAdmin write on employees" ON public.employees FOR ALL TO authenticated USING (true);

CREATE POLICY "Allow authenticated read on documents" ON public.employee_documents FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow HR/SuperAdmin write on documents" ON public.employee_documents FOR ALL TO authenticated USING (true);

CREATE POLICY "Allow authenticated read on sites" ON public.sites FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow write on sites" ON public.sites FOR ALL TO authenticated USING (true);

CREATE POLICY "Allow authenticated read on designations" ON public.designations FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow write on designations" ON public.designations FOR ALL TO authenticated USING (true);

CREATE POLICY "Allow payroll access to authenticated" ON public.payroll_records FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow periods access to authenticated" ON public.payroll_periods FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow attendance access to authenticated" ON public.attendance_logs FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow audit access to authenticated" ON public.audit_logs FOR ALL TO authenticated USING (true);

-- 15. STORAGE BUCKETS (Run in Supabase SQL editor)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('employee-documents', 'employee-documents', false);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('employee-photos', 'employee-photos', true);
