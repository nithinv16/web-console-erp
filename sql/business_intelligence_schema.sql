-- Business Intelligence Schema
-- This schema handles dashboards, reports, KPIs, data sources, and analytics

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Dashboards Table
CREATE TABLE dashboards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    category VARCHAR(20) NOT NULL CHECK (category IN ('executive', 'financial', 'sales', 'operations', 'hr', 'quality', 'custom')),
    layout JSONB NOT NULL DEFAULT '{}',
    is_public BOOLEAN NOT NULL DEFAULT FALSE,
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    created_by UUID NOT NULL REFERENCES employees(id) ON DELETE RESTRICT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT unique_dashboard_name_per_company UNIQUE (company_id, name)
);

-- Reports Table
CREATE TABLE reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    category VARCHAR(20) NOT NULL CHECK (category IN ('financial', 'sales', 'inventory', 'hr', 'operations', 'quality', 'custom')),
    report_type VARCHAR(20) NOT NULL CHECK (report_type IN ('tabular', 'summary', 'chart', 'pivot', 'crosstab')),
    data_source VARCHAR(100) NOT NULL,
    query JSONB NOT NULL DEFAULT '{}',
    parameters JSONB NOT NULL DEFAULT '[]',
    schedule JSONB,
    format VARCHAR(10) NOT NULL DEFAULT 'pdf' CHECK (format IN ('pdf', 'excel', 'csv', 'html')),
    is_public BOOLEAN NOT NULL DEFAULT FALSE,
    created_by UUID NOT NULL REFERENCES employees(id) ON DELETE RESTRICT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT unique_report_name_per_company UNIQUE (company_id, name)
);

-- KPIs Table
CREATE TABLE kpis (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    category VARCHAR(20) NOT NULL CHECK (category IN ('financial', 'sales', 'operations', 'hr', 'quality', 'customer')),
    metric_type VARCHAR(20) NOT NULL CHECK (metric_type IN ('currency', 'percentage', 'number', 'ratio')),
    calculation_method VARCHAR(20) NOT NULL CHECK (calculation_method IN ('sum', 'average', 'count', 'ratio', 'custom')),
    data_source VARCHAR(100) NOT NULL,
    query TEXT NOT NULL,
    target_value DECIMAL(15,6),
    target_type VARCHAR(20) NOT NULL DEFAULT 'fixed' CHECK (target_type IN ('fixed', 'percentage_increase', 'percentage_decrease')),
    frequency VARCHAR(20) NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly', 'quarterly', 'yearly')),
    unit_of_measure VARCHAR(50),
    format VARCHAR(50),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_by UUID NOT NULL REFERENCES employees(id) ON DELETE RESTRICT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT unique_kpi_name_per_company UNIQUE (company_id, name)
);

-- KPI Values Table
CREATE TABLE kpi_values (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    kpi_id UUID NOT NULL REFERENCES kpis(id) ON DELETE CASCADE,
    period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    actual_value DECIMAL(15,6) NOT NULL,
    target_value DECIMAL(15,6),
    variance DECIMAL(15,6) NOT NULL DEFAULT 0,
    variance_percentage DECIMAL(8,4) NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL CHECK (status IN ('above_target', 'on_target', 'below_target')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT unique_kpi_period UNIQUE (kpi_id, period_start, period_end)
);

-- Data Sources Table
CREATE TABLE data_sources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    type VARCHAR(20) NOT NULL CHECK (type IN ('table', 'view', 'query', 'api', 'file')),
    connection_string TEXT,
    query TEXT,
    refresh_frequency INTEGER, -- in minutes
    last_refresh TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT unique_data_source_name_per_company UNIQUE (company_id, name)
);

-- Report Executions Table
CREATE TABLE report_executions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_id UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
    executed_by UUID REFERENCES employees(id) ON DELETE SET NULL,
    execution_type VARCHAR(20) NOT NULL CHECK (execution_type IN ('manual', 'scheduled', 'api')),
    parameters JSONB,
    status VARCHAR(20) NOT NULL CHECK (status IN ('running', 'completed', 'failed', 'cancelled')),
    start_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    end_time TIMESTAMP WITH TIME ZONE,
    execution_time_ms INTEGER,
    record_count INTEGER,
    file_path VARCHAR(500),
    file_size INTEGER,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Dashboard Shares Table
