import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '../../types/database';

const supabase = createClientComponentClient<Database>();

// Asset Management Interfaces
export interface Asset {
  id: string;
  company_id: string;
  asset_code: string;
  name: string;
  description?: string;
  category: string;
  subcategory?: string;
  location: string;
  department?: string;
  assigned_to?: string;
  status: 'active' | 'inactive' | 'disposed' | 'under_maintenance' | 'lost';
  condition: 'excellent' | 'good' | 'fair' | 'poor' | 'damaged';
  purchase_date: string;
  purchase_cost: number;
  current_value: number;
  depreciation_method: 'straight_line' | 'declining_balance' | 'sum_of_years' | 'units_of_production';
  useful_life_years: number;
  salvage_value: number;
  warranty_expiry?: string;
  insurance_details?: string;
  serial_number?: string;
  model?: string;
  manufacturer?: string;
  supplier_id?: string;
  last_maintenance_date?: string;
  next_maintenance_date?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateAssetData {
  asset_code: string;
  name: string;
  description?: string;
  category: string;
  subcategory?: string;
  location: string;
  department?: string;
  assigned_to?: string;
  status: 'active' | 'inactive' | 'disposed' | 'under_maintenance' | 'lost';
  condition: 'excellent' | 'good' | 'fair' | 'poor' | 'damaged';
  purchase_date: string;
  purchase_cost: number;
  depreciation_method: 'straight_line' | 'declining_balance' | 'sum_of_years' | 'units_of_production';
  useful_life_years: number;
  salvage_value: number;
  warranty_expiry?: string;
  insurance_details?: string;
  serial_number?: string;
  model?: string;
  manufacturer?: string;
  supplier_id?: string;
}

export interface AssetTransfer {
  id: string;
  asset_id: string;
  from_location: string;
  to_location: string;
  from_employee?: string;
  to_employee?: string;
  transfer_date: string;
  reason: string;
  approved_by?: string;
  status: 'pending' | 'approved' | 'completed' | 'rejected';
  notes?: string;
  created_by: string;
  created_at: string;
}

export interface CreateAssetTransferData {
  asset_id: string;
  from_location: string;
  to_location: string;
  from_employee?: string;
  to_employee?: string;
  transfer_date: string;
  reason: string;
  notes?: string;
}

export interface AssetMaintenance {
  id: string;
  asset_id: string;
  maintenance_type: 'preventive' | 'corrective' | 'emergency' | 'upgrade';
  description: string;
  scheduled_date: string;
  completed_date?: string;
  cost: number;
  performed_by?: string;
  vendor_id?: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'critical';
  downtime_hours?: number;
  parts_used?: string[];
  notes?: string;
  next_maintenance_date?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface CreateMaintenanceData {
  asset_id: string;
  maintenance_type: 'preventive' | 'corrective' | 'emergency' | 'upgrade';
  description: string;
  scheduled_date: string;
  cost: number;
  performed_by?: string;
  vendor_id?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  parts_used?: string[];
  notes?: string;
  next_maintenance_date?: string;
}

export interface AssetDepreciation {
  id: string;
  asset_id: string;
  depreciation_date: string;
  opening_value: number;
  depreciation_amount: number;
  accumulated_depreciation: number;
  closing_value: number;
  depreciation_rate: number;
  method: string;
  financial_year: string;
  created_at: string;
}

export interface AssetDisposal {
  id: string;
  asset_id: string;
  disposal_date: string;
  disposal_method: 'sale' | 'scrap' | 'donation' | 'trade_in' | 'write_off';
  disposal_value: number;
  buyer_details?: string;
  reason: string;
  approval_required: boolean;
  approved_by?: string;
  approval_date?: string;
  status: 'pending' | 'approved' | 'completed' | 'rejected';
  gain_loss_amount: number;
  notes?: string;
  created_by: string;
  created_at: string;
}

export interface CreateDisposalData {
  asset_id: string;
  disposal_date: string;
  disposal_method: 'sale' | 'scrap' | 'donation' | 'trade_in' | 'write_off';
  disposal_value: number;
  buyer_details?: string;
  reason: string;
  approval_required: boolean;
  notes?: string;
}

export interface AssetFilters {
  category?: string;
  status?: string;
  location?: string;
  department?: string;
  assigned_to?: string;
  condition?: string;
  search?: string;
  date_from?: string;
  date_to?: string;
}

export interface AssetAnalytics {
  total_assets: number;
  total_value: number;
  active_assets: number;
  inactive_assets: number;
  under_maintenance: number;
  disposed_assets: number;
  average_age: number;
  total_depreciation: number;
  maintenance_cost_ytd: number;
  assets_by_category: { category: string; count: number; value: number }[];
  assets_by_location: { location: string; count: number; value: number }[];
  depreciation_trend: { month: string; amount: number }[];
  maintenance_trend: { month: string; cost: number; count: number }[];
  top_value_assets: { id: string; name: string; current_value: number }[];
  upcoming_maintenance: { id: string; name: string; next_maintenance_date: string }[];
}

export class AssetManagementApi {
  // Asset CRUD Operations
  static async getAssets(companyId: string, filters?: AssetFilters) {
    let query = supabase
      .from('assets')
      .select(`
        *,
        assigned_employee:employees!assets_assigned_to_fkey(id, first_name, last_name),
        supplier:suppliers(id, name)
      `)
      .eq('company_id', companyId);

    if (filters?.category) {
      query = query.eq('category', filters.category);
    }
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.location) {
      query = query.eq('location', filters.location);
    }
    if (filters?.department) {
      query = query.eq('department', filters.department);
    }
    if (filters?.assigned_to) {
      query = query.eq('assigned_to', filters.assigned_to);
    }
    if (filters?.condition) {
      query = query.eq('condition', filters.condition);
    }
    if (filters?.search) {
      query = query.or(`name.ilike.%${filters.search}%,asset_code.ilike.%${filters.search}%,serial_number.ilike.%${filters.search}%`);
    }
    if (filters?.date_from) {
      query = query.gte('purchase_date', filters.date_from);
    }
    if (filters?.date_to) {
      query = query.lte('purchase_date', filters.date_to);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  }

