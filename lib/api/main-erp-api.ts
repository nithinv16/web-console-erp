import { AccountingApi } from './accounting-api';
import { AssetManagementApi } from './asset-management-api';
import { BusinessIntelligenceApi } from './business-intelligence-api';
import { CommunicationApi } from './communication-api';
import { CRMApi } from './crm-api';
import { DocumentManagementApi } from './document-management-api';
import { HRApi } from './hr-api';
import { InventoryApi } from './inventory-api';
import { InvoiceApi } from './invoice-api';
// import { ManufacturingApi } from './manufacturing-api'; // Disabled - tables don't exist
import { ProjectManagementApi } from './project-management-api';
import { QualityManagementApi } from './quality-management-api';
import { SalesApi } from './sales-api';
// import { SupplyChainApi } from './supply-chain-api'; // Disabled - tables don't exist
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '../../types/database';

const supabase = createClientComponentClient<Database>();

// Main ERP API Types
export interface ERPModuleStatus {
  module: string;
  status: 'active' | 'inactive' | 'maintenance';
  version: string;
  last_updated: string;
}

export interface ERPSystemHealth {
  overall_status: 'healthy' | 'warning' | 'critical';
  modules: ERPModuleStatus[];
  database_status: 'connected' | 'disconnected' | 'slow';
  api_response_time: number;
  active_users: number;
  system_load: number;
  last_check: string;
}

export interface ERPDashboardData {
  sales: {
    total_revenue: number;
    monthly_growth: number;
    active_opportunities: number;
    conversion_rate: number;
  };
  financial: {
    total_assets: number;
    total_liabilities: number;
    net_profit: number;
    cash_flow: number;
  };
  operations: {
    production_efficiency: number;
    quality_score: number;
    on_time_delivery: number;
    inventory_turnover: number;
  };
  hr: {
    total_employees: number;
    employee_satisfaction: number;
    turnover_rate: number;
    training_completion: number;
  };
  recent_activities: {
    id: string;
    type: string;
    description: string;
    user: string;
    timestamp: string;
  }[];
  alerts: {
    id: string;
    type: 'info' | 'warning' | 'error' | 'success';
    message: string;
    module: string;
    timestamp: string;
  }[];
}

export interface ERPUserPermissions {
  user_id: string;
  modules: {
    [key: string]: {
      read: boolean;
      write: boolean;
      delete: boolean;
      admin: boolean;
    };
  };
  role: string;
  company_id: string;
}

export interface ERPAuditLog {
  id: string;
  user_id: string;
  user_name: string;
  action: string;
  module: string;
  resource_type: string;
  resource_id: string;
  old_values?: Record<string, any>;
  new_values?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  timestamp: string;
}

export interface ERPSystemSettings {
  company_name: string;
  company_logo?: string;
  timezone: string;
  currency: string;
  date_format: string;
  number_format: string;
  fiscal_year_start: string;
  multi_currency_enabled: boolean;
  modules_enabled: string[];
  backup_frequency: 'daily' | 'weekly' | 'monthly';
  data_retention_days: number;
  security_settings: {
    password_policy: {
      min_length: number;
      require_uppercase: boolean;
      require_lowercase: boolean;
      require_numbers: boolean;
      require_symbols: boolean;
    };
    session_timeout_minutes: number;
    max_login_attempts: number;
    two_factor_required: boolean;
  };
}

// Main ERP API Class
export class MainERPApi {
  // Module APIs
  static accounting = AccountingApi;
  static assets = AssetManagementApi;
  static bi = BusinessIntelligenceApi;
  static communication = CommunicationApi;
  static crm = CRMApi;
  static documents = DocumentManagementApi;
  static hr = HRApi;
  static inventory = InventoryApi;
  static invoices = InvoiceApi;
  // static manufacturing = ManufacturingApi; // Disabled - tables don't exist
  static projects = ProjectManagementApi;
  static quality = QualityManagementApi;
  static sales = SalesApi;
  // static supplyChain = SupplyChainApi; // Disabled - tables don't exist

