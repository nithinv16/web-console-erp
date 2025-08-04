-- Leads table
CREATE TABLE IF NOT EXISTS leads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    company_name VARCHAR(255),
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    source VARCHAR(50) NOT NULL DEFAULT 'website' CHECK (source IN ('website', 'referral', 'social_media', 'advertisement', 'cold_call', 'trade_show', 'other')),
    status VARCHAR(20) NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'unqualified', 'converted')),
    industry VARCHAR(100),
    job_title VARCHAR(100),
    estimated_value DECIMAL(15,2),
    notes TEXT,
    address JSONB,
    social_profiles JSONB,
    tags TEXT[],
    assigned_to UUID REFERENCES employees(id),
    converted_to_customer_id UUID REFERENCES customers(id),
    converted_at TIMESTAMP WITH TIME ZONE,
    last_contacted_at TIMESTAMP WITH TIME ZONE,
    next_follow_up_date DATE,
    lead_score INTEGER DEFAULT 0 CHECK (lead_score >= 0 AND lead_score <= 100),
    campaign_id UUID REFERENCES campaigns(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Opportunities table
CREATE TABLE IF NOT EXISTS opportunities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    customer_id UUID REFERENCES customers(id),
    lead_id UUID REFERENCES leads(id),
    stage VARCHAR(20) NOT NULL DEFAULT 'prospecting' CHECK (stage IN ('prospecting', 'qualification', 'proposal', 'negotiation', 'closed_won', 'closed_lost')),
    value DECIMAL(15,2) NOT NULL DEFAULT 0,
    probability INTEGER DEFAULT 50 CHECK (probability >= 0 AND probability <= 100),
    expected_close_date DATE,
    actual_close_date DATE,
    source VARCHAR(100),
    description TEXT,
    competitor VARCHAR(255),
    next_action TEXT,
    next_action_date DATE,
    assigned_to UUID REFERENCES employees(id),
    created_by UUID REFERENCES employees(id),
    closed_reason TEXT,
    campaign_id UUID REFERENCES campaigns(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CHECK (actual_close_date IS NULL OR actual_close_date >= expected_close_date OR stage IN ('closed_won', 'closed_lost'))
);

-- Contacts table
CREATE TABLE IF NOT EXISTS contacts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    job_title VARCHAR(100),
    department VARCHAR(100),
    customer_id UUID REFERENCES customers(id),
    lead_id UUID REFERENCES leads(id),
    is_primary BOOLEAN DEFAULT false,
    address JSONB,
    social_profiles JSONB,
    notes TEXT,
    birth_date DATE,
    preferred_contact_method VARCHAR(20) DEFAULT 'email' CHECK (preferred_contact_method IN ('email', 'phone', 'sms', 'whatsapp')),
    timezone VARCHAR(50),
    language VARCHAR(10) DEFAULT 'en',
    opt_out_marketing BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(company_id, email)
);

-- Activities table
CREATE TABLE IF NOT EXISTS activities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('call', 'email', 'meeting', 'task', 'note', 'demo', 'proposal')),
    subject VARCHAR(255) NOT NULL,
    description TEXT,
    due_date TIMESTAMP WITH TIME ZONE,
    completed_date TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
    priority VARCHAR(10) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    customer_id UUID REFERENCES customers(id),
    lead_id UUID REFERENCES leads(id),
    opportunity_id UUID REFERENCES opportunities(id),
    contact_id UUID REFERENCES contacts(id),
    assigned_to UUID REFERENCES employees(id),
    created_by UUID REFERENCES employees(id),
    duration_minutes INTEGER,
    outcome TEXT,
    location VARCHAR(255),
    meeting_url TEXT,
    attachments JSONB, -- Array of file URLs
    reminder_sent BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Campaigns table
