-- Quality Management Schema
-- This schema handles quality control processes, inspections, non-conformances, corrective actions, and audits

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Quality Inspections Table
CREATE TABLE quality_inspections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    inspection_number VARCHAR(50) NOT NULL,
    inspection_type VARCHAR(20) NOT NULL CHECK (inspection_type IN ('incoming', 'in_process', 'final', 'customer_return', 'supplier_audit')),
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    batch_number VARCHAR(100),
    supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
    work_order_id UUID REFERENCES work_orders(id) ON DELETE SET NULL,
    inspector_id UUID NOT NULL REFERENCES employees(id) ON DELETE RESTRICT,
    inspection_date TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
    result VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (result IN ('pass', 'fail', 'conditional_pass', 'pending')),
    sample_size INTEGER NOT NULL DEFAULT 1,
    defect_count INTEGER NOT NULL DEFAULT 0,
    defect_rate DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT unique_inspection_number_per_company UNIQUE (company_id, inspection_number)
);

-- Quality Checkpoints Table
CREATE TABLE quality_checkpoints (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    inspection_id UUID NOT NULL REFERENCES quality_inspections(id) ON DELETE CASCADE,
    checkpoint_name VARCHAR(200) NOT NULL,
    specification TEXT NOT NULL,
    measurement_type VARCHAR(20) NOT NULL CHECK (measurement_type IN ('numeric', 'visual', 'go_no_go', 'attribute')),
    target_value DECIMAL(15,6),
    tolerance_upper DECIMAL(15,6),
    tolerance_lower DECIMAL(15,6),
    unit_of_measure VARCHAR(50),
    actual_value DECIMAL(15,6),
    text_result TEXT,
    result VARCHAR(10) NOT NULL CHECK (result IN ('pass', 'fail', 'na')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Non-Conformances Table
CREATE TABLE non_conformances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    ncr_number VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(30) NOT NULL CHECK (category IN ('product', 'process', 'system', 'documentation', 'customer_complaint')),
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    source VARCHAR(30) NOT NULL CHECK (source IN ('internal_audit', 'customer_complaint', 'supplier_issue', 'production', 'inspection')),
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    batch_number VARCHAR(100),
    supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
    detected_by UUID NOT NULL REFERENCES employees(id) ON DELETE RESTRICT,
    detection_date TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'corrective_action', 'verification', 'closed', 'cancelled')),
    assigned_to UUID REFERENCES employees(id) ON DELETE SET NULL,
    root_cause TEXT,
    immediate_action TEXT,
    cost_impact DECIMAL(15,2),
    customer_impact BOOLEAN NOT NULL DEFAULT FALSE,
    regulatory_impact BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT unique_ncr_number_per_company UNIQUE (company_id, ncr_number)
);

-- Corrective Actions Table
CREATE TABLE corrective_actions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    non_conformance_id UUID NOT NULL REFERENCES non_conformances(id) ON DELETE CASCADE,
    action_number VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    action_type VARCHAR(20) NOT NULL CHECK (action_type IN ('immediate', 'corrective', 'preventive')),
    assigned_to UUID NOT NULL REFERENCES employees(id) ON DELETE RESTRICT,
    due_date TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'in_progress', 'completed', 'verified', 'cancelled')),
    completion_date TIMESTAMP WITH TIME ZONE,
    verification_date TIMESTAMP WITH TIME ZONE,
    verified_by UUID REFERENCES employees(id) ON DELETE SET NULL,
    effectiveness_review TEXT,
    cost DECIMAL(15,2),
    notes TEXT,
    created_by UUID NOT NULL REFERENCES employees(id) ON DELETE RESTRICT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Quality Audits Table