  // System Health and Monitoring
  static async getSystemHealth(): Promise<ERPSystemHealth> {
    const startTime = Date.now();
    
    try {
      // Test database connection
      const { data: dbTest, error: dbError } = await supabase
        .from('companies')
        .select('id')
        .limit(1);
      
      const apiResponseTime = Date.now() - startTime;
      
      // Get active users count
      const { data: activeUsers } = await supabase
        .from('employees')
        .select('id')
        .eq('status', 'active');
      
      // Module status checks
      const modules: ERPModuleStatus[] = [
        { module: 'Sales', status: 'active', version: '1.0.0', last_updated: new Date().toISOString() },
        { module: 'Accounting', status: 'active', version: '1.0.0', last_updated: new Date().toISOString() },
        { module: 'Inventory', status: 'active', version: '1.0.0', last_updated: new Date().toISOString() },
        { module: 'CRM', status: 'active', version: '1.0.0', last_updated: new Date().toISOString() },
        { module: 'HR', status: 'active', version: '1.0.0', last_updated: new Date().toISOString() },
        { module: 'Manufacturing', status: 'inactive', version: '1.0.0', last_updated: new Date().toISOString() },
        { module: 'Supply Chain', status: 'inactive', version: '1.0.0', last_updated: new Date().toISOString() },
        { module: 'Project Management', status: 'active', version: '1.0.0', last_updated: new Date().toISOString() },
        { module: 'Quality Management', status: 'active', version: '1.0.0', last_updated: new Date().toISOString() },
        { module: 'Asset Management', status: 'active', version: '1.0.0', last_updated: new Date().toISOString() },
        { module: 'Document Management', status: 'active', version: '1.0.0', last_updated: new Date().toISOString() },
        { module: 'Business Intelligence', status: 'active', version: '1.0.0', last_updated: new Date().toISOString() },
        { module: 'Communication', status: 'active', version: '1.0.0', last_updated: new Date().toISOString() }
      ];
      
      return {
        overall_status: dbError ? 'critical' : apiResponseTime > 2000 ? 'warning' : 'healthy',
        modules,
        database_status: dbError ? 'disconnected' : apiResponseTime > 1000 ? 'slow' : 'connected',
        api_response_time: apiResponseTime,
        active_users: activeUsers?.length || 0,
        system_load: Math.random() * 100, // Placeholder
        last_check: new Date().toISOString()
      };
    } catch (error) {
      return {
        overall_status: 'critical',
        modules: [],
        database_status: 'disconnected',
        api_response_time: Date.now() - startTime,
        active_users: 0,
        system_load: 0,
        last_check: new Date().toISOString()
      };
    }
  }

  // Executive Dashboard Data
  static async getDashboardData(): Promise<ERPDashboardData> {
    try {
      const [salesData, financialData, operationsData, hrData, activities, alerts] = await Promise.all([
        Promise.resolve({ total_revenue: 0, monthly_growth: 0, active_opportunities: 0, conversion_rate: 0 }),
        supabase.rpc('get_financial_metrics_summary'),
        supabase.rpc('get_operations_metrics_summary'),
        supabase.rpc('get_hr_metrics_summary'),
        this.getRecentActivities(),
        this.getSystemAlerts()
      ]);

      return {
        sales: {
          total_revenue: salesData.total_revenue || 0,
          monthly_growth: salesData.monthly_growth || 0,
          active_opportunities: salesData.active_opportunities || 0,
          conversion_rate: salesData.conversion_rate || 0
        },
        financial: {
          total_assets: financialData.data?.total_assets || 0,
          total_liabilities: financialData.data?.total_liabilities || 0,
          net_profit: financialData.data?.net_profit || 0,
          cash_flow: financialData.data?.cash_flow || 0
        },
        operations: {
          production_efficiency: operationsData.data?.production_efficiency || 0,
          quality_score: operationsData.data?.quality_score || 0,
          on_time_delivery: operationsData.data?.on_time_delivery || 0,
          inventory_turnover: operationsData.data?.inventory_turnover || 0
        },
        hr: {
          total_employees: hrData.data?.total_employees || 0,
          employee_satisfaction: hrData.data?.employee_satisfaction || 0,
          turnover_rate: hrData.data?.turnover_rate || 0,
          training_completion: hrData.data?.training_completion || 0
        },
        recent_activities: activities,
        alerts: alerts
      };
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      throw error;
    }
  }

