-- Main ERP System Schema
-- This schema contains core system tables that support the entire ERP system

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- ERP Audit Logs Table
CREATE TABLE IF NOT EXISTS erp_audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id),
    user_name VARCHAR(255) NOT NULL,
    action VARCHAR(100) NOT NULL,
    module VARCHAR(50) NOT NULL,
    resource_type VARCHAR(100) NOT NULL,
    resource_id VARCHAR(255) NOT NULL,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    company_id UUID REFERENCES companies(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ERP System Settings Table
CREATE TABLE IF NOT EXISTS erp_system_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) UNIQUE,
    settings JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ERP Module Status Table
CREATE TABLE IF NOT EXISTS erp_module_status (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id),
    module_name VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance')),
    version VARCHAR(20) NOT NULL DEFAULT '1.0.0',
    enabled BOOLEAN NOT NULL DEFAULT true,
    configuration JSONB DEFAULT '{}',
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(company_id, module_name)
);

-- ERP User Sessions Table
CREATE TABLE IF NOT EXISTS erp_user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id),
    employee_id UUID REFERENCES employees(id),
    session_token VARCHAR(255) UNIQUE NOT NULL,
    ip_address INET,
    user_agent TEXT,
    login_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    logout_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN NOT NULL DEFAULT true,
    company_id UUID REFERENCES companies(id)
);

-- ERP System Notifications Table
CREATE TABLE IF NOT EXISTS erp_system_notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id),
    user_id UUID REFERENCES auth.users(id),
    type VARCHAR(20) NOT NULL CHECK (type IN ('info', 'warning', 'error', 'success')),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    module VARCHAR(50),
    action_url VARCHAR(500),
    is_read BOOLEAN NOT NULL DEFAULT false,
    is_system BOOLEAN NOT NULL DEFAULT false,
    priority INTEGER NOT NULL DEFAULT 1 CHECK (priority BETWEEN 1 AND 5),
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ERP API Usage Logs Table
CREATE TABLE IF NOT EXISTS erp_api_usage_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id),
    user_id UUID REFERENCES auth.users(id),
    endpoint VARCHAR(255) NOT NULL,
    method VARCHAR(10) NOT NULL,
    status_code INTEGER NOT NULL,
    response_time_ms INTEGER,
    request_size_bytes INTEGER,
    response_size_bytes INTEGER,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ERP Data Backups Table
CREATE TABLE IF NOT EXISTS erp_data_backups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id),
    backup_type VARCHAR(20) NOT NULL CHECK (backup_type IN ('full', 'incremental', 'differential')),
    backup_size_bytes BIGINT,
    backup_location VARCHAR(500),
    backup_status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (backup_status IN ('pending', 'in_progress', 'completed', 'failed')),
    modules_included TEXT[],
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    created_by UUID REFERENCES auth.users(id)
);

-- ERP System Health Checks Table
CREATE TABLE IF NOT EXISTS erp_system_health_checks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    check_type VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('healthy', 'warning', 'critical')),
    response_time_ms INTEGER,
    details JSONB,
    checked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ERP Feature Flags Table
CREATE TABLE IF NOT EXISTS erp_feature_flags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id),
    flag_name VARCHAR(100) NOT NULL,
    is_enabled BOOLEAN NOT NULL DEFAULT false,
    description TEXT,
    target_users TEXT[], -- Array of user IDs or roles
    rollout_percentage INTEGER DEFAULT 0 CHECK (rollout_percentage BETWEEN 0 AND 100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(company_id, flag_name)
);

-- ERP Integration Logs Table
CREATE TABLE IF NOT EXISTS erp_integration_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id),
    integration_name VARCHAR(100) NOT NULL,
    operation VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('success', 'failed', 'pending')),
    request_data JSONB,
    response_data JSONB,
    error_message TEXT,
    execution_time_ms INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_erp_audit_logs_company_id ON erp_audit_logs(company_id);
CREATE INDEX IF NOT EXISTS idx_erp_audit_logs_user_id ON erp_audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_erp_audit_logs_module ON erp_audit_logs(module);
CREATE INDEX IF NOT EXISTS idx_erp_audit_logs_created_at ON erp_audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_erp_audit_logs_resource ON erp_audit_logs(resource_type, resource_id);

CREATE INDEX IF NOT EXISTS idx_erp_user_sessions_user_id ON erp_user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_erp_user_sessions_active ON erp_user_sessions(is_active, last_activity);
CREATE INDEX IF NOT EXISTS idx_erp_user_sessions_company_id ON erp_user_sessions(company_id);

