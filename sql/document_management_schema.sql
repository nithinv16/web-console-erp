-- Document Management Schema
-- This schema supports document storage, versioning, sharing, approval workflows, and collaboration

-- Document Folders Table
CREATE TABLE IF NOT EXISTS document_folders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    parent_folder_id UUID REFERENCES document_folders(id) ON DELETE CASCADE,
    path TEXT NOT NULL, -- Full path for easy navigation
    access_level VARCHAR(20) NOT NULL DEFAULT 'private' CHECK (access_level IN ('public', 'private', 'restricted')),
    created_by UUID NOT NULL REFERENCES employees(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(company_id, parent_folder_id, name)
);

-- Documents Table
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    folder_id UUID REFERENCES document_folders(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    file_path VARCHAR(500) NOT NULL, -- Path in storage bucket
    file_size BIGINT NOT NULL CHECK (file_size >= 0),
    file_type VARCHAR(50) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    category VARCHAR(100) NOT NULL,
    subcategory VARCHAR(100),
    tags TEXT[], -- Array of tags for categorization
    version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0),
    is_current_version BOOLEAN NOT NULL DEFAULT true,
    parent_document_id UUID REFERENCES documents(id) ON DELETE CASCADE, -- For versioning
    access_level VARCHAR(20) NOT NULL DEFAULT 'private' CHECK (access_level IN ('public', 'private', 'restricted')),
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived', 'deleted', 'pending_approval')),
    uploaded_by UUID NOT NULL REFERENCES employees(id),
    approved_by UUID REFERENCES employees(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    download_count INTEGER NOT NULL DEFAULT 0 CHECK (download_count >= 0),
    last_accessed_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB, -- Additional metadata
    checksum VARCHAR(64), -- File integrity check
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Document Shares Table
CREATE TABLE IF NOT EXISTS document_shares (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    shared_with_user_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    shared_with_email VARCHAR(255),
    permission VARCHAR(20) NOT NULL CHECK (permission IN ('view', 'edit', 'download', 'comment')),
    share_token VARCHAR(100) UNIQUE,
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN NOT NULL DEFAULT true,
    access_count INTEGER NOT NULL DEFAULT 0,
    last_accessed_at TIMESTAMP WITH TIME ZONE,
    created_by UUID NOT NULL REFERENCES employees(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT check_shared_with CHECK (
        (shared_with_user_id IS NOT NULL AND shared_with_email IS NULL) OR
        (shared_with_user_id IS NULL AND shared_with_email IS NOT NULL)
    )
);

-- Document Comments Table
CREATE TABLE IF NOT EXISTS document_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    parent_comment_id UUID REFERENCES document_comments(id) ON DELETE CASCADE, -- For threaded comments
    comment TEXT NOT NULL,
    is_resolved BOOLEAN NOT NULL DEFAULT false,
    resolved_by UUID REFERENCES employees(id),
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_by UUID NOT NULL REFERENCES employees(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Document Approvals Table
CREATE TABLE IF NOT EXISTS document_approvals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    approver_id UUID NOT NULL REFERENCES employees(id),
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'delegated')),
    comments TEXT,
    approval_order INTEGER NOT NULL DEFAULT 1, -- For sequential approvals
    is_required BOOLEAN NOT NULL DEFAULT true,
    delegated_to UUID REFERENCES employees(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(document_id, approver_id, approval_order)
);

-- Document Tags Table (for standardization)
CREATE TABLE IF NOT EXISTS document_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    color VARCHAR(7), -- Hex color code
    usage_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(company_id, name)
);

-- Document Categories Table (for standardization)
CREATE TABLE IF NOT EXISTS document_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    parent_category_id UUID REFERENCES document_categories(id) ON DELETE CASCADE,
    default_access_level VARCHAR(20) NOT NULL DEFAULT 'private',
    requires_approval BOOLEAN NOT NULL DEFAULT false,
    retention_period_days INTEGER, -- Auto-delete after this period
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(company_id, parent_category_id, name)
);

