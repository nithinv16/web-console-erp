import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '../../types/database';

const supabase = createClientComponentClient<Database>();

// Types for Business Intelligence
export interface Dashboard {
  id: string;
  company_id: string;
  name: string;
  description?: string;
  category: 'executive' | 'financial' | 'sales' | 'operations' | 'hr' | 'quality' | 'custom';
  layout: DashboardLayout;
  is_public: boolean;
  is_default: boolean;
  created_by: string;
  created_by_name?: string;
  created_at: string;
  updated_at: string;
}

export interface DashboardLayout {
  widgets: DashboardWidget[];
  columns: number;
  theme?: string;
}

export interface DashboardWidget {
  id: string;
  type: 'chart' | 'metric' | 'table' | 'gauge' | 'progress' | 'text';
  title: string;
  position: { x: number; y: number; width: number; height: number };
  config: WidgetConfig;
  data_source: string;
  refresh_interval?: number; // in seconds
}

export interface WidgetConfig {
  chart_type?: 'line' | 'bar' | 'pie' | 'doughnut' | 'area' | 'scatter';
  metric_type?: 'currency' | 'percentage' | 'number' | 'count';
  color_scheme?: string[];
  show_legend?: boolean;
  show_labels?: boolean;
  target_value?: number;
  format?: string;
  filters?: Record<string, any>;
}

export interface CreateDashboardData {
  name: string;
  description?: string;
  category: 'executive' | 'financial' | 'sales' | 'operations' | 'hr' | 'quality' | 'custom';
  layout: DashboardLayout;
  is_public?: boolean;
  is_default?: boolean;
}

export interface Report {
  id: string;
  company_id: string;
  name: string;
  description?: string;
  category: 'financial' | 'sales' | 'inventory' | 'hr' | 'operations' | 'quality' | 'custom';
  report_type: 'tabular' | 'summary' | 'chart' | 'pivot' | 'crosstab';
  data_source: string;
  query: ReportQuery;
  parameters: ReportParameter[];
  schedule?: ReportSchedule;
  format: 'pdf' | 'excel' | 'csv' | 'html';
  is_public: boolean;
  created_by: string;
  created_by_name?: string;
  created_at: string;
  updated_at: string;
}

export interface ReportQuery {
  tables: string[];
  fields: ReportField[];
  filters: ReportFilter[];
  grouping: string[];
  sorting: ReportSort[];
  aggregations: ReportAggregation[];
}

export interface ReportField {
  name: string;
  alias?: string;
  table?: string;
  type: 'string' | 'number' | 'date' | 'boolean';
  format?: string;
}

export interface ReportFilter {
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'like' | 'between';
  value: any;
  parameter?: string;
}

export interface ReportSort {
  field: string;
  direction: 'asc' | 'desc';
}

export interface ReportAggregation {
  field: string;
  function: 'sum' | 'avg' | 'count' | 'min' | 'max';
  alias?: string;
}

export interface ReportParameter {
  name: string;
  label: string;
  type: 'string' | 'number' | 'date' | 'boolean' | 'select' | 'multiselect';
  required: boolean;
  default_value?: any;
  options?: { value: any; label: string }[];
}

export interface ReportSchedule {
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  time: string; // HH:MM format
  day_of_week?: number; // 0-6 for weekly
  day_of_month?: number; // 1-31 for monthly
  recipients: string[]; // email addresses
  is_active: boolean;
}

export interface CreateReportData {
  name: string;
  description?: string;
  category: 'financial' | 'sales' | 'inventory' | 'hr' | 'operations' | 'quality' | 'custom';
  report_type: 'tabular' | 'summary' | 'chart' | 'pivot' | 'crosstab';
  data_source: string;
  query: ReportQuery;
  parameters?: ReportParameter[];
  schedule?: ReportSchedule;
  format?: 'pdf' | 'excel' | 'csv' | 'html';
  is_public?: boolean;
}