CREATE INDEX IF NOT EXISTS idx_erp_system_notifications_user_id ON erp_system_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_erp_system_notifications_unread ON erp_system_notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_erp_system_notifications_company_id ON erp_system_notifications(company_id);
CREATE INDEX IF NOT EXISTS idx_erp_system_notifications_created_at ON erp_system_notifications(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_erp_api_usage_logs_company_id ON erp_api_usage_logs(company_id);
CREATE INDEX IF NOT EXISTS idx_erp_api_usage_logs_created_at ON erp_api_usage_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_erp_api_usage_logs_endpoint ON erp_api_usage_logs(endpoint);

CREATE INDEX IF NOT EXISTS idx_erp_module_status_company_id ON erp_module_status(company_id);
CREATE INDEX IF NOT EXISTS idx_erp_module_status_enabled ON erp_module_status(company_id, enabled);

CREATE INDEX IF NOT EXISTS idx_erp_health_checks_type ON erp_system_health_checks(check_type);
CREATE INDEX IF NOT EXISTS idx_erp_health_checks_checked_at ON erp_system_health_checks(checked_at DESC);

CREATE INDEX IF NOT EXISTS idx_erp_integration_logs_company_id ON erp_integration_logs(company_id);
CREATE INDEX IF NOT EXISTS idx_erp_integration_logs_created_at ON erp_integration_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_erp_integration_logs_integration ON erp_integration_logs(integration_name);

-- Row Level Security (RLS) Policies
ALTER TABLE erp_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_module_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_system_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_api_usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_data_backups ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_integration_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for company isolation
CREATE POLICY erp_audit_logs_company_isolation ON erp_audit_logs
    FOR ALL USING (
        company_id IN (
            SELECT company_id FROM employees 
            WHERE auth_user_id = auth.uid()
        )
    );

CREATE POLICY erp_system_settings_company_isolation ON erp_system_settings
    FOR ALL USING (
        company_id IN (
            SELECT company_id FROM employees 
            WHERE auth_user_id = auth.uid()
        )
    );

CREATE POLICY erp_module_status_company_isolation ON erp_module_status
    FOR ALL USING (
        company_id IN (
            SELECT company_id FROM employees 
            WHERE auth_user_id = auth.uid()
        )
    );

CREATE POLICY erp_user_sessions_company_isolation ON erp_user_sessions
    FOR ALL USING (
        company_id IN (
            SELECT company_id FROM employees 
            WHERE auth_user_id = auth.uid()
        )
    );

CREATE POLICY erp_system_notifications_user_access ON erp_system_notifications
    FOR ALL USING (
        user_id = auth.uid() OR 
        company_id IN (
            SELECT company_id FROM employees 
            WHERE auth_user_id = auth.uid() AND role IN ('admin', 'manager')
        )
    );

CREATE POLICY erp_api_usage_logs_company_isolation ON erp_api_usage_logs
    FOR ALL USING (
        company_id IN (
            SELECT company_id FROM employees 
            WHERE auth_user_id = auth.uid()
        )
    );

CREATE POLICY erp_data_backups_company_isolation ON erp_data_backups
    FOR ALL USING (
        company_id IN (
            SELECT company_id FROM employees 
            WHERE auth_user_id = auth.uid()
        )
    );

CREATE POLICY erp_feature_flags_company_isolation ON erp_feature_flags
    FOR ALL USING (
        company_id IN (
            SELECT company_id FROM employees 
            WHERE auth_user_id = auth.uid()
        )
    );

CREATE POLICY erp_integration_logs_company_isolation ON erp_integration_logs
    FOR ALL USING (
        company_id IN (
            SELECT company_id FROM employees 
            WHERE auth_user_id = auth.uid()
        )
    );

-- SQL Functions for ERP System

-- Function to get system health metrics
CREATE OR REPLACE FUNCTION get_system_health_metrics()
RETURNS TABLE (
    total_users BIGINT,
    active_sessions BIGINT,
    avg_response_time NUMERIC,
    error_rate NUMERIC,
    last_backup TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*) FROM employees WHERE status = 'active') as total_users,
        (SELECT COUNT(*) FROM erp_user_sessions WHERE is_active = true AND last_activity > NOW() - INTERVAL '1 hour') as active_sessions,
        (SELECT AVG(response_time_ms) FROM erp_api_usage_logs WHERE created_at > NOW() - INTERVAL '1 hour') as avg_response_time,
        (SELECT 
            CASE 
                WHEN COUNT(*) = 0 THEN 0
                ELSE (COUNT(*) FILTER (WHERE status_code >= 400))::NUMERIC / COUNT(*) * 100
            END
         FROM erp_api_usage_logs 
         WHERE created_at > NOW() - INTERVAL '1 hour'
        ) as error_rate,
        (SELECT MAX(completed_at) FROM erp_data_backups WHERE backup_status = 'completed') as last_backup;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up old audit logs
