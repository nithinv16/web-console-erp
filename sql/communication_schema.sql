-- Communication Schema
-- This schema handles emails, notifications, messaging, conversations, and templates

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Email Templates Table
CREATE TABLE email_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    category VARCHAR(20) NOT NULL CHECK (category IN ('marketing', 'transactional', 'notification', 'system')),
    subject_template TEXT NOT NULL,
    body_template TEXT NOT NULL,
    body_type VARCHAR(10) NOT NULL DEFAULT 'html' CHECK (body_type IN ('plain', 'html')),
    variables TEXT[] NOT NULL DEFAULT '{}',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_by UUID NOT NULL REFERENCES employees(id) ON DELETE RESTRICT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT unique_template_name_per_company UNIQUE (company_id, name)
);

-- Emails Table
CREATE TABLE emails (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    from_email VARCHAR(255) NOT NULL,
    from_name VARCHAR(200),
    to_emails TEXT[] NOT NULL,
    cc_emails TEXT[] NOT NULL DEFAULT '{}',
    bcc_emails TEXT[] NOT NULL DEFAULT '{}',
    subject VARCHAR(500) NOT NULL,
    body TEXT NOT NULL,
    body_type VARCHAR(10) NOT NULL DEFAULT 'html' CHECK (body_type IN ('plain', 'html')),
    priority VARCHAR(10) NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'queued', 'sent', 'failed', 'bounced')),
    scheduled_at TIMESTAMP WITH TIME ZONE,
    sent_at TIMESTAMP WITH TIME ZONE,
    template_id UUID REFERENCES email_templates(id) ON DELETE SET NULL,
    template_variables JSONB,
    tracking_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    read_receipt BOOLEAN NOT NULL DEFAULT FALSE,
    open_count INTEGER NOT NULL DEFAULT 0,
    click_count INTEGER NOT NULL DEFAULT 0,
    bounce_reason TEXT,
    error_message TEXT,
    created_by UUID NOT NULL REFERENCES employees(id) ON DELETE RESTRICT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Email Attachments Table
CREATE TABLE email_attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email_id UUID NOT NULL REFERENCES emails(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    file_size INTEGER NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Email Tracking Events Table
CREATE TABLE email_tracking_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email_id UUID NOT NULL REFERENCES emails(id) ON DELETE CASCADE,
    event_type VARCHAR(20) NOT NULL CHECK (event_type IN ('sent', 'delivered', 'opened', 'clicked', 'bounced', 'complained')),
    recipient_email VARCHAR(255) NOT NULL,
    event_data JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notifications Table
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('info', 'warning', 'error', 'success')),
    category VARCHAR(20) NOT NULL CHECK (category IN ('system', 'task', 'approval', 'reminder', 'alert', 'message')),
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    data JSONB,
    channels TEXT[] NOT NULL DEFAULT '{"in_app"}' CHECK (channels <@ '{"in_app", "email", "sms", "push"}'),
    priority VARCHAR(10) NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    read_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    action_url VARCHAR(500),
    action_text VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Conversations Table
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(200),
    type VARCHAR(20) NOT NULL CHECK (type IN ('direct', 'group', 'channel', 'support')),
    description TEXT,
    is_private BOOLEAN NOT NULL DEFAULT FALSE,
    created_by UUID NOT NULL REFERENCES employees(id) ON DELETE RESTRICT,
    last_message_id UUID,
    last_message_at TIMESTAMP WITH TIME ZONE,
    participant_count INTEGER NOT NULL DEFAULT 0,
    is_archived BOOLEAN NOT NULL DEFAULT FALSE,
    archived_at TIMESTAMP WITH TIME ZONE,
    archived_by UUID REFERENCES employees(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Conversation Participants Table
CREATE TABLE conversation_participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    user_name VARCHAR(200) NOT NULL,
    user_avatar VARCHAR(500),
    role VARCHAR(20) NOT NULL DEFAULT 'member' CHECK (role IN ('member', 'admin', 'moderator')),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    left_at TIMESTAMP WITH TIME ZONE,
    last_read_at TIMESTAMP WITH TIME ZONE,
    is_muted BOOLEAN NOT NULL DEFAULT FALSE,
    muted_until TIMESTAMP WITH TIME ZONE,
    
    CONSTRAINT unique_conversation_participant UNIQUE (conversation_id, user_id)
);