CREATE TABLE dashboard_shares (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dashboard_id UUID NOT NULL REFERENCES dashboards(id) ON DELETE CASCADE,
    shared_with_user_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    shared_with_role VARCHAR(100),
    permission VARCHAR(20) NOT NULL CHECK (permission IN ('view', 'edit', 'admin')),
    shared_by UUID NOT NULL REFERENCES employees(id) ON DELETE RESTRICT,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT unique_dashboard_user_share UNIQUE (dashboard_id, shared_with_user_id),
    CONSTRAINT check_share_target CHECK (
        (shared_with_user_id IS NOT NULL AND shared_with_role IS NULL) OR
        (shared_with_user_id IS NULL AND shared_with_role IS NOT NULL)
    )
);

-- Report Shares Table
CREATE TABLE report_shares (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_id UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
    shared_with_user_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    shared_with_role VARCHAR(100),
    permission VARCHAR(20) NOT NULL CHECK (permission IN ('view', 'execute', 'edit', 'admin')),
    shared_by UUID NOT NULL REFERENCES employees(id) ON DELETE RESTRICT,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT unique_report_user_share UNIQUE (report_id, shared_with_user_id),
    CONSTRAINT check_report_share_target CHECK (
        (shared_with_user_id IS NOT NULL AND shared_with_role IS NULL) OR
        (shared_with_user_id IS NULL AND shared_with_role IS NOT NULL)
    )
);

-- Analytics Queries Table (for caching and optimization)
CREATE TABLE analytics_queries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    query_hash VARCHAR(64) NOT NULL, -- MD5 hash of the query
    query_definition JSONB NOT NULL,
    result_data JSONB,
    execution_time_ms INTEGER,
    record_count INTEGER,
    cache_expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT unique_query_hash_per_company UNIQUE (company_id, query_hash)
);

-- BI Alerts Table
CREATE TABLE bi_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    alert_type VARCHAR(20) NOT NULL CHECK (alert_type IN ('kpi_threshold', 'data_anomaly', 'report_failure', 'custom')),
    kpi_id UUID REFERENCES kpis(id) ON DELETE CASCADE,
    condition_type VARCHAR(20) NOT NULL CHECK (condition_type IN ('greater_than', 'less_than', 'equals', 'not_equals', 'percentage_change')),
    threshold_value DECIMAL(15,6),
    notification_channels JSONB NOT NULL DEFAULT '[]', -- email, slack, webhook, etc.
    recipients JSONB NOT NULL DEFAULT '[]',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    last_triggered TIMESTAMP WITH TIME ZONE,
    trigger_count INTEGER NOT NULL DEFAULT 0,
    created_by UUID NOT NULL REFERENCES employees(id) ON DELETE RESTRICT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- BI Alert Logs Table
