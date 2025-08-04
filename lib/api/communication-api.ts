import { supabase } from '@/lib/supabase';

// Types and Interfaces
export interface Email {
  id: string;
  company_id: string;
  from_email: string;
  from_name?: string;
  to_emails: string[];
  cc_emails?: string[];
  bcc_emails?: string[];
  subject: string;
  body: string;
  body_type: 'plain' | 'html';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  status: 'draft' | 'queued' | 'sent' | 'failed' | 'bounced';
  scheduled_at?: string;
  sent_at?: string;
  attachments?: EmailAttachment[];
  template_id?: string;
  template_variables?: Record<string, any>;
  tracking_enabled: boolean;
  read_receipt: boolean;
  error_message?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface EmailAttachment {
  id: string;
  email_id: string;
  filename: string;
  file_size: number;
  mime_type: string;
  file_path: string;
  created_at: string;
}

export interface CreateEmailData {
  to_emails: string[];
  cc_emails?: string[];
  bcc_emails?: string[];
  subject: string;
  body: string;
  body_type?: 'plain' | 'html';
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  scheduled_at?: string;
  template_id?: string;
  template_variables?: Record<string, any>;
  tracking_enabled?: boolean;
  read_receipt?: boolean;
  attachments?: File[];
}

export interface Notification {
  id: string;
  company_id: string;
  user_id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  category: 'system' | 'task' | 'approval' | 'reminder' | 'alert' | 'message';
  title: string;
  message: string;
  data?: Record<string, any>;
  channels: ('in_app' | 'email' | 'sms' | 'push')[];
  priority: 'low' | 'normal' | 'high' | 'urgent';
  is_read: boolean;
  read_at?: string;
  expires_at?: string;
  action_url?: string;
  action_text?: string;
  created_at: string;
}

export interface CreateNotificationData {
  user_id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  category: 'system' | 'task' | 'approval' | 'reminder' | 'alert' | 'message';
  title: string;
  message: string;
  data?: Record<string, any>;
  channels?: ('in_app' | 'email' | 'sms' | 'push')[];
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  expires_at?: string;
  action_url?: string;
  action_text?: string;
}

export interface Message {
  id: string;
  company_id: string;
  conversation_id: string;
  sender_id: string;
  sender_name: string;
  sender_avatar?: string;
  message_type: 'text' | 'file' | 'image' | 'system';
  content: string;
  attachments?: MessageAttachment[];
  reply_to_id?: string;
  is_edited: boolean;
  edited_at?: string;
  is_deleted: boolean;
  deleted_at?: string;
  reactions?: MessageReaction[];
  mentions?: string[];
  created_at: string;
  updated_at: string;
}

export interface MessageAttachment {
  id: string;
  message_id: string;
  filename: string;
  file_size: number;
  mime_type: string;
  file_path: string;
  thumbnail_path?: string;
  created_at: string;
}

export interface MessageReaction {
  id: string;
  message_id: string;
  user_id: string;
  user_name: string;
  emoji: string;
  created_at: string;
}

export interface Conversation {
  id: string;
  company_id: string;
  name?: string;
  type: 'direct' | 'group' | 'channel' | 'support';
  description?: string;
  is_private: boolean;
  created_by: string;
  last_message_id?: string;
  last_message_at?: string;
  participant_count: number;
  unread_count: number;
  is_archived: boolean;
  archived_at?: string;
  created_at: string;
  updated_at: string;
}

export interface ConversationParticipant {
  id: string;
  conversation_id: string;
  user_id: string;
  user_name: string;
  user_avatar?: string;
  role: 'member' | 'admin' | 'moderator';
  joined_at: string;
  last_read_at?: string;
  is_muted: boolean;
  muted_until?: string;
}

export interface CreateConversationData {
  name?: string;
  type: 'direct' | 'group' | 'channel' | 'support';
  description?: string;
  is_private?: boolean;
  participant_ids: string[];
}

export interface CreateMessageData {
  conversation_id: string;
  message_type?: 'text' | 'file' | 'image' | 'system';
  content: string;
  attachments?: File[];
  reply_to_id?: string;
  mentions?: string[];
}

export interface EmailTemplate {
  id: string;
  company_id: string;
  name: string;
  description?: string;
  category: 'marketing' | 'transactional' | 'notification' | 'system';
  subject_template: string;
  body_template: string;
  body_type: 'plain' | 'html';
  variables: string[];
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface CreateEmailTemplateData {
  name: string;
  description?: string;
  category: 'marketing' | 'transactional' | 'notification' | 'system';
  subject_template: string;
  body_template: string;
  body_type?: 'plain' | 'html';
  variables?: string[];
}

export interface CommunicationFilters {
  type?: string;
  status?: string;
  priority?: string;
  date_from?: string;
  date_to?: string;
  search?: string;
  user_id?: string;
  category?: string;
}

export interface CommunicationAnalytics {
  total_emails: number;
  emails_sent: number;
  emails_failed: number;
  email_open_rate: number;
  email_click_rate: number;
  total_notifications: number;
  unread_notifications: number;
  total_messages: number;
  active_conversations: number;
  response_time_avg: number;
  user_engagement: number;
}

// Communication API Class
export class CommunicationApi {
  // Email Management
  static async getEmails(filters?: CommunicationFilters) {
    let query = supabase
      .from('emails')
      .select(`
        *,
        attachments:email_attachments(*),
        template:email_templates(name)
      `)
      .order('created_at', { ascending: false });

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.priority) {
      query = query.eq('priority', filters.priority);
    }
    if (filters?.date_from) {
      query = query.gte('created_at', filters.date_from);
    }
    if (filters?.date_to) {
      query = query.lte('created_at', filters.date_to);
    }
    if (filters?.search) {
      query = query.or(`subject.ilike.%${filters.search}%,body.ilike.%${filters.search}%`);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data as Email[];
  }