-- Document Templates Table
CREATE TABLE IF NOT EXISTS document_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    usage_count INTEGER NOT NULL DEFAULT 0,
    created_by UUID NOT NULL REFERENCES employees(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Document Audit Trail Table
CREATE TABLE IF NOT EXISTS document_audit_trail (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL, -- 'created', 'updated', 'downloaded', 'shared', 'approved', 'deleted'
    field_changed VARCHAR(100),
    old_value TEXT,
    new_value TEXT,
    ip_address INET,
    user_agent TEXT,
    changed_by UUID NOT NULL REFERENCES employees(id),
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    notes TEXT
);

-- Document Bookmarks Table
CREATE TABLE IF NOT EXISTS document_bookmarks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(document_id, user_id)
);

-- Document Notifications Table
CREATE TABLE IF NOT EXISTS document_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    notification_type VARCHAR(50) NOT NULL, -- 'new_version', 'approval_request', 'comment_added', 'shared'
    message TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT false,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Document Access Logs Table
CREATE TABLE IF NOT EXISTS document_access_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    user_id UUID REFERENCES employees(id) ON DELETE SET NULL,
    share_token VARCHAR(100),
    action VARCHAR(50) NOT NULL, -- 'view', 'download', 'preview'
    ip_address INET,
    user_agent TEXT,
    accessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Document Workflows Table
CREATE TABLE IF NOT EXISTS document_workflows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100) NOT NULL,
    workflow_steps JSONB NOT NULL, -- Array of workflow steps
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_by UUID NOT NULL REFERENCES employees(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Document Workflow Instances Table
CREATE TABLE IF NOT EXISTS document_workflow_instances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    workflow_id UUID NOT NULL REFERENCES document_workflows(id),
    current_step INTEGER NOT NULL DEFAULT 1,
    status VARCHAR(20) NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'cancelled', 'rejected')),
    started_by UUID NOT NULL REFERENCES employees(id),
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_document_folders_company_id ON document_folders(company_id);
CREATE INDEX IF NOT EXISTS idx_document_folders_parent_id ON document_folders(parent_folder_id);
CREATE INDEX IF NOT EXISTS idx_document_folders_path ON document_folders USING gin(to_tsvector('english', path));