CREATE TABLE IF NOT EXISTS campaigns (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('email', 'social_media', 'advertisement', 'event', 'webinar', 'content')),
    status VARCHAR(20) DEFAULT 'planning' CHECK (status IN ('planning', 'active', 'paused', 'completed')),
    start_date DATE NOT NULL,
    end_date DATE,
    budget DECIMAL(15,2),
    actual_cost DECIMAL(15,2) DEFAULT 0,
    target_audience TEXT,
    description TEXT,
    goals TEXT,
    channels TEXT[],
    success_metrics JSONB,
    results JSONB,
    created_by UUID REFERENCES employees(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CHECK (end_date IS NULL OR end_date >= start_date)
);

-- Campaign Members table (many-to-many relationship)
CREATE TABLE IF NOT EXISTS campaign_members (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    lead_id UUID REFERENCES leads(id),
    contact_id UUID REFERENCES contacts(id),
    customer_id UUID REFERENCES customers(id),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'responded', 'unsubscribed', 'bounced')),
    response_date TIMESTAMP WITH TIME ZONE,
    response_type VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CHECK ((lead_id IS NOT NULL)::integer + (contact_id IS NOT NULL)::integer + (customer_id IS NOT NULL)::integer = 1)
);

-- Sales Pipeline Stages table (customizable stages per company)
CREATE TABLE IF NOT EXISTS pipeline_stages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    stage_name VARCHAR(100) NOT NULL,
    stage_order INTEGER NOT NULL,
    default_probability INTEGER DEFAULT 50 CHECK (default_probability >= 0 AND default_probability <= 100),
    is_closed_stage BOOLEAN DEFAULT false,
    is_won_stage BOOLEAN DEFAULT false,
    color VARCHAR(7) DEFAULT '#3B82F6', -- Hex color code
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(company_id, stage_name),
    UNIQUE(company_id, stage_order)
);

-- Lead Sources table (customizable sources per company)
CREATE TABLE IF NOT EXISTS lead_sources (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    source_name VARCHAR(100) NOT NULL,
    description TEXT,
    cost_per_lead DECIMAL(10,2),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(company_id, source_name)
);

-- Email Templates table
CREATE TABLE IF NOT EXISTS email_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    body_html TEXT NOT NULL,
    body_text TEXT,
    template_type VARCHAR(50) DEFAULT 'general' CHECK (template_type IN ('general', 'welcome', 'follow_up', 'proposal', 'thank_you', 'reminder')),
    variables JSONB, -- Available template variables
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES employees(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Email Tracking table
CREATE TABLE IF NOT EXISTS email_tracking (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    activity_id UUID REFERENCES activities(id) ON DELETE CASCADE,
    recipient_email VARCHAR(255) NOT NULL,
    subject VARCHAR(255),
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    delivered_at TIMESTAMP WITH TIME ZONE,
    opened_at TIMESTAMP WITH TIME ZONE,
    clicked_at TIMESTAMP WITH TIME ZONE,
    bounced_at TIMESTAMP WITH TIME ZONE,
    unsubscribed_at TIMESTAMP WITH TIME ZONE,
    open_count INTEGER DEFAULT 0,
    click_count INTEGER DEFAULT 0,
    tracking_id UUID DEFAULT gen_random_uuid(),
    email_provider VARCHAR(50),
    status VARCHAR(20) DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'opened', 'clicked', 'bounced', 'unsubscribed'))
);

-- Notes table (for general notes on leads, opportunities, customers)
CREATE TABLE IF NOT EXISTS notes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    note_type VARCHAR(20) DEFAULT 'general' CHECK (note_type IN ('general', 'call', 'meeting', 'email', 'internal')),
    customer_id UUID REFERENCES customers(id),
    lead_id UUID REFERENCES leads(id),
    opportunity_id UUID REFERENCES opportunities(id),
    contact_id UUID REFERENCES contacts(id),
    activity_id UUID REFERENCES activities(id),
    created_by UUID REFERENCES employees(id),
    is_private BOOLEAN DEFAULT false,
    attachments JSONB, -- Array of file URLs
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CHECK ((customer_id IS NOT NULL)::integer + (lead_id IS NOT NULL)::integer + (opportunity_id IS NOT NULL)::integer + (contact_id IS NOT NULL)::integer + (activity_id IS NOT NULL)::integer >= 1)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_leads_company_id ON leads(company_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_source ON leads(source);
CREATE INDEX IF NOT EXISTS idx_leads_assigned_to ON leads(assigned_to);
CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at);

