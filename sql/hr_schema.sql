-- Attendance table
CREATE TABLE IF NOT EXISTS attendance (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    check_in_time TIME,
    check_out_time TIME,
    break_duration INTEGER DEFAULT 0, -- in minutes
    total_hours DECIMAL(4,2) DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'present' CHECK (status IN ('present', 'absent', 'late', 'half_day', 'holiday')),
    notes TEXT,
    location_check_in JSONB, -- GPS coordinates, IP address, etc.
    location_check_out JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(company_id, employee_id, date)
);

-- Leave Requests table
CREATE TABLE IF NOT EXISTS leave_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    leave_type VARCHAR(20) NOT NULL CHECK (leave_type IN ('annual', 'sick', 'maternity', 'paternity', 'emergency', 'unpaid')),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    days_requested INTEGER NOT NULL,
    reason TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    approved_by UUID REFERENCES employees(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    comments TEXT,
    attachment_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CHECK (end_date >= start_date),
    CHECK (days_requested > 0)
);

-- Payroll table
CREATE TABLE IF NOT EXISTS payroll (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    pay_period_start DATE NOT NULL,
    pay_period_end DATE NOT NULL,
    basic_salary DECIMAL(15,2) NOT NULL DEFAULT 0,
    allowances DECIMAL(15,2) DEFAULT 0,
    overtime_hours DECIMAL(5,2) DEFAULT 0,
    overtime_rate DECIMAL(10,2) DEFAULT 0,
    deductions DECIMAL(15,2) DEFAULT 0,
    tax_deduction DECIMAL(15,2) DEFAULT 0,
    pf_deduction DECIMAL(15,2) DEFAULT 0, -- Provident Fund
    esi_deduction DECIMAL(15,2) DEFAULT 0, -- Employee State Insurance
    professional_tax DECIMAL(15,2) DEFAULT 0,
    other_deductions DECIMAL(15,2) DEFAULT 0,
    gross_salary DECIMAL(15,2) NOT NULL DEFAULT 0,
    net_salary DECIMAL(15,2) NOT NULL DEFAULT 0,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'processed', 'paid')),
    pay_date DATE,
    payment_method VARCHAR(20) DEFAULT 'bank_transfer',
    payment_reference VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(company_id, employee_id, pay_period_start, pay_period_end),
    CHECK (pay_period_end >= pay_period_start),
    CHECK (gross_salary >= 0),
    CHECK (net_salary >= 0)
);

-- Employee Benefits table
CREATE TABLE IF NOT EXISTS employee_benefits (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    benefit_type VARCHAR(50) NOT NULL, -- 'health_insurance', 'life_insurance', 'retirement_plan', etc.
    benefit_name VARCHAR(255) NOT NULL,
    provider VARCHAR(255),
    policy_number VARCHAR(100),
    coverage_amount DECIMAL(15,2),
    premium_amount DECIMAL(15,2),
    employee_contribution DECIMAL(15,2) DEFAULT 0,
    employer_contribution DECIMAL(15,2) DEFAULT 0,
    start_date DATE,
    end_date DATE,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'expired')),
    beneficiary_details JSONB,
    documents JSONB, -- Array of document URLs
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Performance Reviews table
CREATE TABLE IF NOT EXISTS performance_reviews (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    reviewer_id UUID NOT NULL REFERENCES employees(id),
    review_period_start DATE NOT NULL,
    review_period_end DATE NOT NULL,
    review_type VARCHAR(20) DEFAULT 'annual' CHECK (review_type IN ('annual', 'quarterly', 'probation', 'project')),
    overall_rating DECIMAL(3,2) CHECK (overall_rating >= 1 AND overall_rating <= 5),
    goals_achievement DECIMAL(3,2) CHECK (goals_achievement >= 1 AND goals_achievement <= 5),
    technical_skills DECIMAL(3,2) CHECK (technical_skills >= 1 AND technical_skills <= 5),
    communication_skills DECIMAL(3,2) CHECK (communication_skills >= 1 AND communication_skills <= 5),
    teamwork DECIMAL(3,2) CHECK (teamwork >= 1 AND teamwork >= 5),
    leadership DECIMAL(3,2) CHECK (leadership >= 1 AND leadership <= 5),
    strengths TEXT,
    areas_for_improvement TEXT,
    goals_next_period TEXT,
    manager_comments TEXT,
    employee_comments TEXT,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'reviewed', 'approved')),
    submitted_at TIMESTAMP WITH TIME ZONE,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CHECK (review_period_end >= review_period_start)
);

