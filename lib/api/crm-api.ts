import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '../../types/database';

type Customer = Database['public']['Tables']['customers']['Row'];

// Interfaces for CRM operations
export interface CreateLeadData {
  first_name: string;
  last_name: string;
  company_name?: string;
  email: string;
  phone?: string;
  source: 'website' | 'referral' | 'social_media' | 'advertisement' | 'cold_call' | 'trade_show' | 'other';
  status: 'new' | 'contacted' | 'qualified' | 'unqualified' | 'converted';
  industry?: string;
  job_title?: string;
  estimated_value?: number;
  notes?: string;
  address?: any;
  social_profiles?: any;
  tags?: string[];
}

export interface CreateOpportunityData {
  name: string;
  customer_id?: string;
  lead_id?: string;
  stage: 'prospecting' | 'qualification' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost';
  value: number;
  probability: number;
  expected_close_date: string;
  source?: string;
  description?: string;
  competitor?: string;
  next_action?: string;
  next_action_date?: string;
}

export interface CreateContactData {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  job_title?: string;
  department?: string;
  customer_id?: string;
  lead_id?: string;
  is_primary: boolean;
  address?: any;
  social_profiles?: any;
  notes?: string;
}

export interface CreateActivityData {
  type: 'call' | 'email' | 'meeting' | 'task' | 'note' | 'demo' | 'proposal';
  subject: string;
  description?: string;
  due_date?: string;
  completed_date?: string;
  status: 'pending' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high';
  customer_id?: string;
  lead_id?: string;
  opportunity_id?: string;
  contact_id?: string;
  assigned_to?: string;
  duration_minutes?: number;
  outcome?: string;
}

export interface CreateCampaignData {
  name: string;
  type: 'email' | 'social_media' | 'advertisement' | 'event' | 'webinar' | 'content';
  status: 'planning' | 'active' | 'paused' | 'completed';
  start_date: string;
  end_date?: string;
  budget?: number;
  target_audience?: string;
  description?: string;
  goals?: string;
  channels?: string[];
}

export interface LeadFilters {
  status?: string;
  source?: string;
  industry?: string;
  assigned_to?: string;
  created_from?: string;
  created_to?: string;
  search?: string;
}

export interface OpportunityFilters {
  stage?: string;
  customer_id?: string;
  assigned_to?: string;
  value_min?: number;
  value_max?: number;
  expected_close_from?: string;
  expected_close_to?: string;
  search?: string;
}

export interface ActivityFilters {
  type?: string;
  status?: string;
  priority?: string;
  assigned_to?: string;
  due_from?: string;
  due_to?: string;
  customer_id?: string;
  lead_id?: string;
  opportunity_id?: string;
}

export interface CRMAnalytics {
  total_leads: number;
  qualified_leads: number;
  conversion_rate: number;
  total_opportunities: number;
  pipeline_value: number;
  won_opportunities: number;
  average_deal_size: number;
  sales_cycle_days: number;
  lead_sources: Array<{
    source: string;
    count: number;
    conversion_rate: number;
  }>;
  pipeline_by_stage: Array<{
    stage: string;
    count: number;
    value: number;
  }>;
  monthly_performance: Array<{
    month: string;
    leads_generated: number;
    opportunities_created: number;
    deals_won: number;
    revenue: number;
  }>;
  top_performers: Array<{
    name: string;
    deals_won: number;
    revenue: number;
  }>;
}

export class CRMApi {
  private static supabase = createClientComponentClient<Database>()

  // Dashboard Data
  static async getDashboardData(companyId: string) {
    try {
      // Get leads count
      const { count: totalLeads } = await this.supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', companyId);

      // Get qualified leads count
      const { count: qualifiedLeads } = await this.supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', companyId)
        .eq('status', 'qualified');

      // Get opportunities count
      const { count: totalOpportunities } = await this.supabase
        .from('opportunities')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', companyId);

      // Get pipeline value
      const { data: opportunities } = await this.supabase
        .from('opportunities')
        .select('value')
        .eq('company_id', companyId)
        .not('stage', 'in', '("closed_won","closed_lost")');

      const pipelineValue = opportunities?.reduce((sum, opp) => sum + (opp.value || 0), 0) || 0;

      return {
        totalLeads: totalLeads || 0,
        qualifiedLeads: qualifiedLeads || 0,
        totalOpportunities: totalOpportunities || 0,
        pipelineValue
      };
    } catch (error) {
      console.error('Error fetching CRM dashboard data:', error);
      throw error;
    }
  }