  static async getAsset(id: string) {
    const { data, error } = await supabase
      .from('assets')
      .select(`
        *,
        assigned_employee:employees!assets_assigned_to_fkey(id, first_name, last_name, email),
        supplier:suppliers(id, name, contact_person, phone),
        maintenance_records:asset_maintenance(id, maintenance_type, scheduled_date, completed_date, cost, status),
        transfer_history:asset_transfers(id, from_location, to_location, transfer_date, reason, status)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  static async createAsset(companyId: string, assetData: CreateAssetData) {
    // Generate asset code if not provided
    if (!assetData.asset_code) {
      const { data: lastAsset } = await supabase
        .from('assets')
        .select('asset_code')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      const lastNumber = lastAsset?.asset_code ? parseInt(lastAsset.asset_code.split('-').pop() || '0') : 0;
      assetData.asset_code = `AST-${String(lastNumber + 1).padStart(6, '0')}`;
    }

    const { data, error } = await supabase
      .from('assets')
      .insert({
        ...assetData,
        company_id: companyId,
        current_value: assetData.purchase_cost // Initial current value equals purchase cost
      })
      .select()
      .single();

    if (error) throw error;

    // Create initial depreciation entry
    await this.calculateAndCreateDepreciation(data.id);

    return data;
  }

  static async updateAsset(id: string, updates: Partial<CreateAssetData>) {
    const { data, error } = await supabase
      .from('assets')
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

  static async deleteAsset(id: string) {
    const { error } = await supabase
      .from('assets')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // Asset Transfer Operations
  static async getAssetTransfers(companyId: string, assetId?: string) {
    let query = supabase
      .from('asset_transfers')
      .select(`
        *,
        asset:assets!inner(id, name, asset_code, company_id),
        from_emp:employees!asset_transfers_from_employee_fkey(id, first_name, last_name),
        to_emp:employees!asset_transfers_to_employee_fkey(id, first_name, last_name),
        created_by_emp:employees!asset_transfers_created_by_fkey(id, first_name, last_name),
        approved_by_emp:employees!asset_transfers_approved_by_fkey(id, first_name, last_name)
      `)
      .eq('asset.company_id', companyId);

    if (assetId) {
      query = query.eq('asset_id', assetId);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  }

  static async createAssetTransfer(transferData: CreateAssetTransferData, createdBy: string) {
    const { data, error } = await supabase
      .from('asset_transfers')
      .insert({
        ...transferData,
        created_by: createdBy,
        status: 'pending'
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async approveAssetTransfer(id: string, approvedBy: string) {
    const { data, error } = await supabase
      .from('asset_transfers')
      .update({
        status: 'approved',
        approved_by: approvedBy
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async completeAssetTransfer(id: string) {
    // Get transfer details
    const { data: transfer, error: transferError } = await supabase
      .from('asset_transfers')
      .select('*')
      .eq('id', id)
      .single();

    if (transferError) throw transferError;

    // Update transfer status
    const { data, error } = await supabase
      .from('asset_transfers')
      .update({ status: 'completed' })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Update asset location and assignment
    await supabase
      .from('assets')
      .update({
        location: transfer.to_location,
        assigned_to: transfer.to_employee,
        updated_at: new Date().toISOString()
      })
      .eq('id', transfer.asset_id);

    return data;
  }

  // Asset Maintenance Operations
  static async getAssetMaintenance(companyId: string, assetId?: string) {
    let query = supabase
      .from('asset_maintenance')
      .select(`
        *,
        asset:assets!inner(id, name, asset_code, company_id),
        performed_by_emp:employees!asset_maintenance_performed_by_fkey(id, first_name, last_name),
        vendor:suppliers!asset_maintenance_vendor_id_fkey(id, name),
        created_by_emp:employees!asset_maintenance_created_by_fkey(id, first_name, last_name)
      `)
      .eq('asset.company_id', companyId);

    if (assetId) {
      query = query.eq('asset_id', assetId);
    }

    const { data, error } = await query.order('scheduled_date', { ascending: false });
    if (error) throw error;
    return data;
  }

  static async createMaintenance(maintenanceData: CreateMaintenanceData, createdBy: string) {
    const { data, error } = await supabase
      .from('asset_maintenance')
      .insert({
        ...maintenanceData,
        created_by: createdBy,
        status: 'scheduled'
      })
      .select()
      .single();

    if (error) throw error;

    // Update asset next maintenance date
    if (maintenanceData.next_maintenance_date) {
      await supabase
        .from('assets')
        .update({
          next_maintenance_date: maintenanceData.next_maintenance_date,
          updated_at: new Date().toISOString()
        })
        .eq('id', maintenanceData.asset_id);
    }

    return data;
  }

  static async updateMaintenanceStatus(id: string, status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled', completedDate?: string) {
    const updates: any = { status };
    
    if (status === 'completed' && completedDate) {
      updates.completed_date = completedDate;
    }

    const { data, error } = await supabase
      .from('asset_maintenance')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Update asset last maintenance date if completed
    if (status === 'completed') {
      const { data: maintenance } = await supabase
        .from('asset_maintenance')
        .select('asset_id')
        .eq('id', id)
        .single();

      if (maintenance) {
        await supabase
          .from('assets')
          .update({
            last_maintenance_date: completedDate || new Date().toISOString().split('T')[0],
            updated_at: new Date().toISOString()
          })
          .eq('id', maintenance.asset_id);
      }
    }

    return data;
  }

  // Asset Depreciation Operations
  static async getAssetDepreciation(assetId: string) {
    const { data, error } = await supabase
      .from('asset_depreciation')
      .select('*')
      .eq('asset_id', assetId)
      .order('depreciation_date', { ascending: false });

    if (error) throw error;
    return data;
  }

  static async calculateAndCreateDepreciation(assetId: string, forDate?: string) {
    const depreciationDate = forDate || new Date().toISOString().split('T')[0];
    
    // Get asset details
    const { data: asset, error: assetError } = await supabase
      .from('assets')
      .select('*')
      .eq('id', assetId)
      .single();

    if (assetError) throw assetError;

    // Get last depreciation entry
    const { data: lastDepreciation } = await supabase
      .from('asset_depreciation')
      .select('*')
      .eq('asset_id', assetId)
      .order('depreciation_date', { ascending: false })
      .limit(1)
      .single();

    const openingValue = lastDepreciation?.closing_value || asset.purchase_cost;
    const depreciableAmount = asset.purchase_cost - asset.salvage_value;
    const accumulatedDepreciation = lastDepreciation?.accumulated_depreciation || 0;

    let depreciationAmount = 0;
    let depreciationRate = 0;

    // Calculate depreciation based on method
    switch (asset.depreciation_method) {
      case 'straight_line':
        depreciationAmount = depreciableAmount / asset.useful_life_years / 12; // Monthly
        depreciationRate = (1 / asset.useful_life_years) * 100;
        break;
      case 'declining_balance':
        depreciationRate = (2 / asset.useful_life_years) * 100;
        depreciationAmount = (openingValue * depreciationRate) / 100 / 12; // Monthly
        break;
      // Add other methods as needed
      default:
        depreciationAmount = depreciableAmount / asset.useful_life_years / 12;
        depreciationRate = (1 / asset.useful_life_years) * 100;
    }

    const newAccumulatedDepreciation = accumulatedDepreciation + depreciationAmount;
    const closingValue = Math.max(asset.purchase_cost - newAccumulatedDepreciation, asset.salvage_value);

    // Create depreciation entry
    const { data, error } = await supabase
      .from('asset_depreciation')
      .insert({
        asset_id: assetId,
        depreciation_date: depreciationDate,
        opening_value: openingValue,
        depreciation_amount: depreciationAmount,
        accumulated_depreciation: newAccumulatedDepreciation,
        closing_value: closingValue,
        depreciation_rate: depreciationRate,
        method: asset.depreciation_method,
        financial_year: new Date(depreciationDate).getFullYear().toString()
      })
      .select()
      .single();

    if (error) throw error;

    // Update asset current value
    await supabase
      .from('assets')
      .update({
        current_value: closingValue,
        updated_at: new Date().toISOString()
      })
      .eq('id', assetId);

    return data;
  }

  // Asset Disposal Operations
  static async getAssetDisposals(companyId: string) {
    const { data, error } = await supabase
      .from('asset_disposals')
      .select(`
        *,
        asset:assets!inner(id, name, asset_code, company_id, current_value),
        created_by_emp:employees!asset_disposals_created_by_fkey(id, first_name, last_name),
        approved_by_emp:employees!asset_disposals_approved_by_fkey(id, first_name, last_name)
      `)
      .eq('asset.company_id', companyId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  static async createAssetDisposal(disposalData: CreateDisposalData, createdBy: string) {
    // Get asset current value to calculate gain/loss
    const { data: asset, error: assetError } = await supabase
      .from('assets')
      .select('current_value')
      .eq('id', disposalData.asset_id)
      .single();

    if (assetError) throw assetError;

    const gainLossAmount = disposalData.disposal_value - asset.current_value;

    const { data, error } = await supabase
      .from('asset_disposals')
      .insert({
        ...disposalData,
        created_by: createdBy,
        gain_loss_amount: gainLossAmount,
        status: disposalData.approval_required ? 'pending' : 'approved'
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async approveAssetDisposal(id: string, approvedBy: string) {
    const { data, error } = await supabase
      .from('asset_disposals')
      .update({
        status: 'approved',
        approved_by: approvedBy,
        approval_date: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async completeAssetDisposal(id: string) {
    // Get disposal details
    const { data: disposal, error: disposalError } = await supabase
      .from('asset_disposals')
      .select('*')
      .eq('id', id)
      .single();

    if (disposalError) throw disposalError;

    // Update disposal status
    const { data, error } = await supabase
      .from('asset_disposals')
      .update({ status: 'completed' })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Update asset status to disposed
    await supabase
      .from('assets')
      .update({
        status: 'disposed',
        updated_at: new Date().toISOString()
      })
      .eq('id', disposal.asset_id);

    return data;
  }

  // Analytics and Reporting
  static async getAssetAnalytics(companyId: string): Promise<AssetAnalytics> {
    // Get basic asset counts and values
    const { data: assetStats } = await supabase
      .from('assets')
      .select('id, status, category, location, current_value, purchase_date, name')
      .eq('company_id', companyId);

    const totalAssets = assetStats?.length || 0;
    const totalValue = assetStats?.reduce((sum: number, asset: any) => sum + asset.current_value, 0) || 0;
    const activeAssets = assetStats?.filter(a => a.status === 'active').length || 0;
    const inactiveAssets = assetStats?.filter(a => a.status === 'inactive').length || 0;
    const underMaintenance = assetStats?.filter(a => a.status === 'under_maintenance').length || 0;
    const disposedAssets = assetStats?.filter(a => a.status === 'disposed').length || 0;

    // Calculate average age
    const currentDate = new Date();
    const totalAge = assetStats?.reduce((sum: number, asset: any) => {
      const purchaseDate = new Date(asset.purchase_date);
      const ageInYears = (currentDate.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24 * 365);
      return sum + ageInYears;
    }, 0) || 0;
    const averageAge = totalAssets > 0 ? totalAge / totalAssets : 0;

    // Get total depreciation
    const { data: depreciationData } = await supabase
      .from('asset_depreciation')
      .select('accumulated_depreciation')
      .in('asset_id', assetStats?.map((a: any) => a.id) || []);

    const totalDepreciation = depreciationData?.reduce((sum: number, dep: any) => sum + dep.accumulated_depreciation, 0) || 0;

    // Get maintenance cost YTD
    const currentYear = new Date().getFullYear();
    const { data: maintenanceData } = await supabase
      .from('asset_maintenance')
      .select('cost')
      .gte('scheduled_date', `${currentYear}-01-01`)
      .lte('scheduled_date', `${currentYear}-12-31`)
      .eq('status', 'completed');

    const maintenanceCostYtd = maintenanceData?.reduce((sum: number, m: any) => sum + m.cost, 0) || 0;

    // Assets by category
    const assetsByCategory = assetStats?.reduce((acc: { category: string; count: number; value: number }[], asset: any) => {
      const existing = acc.find(item => item.category === asset.category);
      if (existing) {
        existing.count++;
        existing.value += asset.current_value;
      } else {
        acc.push({ category: asset.category, count: 1, value: asset.current_value });
      }
      return acc;
    }, [] as { category: string; count: number; value: number }[]) || [];

    // Assets by location
    const assetsByLocation = assetStats?.reduce((acc: { location: string; count: number; value: number }[], asset: any) => {
      const existing = acc.find(item => item.location === asset.location);
      if (existing) {
        existing.count++;
        existing.value += asset.current_value;
      } else {
        acc.push({ location: asset.location, count: 1, value: asset.current_value });
      }
      return acc;
    }, [] as { location: string; count: number; value: number }[]) || [];

    // Get depreciation trend (last 12 months)
    const { data: depreciationTrend } = await supabase
      .rpc('get_monthly_depreciation_trend', { p_company_id: companyId });

    // Get maintenance trend (last 12 months)
    const { data: maintenanceTrend } = await supabase
      .rpc('get_monthly_maintenance_trend', { p_company_id: companyId });

    // Top value assets
    const topValueAssets = assetStats
      ?.sort((a: any, b: any) => b.current_value - a.current_value)
      .slice(0, 10)
      .map((asset: any) => ({
        id: asset.id,
        name: asset.name,
        current_value: asset.current_value
      })) || [];

    // Upcoming maintenance
    const { data: upcomingMaintenance } = await supabase
      .from('assets')
      .select('id, name, next_maintenance_date')
      .eq('company_id', companyId)
      .not('next_maintenance_date', 'is', null)
      .gte('next_maintenance_date', new Date().toISOString().split('T')[0])
      .order('next_maintenance_date', { ascending: true })
      .limit(10);

    return {
      total_assets: totalAssets,
      total_value: totalValue,
      active_assets: activeAssets,
      inactive_assets: inactiveAssets,
      under_maintenance: underMaintenance,
      disposed_assets: disposedAssets,
      average_age: averageAge,
      total_depreciation: totalDepreciation,
      maintenance_cost_ytd: maintenanceCostYtd,
      assets_by_category: assetsByCategory,
      assets_by_location: assetsByLocation,
      depreciation_trend: depreciationTrend || [],
      maintenance_trend: maintenanceTrend || [],
      top_value_assets: topValueAssets,
      upcoming_maintenance: upcomingMaintenance || []
    };
  }

  // Utility Functions
  static async getAssetCategories(companyId: string) {
    const { data, error } = await supabase
      .from('assets')
      .select('category')
      .eq('company_id', companyId)
      .order('category');

    if (error) throw error;
    
    const uniqueCategories = Array.from(new Set(data.map((item: any) => item.category)));
    return uniqueCategories;
  }

  static async getAssetLocations(companyId: string) {
    const { data, error } = await supabase
      .from('assets')
      .select('location')
      .eq('company_id', companyId)
      .order('location');

    if (error) throw error;
    
    const uniqueLocations = Array.from(new Set(data.map((item: any) => item.location)));
    return uniqueLocations;
  }

  static async getAssetsByEmployee(employeeId: string) {
    const { data, error } = await supabase
      .from('assets')
      .select('*')
      .eq('assigned_to', employeeId)
      .eq('status', 'active');

    if (error) throw error;
    return data;
  }

  static async getMaintenanceDue(companyId: string, days: number = 30) {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    const { data, error } = await supabase
      .from('assets')
      .select(`
        id, name, asset_code, next_maintenance_date,
        assigned_employee:employees(id, first_name, last_name)
      `)
      .eq('company_id', companyId)
      .not('next_maintenance_date', 'is', null)
      .lte('next_maintenance_date', futureDate.toISOString().split('T')[0])
      .order('next_maintenance_date', { ascending: true });

    if (error) throw error;
    return data;
  }

  static async getAssetHistory(assetId: string) {
    // Get all historical data for an asset
    const [transfers, maintenance, depreciation] = await Promise.all([
      this.getAssetTransfers('', assetId),
      this.getAssetMaintenance('', assetId),
      this.getAssetDepreciation(assetId)
    ]);

    return {
      transfers,
      maintenance,
      depreciation
    };
  }
}