CREATE TABLE quality_audits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    audit_number VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    audit_type VARCHAR(20) NOT NULL CHECK (audit_type IN ('internal', 'external', 'supplier', 'customer', 'regulatory')),
    scope TEXT NOT NULL,
    standard VARCHAR(100) NOT NULL, -- ISO 9001, AS9100, etc.
    auditor_id UUID NOT NULL REFERENCES employees(id) ON DELETE RESTRICT,
    auditee_department VARCHAR(100),
    planned_date TIMESTAMP WITH TIME ZONE NOT NULL,
    actual_date TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'in_progress', 'completed', 'report_pending', 'closed')),
    overall_rating VARCHAR(20) CHECK (overall_rating IN ('excellent', 'good', 'satisfactory', 'needs_improvement', 'unsatisfactory')),
    findings_count INTEGER NOT NULL DEFAULT 0,
    major_findings INTEGER NOT NULL DEFAULT 0,
    minor_findings INTEGER NOT NULL DEFAULT 0,
    observations INTEGER NOT NULL DEFAULT 0,
    summary TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT unique_audit_number_per_company UNIQUE (company_id, audit_number)
);

-- Audit Findings Table
CREATE TABLE audit_findings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    audit_id UUID NOT NULL REFERENCES quality_audits(id) ON DELETE CASCADE,
    finding_number VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(20) NOT NULL CHECK (category IN ('major', 'minor', 'observation', 'opportunity')),
    clause_reference VARCHAR(100) NOT NULL,
    evidence TEXT NOT NULL,
    recommendation TEXT NOT NULL,
    assigned_to UUID REFERENCES employees(id) ON DELETE SET NULL,
    due_date TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'completed', 'verified', 'closed')),
    response TEXT,
    corrective_action_id UUID REFERENCES corrective_actions(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Quality Metrics Table
CREATE TABLE quality_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    metric_name VARCHAR(100) NOT NULL,
    metric_type VARCHAR(30) NOT NULL CHECK (metric_type IN ('defect_rate', 'first_pass_yield', 'customer_satisfaction', 'supplier_quality', 'cost_of_quality', 'on_time_delivery')),
    target_value DECIMAL(15,6) NOT NULL,
    actual_value DECIMAL(15,6) NOT NULL,
    unit_of_measure VARCHAR(50) NOT NULL,
    measurement_period VARCHAR(20) NOT NULL CHECK (measurement_period IN ('daily', 'weekly', 'monthly', 'quarterly', 'yearly')),
    measurement_date TIMESTAMP WITH TIME ZONE NOT NULL,
    department VARCHAR(100),
    product_line VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Quality Standards Table
CREATE TABLE quality_standards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    standard_name VARCHAR(100) NOT NULL,
    standard_code VARCHAR(50) NOT NULL,
    version VARCHAR(20),
    description TEXT,
    certification_body VARCHAR(100),
    certification_date TIMESTAMP WITH TIME ZONE,
    expiry_date TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'suspended', 'withdrawn')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Quality Documents Table
CREATE TABLE quality_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    document_type VARCHAR(50) NOT NULL, -- SOP, Work Instruction, Quality Manual, etc.
    document_number VARCHAR(100) NOT NULL,
    title VARCHAR(200) NOT NULL,
    version VARCHAR(20) NOT NULL DEFAULT '1.0',
    description TEXT,
    file_path VARCHAR(500),
    file_size INTEGER,
    mime_type VARCHAR(100),
    department VARCHAR(100),
    process_area VARCHAR(100),
    author_id UUID NOT NULL REFERENCES employees(id) ON DELETE RESTRICT,
    reviewer_id UUID REFERENCES employees(id) ON DELETE SET NULL,
    approver_id UUID REFERENCES employees(id) ON DELETE SET NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'review', 'approved', 'obsolete')),
    effective_date TIMESTAMP WITH TIME ZONE,
    review_date TIMESTAMP WITH TIME ZONE,
    next_review_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT unique_document_number_per_company UNIQUE (company_id, document_number)
);

-- Quality Training Records Table
CREATE TABLE quality_training_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    training_topic VARCHAR(200) NOT NULL,
    training_type VARCHAR(50) NOT NULL, -- Classroom, Online, OJT, etc.
    trainer_name VARCHAR(100),
    training_date TIMESTAMP WITH TIME ZONE NOT NULL,
    duration_hours DECIMAL(5,2),
    competency_achieved BOOLEAN NOT NULL DEFAULT FALSE,
    assessment_score DECIMAL(5,2),
    certification_number VARCHAR(100),
    expiry_date TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for Performance