CREATE OR REPLACE FUNCTION cleanup_old_audit_logs(retention_days INTEGER DEFAULT 2555)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM erp_audit_logs 
    WHERE created_at < NOW() - (retention_days || ' days')::INTERVAL;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user activity summary
CREATE OR REPLACE FUNCTION get_user_activity_summary(user_id_param UUID, days_back INTEGER DEFAULT 30)
RETURNS TABLE (
    total_actions BIGINT,
    modules_used TEXT[],
    last_login TIMESTAMP WITH TIME ZONE,
    session_count BIGINT,
    avg_session_duration INTERVAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*) FROM erp_audit_logs 
         WHERE user_id = user_id_param AND created_at > NOW() - (days_back || ' days')::INTERVAL) as total_actions,
        (SELECT ARRAY_AGG(DISTINCT module) FROM erp_audit_logs 
         WHERE user_id = user_id_param AND created_at > NOW() - (days_back || ' days')::INTERVAL) as modules_used,
        (SELECT MAX(login_at) FROM erp_user_sessions WHERE user_id = user_id_param) as last_login,
        (SELECT COUNT(*) FROM erp_user_sessions 
         WHERE user_id = user_id_param AND login_at > NOW() - (days_back || ' days')::INTERVAL) as session_count,
        (SELECT AVG(logout_at - login_at) FROM erp_user_sessions 
         WHERE user_id = user_id_param AND logout_at IS NOT NULL 
         AND login_at > NOW() - (days_back || ' days')::INTERVAL) as avg_session_duration;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get module usage statistics