-- Messages Table
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES employees(id) ON DELETE RESTRICT,
    sender_name VARCHAR(200) NOT NULL,
    sender_avatar VARCHAR(500),
    message_type VARCHAR(20) NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'file', 'image', 'system')),
    content TEXT NOT NULL,
    reply_to_id UUID REFERENCES messages(id) ON DELETE SET NULL,
    is_edited BOOLEAN NOT NULL DEFAULT FALSE,
    edited_at TIMESTAMP WITH TIME ZONE,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at TIMESTAMP WITH TIME ZONE,
    mentions TEXT[] NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Message Attachments Table
CREATE TABLE message_attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    file_size INTEGER NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    thumbnail_path VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Message Reactions Table
CREATE TABLE message_reactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    user_name VARCHAR(200) NOT NULL,
    emoji VARCHAR(10) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT unique_message_user_emoji UNIQUE (message_id, user_id, emoji)
);

-- Message Read Receipts Table
CREATE TABLE message_read_receipts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT unique_message_user_read UNIQUE (message_id, user_id)
);

-- Communication Settings Table
CREATE TABLE communication_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    user_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    setting_type VARCHAR(20) NOT NULL CHECK (setting_type IN ('email', 'notification', 'messaging')),
    setting_key VARCHAR(100) NOT NULL,
    setting_value JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT unique_user_setting UNIQUE (user_id, setting_type, setting_key),
    CONSTRAINT unique_company_setting UNIQUE (company_id, setting_type, setting_key)
);

-- Email Campaigns Table
CREATE TABLE email_campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    template_id UUID REFERENCES email_templates(id) ON DELETE RESTRICT,
    subject VARCHAR(500) NOT NULL,
    from_email VARCHAR(255) NOT NULL,
    from_name VARCHAR(200),
    recipient_list JSONB NOT NULL, -- Array of email addresses or segments
    schedule_type VARCHAR(20) NOT NULL DEFAULT 'immediate' CHECK (schedule_type IN ('immediate', 'scheduled', 'recurring')),
    scheduled_at TIMESTAMP WITH TIME ZONE,
    recurrence_rule VARCHAR(100), -- RRULE format
    status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sending', 'sent', 'paused', 'cancelled')),
    total_recipients INTEGER NOT NULL DEFAULT 0,
    sent_count INTEGER NOT NULL DEFAULT 0,
    delivered_count INTEGER NOT NULL DEFAULT 0,
    opened_count INTEGER NOT NULL DEFAULT 0,
    clicked_count INTEGER NOT NULL DEFAULT 0,
    bounced_count INTEGER NOT NULL DEFAULT 0,
    unsubscribed_count INTEGER NOT NULL DEFAULT 0,
    created_by UUID NOT NULL REFERENCES employees(id) ON DELETE RESTRICT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT unique_campaign_name_per_company UNIQUE (company_id, name)
);

-- Communication Logs Table
CREATE TABLE communication_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    log_type VARCHAR(20) NOT NULL CHECK (log_type IN ('email', 'notification', 'message', 'campaign')),
    reference_id UUID NOT NULL, -- ID of the email, notification, message, or campaign
    action VARCHAR(50) NOT NULL,
    details JSONB,
    user_id UUID REFERENCES employees(id) ON DELETE SET NULL,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add foreign key constraint for last_message_id after messages table is created
ALTER TABLE conversations ADD CONSTRAINT fk_conversations_last_message
    FOREIGN KEY (last_message_id) REFERENCES messages(id) ON DELETE SET NULL;

-- Indexes for Performance
CREATE INDEX idx_email_templates_company_id ON email_templates(company_id);
CREATE INDEX idx_email_templates_category ON email_templates(category);
CREATE INDEX idx_email_templates_is_active ON email_templates(is_active);
CREATE INDEX idx_email_templates_created_by ON email_templates(created_by);