CREATE INDEX idx_quality_inspections_company_id ON quality_inspections(company_id);
CREATE INDEX idx_quality_inspections_inspector_id ON quality_inspections(inspector_id);
CREATE INDEX idx_quality_inspections_date ON quality_inspections(inspection_date);
CREATE INDEX idx_quality_inspections_status ON quality_inspections(status);
CREATE INDEX idx_quality_inspections_result ON quality_inspections(result);
CREATE INDEX idx_quality_inspections_product_id ON quality_inspections(product_id);
CREATE INDEX idx_quality_inspections_supplier_id ON quality_inspections(supplier_id);

CREATE INDEX idx_quality_checkpoints_inspection_id ON quality_checkpoints(inspection_id);
CREATE INDEX idx_quality_checkpoints_result ON quality_checkpoints(result);

CREATE INDEX idx_non_conformances_company_id ON non_conformances(company_id);
CREATE INDEX idx_non_conformances_status ON non_conformances(status);
CREATE INDEX idx_non_conformances_severity ON non_conformances(severity);
CREATE INDEX idx_non_conformances_category ON non_conformances(category);
CREATE INDEX idx_non_conformances_detection_date ON non_conformances(detection_date);
CREATE INDEX idx_non_conformances_assigned_to ON non_conformances(assigned_to);
CREATE INDEX idx_non_conformances_product_id ON non_conformances(product_id);
CREATE INDEX idx_non_conformances_supplier_id ON non_conformances(supplier_id);

CREATE INDEX idx_corrective_actions_ncr_id ON corrective_actions(non_conformance_id);
CREATE INDEX idx_corrective_actions_assigned_to ON corrective_actions(assigned_to);
CREATE INDEX idx_corrective_actions_status ON corrective_actions(status);
CREATE INDEX idx_corrective_actions_due_date ON corrective_actions(due_date);

CREATE INDEX idx_quality_audits_company_id ON quality_audits(company_id);
CREATE INDEX idx_quality_audits_auditor_id ON quality_audits(auditor_id);
CREATE INDEX idx_quality_audits_status ON quality_audits(status);
CREATE INDEX idx_quality_audits_planned_date ON quality_audits(planned_date);

CREATE INDEX idx_audit_findings_audit_id ON audit_findings(audit_id);
CREATE INDEX idx_audit_findings_status ON audit_findings(status);
CREATE INDEX idx_audit_findings_category ON audit_findings(category);
CREATE INDEX idx_audit_findings_assigned_to ON audit_findings(assigned_to);

CREATE INDEX idx_quality_metrics_company_id ON quality_metrics(company_id);
CREATE INDEX idx_quality_metrics_type ON quality_metrics(metric_type);
CREATE INDEX idx_quality_metrics_date ON quality_metrics(measurement_date);
CREATE INDEX idx_quality_metrics_period ON quality_metrics(measurement_period);

CREATE INDEX idx_quality_standards_company_id ON quality_standards(company_id);
CREATE INDEX idx_quality_standards_status ON quality_standards(status);
CREATE INDEX idx_quality_standards_expiry_date ON quality_standards(expiry_date);

CREATE INDEX idx_quality_documents_company_id ON quality_documents(company_id);
CREATE INDEX idx_quality_documents_status ON quality_documents(status);
CREATE INDEX idx_quality_documents_type ON quality_documents(document_type);
CREATE INDEX idx_quality_documents_review_date ON quality_documents(next_review_date);

CREATE INDEX idx_quality_training_company_id ON quality_training_records(company_id);
CREATE INDEX idx_quality_training_employee_id ON quality_training_records(employee_id);
CREATE INDEX idx_quality_training_date ON quality_training_records(training_date);
CREATE INDEX idx_quality_training_expiry ON quality_training_records(expiry_date);

-- Row Level Security Policies
ALTER TABLE quality_inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE quality_checkpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE non_conformances ENABLE ROW LEVEL SECURITY;
ALTER TABLE corrective_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE quality_audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_findings ENABLE ROW LEVEL SECURITY;
ALTER TABLE quality_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE quality_standards ENABLE ROW LEVEL SECURITY;
ALTER TABLE quality_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE quality_training_records ENABLE ROW LEVEL SECURITY;