CREATE INDEX IF NOT EXISTS idx_opportunities_company_id ON opportunities(company_id);
CREATE INDEX IF NOT EXISTS idx_opportunities_stage ON opportunities(stage);
CREATE INDEX IF NOT EXISTS idx_opportunities_customer_id ON opportunities(customer_id);
CREATE INDEX IF NOT EXISTS idx_opportunities_lead_id ON opportunities(lead_id);
CREATE INDEX IF NOT EXISTS idx_opportunities_assigned_to ON opportunities(assigned_to);
CREATE INDEX IF NOT EXISTS idx_opportunities_expected_close_date ON opportunities(expected_close_date);
CREATE INDEX IF NOT EXISTS idx_opportunities_value ON opportunities(value);

CREATE INDEX IF NOT EXISTS idx_contacts_company_id ON contacts(company_id);
CREATE INDEX IF NOT EXISTS idx_contacts_customer_id ON contacts(customer_id);
CREATE INDEX IF NOT EXISTS idx_contacts_lead_id ON contacts(lead_id);
CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts(email);
CREATE INDEX IF NOT EXISTS idx_contacts_is_primary ON contacts(is_primary);

CREATE INDEX IF NOT EXISTS idx_activities_company_id ON activities(company_id);
CREATE INDEX IF NOT EXISTS idx_activities_type ON activities(type);
CREATE INDEX IF NOT EXISTS idx_activities_status ON activities(status);
CREATE INDEX IF NOT EXISTS idx_activities_assigned_to ON activities(assigned_to);
CREATE INDEX IF NOT EXISTS idx_activities_due_date ON activities(due_date);
CREATE INDEX IF NOT EXISTS idx_activities_customer_id ON activities(customer_id);
CREATE INDEX IF NOT EXISTS idx_activities_lead_id ON activities(lead_id);
CREATE INDEX IF NOT EXISTS idx_activities_opportunity_id ON activities(opportunity_id);