CREATE INDEX idx_emails_company_id ON emails(company_id);
CREATE INDEX idx_emails_status ON emails(status);
CREATE INDEX idx_emails_priority ON emails(priority);
CREATE INDEX idx_emails_created_by ON emails(created_by);
CREATE INDEX idx_emails_created_at ON emails(created_at);
CREATE INDEX idx_emails_scheduled_at ON emails(scheduled_at);
CREATE INDEX idx_emails_sent_at ON emails(sent_at);
CREATE INDEX idx_emails_template_id ON emails(template_id);
CREATE INDEX idx_emails_to_emails ON emails USING GIN(to_emails);

CREATE INDEX idx_email_attachments_email_id ON email_attachments(email_id);
CREATE INDEX idx_email_attachments_filename ON email_attachments(filename);

CREATE INDEX idx_email_tracking_events_email_id ON email_tracking_events(email_id);
CREATE INDEX idx_email_tracking_events_type ON email_tracking_events(event_type);
CREATE INDEX idx_email_tracking_events_recipient ON email_tracking_events(recipient_email);
CREATE INDEX idx_email_tracking_events_created_at ON email_tracking_events(created_at);

CREATE INDEX idx_notifications_company_id ON notifications(company_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_category ON notifications(category);
CREATE INDEX idx_notifications_priority ON notifications(priority);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);
CREATE INDEX idx_notifications_expires_at ON notifications(expires_at);

CREATE INDEX idx_conversations_company_id ON conversations(company_id);
CREATE INDEX idx_conversations_type ON conversations(type);
CREATE INDEX idx_conversations_created_by ON conversations(created_by);
CREATE INDEX idx_conversations_last_message_at ON conversations(last_message_at);
CREATE INDEX idx_conversations_is_archived ON conversations(is_archived);
CREATE INDEX idx_conversations_name ON conversations(name);

CREATE INDEX idx_conversation_participants_conversation_id ON conversation_participants(conversation_id);
CREATE INDEX idx_conversation_participants_user_id ON conversation_participants(user_id);
CREATE INDEX idx_conversation_participants_role ON conversation_participants(role);
CREATE INDEX idx_conversation_participants_joined_at ON conversation_participants(joined_at);
CREATE INDEX idx_conversation_participants_last_read_at ON conversation_participants(last_read_at);

CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_message_type ON messages(message_type);
CREATE INDEX idx_messages_created_at ON messages(created_at);
CREATE INDEX idx_messages_reply_to_id ON messages(reply_to_id);
CREATE INDEX idx_messages_is_deleted ON messages(is_deleted);
CREATE INDEX idx_messages_mentions ON messages USING GIN(mentions);

CREATE INDEX idx_message_attachments_message_id ON message_attachments(message_id);
CREATE INDEX idx_message_attachments_filename ON message_attachments(filename);

CREATE INDEX idx_message_reactions_message_id ON message_reactions(message_id);
CREATE INDEX idx_message_reactions_user_id ON message_reactions(user_id);
CREATE INDEX idx_message_reactions_emoji ON message_reactions(emoji);

CREATE INDEX idx_message_read_receipts_message_id ON message_read_receipts(message_id);
CREATE INDEX idx_message_read_receipts_user_id ON message_read_receipts(user_id);
CREATE INDEX idx_message_read_receipts_read_at ON message_read_receipts(read_at);

CREATE INDEX idx_communication_settings_company_id ON communication_settings(company_id);
CREATE INDEX idx_communication_settings_user_id ON communication_settings(user_id);
CREATE INDEX idx_communication_settings_type ON communication_settings(setting_type);

CREATE INDEX idx_email_campaigns_company_id ON email_campaigns(company_id);
CREATE INDEX idx_email_campaigns_status ON email_campaigns(status);
CREATE INDEX idx_email_campaigns_created_by ON email_campaigns(created_by);
CREATE INDEX idx_email_campaigns_scheduled_at ON email_campaigns(scheduled_at);
CREATE INDEX idx_email_campaigns_template_id ON email_campaigns(template_id);