-- RLS Policies for quality_inspections
CREATE POLICY quality_inspections_tenant_isolation ON quality_inspections
    USING (company_id = current_setting('app.current_company_id')::UUID);

CREATE POLICY quality_inspections_insert ON quality_inspections
    FOR INSERT WITH CHECK (company_id = current_setting('app.current_company_id')::UUID);

-- RLS Policies for quality_checkpoints
CREATE POLICY quality_checkpoints_tenant_isolation ON quality_checkpoints
    USING (EXISTS (
        SELECT 1 FROM quality_inspections qi 
        WHERE qi.id = quality_checkpoints.inspection_id 
        AND qi.company_id = current_setting('app.current_company_id')::UUID
    ));

CREATE POLICY quality_checkpoints_insert ON quality_checkpoints
    FOR INSERT WITH CHECK (EXISTS (
        SELECT 1 FROM quality_inspections qi 
        WHERE qi.id = quality_checkpoints.inspection_id 
        AND qi.company_id = current_setting('app.current_company_id')::UUID
    ));

-- RLS Policies for non_conformances
CREATE POLICY non_conformances_tenant_isolation ON non_conformances
    USING (company_id = current_setting('app.current_company_id')::UUID);

CREATE POLICY non_conformances_insert ON non_conformances
    FOR INSERT WITH CHECK (company_id = current_setting('app.current_company_id')::UUID);

-- RLS Policies for corrective_actions
CREATE POLICY corrective_actions_tenant_isolation ON corrective_actions
    USING (EXISTS (
        SELECT 1 FROM non_conformances ncr 
        WHERE ncr.id = corrective_actions.non_conformance_id 
        AND ncr.company_id = current_setting('app.current_company_id')::UUID
    ));

CREATE POLICY corrective_actions_insert ON corrective_actions
    FOR INSERT WITH CHECK (EXISTS (
        SELECT 1 FROM non_conformances ncr 
        WHERE ncr.id = corrective_actions.non_conformance_id 
        AND ncr.company_id = current_setting('app.current_company_id')::UUID
    ));

-- RLS Policies for quality_audits
CREATE POLICY quality_audits_tenant_isolation ON quality_audits
    USING (company_id = current_setting('app.current_company_id')::UUID);

CREATE POLICY quality_audits_insert ON quality_audits
    FOR INSERT WITH CHECK (company_id = current_setting('app.current_company_id')::UUID);

-- RLS Policies for audit_findings
CREATE POLICY audit_findings_tenant_isolation ON audit_findings
    USING (EXISTS (
        SELECT 1 FROM quality_audits qa 
        WHERE qa.id = audit_findings.audit_id 
        AND qa.company_id = current_setting('app.current_company_id')::UUID
    ));

CREATE POLICY audit_findings_insert ON audit_findings
    FOR INSERT WITH CHECK (EXISTS (
        SELECT 1 FROM quality_audits qa 
        WHERE qa.id = audit_findings.audit_id 
        AND qa.company_id = current_setting('app.current_company_id')::UUID
    ));

-- RLS Policies for quality_metrics
CREATE POLICY quality_metrics_tenant_isolation ON quality_metrics
    USING (company_id = current_setting('app.current_company_id')::UUID);

CREATE POLICY quality_metrics_insert ON quality_metrics
    FOR INSERT WITH CHECK (company_id = current_setting('app.current_company_id')::UUID);

-- RLS Policies for quality_standards
CREATE POLICY quality_standards_tenant_isolation ON quality_standards
    USING (company_id = current_setting('app.current_company_id')::UUID);

CREATE POLICY quality_standards_insert ON quality_standards
    FOR INSERT WITH CHECK (company_id = current_setting('app.current_company_id')::UUID);

-- RLS Policies for quality_documents
CREATE POLICY quality_documents_tenant_isolation ON quality_documents
    USING (company_id = current_setting('app.current_company_id')::UUID);

CREATE POLICY quality_documents_insert ON quality_documents
    FOR INSERT WITH CHECK (company_id = current_setting('app.current_company_id')::UUID);