CREATE INDEX IF NOT EXISTS idx_campaigns_company_id ON campaigns(company_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_type ON campaigns(type);
CREATE INDEX IF NOT EXISTS idx_campaigns_start_date ON campaigns(start_date);

CREATE INDEX IF NOT EXISTS idx_campaign_members_campaign_id ON campaign_members(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_members_lead_id ON campaign_members(lead_id);
CREATE INDEX IF NOT EXISTS idx_campaign_members_contact_id ON campaign_members(contact_id);
CREATE INDEX IF NOT EXISTS idx_campaign_members_customer_id ON campaign_members(customer_id);

CREATE INDEX IF NOT EXISTS idx_pipeline_stages_company_id ON pipeline_stages(company_id);
CREATE INDEX IF NOT EXISTS idx_pipeline_stages_order ON pipeline_stages(stage_order);

CREATE INDEX IF NOT EXISTS idx_email_tracking_activity_id ON email_tracking(activity_id);
CREATE INDEX IF NOT EXISTS idx_email_tracking_recipient ON email_tracking(recipient_email);
CREATE INDEX IF NOT EXISTS idx_email_tracking_sent_at ON email_tracking(sent_at);

CREATE INDEX IF NOT EXISTS idx_notes_company_id ON notes(company_id);
CREATE INDEX IF NOT EXISTS idx_notes_customer_id ON notes(customer_id);
CREATE INDEX IF NOT EXISTS idx_notes_lead_id ON notes(lead_id);
CREATE INDEX IF NOT EXISTS idx_notes_opportunity_id ON notes(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_notes_created_at ON notes(created_at);

-- Enable Row Level Security
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipeline_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their company's leads" ON leads
    FOR SELECT USING (company_id IN (
        SELECT c.id FROM companies c
        JOIN auth.users u ON u.id = auth.uid()
        WHERE c.created_by = u.email OR c.id = ANY(
            SELECT company_id FROM employees WHERE user_id = u.id
        )
    ));

CREATE POLICY "Users can manage their company's leads" ON leads
    FOR ALL USING (company_id IN (
        SELECT c.id FROM companies c
        JOIN auth.users u ON u.id = auth.uid()
        WHERE c.created_by = u.email OR c.id = ANY(
            SELECT company_id FROM employees WHERE user_id = u.id
        )
    ));

CREATE POLICY "Users can view their company's opportunities" ON opportunities
    FOR SELECT USING (company_id IN (
        SELECT c.id FROM companies c
        JOIN auth.users u ON u.id = auth.uid()
        WHERE c.created_by = u.email OR c.id = ANY(
            SELECT company_id FROM employees WHERE user_id = u.id
        )
    ));

CREATE POLICY "Users can manage their company's opportunities" ON opportunities
    FOR ALL USING (company_id IN (
        SELECT c.id FROM companies c
        JOIN auth.users u ON u.id = auth.uid()
        WHERE c.created_by = u.email OR c.id = ANY(
            SELECT company_id FROM employees WHERE user_id = u.id
        )
    ));

CREATE POLICY "Users can view their company's contacts" ON contacts
    FOR SELECT USING (company_id IN (
        SELECT c.id FROM companies c
        JOIN auth.users u ON u.id = auth.uid()
        WHERE c.created_by = u.email OR c.id = ANY(
            SELECT company_id FROM employees WHERE user_id = u.id
        )
    ));

CREATE POLICY "Users can manage their company's contacts" ON contacts
    FOR ALL USING (company_id IN (
        SELECT c.id FROM companies c
        JOIN auth.users u ON u.id = auth.uid()
        WHERE c.created_by = u.email OR c.id = ANY(
            SELECT company_id FROM employees WHERE user_id = u.id
        )
    ));

CREATE POLICY "Users can view their company's activities" ON activities
    FOR SELECT USING (company_id IN (
        SELECT c.id FROM companies c
        JOIN auth.users u ON u.id = auth.uid()
        WHERE c.created_by = u.email OR c.id = ANY(
            SELECT company_id FROM employees WHERE user_id = u.id
        )
    ));

CREATE POLICY "Users can manage their company's activities" ON activities
    FOR ALL USING (company_id IN (
        SELECT c.id FROM companies c
        JOIN auth.users u ON u.id = auth.uid()
        WHERE c.created_by = u.email OR c.id = ANY(
            SELECT company_id FROM employees WHERE user_id = u.id
        )
    ));

CREATE POLICY "Users can view their company's campaigns" ON campaigns
    FOR SELECT USING (company_id IN (
        SELECT c.id FROM companies c
        JOIN auth.users u ON u.id = auth.uid()
        WHERE c.created_by = u.email OR c.id = ANY(
            SELECT company_id FROM employees WHERE user_id = u.id
        )
    ));

CREATE POLICY "Users can manage their company's campaigns" ON campaigns
    FOR ALL USING (company_id IN (
        SELECT c.id FROM companies c
        JOIN auth.users u ON u.id = auth.uid()
        WHERE c.created_by = u.email OR c.id = ANY(
            SELECT company_id FROM employees WHERE user_id = u.id
        )
    ));

-- Similar policies for other tables
CREATE POLICY "Users can view their company's campaign members" ON campaign_members
    FOR SELECT USING (campaign_id IN (
        SELECT id FROM campaigns WHERE company_id IN (
            SELECT c.id FROM companies c
            JOIN auth.users u ON u.id = auth.uid()
            WHERE c.created_by = u.email OR c.id = ANY(
                SELECT company_id FROM employees WHERE user_id = u.id
            )
        )
    ));

CREATE POLICY "Users can manage their company's campaign members" ON campaign_members
    FOR ALL USING (campaign_id IN (
        SELECT id FROM campaigns WHERE company_id IN (
            SELECT c.id FROM companies c
            JOIN auth.users u ON u.id = auth.uid()
            WHERE c.created_by = u.email OR c.id = ANY(
                SELECT company_id FROM employees WHERE user_id = u.id
            )
        )
    ));

CREATE POLICY "Users can view their company's pipeline stages" ON pipeline_stages
    FOR SELECT USING (company_id IN (
        SELECT c.id FROM companies c
        JOIN auth.users u ON u.id = auth.uid()
        WHERE c.created_by = u.email OR c.id = ANY(
            SELECT company_id FROM employees WHERE user_id = u.id
        )
    ));

CREATE POLICY "Users can manage their company's pipeline stages" ON pipeline_stages
    FOR ALL USING (company_id IN (
        SELECT c.id FROM companies c
        JOIN auth.users u ON u.id = auth.uid()
        WHERE c.created_by = u.email OR c.id = ANY(
            SELECT company_id FROM employees WHERE user_id = u.id
        )
    ));

CREATE POLICY "Users can view their company's lead sources" ON lead_sources
    FOR SELECT USING (company_id IN (
        SELECT c.id FROM companies c
        JOIN auth.users u ON u.id = auth.uid()
        WHERE c.created_by = u.email OR c.id = ANY(
            SELECT company_id FROM employees WHERE user_id = u.id
        )
    ));

CREATE POLICY "Users can manage their company's lead sources" ON lead_sources
    FOR ALL USING (company_id IN (
        SELECT c.id FROM companies c
        JOIN auth.users u ON u.id = auth.uid()
        WHERE c.created_by = u.email OR c.id = ANY(
            SELECT company_id FROM employees WHERE user_id = u.id
        )
    ));

CREATE POLICY "Users can view their company's email templates" ON email_templates
    FOR SELECT USING (company_id IN (
        SELECT c.id FROM companies c
        JOIN auth.users u ON u.id = auth.uid()
        WHERE c.created_by = u.email OR c.id = ANY(
            SELECT company_id FROM employees WHERE user_id = u.id
        )
    ));

CREATE POLICY "Users can manage their company's email templates" ON email_templates
    FOR ALL USING (company_id IN (
        SELECT c.id FROM companies c
        JOIN auth.users u ON u.id = auth.uid()
        WHERE c.created_by = u.email OR c.id = ANY(
            SELECT company_id FROM employees WHERE user_id = u.id
        )
    ));

CREATE POLICY "Users can view their company's email tracking" ON email_tracking
    FOR SELECT USING (company_id IN (
        SELECT c.id FROM companies c
        JOIN auth.users u ON u.id = auth.uid()
        WHERE c.created_by = u.email OR c.id = ANY(
            SELECT company_id FROM employees WHERE user_id = u.id
        )
    ));

CREATE POLICY "Users can manage their company's email tracking" ON email_tracking
    FOR ALL USING (company_id IN (
        SELECT c.id FROM companies c
        JOIN auth.users u ON u.id = auth.uid()
        WHERE c.created_by = u.email OR c.id = ANY(
            SELECT company_id FROM employees WHERE user_id = u.id
        )
    ));

CREATE POLICY "Users can view their company's notes" ON notes
    FOR SELECT USING (company_id IN (
        SELECT c.id FROM companies c
        JOIN auth.users u ON u.id = auth.uid()
        WHERE c.created_by = u.email OR c.id = ANY(
            SELECT company_id FROM employees WHERE user_id = u.id
        )
    ));

CREATE POLICY "Users can manage their company's notes" ON notes
    FOR ALL USING (company_id IN (
        SELECT c.id FROM companies c
        JOIN auth.users u ON u.id = auth.uid()
        WHERE c.created_by = u.email OR c.id = ANY(
            SELECT company_id FROM employees WHERE user_id = u.id
        )
    ));

-- Insert default pipeline stages for companies
INSERT INTO pipeline_stages (company_id, stage_name, stage_order, default_probability, is_closed_stage, is_won_stage, color)
SELECT 
    c.id,
    stages.stage_name,
    stages.stage_order,
    stages.default_probability,
    stages.is_closed_stage,
    stages.is_won_stage,
    stages.color
FROM companies c
CROSS JOIN (
    VALUES 
    ('Prospecting', 1, 10, false, false, '#EF4444'),
    ('Qualification', 2, 25, false, false, '#F97316'),
    ('Proposal', 3, 50, false, false, '#EAB308'),
    ('Negotiation', 4, 75, false, false, '#3B82F6'),
    ('Closed Won', 5, 100, true, true, '#10B981'),
    ('Closed Lost', 6, 0, true, false, '#6B7280')
) AS stages(stage_name, stage_order, default_probability, is_closed_stage, is_won_stage, color)
WHERE NOT EXISTS (
    SELECT 1 FROM pipeline_stages ps 
    WHERE ps.company_id = c.id AND ps.stage_name = stages.stage_name
);

-- Insert default lead sources for companies
INSERT INTO lead_sources (company_id, source_name, description)
SELECT 
    c.id,
    sources.source_name,
    sources.description
FROM companies c
CROSS JOIN (
    VALUES 
    ('Website', 'Leads from company website forms'),
    ('Referral', 'Leads from customer referrals'),
    ('Social Media', 'Leads from social media platforms'),
    ('Advertisement', 'Leads from paid advertisements'),
    ('Cold Call', 'Leads from cold calling campaigns'),
    ('Trade Show', 'Leads from trade shows and events'),
    ('Email Campaign', 'Leads from email marketing campaigns'),
    ('Content Marketing', 'Leads from blog posts and content'),
    ('SEO/Organic', 'Leads from search engine optimization'),
    ('Partner', 'Leads from business partners')
) AS sources(source_name, description)
WHERE NOT EXISTS (
    SELECT 1 FROM lead_sources ls 
    WHERE ls.company_id = c.id AND ls.source_name = sources.source_name
);

-- Insert default email templates for companies
INSERT INTO email_templates (company_id, name, subject, body_html, body_text, template_type)
SELECT 
    c.id,
    templates.name,
    templates.subject,
    templates.body_html,
    templates.body_text,
    templates.template_type
FROM companies c
CROSS JOIN (
    VALUES 
    ('Welcome Email', 'Welcome to {{company_name}}!', 
     '<h2>Welcome {{first_name}}!</h2><p>Thank you for your interest in {{company_name}}. We''re excited to work with you.</p>',
     'Welcome {{first_name}}! Thank you for your interest in {{company_name}}. We''re excited to work with you.',
     'welcome'),
    ('Follow Up', 'Following up on our conversation', 
     '<p>Hi {{first_name}},</p><p>I wanted to follow up on our recent conversation about {{topic}}. Do you have any questions?</p>',
     'Hi {{first_name}}, I wanted to follow up on our recent conversation about {{topic}}. Do you have any questions?',
     'follow_up'),
    ('Proposal', 'Proposal for {{company_name}}', 
     '<p>Dear {{first_name}},</p><p>Please find attached our proposal for {{project_name}}. We look forward to your feedback.</p>',
     'Dear {{first_name}}, Please find attached our proposal for {{project_name}}. We look forward to your feedback.',
     'proposal'),
    ('Thank You', 'Thank you for choosing {{company_name}}', 
     '<p>Dear {{first_name}},</p><p>Thank you for choosing {{company_name}}. We appreciate your business and look forward to serving you.</p>',
     'Dear {{first_name}}, Thank you for choosing {{company_name}}. We appreciate your business and look forward to serving you.',
     'thank_you')
) AS templates(name, subject, body_html, body_text, template_type)
WHERE NOT EXISTS (
    SELECT 1 FROM email_templates et 
    WHERE et.company_id = c.id AND et.name = templates.name
);

-- Create triggers for updating timestamps
CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON leads
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_opportunities_updated_at BEFORE UPDATE ON opportunities
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contacts_updated_at BEFORE UPDATE ON contacts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_activities_updated_at BEFORE UPDATE ON activities
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_campaigns_updated_at BEFORE UPDATE ON campaigns
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pipeline_stages_updated_at BEFORE UPDATE ON pipeline_stages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lead_sources_updated_at BEFORE UPDATE ON lead_sources
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_templates_updated_at BEFORE UPDATE ON email_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notes_updated_at BEFORE UPDATE ON notes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();