CREATE TABLE bi_alert_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    alert_id UUID NOT NULL REFERENCES bi_alerts(id) ON DELETE CASCADE,
    triggered_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    trigger_value DECIMAL(15,6),
    threshold_value DECIMAL(15,6),
    message TEXT,
    notification_status JSONB, -- status for each notification channel
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Dashboard Usage Analytics Table
CREATE TABLE dashboard_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dashboard_id UUID NOT NULL REFERENCES dashboards(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    session_id VARCHAR(100),
    action VARCHAR(50) NOT NULL, -- view, edit, export, share, etc.
    widget_id VARCHAR(100), -- specific widget interacted with
    duration_seconds INTEGER,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Report Usage Analytics Table
CREATE TABLE report_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_id UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    session_id VARCHAR(100),
    action VARCHAR(50) NOT NULL, -- view, execute, export, share, etc.
    parameters JSONB,
    execution_time_ms INTEGER,
    record_count INTEGER,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for Performance
CREATE INDEX idx_dashboards_company_id ON dashboards(company_id);
CREATE INDEX idx_dashboards_category ON dashboards(category);
CREATE INDEX idx_dashboards_created_by ON dashboards(created_by);
CREATE INDEX idx_dashboards_is_public ON dashboards(is_public);
CREATE INDEX idx_dashboards_is_default ON dashboards(is_default);

CREATE INDEX idx_reports_company_id ON reports(company_id);
CREATE INDEX idx_reports_category ON reports(category);
CREATE INDEX idx_reports_created_by ON reports(created_by);
CREATE INDEX idx_reports_is_public ON reports(is_public);
CREATE INDEX idx_reports_data_source ON reports(data_source);

CREATE INDEX idx_kpis_company_id ON kpis(company_id);
CREATE INDEX idx_kpis_category ON kpis(category);
CREATE INDEX idx_kpis_is_active ON kpis(is_active);
CREATE INDEX idx_kpis_frequency ON kpis(frequency);
CREATE INDEX idx_kpis_created_by ON kpis(created_by);

CREATE INDEX idx_kpi_values_kpi_id ON kpi_values(kpi_id);
CREATE INDEX idx_kpi_values_period ON kpi_values(period_start, period_end);
CREATE INDEX idx_kpi_values_status ON kpi_values(status);
CREATE INDEX idx_kpi_values_created_at ON kpi_values(created_at);

CREATE INDEX idx_data_sources_company_id ON data_sources(company_id);
CREATE INDEX idx_data_sources_type ON data_sources(type);
CREATE INDEX idx_data_sources_is_active ON data_sources(is_active);
CREATE INDEX idx_data_sources_last_refresh ON data_sources(last_refresh);

CREATE INDEX idx_report_executions_report_id ON report_executions(report_id);
CREATE INDEX idx_report_executions_executed_by ON report_executions(executed_by);
CREATE INDEX idx_report_executions_status ON report_executions(status);
CREATE INDEX idx_report_executions_start_time ON report_executions(start_time);
CREATE INDEX idx_report_executions_execution_type ON report_executions(execution_type);

CREATE INDEX idx_dashboard_shares_dashboard_id ON dashboard_shares(dashboard_id);
CREATE INDEX idx_dashboard_shares_user_id ON dashboard_shares(shared_with_user_id);
CREATE INDEX idx_dashboard_shares_role ON dashboard_shares(shared_with_role);
CREATE INDEX idx_dashboard_shares_expires_at ON dashboard_shares(expires_at);

CREATE INDEX idx_report_shares_report_id ON report_shares(report_id);
CREATE INDEX idx_report_shares_user_id ON report_shares(shared_with_user_id);
CREATE INDEX idx_report_shares_role ON report_shares(shared_with_role);
CREATE INDEX idx_report_shares_expires_at ON report_shares(expires_at);

CREATE INDEX idx_analytics_queries_company_id ON analytics_queries(company_id);
CREATE INDEX idx_analytics_queries_hash ON analytics_queries(query_hash);
CREATE INDEX idx_analytics_queries_expires_at ON analytics_queries(cache_expires_at);

CREATE INDEX idx_bi_alerts_company_id ON bi_alerts(company_id);
CREATE INDEX idx_bi_alerts_kpi_id ON bi_alerts(kpi_id);
CREATE INDEX idx_bi_alerts_is_active ON bi_alerts(is_active);
CREATE INDEX idx_bi_alerts_alert_type ON bi_alerts(alert_type);

CREATE INDEX idx_bi_alert_logs_alert_id ON bi_alert_logs(alert_id);
CREATE INDEX idx_bi_alert_logs_triggered_at ON bi_alert_logs(triggered_at);

CREATE INDEX idx_dashboard_usage_dashboard_id ON dashboard_usage(dashboard_id);
CREATE INDEX idx_dashboard_usage_user_id ON dashboard_usage(user_id);
CREATE INDEX idx_dashboard_usage_created_at ON dashboard_usage(created_at);
CREATE INDEX idx_dashboard_usage_action ON dashboard_usage(action);

CREATE INDEX idx_report_usage_report_id ON report_usage(report_id);
CREATE INDEX idx_report_usage_user_id ON report_usage(user_id);
CREATE INDEX idx_report_usage_created_at ON report_usage(created_at);
CREATE INDEX idx_report_usage_action ON report_usage(action);

-- Row Level Security Policies
ALTER TABLE dashboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE kpis ENABLE ROW LEVEL SECURITY;
ALTER TABLE kpi_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboard_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_queries ENABLE ROW LEVEL SECURITY;
ALTER TABLE bi_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE bi_alert_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboard_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_usage ENABLE ROW LEVEL SECURITY;

-- RLS Policies for dashboards
CREATE POLICY dashboards_tenant_isolation ON dashboards
    USING (company_id = current_setting('app.current_company_id')::UUID);

CREATE POLICY dashboards_insert ON dashboards
    FOR INSERT WITH CHECK (company_id = current_setting('app.current_company_id')::UUID);

-- RLS Policies for reports
CREATE POLICY reports_tenant_isolation ON reports
    USING (company_id = current_setting('app.current_company_id')::UUID);

CREATE POLICY reports_insert ON reports
    FOR INSERT WITH CHECK (company_id = current_setting('app.current_company_id')::UUID);

-- RLS Policies for kpis
CREATE POLICY kpis_tenant_isolation ON kpis
    USING (company_id = current_setting('app.current_company_id')::UUID);

CREATE POLICY kpis_insert ON kpis
    FOR INSERT WITH CHECK (company_id = current_setting('app.current_company_id')::UUID);

-- RLS Policies for kpi_values
CREATE POLICY kpi_values_tenant_isolation ON kpi_values
    USING (EXISTS (
        SELECT 1 FROM kpis k 
        WHERE k.id = kpi_values.kpi_id 
        AND k.company_id = current_setting('app.current_company_id')::UUID
    ));

CREATE POLICY kpi_values_insert ON kpi_values
    FOR INSERT WITH CHECK (EXISTS (
        SELECT 1 FROM kpis k 
        WHERE k.id = kpi_values.kpi_id 
        AND k.company_id = current_setting('app.current_company_id')::UUID
    ));

-- RLS Policies for data_sources
CREATE POLICY data_sources_tenant_isolation ON data_sources
    USING (company_id = current_setting('app.current_company_id')::UUID);

CREATE POLICY data_sources_insert ON data_sources
    FOR INSERT WITH CHECK (company_id = current_setting('app.current_company_id')::UUID);

-- RLS Policies for report_executions
CREATE POLICY report_executions_tenant_isolation ON report_executions
    USING (EXISTS (
        SELECT 1 FROM reports r 
        WHERE r.id = report_executions.report_id 
        AND r.company_id = current_setting('app.current_company_id')::UUID
    ));

CREATE POLICY report_executions_insert ON report_executions
    FOR INSERT WITH CHECK (EXISTS (
        SELECT 1 FROM reports r 
        WHERE r.id = report_executions.report_id 
        AND r.company_id = current_setting('app.current_company_id')::UUID
    ));

-- RLS Policies for dashboard_shares
CREATE POLICY dashboard_shares_tenant_isolation ON dashboard_shares
    USING (EXISTS (
        SELECT 1 FROM dashboards d 
        WHERE d.id = dashboard_shares.dashboard_id 
        AND d.company_id = current_setting('app.current_company_id')::UUID
    ));

CREATE POLICY dashboard_shares_insert ON dashboard_shares
    FOR INSERT WITH CHECK (EXISTS (
        SELECT 1 FROM dashboards d 
        WHERE d.id = dashboard_shares.dashboard_id 
        AND d.company_id = current_setting('app.current_company_id')::UUID
    ));

-- RLS Policies for report_shares
CREATE POLICY report_shares_tenant_isolation ON report_shares
    USING (EXISTS (
        SELECT 1 FROM reports r 
        WHERE r.id = report_shares.report_id 
        AND r.company_id = current_setting('app.current_company_id')::UUID
    ));

CREATE POLICY report_shares_insert ON report_shares
    FOR INSERT WITH CHECK (EXISTS (
        SELECT 1 FROM reports r 
        WHERE r.id = report_shares.report_id 
        AND r.company_id = current_setting('app.current_company_id')::UUID
    ));

-- RLS Policies for analytics_queries
CREATE POLICY analytics_queries_tenant_isolation ON analytics_queries
    USING (company_id = current_setting('app.current_company_id')::UUID);

CREATE POLICY analytics_queries_insert ON analytics_queries
    FOR INSERT WITH CHECK (company_id = current_setting('app.current_company_id')::UUID);

-- RLS Policies for bi_alerts
CREATE POLICY bi_alerts_tenant_isolation ON bi_alerts
    USING (company_id = current_setting('app.current_company_id')::UUID);

CREATE POLICY bi_alerts_insert ON bi_alerts
    FOR INSERT WITH CHECK (company_id = current_setting('app.current_company_id')::UUID);

-- RLS Policies for bi_alert_logs
CREATE POLICY bi_alert_logs_tenant_isolation ON bi_alert_logs
    USING (EXISTS (
        SELECT 1 FROM bi_alerts ba 
        WHERE ba.id = bi_alert_logs.alert_id 
        AND ba.company_id = current_setting('app.current_company_id')::UUID
    ));

CREATE POLICY bi_alert_logs_insert ON bi_alert_logs
    FOR INSERT WITH CHECK (EXISTS (
        SELECT 1 FROM bi_alerts ba 
        WHERE ba.id = bi_alert_logs.alert_id 
        AND ba.company_id = current_setting('app.current_company_id')::UUID
    ));

-- RLS Policies for dashboard_usage
CREATE POLICY dashboard_usage_tenant_isolation ON dashboard_usage
    USING (EXISTS (
        SELECT 1 FROM dashboards d 
        WHERE d.id = dashboard_usage.dashboard_id 
        AND d.company_id = current_setting('app.current_company_id')::UUID
    ));

CREATE POLICY dashboard_usage_insert ON dashboard_usage
    FOR INSERT WITH CHECK (EXISTS (
        SELECT 1 FROM dashboards d 
        WHERE d.id = dashboard_usage.dashboard_id 
        AND d.company_id = current_setting('app.current_company_id')::UUID
    ));

-- RLS Policies for report_usage
CREATE POLICY report_usage_tenant_isolation ON report_usage
    USING (EXISTS (
        SELECT 1 FROM reports r 
        WHERE r.id = report_usage.report_id 
        AND r.company_id = current_setting('app.current_company_id')::UUID
    ));

CREATE POLICY report_usage_insert ON report_usage
    FOR INSERT WITH CHECK (EXISTS (
        SELECT 1 FROM reports r 
        WHERE r.id = report_usage.report_id 
        AND r.company_id = current_setting('app.current_company_id')::UUID
    ));

-- SQL Functions for Business Intelligence

-- Function to execute analytics queries (placeholder)
CREATE OR REPLACE FUNCTION execute_analytics_query(
    p_data_source TEXT,
    p_dimensions TEXT[],
    p_metrics TEXT[],
    p_filters JSONB DEFAULT '{}',
    p_date_range JSONB DEFAULT NULL,
    p_group_by TEXT[] DEFAULT '{}',
    p_order_by JSONB DEFAULT '[]',
    p_limit INTEGER DEFAULT 1000
)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
BEGIN
    -- This is a placeholder function
    -- In a real implementation, this would dynamically build and execute SQL queries
    -- based on the provided parameters
    
    result := '[]'::JSONB;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to execute custom queries (placeholder)
CREATE OR REPLACE FUNCTION execute_custom_query(
    p_query TEXT,
    p_parameters JSONB DEFAULT '{}'
)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
BEGIN
    -- This is a placeholder function
    -- In a real implementation, this would safely execute custom SQL queries
    -- with parameter substitution and security checks
    
    result := '[]'::JSONB;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to get sales metrics summary
CREATE OR REPLACE FUNCTION get_sales_metrics_summary(p_company_id UUID)
RETURNS TABLE (
    total_revenue DECIMAL(15,2),
    monthly_growth DECIMAL(5,2),
    active_opportunities BIGINT,
    conversion_rate DECIMAL(5,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(SUM(o.amount), 0) as total_revenue,
        0.0 as monthly_growth, -- Placeholder
        COUNT(DISTINCT op.id) as active_opportunities,
        0.0 as conversion_rate -- Placeholder
    FROM orders o
    LEFT JOIN opportunities op ON op.company_id = p_company_id AND op.stage != 'closed_lost'
    WHERE o.company_id = p_company_id
    AND o.order_date >= DATE_TRUNC('month', CURRENT_DATE);
END;
$$ LANGUAGE plpgsql;

-- Function to get financial metrics summary
CREATE OR REPLACE FUNCTION get_financial_metrics_summary(p_company_id UUID)
RETURNS TABLE (
    total_assets DECIMAL(15,2),
    total_liabilities DECIMAL(15,2),
    net_profit DECIMAL(15,2),
    cash_flow DECIMAL(15,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(SUM(CASE WHEN a.asset_type = 'asset' THEN a.current_value ELSE 0 END), 0) as total_assets,
        COALESCE(SUM(CASE WHEN a.asset_type = 'liability' THEN a.current_value ELSE 0 END), 0) as total_liabilities,
        0.0 as net_profit, -- Placeholder
        0.0 as cash_flow -- Placeholder
    FROM assets a
    WHERE a.company_id = p_company_id
    AND a.status = 'active';
END;
$$ LANGUAGE plpgsql;

-- Function to get operations metrics summary
CREATE OR REPLACE FUNCTION get_operations_metrics_summary(p_company_id UUID)
RETURNS TABLE (
    production_efficiency DECIMAL(5,2),
    quality_score DECIMAL(5,2),
    on_time_delivery DECIMAL(5,2),
    inventory_turnover DECIMAL(5,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(AVG(wo.efficiency_rate), 0) as production_efficiency,
        COALESCE(AVG(
            CASE 
                WHEN qi.result = 'pass' THEN 100.0
                WHEN qi.result = 'fail' THEN 0.0
                ELSE 50.0
            END
        ), 0) as quality_score,
        0.0 as on_time_delivery, -- Placeholder
        0.0 as inventory_turnover -- Placeholder
    FROM work_orders wo
    LEFT JOIN quality_inspections qi ON qi.company_id = p_company_id 
        AND qi.status = 'completed'
        AND qi.inspection_date >= DATE_TRUNC('month', CURRENT_DATE)
    WHERE wo.company_id = p_company_id
    AND wo.status = 'completed'
    AND wo.actual_end_date >= DATE_TRUNC('month', CURRENT_DATE);
END;
$$ LANGUAGE plpgsql;

-- Function to get HR metrics summary
CREATE OR REPLACE FUNCTION get_hr_metrics_summary(p_company_id UUID)
RETURNS TABLE (
    total_employees BIGINT,
    employee_satisfaction DECIMAL(5,2),
    turnover_rate DECIMAL(5,2),
    training_completion DECIMAL(5,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(DISTINCT e.id) as total_employees,
        0.0 as employee_satisfaction, -- Placeholder
        0.0 as turnover_rate, -- Placeholder
        COALESCE(AVG(
            CASE 
                WHEN et.completion_date IS NOT NULL THEN 100.0
                ELSE 0.0
            END
        ), 0) as training_completion
    FROM employees e
    LEFT JOIN employee_training et ON e.id = et.employee_id
        AND et.created_at >= DATE_TRUNC('year', CURRENT_DATE)
    WHERE e.company_id = p_company_id
    AND e.status = 'active';
END;
$$ LANGUAGE plpgsql;

-- Function to calculate KPI variance
CREATE OR REPLACE FUNCTION calculate_kpi_variance()
RETURNS TRIGGER AS $$
BEGIN
    -- Calculate variance and variance percentage
    NEW.variance := NEW.actual_value - COALESCE(NEW.target_value, 0);
    
    IF COALESCE(NEW.target_value, 0) != 0 THEN
        NEW.variance_percentage := (NEW.variance / NEW.target_value) * 100;
    ELSE
        NEW.variance_percentage := 0;
    END IF;
    
    -- Determine status
    IF ABS(NEW.variance_percentage) <= 5 THEN
        NEW.status := 'on_target';
    ELSIF NEW.variance > 0 THEN
        NEW.status := 'above_target';
    ELSE
        NEW.status := 'below_target';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to clean expired analytics cache
CREATE OR REPLACE FUNCTION clean_expired_analytics_cache()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM analytics_queries
    WHERE cache_expires_at < NOW();
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to clean expired shares
CREATE OR REPLACE FUNCTION clean_expired_shares()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM dashboard_shares
    WHERE expires_at < NOW();
    
    DELETE FROM report_shares
    WHERE expires_at < NOW();
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to update dashboard usage statistics
CREATE OR REPLACE FUNCTION update_dashboard_usage_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- Update dashboard last accessed time
    UPDATE dashboards
    SET updated_at = NOW()
    WHERE id = NEW.dashboard_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update report usage statistics
CREATE OR REPLACE FUNCTION update_report_usage_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- Update report last accessed time
    UPDATE reports
    SET updated_at = NOW()
    WHERE id = NEW.report_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to check BI alerts
CREATE OR REPLACE FUNCTION check_bi_alerts()
RETURNS INTEGER AS $$
DECLARE
    alert_record RECORD;
    kpi_record RECORD;
    latest_value RECORD;
    triggered_count INTEGER := 0;
BEGIN
    -- Check all active KPI threshold alerts
    FOR alert_record IN 
        SELECT * FROM bi_alerts 
        WHERE is_active = TRUE 
        AND alert_type = 'kpi_threshold'
        AND kpi_id IS NOT NULL
    LOOP
        -- Get the latest KPI value
        SELECT * INTO latest_value
        FROM kpi_values
        WHERE kpi_id = alert_record.kpi_id
        ORDER BY period_end DESC
        LIMIT 1;
        
        IF latest_value IS NOT NULL THEN
            -- Check if alert condition is met
            CASE alert_record.condition_type
                WHEN 'greater_than' THEN
                    IF latest_value.actual_value > alert_record.threshold_value THEN
                        -- Trigger alert
                        INSERT INTO bi_alert_logs (alert_id, trigger_value, threshold_value, message)
                        VALUES (
                            alert_record.id,
                            latest_value.actual_value,
                            alert_record.threshold_value,
                            format('KPI value %s exceeds threshold %s', latest_value.actual_value, alert_record.threshold_value)
                        );
                        
                        UPDATE bi_alerts
                        SET last_triggered = NOW(), trigger_count = trigger_count + 1
                        WHERE id = alert_record.id;
                        
                        triggered_count := triggered_count + 1;
                    END IF;
                    
                WHEN 'less_than' THEN
                    IF latest_value.actual_value < alert_record.threshold_value THEN
                        -- Trigger alert
                        INSERT INTO bi_alert_logs (alert_id, trigger_value, threshold_value, message)
                        VALUES (
                            alert_record.id,
                            latest_value.actual_value,
                            alert_record.threshold_value,
                            format('KPI value %s is below threshold %s', latest_value.actual_value, alert_record.threshold_value)
                        );
                        
                        UPDATE bi_alerts
                        SET last_triggered = NOW(), trigger_count = trigger_count + 1
                        WHERE id = alert_record.id;
                        
                        triggered_count := triggered_count + 1;
                    END IF;
            END CASE;
        END IF;
    END LOOP;
    
    RETURN triggered_count;
END;
$$ LANGUAGE plpgsql;

-- Triggers
CREATE TRIGGER trigger_calculate_kpi_variance
    BEFORE INSERT OR UPDATE ON kpi_values
    FOR EACH ROW
    EXECUTE FUNCTION calculate_kpi_variance();

CREATE TRIGGER trigger_update_dashboard_usage_stats
    AFTER INSERT ON dashboard_usage
    FOR EACH ROW
    EXECUTE FUNCTION update_dashboard_usage_stats();

CREATE TRIGGER trigger_update_report_usage_stats
    AFTER INSERT ON report_usage
    FOR EACH ROW
    EXECUTE FUNCTION update_report_usage_stats();

-- Insert default dashboards and data sources
INSERT INTO data_sources (company_id, name, description, type, is_active) VALUES
(uuid_nil(), 'Sales Data', 'Sales orders, opportunities, and customer data', 'table', true),
(uuid_nil(), 'Financial Data', 'Financial transactions, assets, and accounting data', 'table', true),
(uuid_nil(), 'Operations Data', 'Manufacturing, inventory, and supply chain data', 'table', true),
(uuid_nil(), 'HR Data', 'Employee, payroll, and training data', 'table', true),
(uuid_nil(), 'Quality Data', 'Quality inspections, non-conformances, and audits', 'table', true);

-- Comments for documentation
COMMENT ON TABLE dashboards IS 'Business intelligence dashboards with widgets and layouts';
COMMENT ON TABLE reports IS 'Configurable reports with parameters and scheduling';
COMMENT ON TABLE kpis IS 'Key Performance Indicators definitions';
COMMENT ON TABLE kpi_values IS 'Historical KPI values and measurements';
COMMENT ON TABLE data_sources IS 'Data sources for analytics and reporting';
COMMENT ON TABLE report_executions IS 'Report execution history and logs';
COMMENT ON TABLE dashboard_shares IS 'Dashboard sharing permissions';
COMMENT ON TABLE report_shares IS 'Report sharing permissions';
COMMENT ON TABLE analytics_queries IS 'Cached analytics query results';
COMMENT ON TABLE bi_alerts IS 'Business intelligence alerts and notifications';
COMMENT ON TABLE bi_alert_logs IS 'BI alert trigger history';
COMMENT ON TABLE dashboard_usage IS 'Dashboard usage analytics';
COMMENT ON TABLE report_usage IS 'Report usage analytics';