CREATE INDEX idx_communication_logs_company_id ON communication_logs(company_id);
CREATE INDEX idx_communication_logs_type ON communication_logs(log_type);
CREATE INDEX idx_communication_logs_reference_id ON communication_logs(reference_id);
CREATE INDEX idx_communication_logs_action ON communication_logs(action);
CREATE INDEX idx_communication_logs_user_id ON communication_logs(user_id);
CREATE INDEX idx_communication_logs_created_at ON communication_logs(created_at);

-- Row Level Security Policies
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_tracking_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_read_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE communication_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE communication_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for email_templates
CREATE POLICY email_templates_tenant_isolation ON email_templates
    USING (company_id = current_setting('app.current_company_id')::UUID);

CREATE POLICY email_templates_insert ON email_templates
    FOR INSERT WITH CHECK (company_id = current_setting('app.current_company_id')::UUID);

-- RLS Policies for emails
CREATE POLICY emails_tenant_isolation ON emails
    USING (company_id = current_setting('app.current_company_id')::UUID);

CREATE POLICY emails_insert ON emails
    FOR INSERT WITH CHECK (company_id = current_setting('app.current_company_id')::UUID);

-- RLS Policies for email_attachments
CREATE POLICY email_attachments_tenant_isolation ON email_attachments
    USING (EXISTS (
        SELECT 1 FROM emails e 
        WHERE e.id = email_attachments.email_id 
        AND e.company_id = current_setting('app.current_company_id')::UUID
    ));

CREATE POLICY email_attachments_insert ON email_attachments
    FOR INSERT WITH CHECK (EXISTS (
        SELECT 1 FROM emails e 
        WHERE e.id = email_attachments.email_id 
        AND e.company_id = current_setting('app.current_company_id')::UUID
    ));

-- RLS Policies for email_tracking_events
CREATE POLICY email_tracking_events_tenant_isolation ON email_tracking_events
    USING (EXISTS (
        SELECT 1 FROM emails e 
        WHERE e.id = email_tracking_events.email_id 
        AND e.company_id = current_setting('app.current_company_id')::UUID
    ));

CREATE POLICY email_tracking_events_insert ON email_tracking_events
    FOR INSERT WITH CHECK (EXISTS (
        SELECT 1 FROM emails e 
        WHERE e.id = email_tracking_events.email_id 
        AND e.company_id = current_setting('app.current_company_id')::UUID
    ));

-- RLS Policies for notifications
CREATE POLICY notifications_tenant_isolation ON notifications
    USING (company_id = current_setting('app.current_company_id')::UUID);

CREATE POLICY notifications_insert ON notifications
    FOR INSERT WITH CHECK (company_id = current_setting('app.current_company_id')::UUID);

-- RLS Policies for conversations
CREATE POLICY conversations_tenant_isolation ON conversations
    USING (company_id = current_setting('app.current_company_id')::UUID);

CREATE POLICY conversations_insert ON conversations
    FOR INSERT WITH CHECK (company_id = current_setting('app.current_company_id')::UUID);

-- RLS Policies for conversation_participants
CREATE POLICY conversation_participants_tenant_isolation ON conversation_participants
    USING (EXISTS (
        SELECT 1 FROM conversations c 
        WHERE c.id = conversation_participants.conversation_id 
        AND c.company_id = current_setting('app.current_company_id')::UUID
    ));

CREATE POLICY conversation_participants_insert ON conversation_participants
    FOR INSERT WITH CHECK (EXISTS (
        SELECT 1 FROM conversations c 
        WHERE c.id = conversation_participants.conversation_id 
        AND c.company_id = current_setting('app.current_company_id')::UUID
    ));

-- RLS Policies for messages
CREATE POLICY messages_tenant_isolation ON messages
    USING (EXISTS (
        SELECT 1 FROM conversations c 
        WHERE c.id = messages.conversation_id 
        AND c.company_id = current_setting('app.current_company_id')::UUID
    ));

