-- Project Management Schema
-- This schema supports projects, tasks, milestones, time tracking, and team management

-- Projects Table
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    project_manager_id UUID NOT NULL REFERENCES employees(id),
    client_id UUID REFERENCES customers(id),
    status VARCHAR(20) NOT NULL DEFAULT 'planning' CHECK (status IN ('planning', 'active', 'on_hold', 'completed', 'cancelled')),
    priority VARCHAR(20) NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    project_type VARCHAR(20) NOT NULL DEFAULT 'internal' CHECK (project_type IN ('internal', 'client', 'research', 'maintenance')),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    actual_start_date DATE,
    actual_end_date DATE,
    budget DECIMAL(15,2),
    actual_cost DECIMAL(15,2) DEFAULT 0,
    progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    completed_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT check_project_dates CHECK (end_date >= start_date)
);

-- Project Team Members Table
CREATE TABLE IF NOT EXISTS project_team_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL DEFAULT 'team_member',
    joined_date DATE NOT NULL DEFAULT CURRENT_DATE,
    left_date DATE,
    hourly_rate DECIMAL(10,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(project_id, employee_id)
);

-- Tasks Table
CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    parent_task_id UUID REFERENCES tasks(id),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    assigned_to UUID REFERENCES employees(id),
    status VARCHAR(20) NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'review', 'completed', 'cancelled')),
    priority VARCHAR(20) NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    estimated_hours DECIMAL(8,2),
    actual_hours DECIMAL(8,2) DEFAULT 0,
    progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    start_date DATE,
    due_date DATE,
    completed_date TIMESTAMP WITH TIME ZONE,
    cancelled_date TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES employees(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Task Dependencies Table
CREATE TABLE IF NOT EXISTS task_dependencies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    dependency_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    dependency_type VARCHAR(20) NOT NULL DEFAULT 'finish_to_start' CHECK (dependency_type IN ('finish_to_start', 'start_to_start', 'finish_to_finish', 'start_to_finish')),
    lag_days INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(task_id, dependency_id),
    CONSTRAINT no_self_dependency CHECK (task_id != dependency_id)
);

-- Task Tags Table
CREATE TABLE IF NOT EXISTS task_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    tag_name VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(task_id, tag_name)
);

-- Task Comments Table
CREATE TABLE IF NOT EXISTS task_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees(id),
    comment TEXT NOT NULL,
    is_internal BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Task Attachments Table
CREATE TABLE IF NOT EXISTS task_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INTEGER,
    file_type VARCHAR(100),
    uploaded_by UUID NOT NULL REFERENCES employees(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Project Milestones Table
CREATE TABLE IF NOT EXISTS project_milestones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    due_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'overdue')),
    completed_date TIMESTAMP WITH TIME ZONE,
    completed_by UUID REFERENCES employees(id),
    deliverables TEXT[], -- Array of deliverable descriptions
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Time Entries Table
CREATE TABLE IF NOT EXISTS time_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
    employee_id UUID NOT NULL REFERENCES employees(id),
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE,
    hours_worked DECIMAL(8,2) NOT NULL CHECK (hours_worked > 0),
    description TEXT,
    billable BOOLEAN DEFAULT true,
    hourly_rate DECIMAL(10,2),
    total_amount DECIMAL(12,2),
    approved BOOLEAN DEFAULT false,
    approved_by UUID REFERENCES employees(id),
    approved_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Project Status History Table
CREATE TABLE IF NOT EXISTS project_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL,
    changed_by UUID NOT NULL REFERENCES employees(id),
    changed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    notes TEXT
);