-- Training Programs table
CREATE TABLE IF NOT EXISTS training_programs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    program_name VARCHAR(255) NOT NULL,
    description TEXT,
    training_type VARCHAR(50) NOT NULL, -- 'technical', 'soft_skills', 'compliance', 'safety'
    provider VARCHAR(255),
    duration_hours INTEGER,
    cost_per_participant DECIMAL(10,2),
    max_participants INTEGER,
    start_date DATE,
    end_date DATE,
    location VARCHAR(255),
    is_mandatory BOOLEAN DEFAULT false,
    certification_provided BOOLEAN DEFAULT false,
    materials JSONB, -- Array of material URLs
    status VARCHAR(20) DEFAULT 'planned' CHECK (status IN ('planned', 'ongoing', 'completed', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Employee Training table (many-to-many relationship)
CREATE TABLE IF NOT EXISTS employee_training (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    training_program_id UUID NOT NULL REFERENCES training_programs(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    enrollment_date DATE DEFAULT CURRENT_DATE,
    completion_date DATE,
    status VARCHAR(20) DEFAULT 'enrolled' CHECK (status IN ('enrolled', 'in_progress', 'completed', 'failed', 'withdrawn')),
    score DECIMAL(5,2),
    certificate_url TEXT,
    feedback TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(training_program_id, employee_id)
);

-- Employee Documents table
CREATE TABLE IF NOT EXISTS employee_documents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    document_type VARCHAR(50) NOT NULL, -- 'resume', 'id_proof', 'address_proof', 'education', 'experience'
    document_name VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    file_size INTEGER, -- in bytes
    mime_type VARCHAR(100),
    upload_date DATE DEFAULT CURRENT_DATE,
    expiry_date DATE,
    is_verified BOOLEAN DEFAULT false,
    verified_by UUID REFERENCES employees(id),
    verified_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Holiday Calendar table
CREATE TABLE IF NOT EXISTS holidays (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    holiday_name VARCHAR(255) NOT NULL,
    holiday_date DATE NOT NULL,
    holiday_type VARCHAR(20) DEFAULT 'public' CHECK (holiday_type IN ('public', 'company', 'optional')),
    description TEXT,
    is_recurring BOOLEAN DEFAULT false,
    applicable_departments JSONB, -- Array of department IDs, null means all departments
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(company_id, holiday_date, holiday_name)
);

-- Shift Management table
CREATE TABLE IF NOT EXISTS shifts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    shift_name VARCHAR(100) NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    break_duration INTEGER DEFAULT 60, -- in minutes
    working_hours DECIMAL(4,2) GENERATED ALWAYS AS (
        EXTRACT(EPOCH FROM (end_time - start_time)) / 3600 - (break_duration / 60.0)
    ) STORED,
    is_night_shift BOOLEAN DEFAULT false,
    overtime_threshold DECIMAL(4,2) DEFAULT 8.0, -- hours after which overtime applies
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(company_id, shift_name)
);

-- Employee Shift Assignment table
CREATE TABLE IF NOT EXISTS employee_shifts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    shift_id UUID NOT NULL REFERENCES shifts(id) ON DELETE CASCADE,
    effective_from DATE NOT NULL,
    effective_to DATE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CHECK (effective_to IS NULL OR effective_to >= effective_from)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_attendance_company_employee_date ON attendance(company_id, employee_id, date);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date);
CREATE INDEX IF NOT EXISTS idx_attendance_status ON attendance(status);

CREATE INDEX IF NOT EXISTS idx_leave_requests_company_id ON leave_requests(company_id);
CREATE INDEX IF NOT EXISTS idx_leave_requests_employee_id ON leave_requests(employee_id);
CREATE INDEX IF NOT EXISTS idx_leave_requests_status ON leave_requests(status);
CREATE INDEX IF NOT EXISTS idx_leave_requests_dates ON leave_requests(start_date, end_date);

CREATE INDEX IF NOT EXISTS idx_payroll_company_employee ON payroll(company_id, employee_id);
CREATE INDEX IF NOT EXISTS idx_payroll_pay_period ON payroll(pay_period_start, pay_period_end);
CREATE INDEX IF NOT EXISTS idx_payroll_status ON payroll(status);

CREATE INDEX IF NOT EXISTS idx_employee_benefits_company_employee ON employee_benefits(company_id, employee_id);
CREATE INDEX IF NOT EXISTS idx_performance_reviews_company_employee ON performance_reviews(company_id, employee_id);
CREATE INDEX IF NOT EXISTS idx_training_programs_company_id ON training_programs(company_id);
CREATE INDEX IF NOT EXISTS idx_employee_training_employee_id ON employee_training(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_documents_company_employee ON employee_documents(company_id, employee_id);
CREATE INDEX IF NOT EXISTS idx_holidays_company_date ON holidays(company_id, holiday_date);
CREATE INDEX IF NOT EXISTS idx_shifts_company_id ON shifts(company_id);
CREATE INDEX IF NOT EXISTS idx_employee_shifts_employee_id ON employee_shifts(employee_id);

-- Enable Row Level Security
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_benefits ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_training ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE holidays ENABLE ROW LEVEL SECURITY;
ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_shifts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their company's attendance" ON attendance
    FOR SELECT USING (company_id IN (
        SELECT c.id FROM companies c
        JOIN auth.users u ON u.id = auth.uid()
        WHERE c.created_by = u.email OR c.id = ANY(
            SELECT company_id FROM employees WHERE user_id = u.id
        )
    ));

CREATE POLICY "Users can manage their company's attendance" ON attendance
    FOR ALL USING (company_id IN (
        SELECT c.id FROM companies c
        JOIN auth.users u ON u.id = auth.uid()
        WHERE c.created_by = u.email OR c.id = ANY(
            SELECT company_id FROM employees WHERE user_id = u.id
        )
    ));

CREATE POLICY "Users can view their company's leave requests" ON leave_requests
    FOR SELECT USING (company_id IN (
        SELECT c.id FROM companies c
        JOIN auth.users u ON u.id = auth.uid()
        WHERE c.created_by = u.email OR c.id = ANY(
            SELECT company_id FROM employees WHERE user_id = u.id
        )
    ));

CREATE POLICY "Users can manage their company's leave requests" ON leave_requests
    FOR ALL USING (company_id IN (
        SELECT c.id FROM companies c
        JOIN auth.users u ON u.id = auth.uid()
        WHERE c.created_by = u.email OR c.id = ANY(
            SELECT company_id FROM employees WHERE user_id = u.id
        )
    ));

CREATE POLICY "Users can view their company's payroll" ON payroll
    FOR SELECT USING (company_id IN (
        SELECT c.id FROM companies c
        JOIN auth.users u ON u.id = auth.uid()
        WHERE c.created_by = u.email OR c.id = ANY(
            SELECT company_id FROM employees WHERE user_id = u.id
        )
    ));

CREATE POLICY "Users can manage their company's payroll" ON payroll
    FOR ALL USING (company_id IN (
        SELECT c.id FROM companies c
        JOIN auth.users u ON u.id = auth.uid()
        WHERE c.created_by = u.email OR c.id = ANY(
            SELECT company_id FROM employees WHERE user_id = u.id
        )
    ));

-- Similar policies for other tables
CREATE POLICY "Users can view their company's employee benefits" ON employee_benefits
    FOR SELECT USING (company_id IN (
        SELECT c.id FROM companies c
        JOIN auth.users u ON u.id = auth.uid()
        WHERE c.created_by = u.email OR c.id = ANY(
            SELECT company_id FROM employees WHERE user_id = u.id
        )
    ));

CREATE POLICY "Users can manage their company's employee benefits" ON employee_benefits
    FOR ALL USING (company_id IN (
        SELECT c.id FROM companies c
        JOIN auth.users u ON u.id = auth.uid()
        WHERE c.created_by = u.email OR c.id = ANY(
            SELECT company_id FROM employees WHERE user_id = u.id
        )
    ));

CREATE POLICY "Users can view their company's performance reviews" ON performance_reviews
    FOR SELECT USING (company_id IN (
        SELECT c.id FROM companies c
        JOIN auth.users u ON u.id = auth.uid()
        WHERE c.created_by = u.email OR c.id = ANY(
            SELECT company_id FROM employees WHERE user_id = u.id
        )
    ));

CREATE POLICY "Users can manage their company's performance reviews" ON performance_reviews
    FOR ALL USING (company_id IN (
        SELECT c.id FROM companies c
        JOIN auth.users u ON u.id = auth.uid()
        WHERE c.created_by = u.email OR c.id = ANY(
            SELECT company_id FROM employees WHERE user_id = u.id
        )
    ));

CREATE POLICY "Users can view their company's training programs" ON training_programs
    FOR SELECT USING (company_id IN (
        SELECT c.id FROM companies c
        JOIN auth.users u ON u.id = auth.uid()
        WHERE c.created_by = u.email OR c.id = ANY(
            SELECT company_id FROM employees WHERE user_id = u.id
        )
    ));

CREATE POLICY "Users can manage their company's training programs" ON training_programs
    FOR ALL USING (company_id IN (
        SELECT c.id FROM companies c
        JOIN auth.users u ON u.id = auth.uid()
        WHERE c.created_by = u.email OR c.id = ANY(
            SELECT company_id FROM employees WHERE user_id = u.id
        )
    ));

-- Employee training policies (employees can view their own training)
CREATE POLICY "Employees can view their training" ON employee_training
    FOR SELECT USING (
        employee_id IN (
            SELECT id FROM employees WHERE user_id = auth.uid()
        ) OR
        training_program_id IN (
            SELECT id FROM training_programs WHERE company_id IN (
                SELECT c.id FROM companies c
                JOIN auth.users u ON u.id = auth.uid()
                WHERE c.created_by = u.email OR c.id = ANY(
                    SELECT company_id FROM employees WHERE user_id = u.id
                )
            )
        )
    );

CREATE POLICY "HR can manage employee training" ON employee_training
    FOR ALL USING (
        training_program_id IN (
            SELECT id FROM training_programs WHERE company_id IN (
                SELECT c.id FROM companies c
                JOIN auth.users u ON u.id = auth.uid()
                WHERE c.created_by = u.email OR c.id = ANY(
                    SELECT company_id FROM employees WHERE user_id = u.id
                )
            )
        )
    );

CREATE POLICY "Users can view their company's employee documents" ON employee_documents
    FOR SELECT USING (company_id IN (
        SELECT c.id FROM companies c
        JOIN auth.users u ON u.id = auth.uid()
        WHERE c.created_by = u.email OR c.id = ANY(
            SELECT company_id FROM employees WHERE user_id = u.id
        )
    ));

CREATE POLICY "Users can manage their company's employee documents" ON employee_documents
    FOR ALL USING (company_id IN (
        SELECT c.id FROM companies c
        JOIN auth.users u ON u.id = auth.uid()
        WHERE c.created_by = u.email OR c.id = ANY(
            SELECT company_id FROM employees WHERE user_id = u.id
        )
    ));

CREATE POLICY "Users can view their company's holidays" ON holidays
    FOR SELECT USING (company_id IN (
        SELECT c.id FROM companies c
        JOIN auth.users u ON u.id = auth.uid()
        WHERE c.created_by = u.email OR c.id = ANY(
            SELECT company_id FROM employees WHERE user_id = u.id
        )
    ));

CREATE POLICY "Users can manage their company's holidays" ON holidays
    FOR ALL USING (company_id IN (
        SELECT c.id FROM companies c
        JOIN auth.users u ON u.id = auth.uid()
        WHERE c.created_by = u.email OR c.id = ANY(
            SELECT company_id FROM employees WHERE user_id = u.id
        )
    ));

CREATE POLICY "Users can view their company's shifts" ON shifts
    FOR SELECT USING (company_id IN (
        SELECT c.id FROM companies c
        JOIN auth.users u ON u.id = auth.uid()
        WHERE c.created_by = u.email OR c.id = ANY(
            SELECT company_id FROM employees WHERE user_id = u.id
        )
    ));

CREATE POLICY "Users can manage their company's shifts" ON shifts
    FOR ALL USING (company_id IN (
        SELECT c.id FROM companies c
        JOIN auth.users u ON u.id = auth.uid()
        WHERE c.created_by = u.email OR c.id = ANY(
            SELECT company_id FROM employees WHERE user_id = u.id
        )
    ));

-- Employee shifts policies (employees can view their own shifts)
CREATE POLICY "Employees can view their shifts" ON employee_shifts
    FOR SELECT USING (
        employee_id IN (
            SELECT id FROM employees WHERE user_id = auth.uid()
        ) OR
        shift_id IN (
            SELECT id FROM shifts WHERE company_id IN (
                SELECT c.id FROM companies c
                JOIN auth.users u ON u.id = auth.uid()
                WHERE c.created_by = u.email OR c.id = ANY(
                    SELECT company_id FROM employees WHERE user_id = u.id
                )
            )
        )
    );

CREATE POLICY "HR can manage employee shifts" ON employee_shifts
    FOR ALL USING (
        shift_id IN (
            SELECT id FROM shifts WHERE company_id IN (
                SELECT c.id FROM companies c
                JOIN auth.users u ON u.id = auth.uid()
                WHERE c.created_by = u.email OR c.id = ANY(
                    SELECT company_id FROM employees WHERE user_id = u.id
                )
            )
        )
    );

-- Insert default shifts for companies
INSERT INTO shifts (company_id, shift_name, start_time, end_time, break_duration, is_night_shift)
SELECT 
    c.id,
    shifts.shift_name,
    shifts.start_time,
    shifts.end_time,
    shifts.break_duration,
    shifts.is_night_shift
FROM companies c
CROSS JOIN (
    VALUES 
    ('Day Shift', '09:00:00', '18:00:00', 60, false),
    ('Evening Shift', '14:00:00', '23:00:00', 60, false),
    ('Night Shift', '22:00:00', '07:00:00', 60, true),
    ('Flexible Hours', '10:00:00', '19:00:00', 60, false)
) AS shifts(shift_name, start_time, end_time, break_duration, is_night_shift)
WHERE NOT EXISTS (
    SELECT 1 FROM shifts s 
    WHERE s.company_id = c.id AND s.shift_name = shifts.shift_name
);

-- Insert common holidays for Indian companies
INSERT INTO holidays (company_id, holiday_name, holiday_date, holiday_type, description)
SELECT 
    c.id,
    holidays.holiday_name,
    holidays.holiday_date,
    holidays.holiday_type,
    holidays.description
FROM companies c
CROSS JOIN (
    VALUES 
    ('New Year''s Day', '2024-01-01', 'public', 'New Year celebration'),
    ('Republic Day', '2024-01-26', 'public', 'Indian Republic Day'),
    ('Holi', '2024-03-25', 'public', 'Festival of Colors'),
    ('Good Friday', '2024-03-29', 'public', 'Christian holiday'),
    ('Independence Day', '2024-08-15', 'public', 'Indian Independence Day'),
    ('Gandhi Jayanti', '2024-10-02', 'public', 'Mahatma Gandhi''s Birthday'),
    ('Diwali', '2024-11-01', 'public', 'Festival of Lights'),
    ('Christmas', '2024-12-25', 'public', 'Christian holiday')
) AS holidays(holiday_name, holiday_date, holiday_type, description)
WHERE NOT EXISTS (
    SELECT 1 FROM holidays h 
    WHERE h.company_id = c.id AND h.holiday_date = holidays.holiday_date
);

-- Create triggers for updating timestamps
CREATE TRIGGER update_attendance_updated_at BEFORE UPDATE ON attendance
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_leave_requests_updated_at BEFORE UPDATE ON leave_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payroll_updated_at BEFORE UPDATE ON payroll
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_employee_benefits_updated_at BEFORE UPDATE ON employee_benefits
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_performance_reviews_updated_at BEFORE UPDATE ON performance_reviews
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_training_programs_updated_at BEFORE UPDATE ON training_programs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_employee_training_updated_at BEFORE UPDATE ON employee_training
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_employee_documents_updated_at BEFORE UPDATE ON employee_documents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_holidays_updated_at BEFORE UPDATE ON holidays
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shifts_updated_at BEFORE UPDATE ON shifts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_employee_shifts_updated_at BEFORE UPDATE ON employee_shifts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();