CREATE POLICY messages_insert ON messages
    FOR INSERT WITH CHECK (EXISTS (
        SELECT 1 FROM conversations c 
        WHERE c.id = messages.conversation_id 
        AND c.company_id = current_setting('app.current_company_id')::UUID
    ));

-- RLS Policies for message_attachments
CREATE POLICY message_attachments_tenant_isolation ON message_attachments
    USING (EXISTS (
        SELECT 1 FROM messages m 
        JOIN conversations c ON c.id = m.conversation_id
        WHERE m.id = message_attachments.message_id 
        AND c.company_id = current_setting('app.current_company_id')::UUID
    ));

CREATE POLICY message_attachments_insert ON message_attachments
    FOR INSERT WITH CHECK (EXISTS (
        SELECT 1 FROM messages m 
        JOIN conversations c ON c.id = m.conversation_id
        WHERE m.id = message_attachments.message_id 
        AND c.company_id = current_setting('app.current_company_id')::UUID
    ));

-- RLS Policies for message_reactions
CREATE POLICY message_reactions_tenant_isolation ON message_reactions
    USING (EXISTS (
        SELECT 1 FROM messages m 
        JOIN conversations c ON c.id = m.conversation_id
        WHERE m.id = message_reactions.message_id 
        AND c.company_id = current_setting('app.current_company_id')::UUID
    ));

CREATE POLICY message_reactions_insert ON message_reactions
    FOR INSERT WITH CHECK (EXISTS (
        SELECT 1 FROM messages m 
        JOIN conversations c ON c.id = m.conversation_id
        WHERE m.id = message_reactions.message_id 
        AND c.company_id = current_setting('app.current_company_id')::UUID
    ));

-- RLS Policies for message_read_receipts
CREATE POLICY message_read_receipts_tenant_isolation ON message_read_receipts
    USING (EXISTS (
        SELECT 1 FROM messages m 
        JOIN conversations c ON c.id = m.conversation_id
        WHERE m.id = message_read_receipts.message_id 
        AND c.company_id = current_setting('app.current_company_id')::UUID
    ));

CREATE POLICY message_read_receipts_insert ON message_read_receipts
    FOR INSERT WITH CHECK (EXISTS (
        SELECT 1 FROM messages m 
        JOIN conversations c ON c.id = m.conversation_id
        WHERE m.id = message_read_receipts.message_id 
        AND c.company_id = current_setting('app.current_company_id')::UUID
    ));

-- RLS Policies for communication_settings
CREATE POLICY communication_settings_tenant_isolation ON communication_settings
    USING (company_id = current_setting('app.current_company_id')::UUID);

CREATE POLICY communication_settings_insert ON communication_settings
    FOR INSERT WITH CHECK (company_id = current_setting('app.current_company_id')::UUID);

-- RLS Policies for email_campaigns
CREATE POLICY email_campaigns_tenant_isolation ON email_campaigns
    USING (company_id = current_setting('app.current_company_id')::UUID);

CREATE POLICY email_campaigns_insert ON email_campaigns
    FOR INSERT WITH CHECK (company_id = current_setting('app.current_company_id')::UUID);

-- RLS Policies for communication_logs
CREATE POLICY communication_logs_tenant_isolation ON communication_logs
    USING (company_id = current_setting('app.current_company_id')::UUID);

CREATE POLICY communication_logs_insert ON communication_logs
    FOR INSERT WITH CHECK (company_id = current_setting('app.current_company_id')::UUID);

-- SQL Functions for Communication