CREATE OR REPLACE FUNCTION get_module_usage_stats(company_id_param UUID, days_back INTEGER DEFAULT 30)
RETURNS TABLE (
    module_name TEXT,
    total_actions BIGINT,
    unique_users BIGINT,
    avg_daily_usage NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        al.module as module_name,
        COUNT(*) as total_actions,
        COUNT(DISTINCT al.user_id) as unique_users,
        (COUNT(*)::NUMERIC / days_back) as avg_daily_usage
    FROM erp_audit_logs al
    WHERE al.company_id = company_id_param 
    AND al.created_at > NOW() - (days_back || ' days')::INTERVAL
    GROUP BY al.module
    ORDER BY total_actions DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check feature flag status
CREATE OR REPLACE FUNCTION is_feature_enabled(
    company_id_param UUID, 
    flag_name_param VARCHAR(100), 
    user_id_param UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    flag_record RECORD;
    user_role TEXT;
BEGIN
    -- Get feature flag
    SELECT * INTO flag_record 
    FROM erp_feature_flags 
    WHERE company_id = company_id_param AND flag_name = flag_name_param;
    
    -- If flag doesn't exist or is disabled, return false
    IF NOT FOUND OR NOT flag_record.is_enabled THEN
        RETURN FALSE;
    END IF;
    
    -- If no user-specific targeting, return true
    IF flag_record.target_users IS NULL OR array_length(flag_record.target_users, 1) = 0 THEN
        RETURN TRUE;
    END IF;
    
    -- Check if user is in target list
    IF user_id_param::TEXT = ANY(flag_record.target_users) THEN
        RETURN TRUE;
    END IF;
    
    -- Check if user role is in target list
    IF user_id_param IS NOT NULL THEN
        SELECT role INTO user_role 
        FROM employees 
        WHERE auth_user_id = user_id_param AND company_id = company_id_param;
        
        IF user_role = ANY(flag_record.target_users) THEN
            RETURN TRUE;
        END IF;
    END IF;
    
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log API usage
CREATE OR REPLACE FUNCTION log_api_usage(
    company_id_param UUID,
    user_id_param UUID,
    endpoint_param VARCHAR(255),
    method_param VARCHAR(10),
    status_code_param INTEGER,
    response_time_ms_param INTEGER DEFAULT NULL,
    ip_address_param INET DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    log_id UUID;
BEGIN
    INSERT INTO erp_api_usage_logs (
        company_id, user_id, endpoint, method, status_code, 
        response_time_ms, ip_address
    ) VALUES (
        company_id_param, user_id_param, endpoint_param, method_param, 
        status_code_param, response_time_ms_param, ip_address_param
    ) RETURNING id INTO log_id;
    
    RETURN log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Triggers

-- Trigger to update system settings timestamp
CREATE OR REPLACE FUNCTION update_system_settings_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_system_settings_timestamp
    BEFORE UPDATE ON erp_system_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_system_settings_timestamp();

-- Trigger to update feature flags timestamp
CREATE OR REPLACE FUNCTION update_feature_flags_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_feature_flags_timestamp
    BEFORE UPDATE ON erp_feature_flags
    FOR EACH ROW
    EXECUTE FUNCTION update_feature_flags_timestamp();

-- Trigger to auto-expire notifications
CREATE OR REPLACE FUNCTION auto_expire_notifications()
RETURNS TRIGGER AS $$
BEGIN
    -- Mark expired notifications as read
    UPDATE erp_system_notifications 
    SET is_read = true 
    WHERE expires_at IS NOT NULL AND expires_at < NOW() AND is_read = false;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_expire_notifications
    AFTER INSERT OR UPDATE ON erp_system_notifications
    FOR EACH STATEMENT
    EXECUTE FUNCTION auto_expire_notifications();

-- Insert default module status for new companies
CREATE OR REPLACE FUNCTION initialize_company_modules()
RETURNS TRIGGER AS $$
DECLARE
    module_names TEXT[] := ARRAY[
        'sales', 'accounting', 'inventory', 'crm', 'hr',
        'manufacturing', 'supply_chain', 'projects', 'quality',
        'assets', 'documents', 'bi', 'communication'
    ];
    module_name TEXT;
BEGIN
    -- Insert default module status for each module
    FOREACH module_name IN ARRAY module_names
    LOOP
        INSERT INTO erp_module_status (company_id, module_name, status, enabled)
        VALUES (NEW.id, module_name, 'active', true);
    END LOOP;
    
    -- Insert default system settings
    INSERT INTO erp_system_settings (company_id, settings)
    VALUES (NEW.id, '{
        "timezone": "UTC",
        "currency": "USD",
        "date_format": "MM/DD/YYYY",
        "number_format": "en-US",
        "fiscal_year_start": "01-01",
        "multi_currency_enabled": false,
        "backup_frequency": "daily",
        "data_retention_days": 2555
    }');
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_initialize_company_modules
    AFTER INSERT ON companies
    FOR EACH ROW
    EXECUTE FUNCTION initialize_company_modules();

-- Create a view for system dashboard
CREATE OR REPLACE VIEW erp_system_dashboard AS
SELECT 
    c.id as company_id,
    c.name as company_name,
    (
        SELECT COUNT(*) 
        FROM employees e 
        WHERE e.company_id = c.id AND e.status = 'active'
    ) as total_employees,
    (
        SELECT COUNT(*) 
        FROM erp_user_sessions s 
        WHERE s.company_id = c.id AND s.is_active = true 
        AND s.last_activity > NOW() - INTERVAL '1 hour'
    ) as active_users,
    (
        SELECT COUNT(*) 
        FROM erp_audit_logs al 
        WHERE al.company_id = c.id 
        AND al.created_at > NOW() - INTERVAL '24 hours'
    ) as daily_activities,
    (
        SELECT COUNT(*) 
        FROM erp_system_notifications n 
        WHERE n.company_id = c.id AND n.is_read = false
    ) as unread_notifications,
    (
        SELECT AVG(response_time_ms) 
        FROM erp_api_usage_logs api 
        WHERE api.company_id = c.id 
        AND api.created_at > NOW() - INTERVAL '1 hour'
    ) as avg_response_time,
    (
        SELECT settings 
        FROM erp_system_settings s 
        WHERE s.company_id = c.id
    ) as system_settings
FROM companies c;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Comments for documentation
COMMENT ON TABLE erp_audit_logs IS 'Comprehensive audit trail for all ERP system activities';
COMMENT ON TABLE erp_system_settings IS 'Company-specific system configuration and preferences';
COMMENT ON TABLE erp_module_status IS 'Status and configuration of ERP modules per company';
COMMENT ON TABLE erp_user_sessions IS 'User session tracking and management';
COMMENT ON TABLE erp_system_notifications IS 'System-wide notifications and alerts';
COMMENT ON TABLE erp_api_usage_logs IS 'API usage tracking and performance monitoring';
COMMENT ON TABLE erp_data_backups IS 'Data backup tracking and management';
COMMENT ON TABLE erp_feature_flags IS 'Feature flag management for gradual rollouts';
COMMENT ON TABLE erp_integration_logs IS 'External integration activity logging';
COMMENT ON VIEW erp_system_dashboard IS 'Consolidated view of system metrics and status';