-- RLS Policies for quality_training_records
CREATE POLICY quality_training_records_tenant_isolation ON quality_training_records
    USING (company_id = current_setting('app.current_company_id')::UUID);

CREATE POLICY quality_training_records_insert ON quality_training_records
    FOR INSERT WITH CHECK (company_id = current_setting('app.current_company_id')::UUID);

-- SQL Functions for Quality Management

-- Function to calculate inspection statistics
CREATE OR REPLACE FUNCTION get_inspection_statistics(p_company_id UUID)
RETURNS TABLE (
    total_inspections BIGINT,
    passed_inspections BIGINT,
    failed_inspections BIGINT,
    pass_rate DECIMAL(5,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_inspections,
        COUNT(*) FILTER (WHERE result = 'pass') as passed_inspections,
        COUNT(*) FILTER (WHERE result = 'fail') as failed_inspections,
        CASE 
            WHEN COUNT(*) > 0 THEN 
                ROUND((COUNT(*) FILTER (WHERE result = 'pass')::DECIMAL / COUNT(*)) * 100, 2)
            ELSE 0
        END as pass_rate
    FROM quality_inspections
    WHERE company_id = p_company_id
    AND status = 'completed';
END;
$$ LANGUAGE plpgsql;

-- Function to calculate NCR statistics
CREATE OR REPLACE FUNCTION get_ncr_statistics(p_company_id UUID)
RETURNS TABLE (
    total_ncr BIGINT,
    open_ncr BIGINT,
    closed_ncr BIGINT,
    avg_resolution_time DECIMAL(10,2),
    total_cost DECIMAL(15,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_ncr,
        COUNT(*) FILTER (WHERE status IN ('open', 'investigating', 'corrective_action', 'verification')) as open_ncr,
        COUNT(*) FILTER (WHERE status = 'closed') as closed_ncr,
        COALESCE(AVG(
            CASE 
                WHEN status = 'closed' THEN 
                    EXTRACT(EPOCH FROM (updated_at - created_at)) / 86400
                ELSE NULL
            END
        ), 0) as avg_resolution_time,
        COALESCE(SUM(cost_impact), 0) as total_cost
    FROM non_conformances
    WHERE company_id = p_company_id;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate corrective action statistics
CREATE OR REPLACE FUNCTION get_corrective_action_statistics(p_company_id UUID)
RETURNS TABLE (
    total_actions BIGINT,
    overdue_actions BIGINT,
    completed_actions BIGINT,
    completion_rate DECIMAL(5,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_actions,
        COUNT(*) FILTER (WHERE due_date < NOW() AND status NOT IN ('completed', 'verified', 'cancelled')) as overdue_actions,
        COUNT(*) FILTER (WHERE status IN ('completed', 'verified')) as completed_actions,
        CASE 
            WHEN COUNT(*) > 0 THEN 
                ROUND((COUNT(*) FILTER (WHERE status IN ('completed', 'verified'))::DECIMAL / COUNT(*)) * 100, 2)
            ELSE 0
        END as completion_rate
    FROM corrective_actions ca
    JOIN non_conformances ncr ON ca.non_conformance_id = ncr.id
    WHERE ncr.company_id = p_company_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get monthly defect trend
CREATE OR REPLACE FUNCTION get_monthly_defect_trend(p_company_id UUID)
RETURNS TABLE (
    month TEXT,
    defect_rate DECIMAL(5,2),
    count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        TO_CHAR(inspection_date, 'YYYY-MM') as month,
        CASE 
            WHEN COUNT(*) > 0 THEN 
                ROUND(AVG(qi.defect_rate), 2)
            ELSE 0
        END as defect_rate,
        COUNT(*) as count
    FROM quality_inspections qi
    WHERE qi.company_id = p_company_id
    AND qi.status = 'completed'
    AND qi.inspection_date >= NOW() - INTERVAL '12 months'
    GROUP BY TO_CHAR(inspection_date, 'YYYY-MM')
    ORDER BY month;
END;
$$ LANGUAGE plpgsql;

-- Function to get top defect categories
CREATE OR REPLACE FUNCTION get_top_defect_categories(p_company_id UUID)
RETURNS TABLE (
    category VARCHAR(30),
    count BIGINT,
    percentage DECIMAL(5,2)
) AS $$
DECLARE
    total_count BIGINT;
BEGIN
    SELECT COUNT(*) INTO total_count
    FROM non_conformances
    WHERE company_id = p_company_id;
    
    RETURN QUERY
    SELECT 
        ncr.category,
        COUNT(*) as count,
        CASE 
            WHEN total_count > 0 THEN 
                ROUND((COUNT(*)::DECIMAL / total_count) * 100, 2)
            ELSE 0
        END as percentage
    FROM non_conformances ncr
    WHERE ncr.company_id = p_company_id
    GROUP BY ncr.category
    ORDER BY count DESC
    LIMIT 10;
END;
$$ LANGUAGE plpgsql;

-- Function to get supplier quality rating
CREATE OR REPLACE FUNCTION get_supplier_quality_rating(p_company_id UUID)
RETURNS TABLE (
    supplier_id UUID,
    supplier_name VARCHAR(200),
    rating DECIMAL(3,2),
    defect_rate DECIMAL(5,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.id as supplier_id,
        s.name as supplier_name,
        CASE 
            WHEN COUNT(qi.*) > 0 THEN 
                ROUND(5.0 - (AVG(qi.defect_rate) / 20.0), 2) -- Convert defect rate to 1-5 rating
            ELSE 5.0
        END as rating,
        COALESCE(ROUND(AVG(qi.defect_rate), 2), 0) as defect_rate
    FROM suppliers s
    LEFT JOIN quality_inspections qi ON s.id = qi.supplier_id 
        AND qi.status = 'completed'
        AND qi.inspection_date >= NOW() - INTERVAL '12 months'
    WHERE s.company_id = p_company_id
    GROUP BY s.id, s.name
    HAVING COUNT(qi.*) > 0
    ORDER BY rating DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to get inspection summary by type
CREATE OR REPLACE FUNCTION get_inspection_summary_by_type(p_company_id UUID)
RETURNS TABLE (
    type VARCHAR(20),
    total BIGINT,
    passed BIGINT,
    failed BIGINT,
    pass_rate DECIMAL(5,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        qi.inspection_type as type,
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE result = 'pass') as passed,
        COUNT(*) FILTER (WHERE result = 'fail') as failed,
        CASE 
            WHEN COUNT(*) > 0 THEN 
                ROUND((COUNT(*) FILTER (WHERE result = 'pass')::DECIMAL / COUNT(*)) * 100, 2)
            ELSE 0
        END as pass_rate
    FROM quality_inspections qi
    WHERE qi.company_id = p_company_id
    AND qi.status = 'completed'
    GROUP BY qi.inspection_type
    ORDER BY total DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to check quality document review dates
CREATE OR REPLACE FUNCTION check_document_review_dates()
RETURNS TRIGGER AS $$
BEGIN
    -- Set next review date if not provided
    IF NEW.next_review_date IS NULL AND NEW.effective_date IS NOT NULL THEN
        NEW.next_review_date := NEW.effective_date + INTERVAL '1 year';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update audit findings count
CREATE OR REPLACE FUNCTION update_audit_findings_count()
RETURNS TRIGGER AS $$
DECLARE
    audit_record RECORD;
BEGIN
    -- Get the audit ID from either NEW or OLD record
    IF TG_OP = 'DELETE' THEN
        SELECT audit_id INTO audit_record FROM (SELECT OLD.audit_id) AS t(audit_id);
    ELSE
        SELECT audit_id INTO audit_record FROM (SELECT NEW.audit_id) AS t(audit_id);
    END IF;
    
    -- Update the audit findings count
    UPDATE quality_audits
    SET 
        findings_count = (
            SELECT COUNT(*) 
            FROM audit_findings 
            WHERE audit_id = audit_record.audit_id
        ),
        major_findings = (
            SELECT COUNT(*) 
            FROM audit_findings 
            WHERE audit_id = audit_record.audit_id AND category = 'major'
        ),
        minor_findings = (
            SELECT COUNT(*) 
            FROM audit_findings 
            WHERE audit_id = audit_record.audit_id AND category = 'minor'
        ),
        observations = (
            SELECT COUNT(*) 
            FROM audit_findings 
            WHERE audit_id = audit_record.audit_id AND category = 'observation'
        ),
        updated_at = NOW()
    WHERE id = audit_record.audit_id;
    
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to update inspection defect statistics
CREATE OR REPLACE FUNCTION update_inspection_defect_stats()
RETURNS TRIGGER AS $$
DECLARE
    inspection_record RECORD;
    total_checkpoints INTEGER;
    failed_checkpoints INTEGER;
BEGIN
    -- Get the inspection ID from either NEW or OLD record
    IF TG_OP = 'DELETE' THEN
        SELECT inspection_id INTO inspection_record FROM (SELECT OLD.inspection_id) AS t(inspection_id);
    ELSE
        SELECT inspection_id INTO inspection_record FROM (SELECT NEW.inspection_id) AS t(inspection_id);
    END IF;
    
    -- Calculate defect statistics
    SELECT 
        COUNT(*),
        COUNT(*) FILTER (WHERE result = 'fail')
    INTO total_checkpoints, failed_checkpoints
    FROM quality_checkpoints
    WHERE inspection_id = inspection_record.inspection_id;
    
    -- Update the inspection defect statistics
    UPDATE quality_inspections
    SET 
        defect_count = failed_checkpoints,
        defect_rate = CASE 
            WHEN total_checkpoints > 0 THEN 
                ROUND((failed_checkpoints::DECIMAL / total_checkpoints) * 100, 2)
            ELSE 0
        END,
        updated_at = NOW()
    WHERE id = inspection_record.inspection_id;
    
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Triggers
CREATE TRIGGER trigger_check_document_review_dates
    BEFORE INSERT OR UPDATE ON quality_documents
    FOR EACH ROW
    EXECUTE FUNCTION check_document_review_dates();

CREATE TRIGGER trigger_update_audit_findings_count
    AFTER INSERT OR UPDATE OR DELETE ON audit_findings
    FOR EACH ROW
    EXECUTE FUNCTION update_audit_findings_count();

CREATE TRIGGER trigger_update_inspection_defect_stats
    AFTER INSERT OR UPDATE OR DELETE ON quality_checkpoints
    FOR EACH ROW
    EXECUTE FUNCTION update_inspection_defect_stats();

-- Insert default quality standards
INSERT INTO quality_standards (company_id, standard_name, standard_code, description, status) VALUES
(uuid_nil(), 'ISO 9001:2015', 'ISO9001', 'Quality Management Systems - Requirements', 'active'),
(uuid_nil(), 'AS9100D', 'AS9100', 'Quality Management Systems - Requirements for Aviation, Space and Defense Organizations', 'active'),
(uuid_nil(), 'ISO 14001:2015', 'ISO14001', 'Environmental Management Systems - Requirements', 'active'),
(uuid_nil(), 'ISO 45001:2018', 'ISO45001', 'Occupational Health and Safety Management Systems - Requirements', 'active'),
(uuid_nil(), 'IATF 16949:2016', 'IATF16949', 'Quality Management System Requirements for Automotive Production', 'active');

-- Comments for documentation
COMMENT ON TABLE quality_inspections IS 'Quality inspections for products, processes, and suppliers';
COMMENT ON TABLE quality_checkpoints IS 'Individual checkpoints within quality inspections';
COMMENT ON TABLE non_conformances IS 'Non-conformance reports and issues tracking';
COMMENT ON TABLE corrective_actions IS 'Corrective and preventive actions for non-conformances';
COMMENT ON TABLE quality_audits IS 'Quality audits (internal, external, supplier, customer)';
COMMENT ON TABLE audit_findings IS 'Findings from quality audits';
COMMENT ON TABLE quality_metrics IS 'Quality performance metrics and KPIs';
COMMENT ON TABLE quality_standards IS 'Quality standards and certifications';
COMMENT ON TABLE quality_documents IS 'Quality management system documents';
COMMENT ON TABLE quality_training_records IS 'Quality training records for employees';