  // Customer Management
  static async getCustomers(companyId: string, filters: any = {}) {
    try {
      let query = this.supabase
        .from('customers')
        .select('*')
        .eq('company_id', companyId);

      if (filters.search) {
        query = query.or(`name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
      }

      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(filters.offset || 0, (filters.offset || 0) + (filters.limit || 50) - 1);

      if (error) throw error;

      return {
        data: data || [],
        count: count || 0
      };
    } catch (error) {
      console.error('Error fetching customers:', error);
      throw error;
    }
  }

  // Lead Management
  static async getLeads(companyId: string, filters?: LeadFilters) {
    let query = this.supabase
      .from('leads')
      .select(`
        *,
        assigned_user:employees!leads_assigned_to_fkey(first_name, last_name),
        activities:activities(count)
      `)
      .eq('company_id', companyId);

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.source) {
      query = query.eq('source', filters.source);
    }
    if (filters?.industry) {
      query = query.eq('industry', filters.industry);
    }
    if (filters?.assigned_to) {
      query = query.eq('assigned_to', filters.assigned_to);
    }
    if (filters?.created_from) {
      query = query.gte('created_at', filters.created_from);
    }
    if (filters?.created_to) {
      query = query.lte('created_at', filters.created_to);
    }
    if (filters?.search) {
      query = query.or(`first_name.ilike.%${filters.search}%,last_name.ilike.%${filters.search}%,company_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  }

  static async getLead(id: string) {
    const { data, error } = await this.supabase
      .from('leads')
      .select(`
        *,
        assigned_user:employees!leads_assigned_to_fkey(first_name, last_name),
        contacts:contacts(*),
        activities:activities(*),
        opportunities:opportunities(*)
      `)
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  }

  static async createLead(companyId: string, leadData: CreateLeadData) {
    const { data, error } = await this.supabase
      .from('leads')
      .insert({
        ...leadData,
        company_id: companyId
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async updateLead(id: string, leadData: Partial<CreateLeadData>) {
    const { data, error } = await this.supabase
      .from('leads')
      .update(leadData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async convertLeadToCustomer(leadId: string, customerData?: Partial<Customer>) {
    // Get lead data
    const { data: lead, error: leadError } = await this.supabase
      .from('leads')
      .select('*')
      .eq('id', leadId)
      .single();
    
    if (leadError) throw leadError;

    // Create customer from lead
    const { data: customer, error: customerError } = await this.supabase
      .from('customers')
      .insert({
        company_id: lead.company_id,
        name: lead.company_name || `${lead.first_name} ${lead.last_name}`,
        email: lead.email,
        phone: lead.phone,
        address: lead.address,
        contact_person: `${lead.first_name} ${lead.last_name}`,
        customer_type: 'individual',
        status: 'active',
        source: lead.source,
        ...customerData
      })
      .select()
      .single();
    
    if (customerError) throw customerError;

    // Update lead status
    await this.supabase
      .from('leads')
      .update({ 
        status: 'converted',
        converted_to_customer_id: customer.id,
        converted_at: new Date().toISOString()
      })
      .eq('id', leadId);

    return customer;
  }

  static async deleteLead(id: string) {
    const { error } = await this.supabase
      .from('leads')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }

  // Opportunity Management
  static async getOpportunities(companyId: string, filters?: OpportunityFilters) {
    let query = this.supabase
      .from('opportunities')
      .select(`
        *,
        customer:customers(name, email),
        lead:leads(first_name, last_name, company_name),
        assigned_user:employees!opportunities_assigned_to_fkey(first_name, last_name)
      `)
      .eq('company_id', companyId);

    if (filters?.stage) {
      query = query.eq('stage', filters.stage);
    }
    if (filters?.customer_id) {
      query = query.eq('customer_id', filters.customer_id);
    }
    if (filters?.assigned_to) {
      query = query.eq('assigned_to', filters.assigned_to);
    }
    if (filters?.value_min) {
      query = query.gte('value', filters.value_min);
    }
    if (filters?.value_max) {
      query = query.lte('value', filters.value_max);
    }
    if (filters?.expected_close_from) {
      query = query.gte('expected_close_date', filters.expected_close_from);
    }
    if (filters?.expected_close_to) {
      query = query.lte('expected_close_date', filters.expected_close_to);
    }
    if (filters?.search) {
      query = query.ilike('name', `%${filters.search}%`);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  }

  static async getOpportunity(id: string) {
    const { data, error } = await this.supabase
      .from('opportunities')
      .select(`
        *,
        customer:customers(*),
        lead:leads(*),
        assigned_user:employees!opportunities_assigned_to_fkey(first_name, last_name),
        activities:activities(*)
      `)
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  }

  static async createOpportunity(companyId: string, opportunityData: CreateOpportunityData) {
    const { data, error } = await this.supabase
      .from('opportunities')
      .insert({
        ...opportunityData,
        company_id: companyId
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async updateOpportunity(id: string, opportunityData: Partial<CreateOpportunityData>) {
    const { data, error } = await this.supabase
      .from('opportunities')
      .update(opportunityData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async updateOpportunityStage(id: string, stage: string, notes?: string) {
    const updateData: any = { stage };
    
    if (stage === 'closed_won' || stage === 'closed_lost') {
      updateData.closed_date = new Date().toISOString();
    }
    
    if (notes) {
      updateData.notes = notes;
    }

    const { data, error } = await this.supabase
      .from('opportunities')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async deleteOpportunity(id: string) {
    const { error } = await this.supabase
      .from('opportunities')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }

  // Contact Management
  static async getContacts(companyId: string, customerId?: string) {
    let query = this.supabase
      .from('contacts')
      .select(`
        *,
        customer:customers(name),
        lead:leads(first_name, last_name, company_name)
      `)
      .eq('company_id', companyId);

    if (customerId) {
      query = query.eq('customer_id', customerId);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  }

  static async createContact(companyId: string, contactData: CreateContactData) {
    const { data, error } = await this.supabase
      .from('contacts')
      .insert({
        ...contactData,
        company_id: companyId
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async updateContact(id: string, contactData: Partial<CreateContactData>) {
    const { data, error } = await this.supabase
      .from('contacts')
      .update(contactData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async deleteContact(id: string) {
    const { error } = await this.supabase
      .from('contacts')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }

  // Activity Management
  static async getActivities(companyId: string, filters?: ActivityFilters) {
    let query = this.supabase
      .from('activities')
      .select(`
        *,
        customer:customers(name),
        lead:leads(first_name, last_name, company_name),
        opportunity:opportunities(name),
        contact:contacts(first_name, last_name),
        assigned_user:employees!activities_assigned_to_fkey(first_name, last_name)
      `)
      .eq('company_id', companyId);

    if (filters?.type) {
      query = query.eq('type', filters.type);
    }
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.priority) {
      query = query.eq('priority', filters.priority);
    }
    if (filters?.assigned_to) {
      query = query.eq('assigned_to', filters.assigned_to);
    }
    if (filters?.customer_id) {
      query = query.eq('customer_id', filters.customer_id);
    }
    if (filters?.lead_id) {
      query = query.eq('lead_id', filters.lead_id);
    }
    if (filters?.opportunity_id) {
      query = query.eq('opportunity_id', filters.opportunity_id);
    }
    if (filters?.due_from) {
      query = query.gte('due_date', filters.due_from);
    }
    if (filters?.due_to) {
      query = query.lte('due_date', filters.due_to);
    }

    const { data, error } = await query.order('due_date', { ascending: true });
    if (error) throw error;
    return data;
  }

  static async createActivity(companyId: string, activityData: CreateActivityData) {
    const { data, error } = await this.supabase
      .from('activities')
      .insert({
        ...activityData,
        company_id: companyId
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async updateActivity(id: string, activityData: Partial<CreateActivityData>) {
    const { data, error } = await this.supabase
      .from('activities')
      .update(activityData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async completeActivity(id: string, outcome?: string) {
    const { data, error } = await this.supabase
      .from('activities')
      .update({
        status: 'completed',
        completed_date: new Date().toISOString(),
        outcome
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async deleteActivity(id: string) {
    const { error } = await this.supabase
      .from('activities')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }

  // Campaign Management
  static async getCampaigns(companyId: string) {
    const { data, error } = await this.supabase
      .from('campaigns')
      .select(`
        *,
        leads:leads(count),
        opportunities:opportunities(count)
      `)
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  }

  static async createCampaign(companyId: string, campaignData: CreateCampaignData) {
    const { data, error } = await this.supabase
      .from('campaigns')
      .insert({
        ...campaignData,
        company_id: companyId
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async updateCampaign(id: string, campaignData: Partial<CreateCampaignData>) {
    const { data, error } = await this.supabase
      .from('campaigns')
      .update(campaignData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async deleteCampaign(id: string) {
    const { error } = await this.supabase
      .from('campaigns')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }

  // Analytics and Reports
  static async getCRMAnalytics(companyId: string): Promise<CRMAnalytics> {
    // Get leads data
    const { data: leads, error: leadsError } = await this.supabase
      .from('leads')
      .select('*')
      .eq('company_id', companyId);
    
    if (leadsError) throw leadsError;

    // Get opportunities data
    const { data: opportunities, error: opportunitiesError } = await this.supabase
      .from('opportunities')
      .select('*')
      .eq('company_id', companyId);
    
    if (opportunitiesError) throw opportunitiesError;

    const totalLeads = leads.length;
    const qualifiedLeads = leads.filter(lead => lead.status === 'qualified').length;
    const convertedLeads = leads.filter(lead => lead.status === 'converted').length;
    const conversionRate = totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0;

    const totalOpportunities = opportunities.length;
    const pipelineValue = opportunities
      .filter(opp => !['closed_won', 'closed_lost'].includes(opp.stage))
      .reduce((sum, opp) => sum + (opp.value || 0), 0);
    
    const wonOpportunities = opportunities.filter(opp => opp.stage === 'closed_won');
    const wonOpportunitiesCount = wonOpportunities.length;
    const totalRevenue = wonOpportunities.reduce((sum, opp) => sum + (opp.value || 0), 0);
    const averageDealSize = wonOpportunitiesCount > 0 ? totalRevenue / wonOpportunitiesCount : 0;

    // Calculate average sales cycle (simplified)
    const salesCycleDays = 45; // Placeholder - would need historical data

    // Lead sources analysis
    const leadSourceCounts = leads.reduce((acc, lead) => {
      acc[lead.source] = (acc[lead.source] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const leadSources = Object.entries(leadSourceCounts).map(([source, count]) => {
      const converted = leads.filter(lead => lead.source === source && lead.status === 'converted').length;
      return {
        source,
        count,
        conversion_rate: (typeof count === 'number' && count > 0) ? (converted / count) * 100 : 0
      };
    });

    // Pipeline by stage
    const stageData = opportunities.reduce((acc, opp) => {
      if (!acc[opp.stage]) {
        acc[opp.stage] = { count: 0, value: 0 };
      }
      acc[opp.stage].count += 1;
      acc[opp.stage].value += opp.value || 0;
      return acc;
    }, {} as Record<string, { count: number; value: number }>);

    const pipelineByStage = Object.entries(stageData).map(([stage, data]) => ({
      stage,
      count: typeof (data as any).count === 'number' ? (data as any).count : 0,
      value: typeof (data as any).value === 'number' ? (data as any).value : 0
    }));

    // Monthly performance (last 6 months)
    const monthlyPerformance = [
      { month: 'Jan', leads_generated: 25, opportunities_created: 8, deals_won: 3, revenue: 45000 },
      { month: 'Feb', leads_generated: 32, opportunities_created: 12, deals_won: 5, revenue: 67000 },
      { month: 'Mar', leads_generated: 28, opportunities_created: 10, deals_won: 4, revenue: 52000 },
      { month: 'Apr', leads_generated: 35, opportunities_created: 15, deals_won: 6, revenue: 78000 },
      { month: 'May', leads_generated: 30, opportunities_created: 11, deals_won: 5, revenue: 65000 },
      { month: 'Jun', leads_generated: totalLeads, opportunities_created: totalOpportunities, deals_won: wonOpportunitiesCount, revenue: totalRevenue }
    ];

    // Top performers (placeholder)
    const topPerformers = [
      { name: 'John Doe', deals_won: 8, revenue: 120000 },
      { name: 'Jane Smith', deals_won: 6, revenue: 95000 },
      { name: 'Mike Johnson', deals_won: 5, revenue: 78000 }
    ];

    return {
      total_leads: totalLeads,
      qualified_leads: qualifiedLeads,
      conversion_rate: Math.round(conversionRate * 100) / 100,
      total_opportunities: totalOpportunities,
      pipeline_value: pipelineValue,
      won_opportunities: wonOpportunitiesCount,
      average_deal_size: Math.round(averageDealSize),
      sales_cycle_days: salesCycleDays,
      lead_sources: leadSources as Array<{source: string; count: number; conversion_rate: number}>,
      pipeline_by_stage: pipelineByStage,
      monthly_performance: monthlyPerformance,
      top_performers: topPerformers
    };
  }

  static async getUpcomingActivities(companyId: string, days: number = 7) {
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + days);

    const { data, error } = await this.supabase
      .from('activities')
      .select(`
        *,
        customer:customers(name),
        lead:leads(first_name, last_name, company_name),
        opportunity:opportunities(name),
        assigned_user:employees!activities_assigned_to_fkey(first_name, last_name)
      `)
      .eq('company_id', companyId)
      .eq('status', 'pending')
      .lte('due_date', endDate.toISOString().split('T')[0])
      .order('due_date');
    
    if (error) throw error;
    return data;
  }

  static async getOverdueActivities(companyId: string) {
    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await this.supabase
      .from('activities')
      .select(`
        *,
        customer:customers(name),
        lead:leads(first_name, last_name, company_name),
        opportunity:opportunities(name),
        assigned_user:employees!activities_assigned_to_fkey(first_name, last_name)
      `)
      .eq('company_id', companyId)
      .eq('status', 'pending')
      .lt('due_date', today)
      .order('due_date');
    
    if (error) throw error;
    return data;
  }

  static async getSalesForecast(companyId: string, months: number = 3) {
    const { data: opportunities, error } = await this.supabase
      .from('opportunities')
      .select('*')
      .eq('company_id', companyId)
      .in('stage', ['prospecting', 'qualification', 'proposal', 'negotiation'])
      .not('expected_close_date', 'is', null);
    
    if (error) throw error;

    // Group by month and calculate weighted forecast
    const forecast = opportunities.reduce((acc, opp) => {
      const closeDate = new Date(opp.expected_close_date);
      const monthKey = `${closeDate.getFullYear()}-${(closeDate.getMonth() + 1).toString().padStart(2, '0')}`;
      
      if (!acc[monthKey]) {
        acc[monthKey] = { month: monthKey, forecasted_revenue: 0, opportunity_count: 0 };
      }
      
      acc[monthKey].forecasted_revenue += (opp.value || 0) * (opp.probability / 100);
      acc[monthKey].opportunity_count += 1;
      
      return acc;
    }, {} as Record<string, { month: string; forecasted_revenue: number; opportunity_count: number }>);

    return Object.values(forecast).sort((a, b) => {
      const monthA = (a as { month: string }).month;
      const monthB = (b as { month: string }).month;
      return monthA.localeCompare(monthB);
    });
  }
}