CREATE INDEX IF NOT EXISTS idx_documents_company_id ON documents(company_id);
CREATE INDEX IF NOT EXISTS idx_documents_folder_id ON documents(folder_id);
CREATE INDEX IF NOT EXISTS idx_documents_category ON documents(category);
CREATE INDEX IF NOT EXISTS idx_documents_file_type ON documents(file_type);
CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(status);
CREATE INDEX IF NOT EXISTS idx_documents_uploaded_by ON documents(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_documents_created_at ON documents(created_at);
CREATE INDEX IF NOT EXISTS idx_documents_is_current_version ON documents(is_current_version);
CREATE INDEX IF NOT EXISTS idx_documents_parent_document_id ON documents(parent_document_id);
CREATE INDEX IF NOT EXISTS idx_documents_tags ON documents USING gin(tags);
CREATE INDEX IF NOT EXISTS idx_documents_name_search ON documents USING gin(to_tsvector('english', name));
CREATE INDEX IF NOT EXISTS idx_documents_description_search ON documents USING gin(to_tsvector('english', description));
CREATE INDEX IF NOT EXISTS idx_documents_access_level ON documents(access_level);

CREATE INDEX IF NOT EXISTS idx_document_shares_document_id ON document_shares(document_id);
CREATE INDEX IF NOT EXISTS idx_document_shares_shared_with_user ON document_shares(shared_with_user_id);
CREATE INDEX IF NOT EXISTS idx_document_shares_share_token ON document_shares(share_token);
CREATE INDEX IF NOT EXISTS idx_document_shares_expires_at ON document_shares(expires_at);
CREATE INDEX IF NOT EXISTS idx_document_shares_created_by ON document_shares(created_by);

CREATE INDEX IF NOT EXISTS idx_document_comments_document_id ON document_comments(document_id);
CREATE INDEX IF NOT EXISTS idx_document_comments_parent_id ON document_comments(parent_comment_id);
CREATE INDEX IF NOT EXISTS idx_document_comments_created_by ON document_comments(created_by);
CREATE INDEX IF NOT EXISTS idx_document_comments_created_at ON document_comments(created_at);

CREATE INDEX IF NOT EXISTS idx_document_approvals_document_id ON document_approvals(document_id);
CREATE INDEX IF NOT EXISTS idx_document_approvals_approver_id ON document_approvals(approver_id);
CREATE INDEX IF NOT EXISTS idx_document_approvals_status ON document_approvals(status);
CREATE INDEX IF NOT EXISTS idx_document_approvals_order ON document_approvals(approval_order);

CREATE INDEX IF NOT EXISTS idx_document_tags_company_id ON document_tags(company_id);
CREATE INDEX IF NOT EXISTS idx_document_tags_name ON document_tags(name);

CREATE INDEX IF NOT EXISTS idx_document_categories_company_id ON document_categories(company_id);
CREATE INDEX IF NOT EXISTS idx_document_categories_parent_id ON document_categories(parent_category_id);

CREATE INDEX IF NOT EXISTS idx_document_templates_company_id ON document_templates(company_id);
CREATE INDEX IF NOT EXISTS idx_document_templates_category ON document_templates(category);
CREATE INDEX IF NOT EXISTS idx_document_templates_is_active ON document_templates(is_active);

CREATE INDEX IF NOT EXISTS idx_document_audit_trail_document_id ON document_audit_trail(document_id);
CREATE INDEX IF NOT EXISTS idx_document_audit_trail_changed_by ON document_audit_trail(changed_by);
CREATE INDEX IF NOT EXISTS idx_document_audit_trail_changed_at ON document_audit_trail(changed_at);
CREATE INDEX IF NOT EXISTS idx_document_audit_trail_action ON document_audit_trail(action);

CREATE INDEX IF NOT EXISTS idx_document_bookmarks_document_id ON document_bookmarks(document_id);
CREATE INDEX IF NOT EXISTS idx_document_bookmarks_user_id ON document_bookmarks(user_id);

CREATE INDEX IF NOT EXISTS idx_document_notifications_user_id ON document_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_document_notifications_is_read ON document_notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_document_notifications_created_at ON document_notifications(created_at);

CREATE INDEX IF NOT EXISTS idx_document_access_logs_document_id ON document_access_logs(document_id);
CREATE INDEX IF NOT EXISTS idx_document_access_logs_user_id ON document_access_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_document_access_logs_accessed_at ON document_access_logs(accessed_at);

CREATE INDEX IF NOT EXISTS idx_document_workflows_company_id ON document_workflows(company_id);
CREATE INDEX IF NOT EXISTS idx_document_workflows_category ON document_workflows(category);
CREATE INDEX IF NOT EXISTS idx_document_workflows_is_active ON document_workflows(is_active);

CREATE INDEX IF NOT EXISTS idx_document_workflow_instances_document_id ON document_workflow_instances(document_id);
CREATE INDEX IF NOT EXISTS idx_document_workflow_instances_workflow_id ON document_workflow_instances(workflow_id);
CREATE INDEX IF NOT EXISTS idx_document_workflow_instances_status ON document_workflow_instances(status);

-- Enable Row Level Security
ALTER TABLE document_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_audit_trail ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_access_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_workflow_instances ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies

-- Document Folders Policies
CREATE POLICY "Users can view company document folders" ON document_folders
    FOR SELECT USING (
        company_id IN (
            SELECT company_id FROM user_company_access 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert company document folders" ON document_folders
    FOR INSERT WITH CHECK (
        company_id IN (
            SELECT company_id FROM user_company_access 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update company document folders" ON document_folders
    FOR UPDATE USING (
        company_id IN (
            SELECT company_id FROM user_company_access 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete company document folders" ON document_folders
    FOR DELETE USING (
        company_id IN (
            SELECT company_id FROM user_company_access 
            WHERE user_id = auth.uid()
        )
    );

-- Documents Policies
CREATE POLICY "Users can view accessible documents" ON documents
    FOR SELECT USING (
        company_id IN (
            SELECT company_id FROM user_company_access 
            WHERE user_id = auth.uid()
        ) AND (
            access_level = 'public' OR
            uploaded_by = auth.uid() OR
            id IN (
                SELECT document_id FROM document_shares 
                WHERE (shared_with_user_id = auth.uid() OR shared_with_email = auth.email())
                AND is_active = true
                AND (expires_at IS NULL OR expires_at > NOW())
            )
        )
    );

CREATE POLICY "Users can insert company documents" ON documents
    FOR INSERT WITH CHECK (
        company_id IN (
            SELECT company_id FROM user_company_access 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update own documents" ON documents
    FOR UPDATE USING (
        company_id IN (
            SELECT company_id FROM user_company_access 
            WHERE user_id = auth.uid()
        ) AND (
            uploaded_by = auth.uid() OR
            id IN (
                SELECT document_id FROM document_shares 
                WHERE shared_with_user_id = auth.uid()
                AND permission IN ('edit')
                AND is_active = true
                AND (expires_at IS NULL OR expires_at > NOW())
            )
        )
    );

CREATE POLICY "Users can delete own documents" ON documents
    FOR DELETE USING (
        company_id IN (
            SELECT company_id FROM user_company_access 
            WHERE user_id = auth.uid()
        ) AND uploaded_by = auth.uid()
    );

-- Document Shares Policies
CREATE POLICY "Users can view document shares" ON document_shares
    FOR SELECT USING (
        document_id IN (
            SELECT id FROM documents 
            WHERE company_id IN (
                SELECT company_id FROM user_company_access 
                WHERE user_id = auth.uid()
            )
        ) AND (
            created_by = auth.uid() OR
            shared_with_user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create document shares" ON document_shares
    FOR INSERT WITH CHECK (
        document_id IN (
            SELECT id FROM documents 
            WHERE company_id IN (
                SELECT company_id FROM user_company_access 
                WHERE user_id = auth.uid()
            ) AND uploaded_by = auth.uid()
        )
    );

CREATE POLICY "Users can update own document shares" ON document_shares
    FOR UPDATE USING (created_by = auth.uid());

CREATE POLICY "Users can delete own document shares" ON document_shares
    FOR DELETE USING (created_by = auth.uid());

-- Document Comments Policies
CREATE POLICY "Users can view document comments" ON document_comments
    FOR SELECT USING (
        document_id IN (
            SELECT id FROM documents 
            WHERE company_id IN (
                SELECT company_id FROM user_company_access 
                WHERE user_id = auth.uid()
            ) AND (
                access_level = 'public' OR
                uploaded_by = auth.uid() OR
                id IN (
                    SELECT document_id FROM document_shares 
                    WHERE shared_with_user_id = auth.uid()
                    AND permission IN ('view', 'edit', 'comment')
                    AND is_active = true
                    AND (expires_at IS NULL OR expires_at > NOW())
                )
            )
        )
    );

CREATE POLICY "Users can insert document comments" ON document_comments
    FOR INSERT WITH CHECK (
        document_id IN (
            SELECT id FROM documents 
            WHERE company_id IN (
                SELECT company_id FROM user_company_access 
                WHERE user_id = auth.uid()
            ) AND (
                uploaded_by = auth.uid() OR
                id IN (
                    SELECT document_id FROM document_shares 
                    WHERE shared_with_user_id = auth.uid()
                    AND permission IN ('edit', 'comment')
                    AND is_active = true
                    AND (expires_at IS NULL OR expires_at > NOW())
                )
            )
        )
    );

CREATE POLICY "Users can update own comments" ON document_comments
    FOR UPDATE USING (created_by = auth.uid());

CREATE POLICY "Users can delete own comments" ON document_comments
    FOR DELETE USING (created_by = auth.uid());

-- Document Approvals Policies
CREATE POLICY "Users can view document approvals" ON document_approvals
    FOR SELECT USING (
        document_id IN (
            SELECT id FROM documents 
            WHERE company_id IN (
                SELECT company_id FROM user_company_access 
                WHERE user_id = auth.uid()
            )
        ) AND (
            approver_id = auth.uid() OR
            document_id IN (
                SELECT id FROM documents WHERE uploaded_by = auth.uid()
            )
        )
    );

CREATE POLICY "Users can insert document approvals" ON document_approvals
    FOR INSERT WITH CHECK (
        document_id IN (
            SELECT id FROM documents 
            WHERE company_id IN (
                SELECT company_id FROM user_company_access 
                WHERE user_id = auth.uid()
            ) AND uploaded_by = auth.uid()
        )
    );

CREATE POLICY "Approvers can update their approvals" ON document_approvals
    FOR UPDATE USING (approver_id = auth.uid());

-- Apply similar policies for other tables...
-- (Abbreviated for brevity, but would follow the same pattern)

-- Create Functions for Document Management

-- Function to get documents by category
CREATE OR REPLACE FUNCTION get_documents_by_category(p_company_id UUID)
RETURNS TABLE (
    category TEXT,
    count BIGINT,
    size BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        d.category,
        COUNT(*) as count,
        COALESCE(SUM(d.file_size), 0) as size
    FROM documents d
    WHERE d.company_id = p_company_id
      AND d.is_current_version = true
      AND d.status = 'active'
    GROUP BY d.category
    ORDER BY count DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to get documents by file type
CREATE OR REPLACE FUNCTION get_documents_by_type(p_company_id UUID)
RETURNS TABLE (
    file_type TEXT,
    count BIGINT,
    size BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        d.file_type,
        COUNT(*) as count,
        COALESCE(SUM(d.file_size), 0) as size
    FROM documents d
    WHERE d.company_id = p_company_id
      AND d.is_current_version = true
      AND d.status = 'active'
    GROUP BY d.file_type
    ORDER BY count DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to get monthly upload trend
CREATE OR REPLACE FUNCTION get_monthly_upload_trend(p_company_id UUID)
RETURNS TABLE (
    month TEXT,
    count BIGINT,
    size BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        TO_CHAR(d.created_at, 'YYYY-MM') as month,
        COUNT(*) as count,
        COALESCE(SUM(d.file_size), 0) as size
    FROM documents d
    WHERE d.company_id = p_company_id
      AND d.created_at >= CURRENT_DATE - INTERVAL '12 months'
      AND d.status = 'active'
    GROUP BY TO_CHAR(d.created_at, 'YYYY-MM')
    ORDER BY month;
END;
$$ LANGUAGE plpgsql;

-- Function to clean up expired shares
CREATE OR REPLACE FUNCTION cleanup_expired_shares()
RETURNS INTEGER AS $$
DECLARE
    v_count INTEGER;
BEGIN
    UPDATE document_shares
    SET is_active = false
    WHERE expires_at IS NOT NULL 
      AND expires_at < NOW()
      AND is_active = true;
    
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate folder size
CREATE OR REPLACE FUNCTION get_folder_size(p_folder_id UUID)
RETURNS BIGINT AS $$
DECLARE
    v_size BIGINT;
BEGIN
    WITH RECURSIVE folder_tree AS (
        SELECT id FROM document_folders WHERE id = p_folder_id
        UNION ALL
        SELECT df.id 
        FROM document_folders df
        JOIN folder_tree ft ON df.parent_folder_id = ft.id
    )
    SELECT COALESCE(SUM(d.file_size), 0) INTO v_size
    FROM documents d
    WHERE d.folder_id IN (SELECT id FROM folder_tree)
      AND d.is_current_version = true
      AND d.status = 'active';
    
    RETURN v_size;
END;
$$ LANGUAGE plpgsql;

-- Function to get document access statistics
CREATE OR REPLACE FUNCTION get_document_access_stats(
    p_document_id UUID,
    p_days INTEGER DEFAULT 30
)
RETURNS TABLE (
    total_views BIGINT,
    total_downloads BIGINT,
    unique_users BIGINT,
    recent_activity BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) FILTER (WHERE action = 'view') as total_views,
        COUNT(*) FILTER (WHERE action = 'download') as total_downloads,
        COUNT(DISTINCT user_id) as unique_users,
        COUNT(*) FILTER (WHERE accessed_at >= CURRENT_DATE - INTERVAL '1 day' * p_days) as recent_activity
    FROM document_access_logs
    WHERE document_id = p_document_id;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for audit trail
CREATE OR REPLACE FUNCTION document_audit_trigger()
RETURNS TRIGGER AS $$
DECLARE
    v_action VARCHAR(50);
    v_user_id UUID;
BEGIN
    -- Get current user ID
    v_user_id := auth.uid();
    
    -- Determine action
    IF TG_OP = 'INSERT' THEN
        v_action := 'created';
        INSERT INTO document_audit_trail (document_id, action, new_value, changed_by)
        VALUES (NEW.id, v_action, row_to_json(NEW)::TEXT, v_user_id);
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        v_action := 'updated';
        -- Log specific field changes
        IF OLD.name != NEW.name THEN
            INSERT INTO document_audit_trail (document_id, action, field_changed, old_value, new_value, changed_by)
            VALUES (NEW.id, v_action, 'name', OLD.name, NEW.name, v_user_id);
        END IF;
        IF OLD.status != NEW.status THEN
            INSERT INTO document_audit_trail (document_id, action, field_changed, old_value, new_value, changed_by)
            VALUES (NEW.id, v_action, 'status', OLD.status, NEW.status, v_user_id);
        END IF;
        IF OLD.access_level != NEW.access_level THEN
            INSERT INTO document_audit_trail (document_id, action, field_changed, old_value, new_value, changed_by)
            VALUES (NEW.id, v_action, 'access_level', OLD.access_level, NEW.access_level, v_user_id);
        END IF;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        v_action := 'deleted';
        INSERT INTO document_audit_trail (document_id, action, old_value, changed_by)
        VALUES (OLD.id, v_action, row_to_json(OLD)::TEXT, v_user_id);
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_document_audit
    AFTER INSERT OR UPDATE OR DELETE ON documents
    FOR EACH ROW
    EXECUTE FUNCTION document_audit_trigger();

-- Create trigger to update tag usage count
CREATE OR REPLACE FUNCTION update_tag_usage_trigger()
RETURNS TRIGGER AS $$
DECLARE
    tag_name TEXT;
BEGIN
    -- Handle INSERT
    IF TG_OP = 'INSERT' AND NEW.tags IS NOT NULL THEN
        FOREACH tag_name IN ARRAY NEW.tags
        LOOP
            INSERT INTO document_tags (company_id, name, usage_count)
            VALUES (NEW.company_id, tag_name, 1)
            ON CONFLICT (company_id, name)
            DO UPDATE SET usage_count = document_tags.usage_count + 1;
        END LOOP;
        RETURN NEW;
    END IF;
    
    -- Handle UPDATE
    IF TG_OP = 'UPDATE' THEN
        -- Decrease count for removed tags
        IF OLD.tags IS NOT NULL THEN
            FOREACH tag_name IN ARRAY OLD.tags
            LOOP
                IF NEW.tags IS NULL OR NOT (tag_name = ANY(NEW.tags)) THEN
                    UPDATE document_tags 
                    SET usage_count = GREATEST(0, usage_count - 1)
                    WHERE company_id = OLD.company_id AND name = tag_name;
                END IF;
            END LOOP;
        END IF;
        
        -- Increase count for new tags
        IF NEW.tags IS NOT NULL THEN
            FOREACH tag_name IN ARRAY NEW.tags
            LOOP
                IF OLD.tags IS NULL OR NOT (tag_name = ANY(OLD.tags)) THEN
                    INSERT INTO document_tags (company_id, name, usage_count)
                    VALUES (NEW.company_id, tag_name, 1)
                    ON CONFLICT (company_id, name)
                    DO UPDATE SET usage_count = document_tags.usage_count + 1;
                END IF;
            END LOOP;
        END IF;
        RETURN NEW;
    END IF;
    
    -- Handle DELETE
    IF TG_OP = 'DELETE' AND OLD.tags IS NOT NULL THEN
        FOREACH tag_name IN ARRAY OLD.tags
        LOOP
            UPDATE document_tags 
            SET usage_count = GREATEST(0, usage_count - 1)
            WHERE company_id = OLD.company_id AND name = tag_name;
        END LOOP;
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_tag_usage
    AFTER INSERT OR UPDATE OR DELETE ON documents
    FOR EACH ROW
    EXECUTE FUNCTION update_tag_usage_trigger();

-- Create trigger to log document access
CREATE OR REPLACE FUNCTION log_document_access_trigger()
RETURNS TRIGGER AS $$
BEGIN
    -- Log download access
    IF NEW.download_count > OLD.download_count THEN
        INSERT INTO document_access_logs (document_id, user_id, action)
        VALUES (NEW.id, auth.uid(), 'download');
    END IF;
    
    -- Update last accessed time
    IF NEW.last_accessed_at IS DISTINCT FROM OLD.last_accessed_at THEN
        INSERT INTO document_access_logs (document_id, user_id, action)
        VALUES (NEW.id, auth.uid(), 'view');
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_log_document_access
    AFTER UPDATE ON documents
    FOR EACH ROW
    EXECUTE FUNCTION log_document_access_trigger();

-- Insert default document categories
INSERT INTO document_categories (company_id, name, description, requires_approval) 
SELECT 
    c.id,
    category_name,
    category_description,
    requires_approval
FROM companies c
CROSS JOIN (
    VALUES 
        ('Contracts', 'Legal contracts and agreements', true),
        ('Invoices', 'Sales and purchase invoices', false),
        ('Reports', 'Business and financial reports', false),
        ('Policies', 'Company policies and procedures', true),
        ('Forms', 'Application and request forms', false),
        ('Presentations', 'Business presentations and slides', false),
        ('Spreadsheets', 'Data analysis and calculations', false),
        ('Images', 'Photos, diagrams, and graphics', false),
        ('Videos', 'Training and promotional videos', false),
        ('Audio', 'Recordings and audio files', false),
        ('Archives', 'Historical and backup documents', false),
        ('Templates', 'Document templates and formats', false),
        ('Certificates', 'Licenses and certifications', true),
        ('Manuals', 'User guides and documentation', false),
        ('Other', 'Miscellaneous documents', false)
) AS categories(category_name, category_description, requires_approval)
ON CONFLICT (company_id, parent_category_id, name) DO NOTHING;

-- Create view for document dashboard
CREATE OR REPLACE VIEW document_dashboard AS
SELECT 
    d.id,
    d.name,
    d.category,
    d.file_type,
    d.file_size,
    d.download_count,
    d.created_at,
    d.last_accessed_at,
    CONCAT(e.first_name, ' ', e.last_name) as uploaded_by_name,
    df.name as folder_name,
    df.path as folder_path,
    CASE 
        WHEN d.created_at >= CURRENT_DATE - INTERVAL '7 days' THEN 'new'
        WHEN d.last_accessed_at >= CURRENT_DATE - INTERVAL '7 days' THEN 'recent'
        ELSE 'normal'
    END as activity_status,
    (
        SELECT COUNT(*) 
        FROM document_comments dc 
        WHERE dc.document_id = d.id
    ) as comment_count,
    (
        SELECT COUNT(*) 
        FROM document_shares ds 
        WHERE ds.document_id = d.id AND ds.is_active = true
    ) as share_count
FROM documents d
LEFT JOIN employees e ON d.uploaded_by = e.id
LEFT JOIN document_folders df ON d.folder_id = df.id
WHERE d.is_current_version = true
  AND d.status = 'active';

-- Create scheduled job to clean up expired shares (if using pg_cron)
-- SELECT cron.schedule('cleanup-expired-shares', '0 2 * * *', 'SELECT cleanup_expired_shares();');