-- Function to get email analytics
CREATE OR REPLACE FUNCTION get_email_analytics(
    p_company_id UUID DEFAULT NULL,
    p_date_from TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    p_date_to TIMESTAMP WITH TIME ZONE DEFAULT NULL
)
RETURNS TABLE (
    total_emails BIGINT,
    emails_sent BIGINT,
    emails_failed BIGINT,
    emails_bounced BIGINT,
    open_rate DECIMAL(5,2),
    click_rate DECIMAL(5,2),
    bounce_rate DECIMAL(5,2)
) AS $$
DECLARE
    company_filter UUID := COALESCE(p_company_id, current_setting('app.current_company_id')::UUID);
    date_filter_start TIMESTAMP WITH TIME ZONE := COALESCE(p_date_from, DATE_TRUNC('month', CURRENT_DATE));
    date_filter_end TIMESTAMP WITH TIME ZONE := COALESCE(p_date_to, CURRENT_DATE + INTERVAL '1 day');
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_emails,
        COUNT(*) FILTER (WHERE e.status = 'sent') as emails_sent,
        COUNT(*) FILTER (WHERE e.status = 'failed') as emails_failed,
        COUNT(*) FILTER (WHERE e.status = 'bounced') as emails_bounced,
        CASE 
            WHEN COUNT(*) FILTER (WHERE e.status = 'sent') > 0 THEN
                (SUM(e.open_count)::DECIMAL / COUNT(*) FILTER (WHERE e.status = 'sent')) * 100
            ELSE 0
        END as open_rate,
        CASE 
            WHEN COUNT(*) FILTER (WHERE e.status = 'sent') > 0 THEN
                (SUM(e.click_count)::DECIMAL / COUNT(*) FILTER (WHERE e.status = 'sent')) * 100
            ELSE 0
        END as click_rate,
        CASE 
            WHEN COUNT(*) > 0 THEN
                (COUNT(*) FILTER (WHERE e.status = 'bounced')::DECIMAL / COUNT(*)) * 100
            ELSE 0
        END as bounce_rate
    FROM emails e
    WHERE e.company_id = company_filter
    AND e.created_at >= date_filter_start
    AND e.created_at <= date_filter_end;
END;
$$ LANGUAGE plpgsql;

-- Function to get notification analytics
CREATE OR REPLACE FUNCTION get_notification_analytics(
    p_company_id UUID DEFAULT NULL,
    p_date_from TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    p_date_to TIMESTAMP WITH TIME ZONE DEFAULT NULL
)
RETURNS TABLE (
    total_notifications BIGINT,
    unread_notifications BIGINT,
    read_rate DECIMAL(5,2),
    avg_read_time_hours DECIMAL(8,2)
) AS $$
DECLARE
    company_filter UUID := COALESCE(p_company_id, current_setting('app.current_company_id')::UUID);
    date_filter_start TIMESTAMP WITH TIME ZONE := COALESCE(p_date_from, DATE_TRUNC('month', CURRENT_DATE));
    date_filter_end TIMESTAMP WITH TIME ZONE := COALESCE(p_date_to, CURRENT_DATE + INTERVAL '1 day');
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_notifications,
        COUNT(*) FILTER (WHERE NOT n.is_read) as unread_notifications,
        CASE 
            WHEN COUNT(*) > 0 THEN
                (COUNT(*) FILTER (WHERE n.is_read)::DECIMAL / COUNT(*)) * 100
            ELSE 0
        END as read_rate,
        COALESCE(AVG(
            CASE 
                WHEN n.is_read AND n.read_at IS NOT NULL THEN
                    EXTRACT(EPOCH FROM (n.read_at - n.created_at)) / 3600
                ELSE NULL
            END
        ), 0) as avg_read_time_hours
    FROM notifications n
    WHERE n.company_id = company_filter
    AND n.created_at >= date_filter_start
    AND n.created_at <= date_filter_end;
END;
$$ LANGUAGE plpgsql;