export interface KPI {
  id: string;
  company_id: string;
  name: string;
  description?: string;
  category: 'financial' | 'sales' | 'operations' | 'hr' | 'quality' | 'customer';
  metric_type: 'currency' | 'percentage' | 'number' | 'ratio';
  calculation_method: 'sum' | 'average' | 'count' | 'ratio' | 'custom';
  data_source: string;
  query: string;
  target_value?: number;
  target_type: 'fixed' | 'percentage_increase' | 'percentage_decrease';
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  unit_of_measure?: string;
  format?: string;
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface KPIValue {
  id: string;
  kpi_id: string;
  period_start: string;
  period_end: string;
  actual_value: number;
  target_value?: number;
  variance: number;
  variance_percentage: number;
  status: 'above_target' | 'on_target' | 'below_target';
  notes?: string;
  created_at: string;
}

export interface CreateKPIData {
  name: string;
  description?: string;
  category: 'financial' | 'sales' | 'operations' | 'hr' | 'quality' | 'customer';
  metric_type: 'currency' | 'percentage' | 'number' | 'ratio';
  calculation_method: 'sum' | 'average' | 'count' | 'ratio' | 'custom';
  data_source: string;
  query: string;
  target_value?: number;
  target_type: 'fixed' | 'percentage_increase' | 'percentage_decrease';
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  unit_of_measure?: string;
  format?: string;
}

export interface DataSource {
  id: string;
  company_id: string;
  name: string;
  description?: string;
  type: 'table' | 'view' | 'query' | 'api' | 'file';
  connection_string?: string;
  query?: string;
  refresh_frequency?: number; // in minutes
  last_refresh?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AnalyticsQuery {
  data_source: string;
  dimensions: string[];
  metrics: string[];
  filters?: Record<string, any>;
  date_range?: { start: string; end: string };
  group_by?: string[];
  order_by?: { field: string; direction: 'asc' | 'desc' }[];
  limit?: number;
}

export interface AnalyticsResult {
  data: Record<string, any>[];
  total_records: number;
  execution_time: number;
  metadata: {
    columns: { name: string; type: string }[];
    query: string;
  };
}

export interface BIFilters {
  category?: string;
  created_by?: string;
  is_public?: boolean;
  date_from?: string;
  date_to?: string;
  search?: string;
}

export class BusinessIntelligenceApi {
  // Dashboards
  async getDashboards(companyId: string, filters?: BIFilters) {
    let query = supabase
      .from('dashboards')
      .select(`
        *,
        creator:employees!dashboards_created_by_fkey(
          first_name,
          last_name
        )
      `)
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });

    if (filters) {
      if (filters.category) {
        query = query.eq('category', filters.category);
      }
      if (filters.created_by) {
        query = query.eq('created_by', filters.created_by);
      }
      if (filters.is_public !== undefined) {
        query = query.eq('is_public', filters.is_public);
      }
      if (filters.search) {
        query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }
    }

    const { data, error } = await query;
    if (error) throw error;

    return data.map(dashboard => ({
      ...dashboard,
      created_by_name: dashboard.creator 
        ? `${dashboard.creator.first_name} ${dashboard.creator.last_name}`
        : null
    }));
  }

  async getDashboardById(id: string) {
    const { data, error } = await supabase
      .from('dashboards')
      .select(`
        *,
        creator:employees!dashboards_created_by_fkey(
          first_name,
          last_name
        )
      `)
      .eq('id', id)
      .single();

    if (error) throw error;

    return {
      ...data,
      created_by_name: data.creator 
        ? `${data.creator.first_name} ${data.creator.last_name}`
        : null
    };
  }