  // Recent Activities
  static async getRecentActivities(limit = 10) {
    const { data, error } = await supabase
      .from('erp_audit_logs')
      .select(`
        id,
        action,
        module,
        resource_type,
        user_name,
        timestamp:created_at
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return data.map(activity => ({
      id: activity.id,
      type: activity.module,
      description: `${activity.action} ${activity.resource_type}`,
      user: activity.user_name,
      timestamp: activity.timestamp
    }));
  }

  // System Alerts
  static async getSystemAlerts(limit = 5) {
    const { data, error } = await supabase
      .from('bi_alert_logs')
      .select(`
        id,
        message,
        triggered_at,
        alert:bi_alerts(
          alert_type,
          name
        )
      `)
      .order('triggered_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return data.map(alert => ({
      id: alert.id,
      type: 'warning' as const,
      message: alert.message || (Array.isArray(alert.alert) ? (alert.alert[0] as any)?.name : (alert.alert as any)?.name) || 'System Alert',
      module: (Array.isArray(alert.alert) ? (alert.alert[0] as any)?.alert_type : (alert.alert as any)?.alert_type) || 'System',
      timestamp: alert.triggered_at
    }));
  }

  // User Permissions
  static async getUserPermissions(userId: string): Promise<ERPUserPermissions> {
    const { data: employee, error } = await supabase
      .from('employees')
      .select(`
        id,
        role,
        company_id,
        permissions
      `)
      .eq('id', userId)
      .single();

    if (error) throw error;

    // Default permissions structure
    const defaultModulePermissions = {
      read: true,
      write: false,
      delete: false,
      admin: false
    };

    const modules = {
      sales: { ...defaultModulePermissions, write: true },
      accounting: { ...defaultModulePermissions },
      inventory: { ...defaultModulePermissions, write: true },
      crm: { ...defaultModulePermissions, write: true },
      hr: { ...defaultModulePermissions },
      manufacturing: { ...defaultModulePermissions },
      supply_chain: { ...defaultModulePermissions },
      projects: { ...defaultModulePermissions, write: true },
      quality: { ...defaultModulePermissions },
      assets: { ...defaultModulePermissions },
      documents: { ...defaultModulePermissions, write: true },
      bi: { ...defaultModulePermissions },
      communication: { ...defaultModulePermissions, write: true }
    };

    // Override with actual permissions if available
    if (employee.permissions) {
      Object.keys(employee.permissions).forEach(module => {
        if (modules[module as keyof typeof modules]) {
          modules[module as keyof typeof modules] = { ...modules[module as keyof typeof modules], ...employee.permissions[module] };
        }
      });
    }

    return {
      user_id: userId,
      modules,
      role: employee.role,
      company_id: employee.company_id
    };
  }

  // Audit Logging
  static async logActivity(
    action: string,
    module: string,
    resourceType: string,
    resourceId: string,
    oldValues?: Record<string, any>,
    newValues?: Record<string, any>
  ) {
    try {
      const { data: user } = await supabase.auth.getUser();
      
      if (!user.user) return;

      const { data: employee } = await supabase
        .from('employees')
        .select('full_name')
        .eq('auth_user_id', user.user.id)
        .single();

      await supabase
        .from('erp_audit_logs')
        .insert({
          user_id: user.user.id,
          user_name: employee?.full_name || 'Unknown User',
          action,
          module,
          resource_type: resourceType,
          resource_id: resourceId,
          old_values: oldValues,
          new_values: newValues
        });
    } catch (error) {
      console.error('Error logging activity:', error);
    }
  }

  // System Settings
  static async getSystemSettings(): Promise<ERPSystemSettings> {
    const { data, error } = await supabase
      .from('companies')
      .select(`
        name,
        logo_url,
        settings
      `)
      .single();

    if (error) throw error;

    const defaultSettings: ERPSystemSettings = {
      company_name: data.name || 'ERP Company',
      company_logo: data.logo_url,
      timezone: 'UTC',
      currency: 'USD',
      date_format: 'MM/DD/YYYY',
      number_format: 'en-US',
      fiscal_year_start: '01-01',
      multi_currency_enabled: false,
      modules_enabled: [
        'sales', 'accounting', 'inventory', 'crm', 'hr',
        'manufacturing', 'supply_chain', 'projects', 'quality',
        'assets', 'documents', 'bi', 'communication'
      ],
      backup_frequency: 'daily',
      data_retention_days: 2555, // 7 years
      security_settings: {
        password_policy: {
          min_length: 8,
          require_uppercase: true,
          require_lowercase: true,
          require_numbers: true,
          require_symbols: false
        },
        session_timeout_minutes: 480, // 8 hours
        max_login_attempts: 5,
        two_factor_required: false
      }
    };

    // Merge with stored settings
    if (data.settings) {
      return { ...defaultSettings, ...data.settings };
    }

    return defaultSettings;
  }

  static async updateSystemSettings(settings: Partial<ERPSystemSettings>) {
    const { data, error } = await supabase
      .from('companies')
      .update({
        settings,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Data Export/Import
  static async exportData(companyId: string, modules: string[], format: 'json' | 'csv' | 'excel' = 'json') {
    const exportData: Record<string, any> = {};

    for (const module of modules) {
      try {
        switch (module) {
          case 'sales':
            exportData.sales = {
              orders: await this.sales.getSalesOrders(companyId),
              analytics: await this.sales.getSalesAnalytics(companyId),
              recent_orders: await this.sales.getRecentSalesOrders(companyId)
            };
            break;
          case 'inventory':
            exportData.inventory = {
              products: await this.inventory.getInventory(companyId),
              warehouses: await this.inventory.getWarehouses(companyId),
              transactions: await this.inventory.getInventoryTransactions(companyId)
            };
            break;
          case 'accounting':
            exportData.accounting = {
              accounts: await this.accounting.getChartOfAccounts(companyId),
              journal_entries: await this.accounting.getJournalEntries(companyId),
              invoices: await this.invoices.getInvoices(companyId)
            };
            break;
          // Add other modules as needed
        }
      } catch (error) {
        console.error(`Error exporting ${module}:`, error);
      }
    }

    return {
      export_date: new Date().toISOString(),
      format,
      modules,
      data: exportData
    };
  }

  // Search across modules
  static async globalSearch(query: string, modules?: string[], limit = 50) {
    const results: Array<{
      module: string;
      type: string;
      id: string;
      title: string;
      description?: string;
      url: string;
      relevance: number;
    }> = [];

    const searchModules = modules || ['sales', 'inventory', 'accounting', 'crm', 'hr'];

    for (const module of searchModules) {
      try {
        switch (module) {
          case 'sales':
            const { data: customers } = await supabase
              .from('customers')
              .select()
              .textSearch('name', query)
              .limit(10);
            customers?.forEach(customer => {
              results.push({
                module: 'sales',
                type: 'customer',
                id: customer.id,
                title: customer.name,
                description: customer.email,
                url: `/erp/sales/customers/${customer.id}`,
                relevance: 0.9
              });
            });
            break;
          case 'inventory':
            const { data: products } = await supabase
              .from('products')
              .select()
              .textSearch('name', query)
              .limit(10);
            products?.forEach((product: { id: string; name: string; description: string; }) => {
              results.push({
                module: 'inventory',
                type: 'product',
                id: product.id,
                title: product.name,
                description: product.description,
                url: `/erp/inventory/products/${product.id}`,
                relevance: 0.8
              });
            });
            break;
          // Add other modules as needed
        }
      } catch (error) {
        console.error(`Error searching ${module}:`, error);
      }
    }

    return results
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, limit);
  }

  // System Statistics
  static async getSystemStatistics() {
    const [users, customers, products, orders, invoices] = await Promise.all([
      supabase.from('employees').select('id', { count: 'exact', head: true }),
      supabase.from('customers').select('id', { count: 'exact', head: true }),
      supabase.from('products').select('id', { count: 'exact', head: true }),
      supabase.from('orders').select('id', { count: 'exact', head: true }),
      supabase.from('invoices').select('id', { count: 'exact', head: true })
    ]);

    return {
      total_users: users.count || 0,
      total_customers: customers.count || 0,
      total_products: products.count || 0,
      total_orders: orders.count || 0,
      total_invoices: invoices.count || 0,
      system_uptime: '99.9%', // Placeholder
      last_backup: new Date().toISOString(), // Placeholder
      storage_used: '1.2 GB', // Placeholder
      api_calls_today: 15420 // Placeholder
    };
  }

  // Utility Functions
  static async checkModuleAccess(module: string, action: 'read' | 'write' | 'delete' | 'admin' = 'read') {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return false;

      const permissions = await this.getUserPermissions(user.user.id);
      return permissions.modules[module]?.[action] || false;
    } catch (error) {
      console.error('Error checking module access:', error);
      return false;
    }
  }

  static formatCurrency(amount: number, currency = 'USD') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency
    }).format(amount);
  }

  static formatDate(date: string | Date, format = 'MM/DD/YYYY') {
    const d = new Date(date);
    return d.toLocaleDateString('en-US');
  }

  static formatNumber(number: number, locale = 'en-US') {
    return new Intl.NumberFormat(locale).format(number);
  }

  static generateId() {
    return crypto.randomUUID();
  }

  static validateEmail(email: string) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  static validatePhone(phone: string) {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
  }

  static calculatePercentageChange(current: number, previous: number) {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  }

  static truncateText(text: string, maxLength = 100) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  }

  static debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  }
}

// Export all module APIs for convenience
export {
  AccountingApi,
  AssetManagementApi,
  BusinessIntelligenceApi,
  CommunicationApi,
  CRMApi,
  DocumentManagementApi,
  HRApi,
  InventoryApi,
  InvoiceApi,
  // ManufacturingApi, // Disabled - tables don't exist
  ProjectManagementApi,
  QualityManagementApi,
  SalesApi,
  // SupplyChainApi // Commented out since it's not imported
};

// Default export
export default MainERPApi;