-- Function to get message analytics
CREATE OR REPLACE FUNCTION get_message_analytics(
    p_company_id UUID DEFAULT NULL,
    p_date_from TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    p_date_to TIMESTAMP WITH TIME ZONE DEFAULT NULL
)
RETURNS TABLE (
    total_messages BIGINT,
    active_conversations BIGINT,
    avg_messages_per_conversation DECIMAL(8,2),
    response_time_avg_hours DECIMAL(8,2),
    user_engagement DECIMAL(5,2)
) AS $$
DECLARE
    company_filter UUID := COALESCE(p_company_id, current_setting('app.current_company_id')::UUID);
    date_filter_start TIMESTAMP WITH TIME ZONE := COALESCE(p_date_from, DATE_TRUNC('month', CURRENT_DATE));
    date_filter_end TIMESTAMP WITH TIME ZONE := COALESCE(p_date_to, CURRENT_DATE + INTERVAL '1 day');
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(DISTINCT m.id) as total_messages,
        COUNT(DISTINCT c.id) as active_conversations,
        CASE 
            WHEN COUNT(DISTINCT c.id) > 0 THEN
                COUNT(DISTINCT m.id)::DECIMAL / COUNT(DISTINCT c.id)
            ELSE 0
        END as avg_messages_per_conversation,
        0.0 as response_time_avg_hours, -- Placeholder for complex calculation
        CASE 
            WHEN COUNT(DISTINCT c.id) > 0 THEN
                (COUNT(DISTINCT m.sender_id)::DECIMAL / COUNT(DISTINCT c.id)) * 100
            ELSE 0
        END as user_engagement
    FROM conversations c
    LEFT JOIN messages m ON c.id = m.conversation_id 
        AND m.created_at >= date_filter_start
        AND m.created_at <= date_filter_end
        AND NOT m.is_deleted
    WHERE c.company_id = company_filter
    AND c.last_message_at >= date_filter_start;
END;
$$ LANGUAGE plpgsql;

-- Function to update conversation participant count
CREATE OR REPLACE FUNCTION update_conversation_participant_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE conversations
        SET participant_count = participant_count + 1,
            updated_at = NOW()
        WHERE id = NEW.conversation_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE conversations
        SET participant_count = participant_count - 1,
            updated_at = NOW()
        WHERE id = OLD.conversation_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Function to update conversation last message
CREATE OR REPLACE FUNCTION update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE conversations
    SET last_message_id = NEW.id,
        last_message_at = NEW.created_at,
        updated_at = NOW()
    WHERE id = NEW.conversation_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to mark notification as read when accessed
CREATE OR REPLACE FUNCTION auto_mark_notification_read()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.is_read = FALSE AND NEW.is_read = TRUE THEN
        NEW.read_at := NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to clean expired notifications
CREATE OR REPLACE FUNCTION clean_expired_notifications()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM notifications
    WHERE expires_at < NOW();
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get conversation unread count for user
CREATE OR REPLACE FUNCTION get_conversation_unread_count(
    p_conversation_id UUID,
    p_user_id UUID
)
RETURNS INTEGER AS $$
DECLARE
    last_read_time TIMESTAMP WITH TIME ZONE;
    unread_count INTEGER;
BEGIN
    -- Get user's last read time for this conversation
    SELECT last_read_at INTO last_read_time
    FROM conversation_participants
    WHERE conversation_id = p_conversation_id
    AND user_id = p_user_id;
    
    -- Count unread messages
    SELECT COUNT(*) INTO unread_count
    FROM messages
    WHERE conversation_id = p_conversation_id
    AND NOT is_deleted
    AND (last_read_time IS NULL OR created_at > last_read_time);
    
    RETURN COALESCE(unread_count, 0);
END;
$$ LANGUAGE plpgsql;

-- Function to update email tracking stats
CREATE OR REPLACE FUNCTION update_email_tracking_stats()
RETURNS TRIGGER AS $$
BEGIN
    CASE NEW.event_type
        WHEN 'opened' THEN
            UPDATE emails
            SET open_count = open_count + 1
            WHERE id = NEW.email_id;
        WHEN 'clicked' THEN
            UPDATE emails
            SET click_count = click_count + 1
            WHERE id = NEW.email_id;
        WHEN 'bounced' THEN
            UPDATE emails
            SET status = 'bounced',
                bounce_reason = NEW.event_data->>'reason'
            WHERE id = NEW.email_id;
    END CASE;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers
CREATE TRIGGER trigger_update_conversation_participant_count
    AFTER INSERT OR DELETE ON conversation_participants
    FOR EACH ROW
    EXECUTE FUNCTION update_conversation_participant_count();