  static async getEmailById(id: string) {
    const { data, error } = await supabase
      .from('emails')
      .select(`
        *,
        attachments:email_attachments(*),
        template:email_templates(*)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as Email;
  }

  static async createEmail(emailData: CreateEmailData) {
    const { data, error } = await supabase
      .from('emails')
      .insert({
        to_emails: emailData.to_emails,
        cc_emails: emailData.cc_emails || [],
        bcc_emails: emailData.bcc_emails || [],
        subject: emailData.subject,
        body: emailData.body,
        body_type: emailData.body_type || 'html',
        priority: emailData.priority || 'normal',
        scheduled_at: emailData.scheduled_at,
        template_id: emailData.template_id,
        template_variables: emailData.template_variables,
        tracking_enabled: emailData.tracking_enabled || false,
        read_receipt: emailData.read_receipt || false,
        status: emailData.scheduled_at ? 'queued' : 'draft'
      })
      .select()
      .single();

    if (error) throw error;
    return data as Email;
  }

  static async updateEmail(id: string, updates: Partial<CreateEmailData>) {
    const { data, error } = await supabase
      .from('emails')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Email;
  }

  static async deleteEmail(id: string) {
    const { error } = await supabase
      .from('emails')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  static async sendEmail(id: string) {
    const { data, error } = await supabase
      .from('emails')
      .update({
        status: 'queued',
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Email;
  }

  // Notification Management
  static async getNotifications(userId?: string, filters?: CommunicationFilters) {
    let query = supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false });

    if (userId) {
      query = query.eq('user_id', userId);
    }
    if (filters?.type) {
      query = query.eq('type', filters.type);
    }
    if (filters?.category) {
      query = query.eq('category', filters.category);
    }
    if (filters?.priority) {
      query = query.eq('priority', filters.priority);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data as Notification[];
  }

  static async getUnreadNotifications(userId: string) {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .eq('is_read', false)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as Notification[];
  }

  static async createNotification(notificationData: CreateNotificationData) {
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        user_id: notificationData.user_id,
        type: notificationData.type,
        category: notificationData.category,
        title: notificationData.title,
        message: notificationData.message,
        data: notificationData.data,
        channels: notificationData.channels || ['in_app'],
        priority: notificationData.priority || 'normal',
        expires_at: notificationData.expires_at,
        action_url: notificationData.action_url,
        action_text: notificationData.action_text
      })
      .select()
      .single();

    if (error) throw error;
    return data as Notification;
  }

  static async markNotificationAsRead(id: string) {
    const { data, error } = await supabase
      .from('notifications')
      .update({
        is_read: true,
        read_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Notification;
  }

  static async markAllNotificationsAsRead(userId: string) {
    const { error } = await supabase
      .from('notifications')
      .update({
        is_read: true,
        read_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) throw error;
  }

  static async deleteNotification(id: string) {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // Messaging and Conversations
  static async getConversations(filters?: CommunicationFilters) {
    let query = supabase
      .from('conversations')
      .select(`
        *,
        participants:conversation_participants(
          id,
          user_id,
          user_name,
          user_avatar,
          role,
          joined_at,
          last_read_at
        ),
        last_message:messages!conversations_last_message_id_fkey(
          id,
          content,
          sender_name,
          created_at
        )
      `)
      .order('last_message_at', { ascending: false });

    if (filters?.type) {
      query = query.eq('type', filters.type);
    }
    if (filters?.search) {
      query = query.ilike('name', `%${filters.search}%`);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data as Conversation[];
  }

  static async getConversationById(id: string) {
    const { data, error } = await supabase
      .from('conversations')
      .select(`
        *,
        participants:conversation_participants(
          id,
          user_id,
          user_name,
          user_avatar,
          role,
          joined_at,
          last_read_at,
          is_muted,
          muted_until
        )
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as Conversation;
  }

  static async createConversation(conversationData: CreateConversationData) {
    const { data, error } = await supabase
      .from('conversations')
      .insert({
        name: conversationData.name,
        type: conversationData.type,
        description: conversationData.description,
        is_private: conversationData.is_private || false
      })
      .select()
      .single();

    if (error) throw error;

    // Add participants
    if (conversationData.participant_ids.length > 0) {
      const participants = conversationData.participant_ids.map(userId => ({
        conversation_id: data.id,
        user_id: userId,
        role: 'member'
      }));

      const { error: participantError } = await supabase
        .from('conversation_participants')
        .insert(participants);

      if (participantError) throw participantError;
    }

    return data as Conversation;
  }

  static async updateConversation(id: string, updates: Partial<CreateConversationData>) {
    const { data, error } = await supabase
      .from('conversations')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Conversation;
  }

  static async deleteConversation(id: string) {
    const { error } = await supabase
      .from('conversations')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  static async getMessages(conversationId: string, limit = 50, offset = 0) {
    const { data, error } = await supabase
      .from('messages')
      .select(`
        *,
        attachments:message_attachments(*),
        reactions:message_reactions(
          id,
          user_id,
          user_name,
          emoji,
          created_at
        ),
        reply_to:messages!messages_reply_to_id_fkey(
          id,
          content,
          sender_name
        )
      `)
      .eq('conversation_id', conversationId)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return data as Message[];
  }

  static async createMessage(messageData: CreateMessageData) {
    const { data, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: messageData.conversation_id,
        message_type: messageData.message_type || 'text',
        content: messageData.content,
        reply_to_id: messageData.reply_to_id,
        mentions: messageData.mentions || []
      })
      .select()
      .single();

    if (error) throw error;

    // Update conversation last message
    await supabase
      .from('conversations')
      .update({
        last_message_id: data.id,
        last_message_at: data.created_at,
        updated_at: new Date().toISOString()
      })
      .eq('id', messageData.conversation_id);

    return data as Message;
  }

  static async updateMessage(id: string, content: string) {
    const { data, error } = await supabase
      .from('messages')
      .update({
        content,
        is_edited: true,
        edited_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Message;
  }

  static async deleteMessage(id: string) {
    const { data, error } = await supabase
      .from('messages')
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Message;
  }

  static async addMessageReaction(messageId: string, emoji: string) {
    const { data, error } = await supabase
      .from('message_reactions')
      .insert({
        message_id: messageId,
        emoji
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async removeMessageReaction(messageId: string, emoji: string, userId: string) {
    const { error } = await supabase
      .from('message_reactions')
      .delete()
      .eq('message_id', messageId)
      .eq('emoji', emoji)
      .eq('user_id', userId);

    if (error) throw error;
  }

  // Email Templates
  static async getEmailTemplates(filters?: CommunicationFilters) {
    let query = supabase
      .from('email_templates')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (filters?.category) {
      query = query.eq('category', filters.category);
    }
    if (filters?.search) {
      query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data as EmailTemplate[];
  }

  static async getEmailTemplateById(id: string) {
    const { data, error } = await supabase
      .from('email_templates')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as EmailTemplate;
  }

  static async createEmailTemplate(templateData: CreateEmailTemplateData) {
    const { data, error } = await supabase
      .from('email_templates')
      .insert({
        name: templateData.name,
        description: templateData.description,
        category: templateData.category,
        subject_template: templateData.subject_template,
        body_template: templateData.body_template,
        body_type: templateData.body_type || 'html',
        variables: templateData.variables || []
      })
      .select()
      .single();

    if (error) throw error;
    return data as EmailTemplate;
  }

  static async updateEmailTemplate(id: string, updates: Partial<CreateEmailTemplateData>) {
    const { data, error } = await supabase
      .from('email_templates')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as EmailTemplate;
  }

  static async deleteEmailTemplate(id: string) {
    const { data, error } = await supabase
      .from('email_templates')
      .update({ is_active: false })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as EmailTemplate;
  }

  // Analytics and Reporting
  static async getCommunicationAnalytics(): Promise<CommunicationAnalytics> {
    const [emailStats, notificationStats, messageStats] = await Promise.all([
      supabase.rpc('get_email_analytics'),
      supabase.rpc('get_notification_analytics'),
      supabase.rpc('get_message_analytics')
    ]);

    return {
      total_emails: emailStats.data?.total_emails || 0,
      emails_sent: emailStats.data?.emails_sent || 0,
      emails_failed: emailStats.data?.emails_failed || 0,
      email_open_rate: emailStats.data?.open_rate || 0,
      email_click_rate: emailStats.data?.click_rate || 0,
      total_notifications: notificationStats.data?.total_notifications || 0,
      unread_notifications: notificationStats.data?.unread_notifications || 0,
      total_messages: messageStats.data?.total_messages || 0,
      active_conversations: messageStats.data?.active_conversations || 0,
      response_time_avg: messageStats.data?.response_time_avg || 0,
      user_engagement: messageStats.data?.user_engagement || 0
    };
  }

  static async getEmailAnalytics(dateFrom?: string, dateTo?: string) {
    const { data, error } = await supabase.rpc('get_email_analytics', {
      date_from: dateFrom,
      date_to: dateTo
    });

    if (error) throw error;
    return data;
  }

  static async getNotificationAnalytics(dateFrom?: string, dateTo?: string) {
    const { data, error } = await supabase.rpc('get_notification_analytics', {
      date_from: dateFrom,
      date_to: dateTo
    });

    if (error) throw error;
    return data;
  }

  static async getMessageAnalytics(dateFrom?: string, dateTo?: string) {
    const { data, error } = await supabase.rpc('get_message_analytics', {
      date_from: dateFrom,
      date_to: dateTo
    });

    if (error) throw error;
    return data;
  }

  // Utility Functions
  static async getEmailCategories() {
    return [
      { value: 'marketing', label: 'Marketing' },
      { value: 'transactional', label: 'Transactional' },
      { value: 'notification', label: 'Notification' },
      { value: 'system', label: 'System' }
    ];
  }

  static async getNotificationTypes() {
    return [
      { value: 'info', label: 'Information' },
      { value: 'warning', label: 'Warning' },
      { value: 'error', label: 'Error' },
      { value: 'success', label: 'Success' }
    ];
  }

  static async getConversationTypes() {
    return [
      { value: 'direct', label: 'Direct Message' },
      { value: 'group', label: 'Group Chat' },
      { value: 'channel', label: 'Channel' },
      { value: 'support', label: 'Support' }
    ];
  }

  static async searchEmails(query: string, limit = 20) {
    const { data, error } = await supabase
      .from('emails')
      .select('id, subject, from_email, to_emails, created_at, status')
      .or(`subject.ilike.%${query}%,body.ilike.%${query}%`)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  }

  static async searchConversations(query: string, limit = 20) {
    const { data, error } = await supabase
      .from('conversations')
      .select('id, name, type, description, participant_count, last_message_at')
      .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
      .order('last_message_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  }

  static async getRecentEmails(limit = 10) {
    const { data, error } = await supabase
      .from('emails')
      .select('id, subject, from_email, to_emails, status, created_at')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  }

  static async getRecentNotifications(userId: string, limit = 10) {
    const { data, error } = await supabase
      .from('notifications')
      .select('id, title, message, type, category, is_read, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  }

  static async getActiveConversations(limit = 10) {
    const { data, error } = await supabase
      .from('conversations')
      .select('id, name, type, participant_count, last_message_at')
      .not('last_message_at', 'is', null)
      .order('last_message_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  }
}