-- Project Budget Tracking Table
CREATE TABLE IF NOT EXISTS project_budget_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    category VARCHAR(100) NOT NULL, -- 'labor', 'materials', 'equipment', 'other'
    description TEXT NOT NULL,
    budgeted_amount DECIMAL(12,2) NOT NULL,
    actual_amount DECIMAL(12,2) DEFAULT 0,
    entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_by UUID NOT NULL REFERENCES employees(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Project Documents Table
CREATE TABLE IF NOT EXISTS project_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    document_name VARCHAR(255) NOT NULL,
    document_type VARCHAR(50) NOT NULL, -- 'contract', 'specification', 'report', 'other'
    file_path VARCHAR(500) NOT NULL,
    file_size INTEGER,
    version VARCHAR(20) DEFAULT '1.0',
    uploaded_by UUID NOT NULL REFERENCES employees(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Project Risk Register Table
CREATE TABLE IF NOT EXISTS project_risks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    risk_title VARCHAR(200) NOT NULL,
    risk_description TEXT NOT NULL,
    probability VARCHAR(20) NOT NULL CHECK (probability IN ('very_low', 'low', 'medium', 'high', 'very_high')),
    impact VARCHAR(20) NOT NULL CHECK (impact IN ('very_low', 'low', 'medium', 'high', 'very_high')),
    risk_score INTEGER GENERATED ALWAYS AS (
        CASE probability
            WHEN 'very_low' THEN 1
            WHEN 'low' THEN 2
            WHEN 'medium' THEN 3
            WHEN 'high' THEN 4
            WHEN 'very_high' THEN 5
        END *
        CASE impact
            WHEN 'very_low' THEN 1
            WHEN 'low' THEN 2
            WHEN 'medium' THEN 3
            WHEN 'high' THEN 4
            WHEN 'very_high' THEN 5
        END
    ) STORED,
    mitigation_strategy TEXT,
    contingency_plan TEXT,
    owner_id UUID REFERENCES employees(id),
    status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'monitoring', 'closed', 'occurred')),
    identified_date DATE NOT NULL DEFAULT CURRENT_DATE,
    review_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Project Communication Log Table