CREATE TRIGGER trigger_update_conversation_last_message
    AFTER INSERT ON messages
    FOR EACH ROW
    EXECUTE FUNCTION update_conversation_last_message();

CREATE TRIGGER trigger_auto_mark_notification_read
    BEFORE UPDATE ON notifications
    FOR EACH ROW
    EXECUTE FUNCTION auto_mark_notification_read();

CREATE TRIGGER trigger_update_email_tracking_stats
    AFTER INSERT ON email_tracking_events
    FOR EACH ROW
    EXECUTE FUNCTION update_email_tracking_stats();

-- Insert default email templates
INSERT INTO email_templates (company_id, name, description, category, subject_template, body_template, variables) VALUES
(uuid_nil(), 'Welcome Email', 'Welcome new users to the system', 'system', 'Welcome to {{company_name}}!', '<h1>Welcome {{user_name}}!</h1><p>Thank you for joining {{company_name}}. We are excited to have you on board.</p>', '{"company_name", "user_name"}'),
(uuid_nil(), 'Password Reset', 'Password reset notification', 'system', 'Reset Your Password', '<h2>Password Reset Request</h2><p>Click the link below to reset your password:</p><a href="{{reset_link}}">Reset Password</a>', '{"reset_link", "user_name"}'),
(uuid_nil(), 'Task Assignment', 'Notify users of new task assignments', 'notification', 'New Task Assigned: {{task_title}}', '<h2>New Task Assignment</h2><p>You have been assigned a new task: {{task_title}}</p><p>Due Date: {{due_date}}</p><p>Description: {{task_description}}</p>', '{"task_title", "due_date", "task_description"}'),
(uuid_nil(), 'Invoice Reminder', 'Remind customers about pending invoices', 'transactional', 'Invoice Reminder - {{invoice_number}}', '<h2>Payment Reminder</h2><p>This is a friendly reminder that invoice {{invoice_number}} for {{amount}} is due on {{due_date}}.</p>', '{"invoice_number", "amount", "due_date", "customer_name"}');

-- Insert default communication settings
INSERT INTO communication_settings (company_id, setting_type, setting_key, setting_value) VALUES
(uuid_nil(), 'email', 'smtp_host', '"localhost"'),
(uuid_nil(), 'email', 'smtp_port', '587'),
(uuid_nil(), 'email', 'smtp_encryption', '"tls"'),
(uuid_nil(), 'email', 'from_name', '"ERP System"'),
(uuid_nil(), 'email', 'from_email', '"noreply@company.com"'),
(uuid_nil(), 'notification', 'default_channels', '["in_app", "email"]'),
(uuid_nil(), 'notification', 'retention_days', '30'),
(uuid_nil(), 'messaging', 'max_file_size_mb', '10'),
(uuid_nil(), 'messaging', 'allowed_file_types', '["pdf", "doc", "docx", "xls", "xlsx", "jpg", "jpeg", "png", "gif"]');

-- Comments for documentation
COMMENT ON TABLE email_templates IS 'Email templates for various communication purposes';
COMMENT ON TABLE emails IS 'Email messages sent through the system';
COMMENT ON TABLE email_attachments IS 'File attachments for emails';
COMMENT ON TABLE email_tracking_events IS 'Email tracking events (opens, clicks, bounces)';
COMMENT ON TABLE notifications IS 'In-app and push notifications for users';
COMMENT ON TABLE conversations IS 'Chat conversations and channels';
COMMENT ON TABLE conversation_participants IS 'Users participating in conversations';
COMMENT ON TABLE messages IS 'Individual messages within conversations';
COMMENT ON TABLE message_attachments IS 'File attachments for messages';
COMMENT ON TABLE message_reactions IS 'Emoji reactions to messages';
COMMENT ON TABLE message_read_receipts IS 'Message read status tracking';
COMMENT ON TABLE communication_settings IS 'Communication system configuration settings';
COMMENT ON TABLE email_campaigns IS 'Email marketing campaigns';
COMMENT ON TABLE communication_logs IS 'Audit logs for communication activities';