  async createDashboard(companyId: string, createdBy: string, dashboardData: CreateDashboardData) {
    const { data, error } = await supabase
      .from('dashboards')
      .insert({
        company_id: companyId,
        created_by: createdBy,
        ...dashboardData,
        is_public: dashboardData.is_public || false,
        is_default: dashboardData.is_default || false
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateDashboard(id: string, updates: Partial<CreateDashboardData>) {
    const { data, error } = await supabase
      .from('dashboards')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteDashboard(id: string) {
    const { error } = await supabase
      .from('dashboards')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  async cloneDashboard(id: string, name: string) {
    const original = await this.getDashboardById(id);
    
    const { data, error } = await supabase
      .from('dashboards')
      .insert({
        company_id: original.company_id,
        name: name,
        description: `Copy of ${original.name}`,
        category: original.category,
        layout: original.layout,
        is_public: false,
        is_default: false,
        created_by: original.created_by
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Reports
  async getReports(companyId: string, filters?: BIFilters) {
    let query = supabase
      .from('reports')
      .select(`
        *,
        creator:employees!reports_created_by_fkey(
          first_name,
          last_name
        )
      `)
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });

    if (filters) {
      if (filters.category) {
        query = query.eq('category', filters.category);
      }
      if (filters.created_by) {
        query = query.eq('created_by', filters.created_by);
      }
      if (filters.is_public !== undefined) {
        query = query.eq('is_public', filters.is_public);
      }
      if (filters.search) {
        query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }
    }

    const { data, error } = await query;
    if (error) throw error;

    return data.map(report => ({
      ...report,
      created_by_name: report.creator 
        ? `${report.creator.first_name} ${report.creator.last_name}`
        : null
    }));
  }

  async getReportById(id: string) {
    const { data, error } = await supabase
      .from('reports')
      .select(`
        *,
        creator:employees!reports_created_by_fkey(
          first_name,
          last_name
        )
      `)
      .eq('id', id)
      .single();

    if (error) throw error;

    return {
      ...data,
      created_by_name: data.creator 
        ? `${data.creator.first_name} ${data.creator.last_name}`
        : null
    };
  }

  async createReport(companyId: string, createdBy: string, reportData: CreateReportData) {
    const { data, error } = await supabase
      .from('reports')
      .insert({
        company_id: companyId,
        created_by: createdBy,
        ...reportData,
        parameters: reportData.parameters || [],
        format: reportData.format || 'pdf',
        is_public: reportData.is_public || false
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateReport(id: string, updates: Partial<CreateReportData>) {
    const { data, error } = await supabase
      .from('reports')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteReport(id: string) {
    const { error } = await supabase
      .from('reports')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  async executeReport(id: string, parameters?: Record<string, any>) {
    const report = await this.getReportById(id);
    
    // Build and execute the query based on report configuration
    const result = await this.executeAnalyticsQuery({
      data_source: report.data_source,
      dimensions: report.query.fields.filter((f: ReportField) => f.type !== 'number').map((f: ReportField) => f.name),
      metrics: report.query.fields.filter((f: ReportField) => f.type === 'number').map((f: ReportField) => f.name),
      filters: this.buildFiltersFromReport(report.query.filters, parameters),
      group_by: report.query.grouping,
      order_by: report.query.sorting.map((s: ReportSort) => ({ field: s.field, direction: s.direction }))
    });

    return {
      report: report,
      data: result.data,
      generated_at: new Date().toISOString(),
      parameters: parameters
    };
  }

  // KPIs
  async getKPIs(companyId: string, filters?: BIFilters) {
    let query = supabase
      .from('kpis')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });

    if (filters) {
      if (filters.category) {
        query = query.eq('category', filters.category);
      }
      if (filters.search) {
        query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  async getKPIById(id: string) {
    const { data, error } = await supabase
      .from('kpis')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  async createKPI(companyId: string, createdBy: string, kpiData: CreateKPIData) {
    const { data, error } = await supabase
      .from('kpis')
      .insert({
        company_id: companyId,
        created_by: createdBy,
        ...kpiData,
        target_type: kpiData.target_type || 'fixed',
        is_active: true
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateKPI(id: string, updates: Partial<CreateKPIData & { is_active: boolean }>) {
    const { data, error } = await supabase
      .from('kpis')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteKPI(id: string) {
    const { error } = await supabase
      .from('kpis')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // KPI Values
  async getKPIValues(kpiId: string, dateRange?: { start: string; end: string }) {
    let query = supabase
      .from('kpi_values')
      .select('*')
      .eq('kpi_id', kpiId)
      .order('period_start', { ascending: false });

    if (dateRange) {
      query = query
        .gte('period_start', dateRange.start)
        .lte('period_end', dateRange.end);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  async recordKPIValue(kpiId: string, valueData: Omit<KPIValue, 'id' | 'kpi_id' | 'variance' | 'variance_percentage' | 'status' | 'created_at'>) {
    const kpi = await this.getKPIById(kpiId);
    const targetValue = valueData.target_value || kpi.target_value || 0;
    const variance = valueData.actual_value - targetValue;
    const variancePercentage = targetValue !== 0 ? (variance / targetValue) * 100 : 0;
    
    let status: 'above_target' | 'on_target' | 'below_target';
    if (Math.abs(variancePercentage) <= 5) {
      status = 'on_target';
    } else if (variance > 0) {
      status = 'above_target';
    } else {
      status = 'below_target';
    }

    const { data, error } = await supabase
      .from('kpi_values')
      .insert({
        kpi_id: kpiId,
        ...valueData,
        target_value: targetValue,
        variance: variance,
        variance_percentage: variancePercentage,
        status: status
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async calculateKPIValue(kpiId: string, periodStart: string, periodEnd: string) {
    const kpi = await this.getKPIById(kpiId);
    
    // Execute the KPI query with date parameters
    const result = await this.executeCustomQuery(kpi.query, {
      period_start: periodStart,
      period_end: periodEnd,
      company_id: kpi.company_id
    });

    if (result.data.length > 0) {
      const actualValue = result.data[0].value || 0;
      
      await this.recordKPIValue(kpiId, {
        period_start: periodStart,
        period_end: periodEnd,
        actual_value: actualValue
      });

      return actualValue;
    }

    return 0;
  }

  // Data Sources
  async getDataSources(companyId: string) {
    const { data, error } = await supabase
      .from('data_sources')
      .select('*')
      .eq('company_id', companyId)
      .order('name');

    if (error) throw error;
    return data;
  }

  async createDataSource(companyId: string, dataSourceData: Omit<DataSource, 'id' | 'company_id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('data_sources')
      .insert({
        company_id: companyId,
        ...dataSourceData,
        is_active: dataSourceData.is_active !== false
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateDataSource(id: string, updates: Partial<Omit<DataSource, 'id' | 'company_id' | 'created_at'>>) {
    const { data, error } = await supabase
      .from('data_sources')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async refreshDataSource(id: string) {
    const { data, error } = await supabase
      .from('data_sources')
      .update({
        last_refresh: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Analytics and Queries
  async executeAnalyticsQuery(query: AnalyticsQuery): Promise<AnalyticsResult> {
    const startTime = Date.now();
    
    try {
      // This is a simplified implementation
      // In a real application, you would build and execute SQL queries based on the analytics query
      const { data, error } = await supabase
        .rpc('execute_analytics_query', {
          p_data_source: query.data_source,
          p_dimensions: query.dimensions,
          p_metrics: query.metrics,
          p_filters: query.filters || {},
          p_date_range: query.date_range,
          p_group_by: query.group_by || [],
          p_order_by: query.order_by || [],
          p_limit: query.limit || 1000
        });

      if (error) throw error;

      const executionTime = Date.now() - startTime;

      return {
        data: data || [],
        total_records: data?.length || 0,
        execution_time: executionTime,
        metadata: {
          columns: this.extractColumns(data),
          query: 'Generated SQL query would be here'
        }
      };
    } catch (error) {
      throw new Error(`Analytics query failed: ${error}`);
    }
  }

  async executeCustomQuery(query: string, parameters?: Record<string, any>): Promise<AnalyticsResult> {
    const startTime = Date.now();
    
    try {
      const { data, error } = await supabase
        .rpc('execute_custom_query', {
          p_query: query,
          p_parameters: parameters || {}
        });

      if (error) throw error;

      const executionTime = Date.now() - startTime;

      return {
        data: data || [],
        total_records: data?.length || 0,
        execution_time: executionTime,
        metadata: {
          columns: this.extractColumns(data),
          query: query
        }
      };
    } catch (error) {
      throw new Error(`Custom query failed: ${error}`);
    }
  }

  // Widget Data
  async getWidgetData(widgetConfig: DashboardWidget, dateRange?: { start: string; end: string }) {
    const query: AnalyticsQuery = {
      data_source: widgetConfig.data_source,
      dimensions: [],
      metrics: [],
      filters: widgetConfig.config.filters,
      date_range: dateRange
    };

    // Configure query based on widget type
    switch (widgetConfig.type) {
      case 'chart':
        query.dimensions = ['date', 'category'];
        query.metrics = ['value'];
        query.group_by = ['date'];
        break;
      case 'metric':
        query.metrics = ['value'];
        break;
      case 'table':
        query.dimensions = ['name', 'category'];
        query.metrics = ['value', 'count'];
        break;
      case 'gauge':
        query.metrics = ['current_value', 'target_value'];
        break;
    }

    return await this.executeAnalyticsQuery(query);
  }

  // Utility Functions
  private extractColumns(data: any[]): { name: string; type: string }[] {
    if (!data || data.length === 0) return [];
    
    const firstRow = data[0];
    return Object.keys(firstRow).map(key => ({
      name: key,
      type: typeof firstRow[key]
    }));
  }

  private buildFiltersFromReport(reportFilters: ReportFilter[], parameters?: Record<string, any>): Record<string, any> {
    const filters: Record<string, any> = {};
    
    reportFilters.forEach(filter => {
      let value = filter.value;
      
      // Replace parameter placeholders
      if (filter.parameter && parameters && parameters[filter.parameter] !== undefined) {
        value = parameters[filter.parameter];
      }
      
      filters[filter.field] = {
        operator: filter.operator,
        value: value
      };
    });
    
    return filters;
  }

  // Dashboard Analytics
  async getDashboardAnalytics(companyId: string) {
    const { data: dashboards } = await supabase
      .from('dashboards')
      .select('category')
      .eq('company_id', companyId);

    const { data: reports } = await supabase
      .from('reports')
      .select('category')
      .eq('company_id', companyId);

    const { data: kpis } = await supabase
      .from('kpis')
      .select('category, is_active')
      .eq('company_id', companyId);

    const dashboardsByCategory = this.groupByCategory(dashboards || []);
    const reportsByCategory = this.groupByCategory(reports || []);
    const kpisByCategory = this.groupByCategory(kpis || []);
    const activeKPIs = kpis?.filter(k => k.is_active).length || 0;

    return {
      total_dashboards: dashboards?.length || 0,
      total_reports: reports?.length || 0,
      total_kpis: kpis?.length || 0,
      active_kpis: activeKPIs,
      dashboards_by_category: dashboardsByCategory,
      reports_by_category: reportsByCategory,
      kpis_by_category: kpisByCategory
    };
  }

  private groupByCategory(items: { category: string }[]) {
    return items.reduce((acc, item) => {
      acc[item.category] = (acc[item.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  // Executive Dashboard Data
  async getExecutiveDashboard(companyId: string) {
    // Get key metrics for executive dashboard
    const [salesData, financialData, operationsData, hrData] = await Promise.all([
      this.getSalesMetrics(companyId),
      this.getFinancialMetrics(companyId),
      this.getOperationsMetrics(companyId),
      this.getHRMetrics(companyId)
    ]);

    return {
      sales: salesData,
      financial: financialData,
      operations: operationsData,
      hr: hrData,
      generated_at: new Date().toISOString()
    };
  }

  private async getSalesMetrics(companyId: string) {
    const { data } = await supabase
      .rpc('get_sales_metrics_summary', { p_company_id: companyId });
    
    return data?.[0] || {
      total_revenue: 0,
      monthly_growth: 0,
      active_opportunities: 0,
      conversion_rate: 0
    };
  }

  private async getFinancialMetrics(companyId: string) {
    const { data } = await supabase
      .rpc('get_financial_metrics_summary', { p_company_id: companyId });
    
    return data?.[0] || {
      total_assets: 0,
      total_liabilities: 0,
      net_profit: 0,
      cash_flow: 0
    };
  }

  private async getOperationsMetrics(companyId: string) {
    const { data } = await supabase
      .rpc('get_operations_metrics_summary', { p_company_id: companyId });
    
    return data?.[0] || {
      production_efficiency: 0,
      quality_score: 0,
      on_time_delivery: 0,
      inventory_turnover: 0
    };
  }

  private async getHRMetrics(companyId: string) {
    const { data } = await supabase
      .rpc('get_hr_metrics_summary', { p_company_id: companyId });
    
    return data?.[0] || {
      total_employees: 0,
      employee_satisfaction: 0,
      turnover_rate: 0,
      training_completion: 0
    };
  }

  // Scheduled Reports
  async getScheduledReports(companyId: string) {
    const { data, error } = await supabase
      .from('reports')
      .select('*')
      .eq('company_id', companyId)
      .not('schedule', 'is', null)
      .eq('schedule->is_active', true);

    if (error) throw error;
    return data;
  }

  async executeScheduledReport(reportId: string) {
    const report = await this.getReportById(reportId);
    const result = await this.executeReport(reportId);
    
    // In a real implementation, you would:
    // 1. Generate the report in the specified format
    // 2. Send it to the recipients
    // 3. Log the execution
    
    return {
      report_id: reportId,
      executed_at: new Date().toISOString(),
      status: 'success',
      recipients: report.schedule?.recipients || [],
      record_count: result.data.length
    };
  }
}

export const businessIntelligenceApi = new BusinessIntelligenceApi();
export default businessIntelligenceApi;