CREATE TABLE IF NOT EXISTS project_communications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    communication_type VARCHAR(50) NOT NULL, -- 'meeting', 'email', 'call', 'document'
    subject VARCHAR(200) NOT NULL,
    content TEXT,
    participants UUID[], -- Array of employee IDs
    communication_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_by UUID NOT NULL REFERENCES employees(id),
    is_internal BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_projects_company_id ON projects(company_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_manager ON projects(project_manager_id);
CREATE INDEX IF NOT EXISTS idx_projects_client ON projects(client_id);
CREATE INDEX IF NOT EXISTS idx_projects_dates ON projects(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_projects_priority ON projects(priority);

CREATE INDEX IF NOT EXISTS idx_project_team_members_project_id ON project_team_members(project_id);
CREATE INDEX IF NOT EXISTS idx_project_team_members_employee_id ON project_team_members(employee_id);

CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_parent ON tasks(parent_task_id);

CREATE INDEX IF NOT EXISTS idx_task_dependencies_task_id ON task_dependencies(task_id);
CREATE INDEX IF NOT EXISTS idx_task_dependencies_dependency_id ON task_dependencies(dependency_id);

CREATE INDEX IF NOT EXISTS idx_task_tags_task_id ON task_tags(task_id);
CREATE INDEX IF NOT EXISTS idx_task_tags_tag_name ON task_tags(tag_name);

CREATE INDEX IF NOT EXISTS idx_task_comments_task_id ON task_comments(task_id);
CREATE INDEX IF NOT EXISTS idx_task_comments_employee_id ON task_comments(employee_id);
CREATE INDEX IF NOT EXISTS idx_task_comments_created_at ON task_comments(created_at);

CREATE INDEX IF NOT EXISTS idx_task_attachments_task_id ON task_attachments(task_id);

CREATE INDEX IF NOT EXISTS idx_project_milestones_project_id ON project_milestones(project_id);
CREATE INDEX IF NOT EXISTS idx_project_milestones_due_date ON project_milestones(due_date);
CREATE INDEX IF NOT EXISTS idx_project_milestones_status ON project_milestones(status);

CREATE INDEX IF NOT EXISTS idx_time_entries_project_id ON time_entries(project_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_task_id ON time_entries(task_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_employee_id ON time_entries(employee_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_start_time ON time_entries(start_time);
CREATE INDEX IF NOT EXISTS idx_time_entries_billable ON time_entries(billable);

CREATE INDEX IF NOT EXISTS idx_project_status_history_project_id ON project_status_history(project_id);
CREATE INDEX IF NOT EXISTS idx_project_status_history_changed_at ON project_status_history(changed_at);

CREATE INDEX IF NOT EXISTS idx_project_budget_entries_project_id ON project_budget_entries(project_id);
CREATE INDEX IF NOT EXISTS idx_project_budget_entries_category ON project_budget_entries(category);

CREATE INDEX IF NOT EXISTS idx_project_documents_project_id ON project_documents(project_id);
CREATE INDEX IF NOT EXISTS idx_project_documents_type ON project_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_project_documents_active ON project_documents(is_active);

CREATE INDEX IF NOT EXISTS idx_project_risks_project_id ON project_risks(project_id);
CREATE INDEX IF NOT EXISTS idx_project_risks_score ON project_risks(risk_score);
CREATE INDEX IF NOT EXISTS idx_project_risks_status ON project_risks(status);

CREATE INDEX IF NOT EXISTS idx_project_communications_project_id ON project_communications(project_id);
CREATE INDEX IF NOT EXISTS idx_project_communications_date ON project_communications(communication_date);
CREATE INDEX IF NOT EXISTS idx_project_communications_type ON project_communications(communication_type);

-- Enable Row Level Security
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_dependencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_budget_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_risks ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_communications ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies
-- Projects Policies
CREATE POLICY "Users can view company projects" ON projects
    FOR SELECT USING (
        company_id IN (
            SELECT company_id FROM user_company_access 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert company projects" ON projects
    FOR INSERT WITH CHECK (
        company_id IN (
            SELECT company_id FROM user_company_access 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update company projects" ON projects
    FOR UPDATE USING (
        company_id IN (
            SELECT company_id FROM user_company_access 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete company projects" ON projects
    FOR DELETE USING (
        company_id IN (
            SELECT company_id FROM user_company_access 
            WHERE user_id = auth.uid()
        )
    );

-- Project Team Members Policies
CREATE POLICY "Users can view project team members" ON project_team_members
    FOR SELECT USING (
        project_id IN (
            SELECT id FROM projects 
            WHERE company_id IN (
                SELECT company_id FROM user_company_access 
                WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can insert project team members" ON project_team_members
    FOR INSERT WITH CHECK (
        project_id IN (
            SELECT id FROM projects 
            WHERE company_id IN (
                SELECT company_id FROM user_company_access 
                WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can update project team members" ON project_team_members
    FOR UPDATE USING (
        project_id IN (
            SELECT id FROM projects 
            WHERE company_id IN (
                SELECT company_id FROM user_company_access 
                WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can delete project team members" ON project_team_members
    FOR DELETE USING (
        project_id IN (
            SELECT id FROM projects 
            WHERE company_id IN (
                SELECT company_id FROM user_company_access 
                WHERE user_id = auth.uid()
            )
        )
    );

-- Tasks Policies
CREATE POLICY "Users can view project tasks" ON tasks
    FOR SELECT USING (
        project_id IN (
            SELECT id FROM projects 
            WHERE company_id IN (
                SELECT company_id FROM user_company_access 
                WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can insert project tasks" ON tasks
    FOR INSERT WITH CHECK (
        project_id IN (
            SELECT id FROM projects 
            WHERE company_id IN (
                SELECT company_id FROM user_company_access 
                WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can update project tasks" ON tasks
    FOR UPDATE USING (
        project_id IN (
            SELECT id FROM projects 
            WHERE company_id IN (
                SELECT company_id FROM user_company_access 
                WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can delete project tasks" ON tasks
    FOR DELETE USING (
        project_id IN (
            SELECT id FROM projects 
            WHERE company_id IN (
                SELECT company_id FROM user_company_access 
                WHERE user_id = auth.uid()
            )
        )
    );

-- Task Dependencies Policies
CREATE POLICY "Users can view task dependencies" ON task_dependencies
    FOR SELECT USING (
        task_id IN (
            SELECT id FROM tasks 
            WHERE project_id IN (
                SELECT id FROM projects 
                WHERE company_id IN (
                    SELECT company_id FROM user_company_access 
                    WHERE user_id = auth.uid()
                )
            )
        )
    );

CREATE POLICY "Users can insert task dependencies" ON task_dependencies
    FOR INSERT WITH CHECK (
        task_id IN (
            SELECT id FROM tasks 
            WHERE project_id IN (
                SELECT id FROM projects 
                WHERE company_id IN (
                    SELECT company_id FROM user_company_access 
                    WHERE user_id = auth.uid()
                )
            )
        )
    );

CREATE POLICY "Users can update task dependencies" ON task_dependencies
    FOR UPDATE USING (
        task_id IN (
            SELECT id FROM tasks 
            WHERE project_id IN (
                SELECT id FROM projects 
                WHERE company_id IN (
                    SELECT company_id FROM user_company_access 
                    WHERE user_id = auth.uid()
                )
            )
        )
    );

CREATE POLICY "Users can delete task dependencies" ON task_dependencies
    FOR DELETE USING (
        task_id IN (
            SELECT id FROM tasks 
            WHERE project_id IN (
                SELECT id FROM projects 
                WHERE company_id IN (
                    SELECT company_id FROM user_company_access 
                    WHERE user_id = auth.uid()
                )
            )
        )
    );

-- Task Tags Policies
CREATE POLICY "Users can view task tags" ON task_tags
    FOR SELECT USING (
        task_id IN (
            SELECT id FROM tasks 
            WHERE project_id IN (
                SELECT id FROM projects 
                WHERE company_id IN (
                    SELECT company_id FROM user_company_access 
                    WHERE user_id = auth.uid()
                )
            )
        )
    );

CREATE POLICY "Users can insert task tags" ON task_tags
    FOR INSERT WITH CHECK (
        task_id IN (
            SELECT id FROM tasks 
            WHERE project_id IN (
                SELECT id FROM projects 
                WHERE company_id IN (
                    SELECT company_id FROM user_company_access 
                    WHERE user_id = auth.uid()
                )
            )
        )
    );

CREATE POLICY "Users can update task tags" ON task_tags
    FOR UPDATE USING (
        task_id IN (
            SELECT id FROM tasks 
            WHERE project_id IN (
                SELECT id FROM projects 
                WHERE company_id IN (
                    SELECT company_id FROM user_company_access 
                    WHERE user_id = auth.uid()
                )
            )
        )
    );

CREATE POLICY "Users can delete task tags" ON task_tags
    FOR DELETE USING (
        task_id IN (
            SELECT id FROM tasks 
            WHERE project_id IN (
                SELECT id FROM projects 
                WHERE company_id IN (
                    SELECT company_id FROM user_company_access 
                    WHERE user_id = auth.uid()
                )
            )
        )
    );

-- Task Comments Policies
CREATE POLICY "Users can view task comments" ON task_comments
    FOR SELECT USING (
        task_id IN (
            SELECT id FROM tasks 
            WHERE project_id IN (
                SELECT id FROM projects 
                WHERE company_id IN (
                    SELECT company_id FROM user_company_access 
                    WHERE user_id = auth.uid()
                )
            )
        )
    );

CREATE POLICY "Users can insert task comments" ON task_comments
    FOR INSERT WITH CHECK (
        task_id IN (
            SELECT id FROM tasks 
            WHERE project_id IN (
                SELECT id FROM projects 
                WHERE company_id IN (
                    SELECT company_id FROM user_company_access 
                    WHERE user_id = auth.uid()
                )
            )
        )
    );

CREATE POLICY "Users can update task comments" ON task_comments
    FOR UPDATE USING (
        task_id IN (
            SELECT id FROM tasks 
            WHERE project_id IN (
                SELECT id FROM projects 
                WHERE company_id IN (
                    SELECT company_id FROM user_company_access 
                    WHERE user_id = auth.uid()
                )
            )
        )
    );

CREATE POLICY "Users can delete task comments" ON task_comments
    FOR DELETE USING (
        task_id IN (
            SELECT id FROM tasks 
            WHERE project_id IN (
                SELECT id FROM projects 
                WHERE company_id IN (
                    SELECT company_id FROM user_company_access 
                    WHERE user_id = auth.uid()
                )
            )
        )
    );

-- Task Attachments Policies
CREATE POLICY "Users can view task attachments" ON task_attachments
    FOR SELECT USING (
        task_id IN (
            SELECT id FROM tasks 
            WHERE project_id IN (
                SELECT id FROM projects 
                WHERE company_id IN (
                    SELECT company_id FROM user_company_access 
                    WHERE user_id = auth.uid()
                )
            )
        )
    );

CREATE POLICY "Users can insert task attachments" ON task_attachments
    FOR INSERT WITH CHECK (
        task_id IN (
            SELECT id FROM tasks 
            WHERE project_id IN (
                SELECT id FROM projects 
                WHERE company_id IN (
                    SELECT company_id FROM user_company_access 
                    WHERE user_id = auth.uid()
                )
            )
        )
    );

CREATE POLICY "Users can update task attachments" ON task_attachments
    FOR UPDATE USING (
        task_id IN (
            SELECT id FROM tasks 
            WHERE project_id IN (
                SELECT id FROM projects 
                WHERE company_id IN (
                    SELECT company_id FROM user_company_access 
                    WHERE user_id = auth.uid()
                )
            )
        )
    );

CREATE POLICY "Users can delete task attachments" ON task_attachments
    FOR DELETE USING (
        task_id IN (
            SELECT id FROM tasks 
            WHERE project_id IN (
                SELECT id FROM projects 
                WHERE company_id IN (
                    SELECT company_id FROM user_company_access 
                    WHERE user_id = auth.uid()
                )
            )
        )
    );

-- Project Milestones Policies
CREATE POLICY "Users can view project milestones" ON project_milestones
    FOR SELECT USING (
        project_id IN (
            SELECT id FROM projects 
            WHERE company_id IN (
                SELECT company_id FROM user_company_access 
                WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can insert project milestones" ON project_milestones
    FOR INSERT WITH CHECK (
        project_id IN (
            SELECT id FROM projects 
            WHERE company_id IN (
                SELECT company_id FROM user_company_access 
                WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can update project milestones" ON project_milestones
    FOR UPDATE USING (
        project_id IN (
            SELECT id FROM projects 
            WHERE company_id IN (
                SELECT company_id FROM user_company_access 
                WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can delete project milestones" ON project_milestones
    FOR DELETE USING (
        project_id IN (
            SELECT id FROM projects 
            WHERE company_id IN (
                SELECT company_id FROM user_company_access 
                WHERE user_id = auth.uid()
            )
        )
    );

-- Time Entries Policies
CREATE POLICY "Users can view project time entries" ON time_entries
    FOR SELECT USING (
        project_id IN (
            SELECT id FROM projects 
            WHERE company_id IN (
                SELECT company_id FROM user_company_access 
                WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can insert project time entries" ON time_entries
    FOR INSERT WITH CHECK (
        project_id IN (
            SELECT id FROM projects 
            WHERE company_id IN (
                SELECT company_id FROM user_company_access 
                WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can update project time entries" ON time_entries
    FOR UPDATE USING (
        project_id IN (
            SELECT id FROM projects 
            WHERE company_id IN (
                SELECT company_id FROM user_company_access 
                WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can delete project time entries" ON time_entries
    FOR DELETE USING (
        project_id IN (
            SELECT id FROM projects 
            WHERE company_id IN (
                SELECT company_id FROM user_company_access 
                WHERE user_id = auth.uid()
            )
        )
    );

-- Project Status History Policies
CREATE POLICY "Users can view project status history" ON project_status_history
    FOR SELECT USING (
        project_id IN (
            SELECT id FROM projects 
            WHERE company_id IN (
                SELECT company_id FROM user_company_access 
                WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can insert project status history" ON project_status_history
    FOR INSERT WITH CHECK (
        project_id IN (
            SELECT id FROM projects 
            WHERE company_id IN (
                SELECT company_id FROM user_company_access 
                WHERE user_id = auth.uid()
            )
        )
    );

-- Project Budget Entries Policies
CREATE POLICY "Users can view project budget entries" ON project_budget_entries
    FOR SELECT USING (
        project_id IN (
            SELECT id FROM projects 
            WHERE company_id IN (
                SELECT company_id FROM user_company_access 
                WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can insert project budget entries" ON project_budget_entries
    FOR INSERT WITH CHECK (
        project_id IN (
            SELECT id FROM projects 
            WHERE company_id IN (
                SELECT company_id FROM user_company_access 
                WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can update project budget entries" ON project_budget_entries
    FOR UPDATE USING (
        project_id IN (
            SELECT id FROM projects 
            WHERE company_id IN (
                SELECT company_id FROM user_company_access 
                WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can delete project budget entries" ON project_budget_entries
    FOR DELETE USING (
        project_id IN (
            SELECT id FROM projects 
            WHERE company_id IN (
                SELECT company_id FROM user_company_access 
                WHERE user_id = auth.uid()
            )
        )
    );

-- Project Documents Policies
CREATE POLICY "Users can view project documents" ON project_documents
    FOR SELECT USING (
        project_id IN (
            SELECT id FROM projects 
            WHERE company_id IN (
                SELECT company_id FROM user_company_access 
                WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can insert project documents" ON project_documents
    FOR INSERT WITH CHECK (
        project_id IN (
            SELECT id FROM projects 
            WHERE company_id IN (
                SELECT company_id FROM user_company_access 
                WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can update project documents" ON project_documents
    FOR UPDATE USING (
        project_id IN (
            SELECT id FROM projects 
            WHERE company_id IN (
                SELECT company_id FROM user_company_access 
                WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can delete project documents" ON project_documents
    FOR DELETE USING (
        project_id IN (
            SELECT id FROM projects 
            WHERE company_id IN (
                SELECT company_id FROM user_company_access 
                WHERE user_id = auth.uid()
            )
        )
    );

-- Project Risks Policies
CREATE POLICY "Users can view project risks" ON project_risks
    FOR SELECT USING (
        project_id IN (
            SELECT id FROM projects 
            WHERE company_id IN (
                SELECT company_id FROM user_company_access 
                WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can insert project risks" ON project_risks
    FOR INSERT WITH CHECK (
        project_id IN (
            SELECT id FROM projects 
            WHERE company_id IN (
                SELECT company_id FROM user_company_access 
                WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can update project risks" ON project_risks
    FOR UPDATE USING (
        project_id IN (
            SELECT id FROM projects 
            WHERE company_id IN (
                SELECT company_id FROM user_company_access 
                WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can delete project risks" ON project_risks
    FOR DELETE USING (
        project_id IN (
            SELECT id FROM projects 
            WHERE company_id IN (
                SELECT company_id FROM user_company_access 
                WHERE user_id = auth.uid()
            )
        )
    );

-- Project Communications Policies
CREATE POLICY "Users can view project communications" ON project_communications
    FOR SELECT USING (
        project_id IN (
            SELECT id FROM projects 
            WHERE company_id IN (
                SELECT company_id FROM user_company_access 
                WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can insert project communications" ON project_communications
    FOR INSERT WITH CHECK (
        project_id IN (
            SELECT id FROM projects 
            WHERE company_id IN (
                SELECT company_id FROM user_company_access 
                WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can update project communications" ON project_communications
    FOR UPDATE USING (
        project_id IN (
            SELECT id FROM projects 
            WHERE company_id IN (
                SELECT company_id FROM user_company_access 
                WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can delete project communications" ON project_communications
    FOR DELETE USING (
        project_id IN (
            SELECT id FROM projects 
            WHERE company_id IN (
                SELECT company_id FROM user_company_access 
                WHERE user_id = auth.uid()
            )
        )
    );

-- Create Functions for Project Management

-- Function to calculate project health score
CREATE OR REPLACE FUNCTION calculate_project_health_score(p_project_id UUID)
RETURNS DECIMAL(3,2) AS $$
DECLARE
    v_score DECIMAL(3,2) := 0;
    v_schedule_score DECIMAL(3,2);
    v_budget_score DECIMAL(3,2);
    v_quality_score DECIMAL(3,2);
    v_project projects%ROWTYPE;
BEGIN
    -- Get project details
    SELECT * INTO v_project FROM projects WHERE id = p_project_id;
    
    IF NOT FOUND THEN
        RETURN 0;
    END IF;

    -- Schedule Score (40% weight)
    IF v_project.status = 'completed' THEN
        v_schedule_score := 5.0;
    ELSIF v_project.end_date < CURRENT_DATE AND v_project.status != 'completed' THEN
        v_schedule_score := 1.0; -- Overdue
    ELSIF v_project.progress >= 80 THEN
        v_schedule_score := 4.0;
    ELSIF v_project.progress >= 60 THEN
        v_schedule_score := 3.5;
    ELSIF v_project.progress >= 40 THEN
        v_schedule_score := 3.0;
    ELSIF v_project.progress >= 20 THEN
        v_schedule_score := 2.5;
    ELSE
        v_schedule_score := 2.0;
    END IF;

    -- Budget Score (30% weight)
    IF v_project.budget IS NULL OR v_project.budget = 0 THEN
        v_budget_score := 3.0; -- Neutral if no budget set
    ELSIF v_project.actual_cost <= v_project.budget * 0.8 THEN
        v_budget_score := 5.0; -- Under budget
    ELSIF v_project.actual_cost <= v_project.budget THEN
        v_budget_score := 4.0; -- On budget
    ELSIF v_project.actual_cost <= v_project.budget * 1.1 THEN
        v_budget_score := 3.0; -- Slightly over budget
    ELSIF v_project.actual_cost <= v_project.budget * 1.2 THEN
        v_budget_score := 2.0; -- Over budget
    ELSE
        v_budget_score := 1.0; -- Significantly over budget
    END IF;

    -- Quality Score (30% weight) - based on task completion rate
    SELECT 
        CASE 
            WHEN COUNT(*) = 0 THEN 3.0
            WHEN COUNT(CASE WHEN status = 'completed' THEN 1 END)::DECIMAL / COUNT(*) >= 0.9 THEN 5.0
            WHEN COUNT(CASE WHEN status = 'completed' THEN 1 END)::DECIMAL / COUNT(*) >= 0.8 THEN 4.0
            WHEN COUNT(CASE WHEN status = 'completed' THEN 1 END)::DECIMAL / COUNT(*) >= 0.7 THEN 3.5
            WHEN COUNT(CASE WHEN status = 'completed' THEN 1 END)::DECIMAL / COUNT(*) >= 0.6 THEN 3.0
            WHEN COUNT(CASE WHEN status = 'completed' THEN 1 END)::DECIMAL / COUNT(*) >= 0.5 THEN 2.5
            ELSE 2.0
        END INTO v_quality_score
    FROM tasks
    WHERE project_id = p_project_id;

    -- Calculate weighted score
    v_score := (v_schedule_score * 0.4) + (v_budget_score * 0.3) + (v_quality_score * 0.3);

    RETURN LEAST(5.0, GREATEST(1.0, v_score));
END;
$$ LANGUAGE plpgsql;

-- Function to check task dependencies
CREATE OR REPLACE FUNCTION check_task_dependencies(p_task_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_blocked BOOLEAN := FALSE;
BEGIN
    -- Check if any dependencies are not completed
    SELECT EXISTS(
        SELECT 1 
        FROM task_dependencies td
        JOIN tasks t ON td.dependency_id = t.id
        WHERE td.task_id = p_task_id
          AND t.status != 'completed'
    ) INTO v_blocked;

    RETURN NOT v_blocked;
END;
$$ LANGUAGE plpgsql;

-- Function to get critical path for a project
CREATE OR REPLACE FUNCTION get_project_critical_path(p_project_id UUID)
RETURNS TABLE (
    task_id UUID,
    task_title VARCHAR(200),
    estimated_hours DECIMAL(8,2),
    start_date DATE,
    due_date DATE,
    is_critical BOOLEAN
) AS $$
BEGIN
    -- This is a simplified critical path calculation
    -- In a real implementation, you would use more sophisticated algorithms
    RETURN QUERY
    WITH RECURSIVE task_path AS (
        -- Start with tasks that have no dependencies
        SELECT 
            t.id,
            t.title,
            t.estimated_hours,
            t.start_date,
            t.due_date,
            t.estimated_hours as path_duration,
            1 as path_length
        FROM tasks t
        WHERE t.project_id = p_project_id
          AND NOT EXISTS (
              SELECT 1 FROM task_dependencies td 
              WHERE td.task_id = t.id
          )
        
        UNION ALL
        
        -- Recursively add dependent tasks
        SELECT 
            t.id,
            t.title,
            t.estimated_hours,
            t.start_date,
            t.due_date,
            tp.path_duration + t.estimated_hours,
            tp.path_length + 1
        FROM tasks t
        JOIN task_dependencies td ON t.id = td.task_id
        JOIN task_path tp ON td.dependency_id = tp.id
        WHERE t.project_id = p_project_id
    ),
    max_duration AS (
        SELECT MAX(path_duration) as max_path_duration
        FROM task_path
    )
    SELECT 
        tp.id,
        tp.title,
        tp.estimated_hours,
        tp.start_date,
        tp.due_date,
        (tp.path_duration = md.max_path_duration) as is_critical
    FROM task_path tp
    CROSS JOIN max_duration md
    ORDER BY tp.start_date;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate project ROI
CREATE OR REPLACE FUNCTION calculate_project_roi(p_project_id UUID)
RETURNS DECIMAL(10,2) AS $$
DECLARE
    v_project projects%ROWTYPE;
    v_total_cost DECIMAL(15,2);
    v_revenue DECIMAL(15,2);
    v_roi DECIMAL(10,2);
BEGIN
    -- Get project details
    SELECT * INTO v_project FROM projects WHERE id = p_project_id;
    
    IF NOT FOUND THEN
        RETURN 0;
    END IF;

    -- Calculate total cost (actual cost + labor cost)
    SELECT 
        COALESCE(v_project.actual_cost, 0) + 
        COALESCE(SUM(te.hours_worked * COALESCE(te.hourly_rate, 0)), 0)
    INTO v_total_cost
    FROM time_entries te
    WHERE te.project_id = p_project_id;

    -- For client projects, revenue could be from invoices
    -- For internal projects, this might be estimated value
    IF v_project.project_type = 'client' THEN
        -- Get revenue from invoices (if invoice system is integrated)
        v_revenue := COALESCE(v_project.budget, 0);
    ELSE
        -- For internal projects, use budget as estimated value
        v_revenue := COALESCE(v_project.budget, 0);
    END IF;

    -- Calculate ROI: (Revenue - Cost) / Cost * 100
    IF v_total_cost > 0 THEN
        v_roi := ((v_revenue - v_total_cost) / v_total_cost) * 100;
    ELSE
        v_roi := 0;
    END IF;

    RETURN v_roi;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to update project progress and costs
CREATE OR REPLACE FUNCTION update_project_progress_trigger()
RETURNS TRIGGER AS $$
BEGIN
    -- Update project progress based on task completion
    UPDATE projects
    SET progress = (
        SELECT 
            CASE 
                WHEN COUNT(*) = 0 THEN 0
                ELSE ROUND(AVG(COALESCE(progress, 0)))
            END
        FROM tasks
        WHERE project_id = COALESCE(NEW.project_id, OLD.project_id)
    ),
    updated_at = NOW()
    WHERE id = COALESCE(NEW.project_id, OLD.project_id);

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_project_progress
    AFTER INSERT OR UPDATE OR DELETE ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_project_progress_trigger();

-- Create trigger to update project actual cost
CREATE OR REPLACE FUNCTION update_project_cost_trigger()
RETURNS TRIGGER AS $$
BEGIN
    -- Update project actual cost based on time entries
    UPDATE projects
    SET actual_cost = (
        SELECT COALESCE(SUM(hours_worked * COALESCE(hourly_rate, 0)), 0)
        FROM time_entries
        WHERE project_id = COALESCE(NEW.project_id, OLD.project_id)
    ),
    updated_at = NOW()
    WHERE id = COALESCE(NEW.project_id, OLD.project_id);

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_project_cost
    AFTER INSERT OR UPDATE OR DELETE ON time_entries
    FOR EACH ROW
    EXECUTE FUNCTION update_project_cost_trigger();

-- Create trigger to update task actual hours
CREATE OR REPLACE FUNCTION update_task_hours_trigger()
RETURNS TRIGGER AS $$
BEGIN
    -- Update task actual hours based on time entries
    IF NEW.task_id IS NOT NULL THEN
        UPDATE tasks
        SET actual_hours = (
            SELECT COALESCE(SUM(hours_worked), 0)
            FROM time_entries
            WHERE task_id = NEW.task_id
        ),
        updated_at = NOW()
        WHERE id = NEW.task_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_task_hours
    AFTER INSERT OR UPDATE ON time_entries
    FOR EACH ROW
    EXECUTE FUNCTION update_task_hours_trigger();

-- Create trigger to auto-update milestone status
CREATE OR REPLACE FUNCTION update_milestone_status_trigger()
RETURNS TRIGGER AS $$
BEGIN
    -- Auto-mark milestones as overdue if past due date
    UPDATE project_milestones
    SET status = 'overdue'
    WHERE due_date < CURRENT_DATE
      AND status = 'pending';

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create a scheduled job to run milestone status updates (this would typically be done via cron or similar)
-- For now, we'll create the function that can be called manually or via a scheduler

-- Create view for project dashboard
CREATE OR REPLACE VIEW project_dashboard AS
SELECT 
    p.id,
    p.name,
    p.status,
    p.priority,
    p.progress,
    p.start_date,
    p.end_date,
    p.budget,
    p.actual_cost,
    CONCAT(pm.first_name, ' ', pm.last_name) as project_manager,
    c.name as client_name,
    COUNT(DISTINCT t.id) as total_tasks,
    COUNT(DISTINCT CASE WHEN t.status = 'completed' THEN t.id END) as completed_tasks,
    COUNT(DISTINCT CASE WHEN t.due_date < CURRENT_DATE AND t.status != 'completed' THEN t.id END) as overdue_tasks,
    COUNT(DISTINCT tm.employee_id) as team_size,
    COALESCE(SUM(te.hours_worked), 0) as total_hours_logged,
    calculate_project_health_score(p.id) as health_score
FROM projects p
LEFT JOIN employees pm ON p.project_manager_id = pm.id
LEFT JOIN customers c ON p.client_id = c.id
LEFT JOIN tasks t ON p.id = t.project_id
LEFT JOIN project_team_members tm ON p.id = tm.project_id
LEFT JOIN time_entries te ON p.id = te.project_id
GROUP BY p.id, p.name, p.status, p.priority, p.progress, p.start_date, p.end_date, 
         p.budget, p.actual_cost, pm.first_name, pm.last_name, c.name;