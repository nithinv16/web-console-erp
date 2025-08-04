import { supabase } from '../supabase';
import { Database } from '../../types/database';

type WorkOrder = Database['public']['Tables']['work_orders']['Row'];
type WorkOrderInsert = Database['public']['Tables']['work_orders']['Insert'];
type WorkOrderUpdate = Database['public']['Tables']['work_orders']['Update'];

type BillOfMaterials = Database['public']['Tables']['bill_of_materials']['Row'];
type BillOfMaterialsInsert = Database['public']['Tables']['bill_of_materials']['Insert'];
type BillOfMaterialsUpdate = Database['public']['Tables']['bill_of_materials']['Update'];

type ProductionLine = Database['public']['Tables']['production_lines']['Row'];
type ProductionLineInsert = Database['public']['Tables']['production_lines']['Insert'];
type ProductionLineUpdate = Database['public']['Tables']['production_lines']['Update'];

type QualityCheck = Database['public']['Tables']['quality_checks']['Row'];
type QualityCheckInsert = Database['public']['Tables']['quality_checks']['Insert'];
type QualityCheckUpdate = Database['public']['Tables']['quality_checks']['Update'];

type WorkOrderOperation = Database['public']['Tables']['work_order_operations']['Row'];
type WorkOrderOperationInsert = Database['public']['Tables']['work_order_operations']['Insert'];
type WorkOrderOperationUpdate = Database['public']['Tables']['work_order_operations']['Update'];

type ProductionSchedule = Database['public']['Tables']['production_schedules']['Row'];
type ProductionScheduleInsert = Database['public']['Tables']['production_schedules']['Insert'];
type ProductionScheduleUpdate = Database['public']['Tables']['production_schedules']['Update'];

interface CreateWorkOrderData {
  product_id: string;
  quantity_to_produce: number;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  due_date: string;
  sales_order_id?: string;
  notes?: string;
}

interface CreateBOMData {
  product_id: string;
  component_product_id: string;
  quantity_required: number;
  unit_cost?: number;
  notes?: string;
}

interface CreateProductionLineData {
  name: string;
  description?: string;
  capacity_per_hour: number;
  warehouse_id: string;
  is_active?: boolean;
}

interface CreateQualityCheckData {
  work_order_id: string;
  check_type: 'incoming' | 'in_process' | 'final' | 'random';
  inspector_id: string;
  parameters_checked: Record<string, any>;
  notes?: string;
}

interface WorkOrderFilters {
  status?: string;
  priority?: string;
  product_id?: string;
  production_line_id?: string;
  date_from?: string;
  date_to?: string;
  search?: string;
}

interface ProductionAnalytics {
  total_work_orders: number;
  active_work_orders: number;
  completed_work_orders: number;
  total_production_quantity: number;
  average_completion_time: number;
  efficiency_rate: number;
  quality_pass_rate: number;
  top_products: Array<{
    product_id: string;
    product_name: string;
    total_quantity: number;
    total_orders: number;
  }>;
  production_trend: Array<{
    date: string;
    quantity_produced: number;
    orders_completed: number;
  }>;
  capacity_utilization: Array<{
    production_line_id: string;
    line_name: string;
    utilization_percentage: number;
  }>;
}

export class ManufacturingApi {
  // Work Orders
  static async getWorkOrders(filters: WorkOrderFilters = {}) {
    let query = supabase
      .from('work_orders')
      .select(`
        *,
        erp_products!work_orders_product_id_fkey(name, sku),
        production_lines(name),
        sales_orders(order_number)
      `);

    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    if (filters.priority) {
      query = query.eq('priority', filters.priority);
    }
    if (filters.product_id) {
      query = query.eq('product_id', filters.product_id);
    }
    if (filters.production_line_id) {
      query = query.eq('production_line_id', filters.production_line_id);
    }
    if (filters.date_from) {
      query = query.gte('created_at', filters.date_from);
    }
    if (filters.date_to) {
      query = query.lte('created_at', filters.date_to);
    }
    if (filters.search) {
      query = query.or(`work_order_number.ilike.%${filters.search}%,notes.ilike.%${filters.search}%`);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  }

  static async getWorkOrder(id: string) {
    const { data, error } = await supabase
      .from('work_orders')
      .select(`
        *,
        erp_products!work_orders_product_id_fkey(name, sku, description),
        production_lines(name, capacity_per_hour),
        sales_orders(order_number, customer_id),
        work_order_operations(
          *,
          employees(first_name, last_name)
        ),
        quality_checks(
          *,
          employees!quality_checks_inspector_id_fkey(first_name, last_name)
        )
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  static async createWorkOrder(workOrderData: CreateWorkOrderData) {
    // Generate work order number
    const workOrderNumber = `WO-${Date.now()}`;

    const { data, error } = await supabase
      .from('work_orders')
      .insert({
        work_order_number: workOrderNumber,
        ...workOrderData,
        status: 'planned',
        quantity_produced: 0
      })
      .select()
      .single();

    if (error) throw error;

    // Create work order operations based on BOM
    await this.createWorkOrderOperations(data.id, workOrderData.product_id);

    return data;
  }

  static async updateWorkOrder(id: string, updates: WorkOrderUpdate) {
    const { data, error } = await supabase
      .from('work_orders')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async deleteWorkOrder(id: string) {
    const { error } = await supabase
      .from('work_orders')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  static async updateWorkOrderStatus(id: string, status: string, notes?: string) {
    const updates: any = { status };
    if (notes) updates.notes = notes;

    // If starting production, set actual start date
    if (status === 'in_progress') {
      updates.actual_start_date = new Date().toISOString();
    }

    // If completing, set actual end date and update inventory
    if (status === 'completed') {
      updates.actual_end_date = new Date().toISOString();
      
      // Get work order details
      const workOrder = await this.getWorkOrder(id);
      
      // Update inventory with produced quantity
      await supabase.rpc('update_inventory_transaction', {
        p_product_id: workOrder.product_id,
        p_warehouse_id: workOrder.production_lines?.warehouse_id,
        p_transaction_type: 'production',
        p_quantity: workOrder.quantity_produced,
        p_reference_id: id,
        p_reference_type: 'work_order'
      });
    }

    return this.updateWorkOrder(id, updates);
  }

  static async startWorkOrder(id: string, production_line_id: string) {
    const { data, error } = await supabase
      .from('work_orders')
      .update({
        status: 'in_progress',
        production_line_id,
        actual_start_date: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async completeWorkOrder(id: string, quantity_produced: number) {
    const workOrder = await this.getWorkOrder(id);
    
    const { data, error } = await supabase
      .from('work_orders')
      .update({
        status: 'completed',
        quantity_produced,
        actual_end_date: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Update inventory with produced quantity
    await supabase.rpc('update_inventory_transaction', {
      p_product_id: workOrder.product_id,
      p_warehouse_id: workOrder.production_lines?.warehouse_id,
      p_transaction_type: 'production',
      p_quantity: quantity_produced,
      p_reference_id: id,
      p_reference_type: 'work_order'
    });

    return data;
  }

  // Bill of Materials (BOM)
  static async getBOM(product_id: string) {
    const { data, error } = await supabase
      .from('bill_of_materials')
      .select(`
        *,
        erp_products!bill_of_materials_component_product_id_fkey(name, sku, unit_price)
      `)
      .eq('product_id', product_id)
      .order('created_at');

    if (error) throw error;
    return data;
  }

  static async createBOMItem(bomData: CreateBOMData) {
    const { data, error } = await supabase
      .from('bill_of_materials')
      .insert(bomData)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async updateBOMItem(id: string, updates: BillOfMaterialsUpdate) {
    const { data, error } = await supabase
      .from('bill_of_materials')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async deleteBOMItem(id: string) {
    const { error } = await supabase
      .from('bill_of_materials')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  static async calculateBOMCost(product_id: string, quantity: number = 1) {
    const bom = await this.getBOM(product_id);
    
    let totalCost = 0;
    const costBreakdown = [];

    for (const item of bom) {
      const itemCost = (item.unit_cost || item.erp_products?.unit_price || 0) * item.quantity_required * quantity;
      totalCost += itemCost;
      
      costBreakdown.push({
        component_id: item.component_product_id,
        component_name: item.erp_products?.name,
        quantity_required: item.quantity_required * quantity,
        unit_cost: item.unit_cost || item.erp_products?.unit_price || 0,
        total_cost: itemCost
      });
    }

    return {
      total_cost: totalCost,
      cost_breakdown: costBreakdown
    };
  }

  // Production Lines
  static async getProductionLines() {
    const { data, error } = await supabase
      .from('production_lines')
      .select(`
        *,
        warehouses(name, location)
      `)
      .order('name');

    if (error) throw error;
    return data;
  }

  static async getProductionLine(id: string) {
    const { data, error } = await supabase
      .from('production_lines')
      .select(`
        *,
        warehouses(name, location),
        work_orders!work_orders_production_line_id_fkey(
          id, work_order_number, status, quantity_to_produce, quantity_produced
        )
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  static async createProductionLine(lineData: CreateProductionLineData) {
    const { data, error } = await supabase
      .from('production_lines')
      .insert(lineData)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async updateProductionLine(id: string, updates: ProductionLineUpdate) {
    const { data, error } = await supabase
      .from('production_lines')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async deleteProductionLine(id: string) {
    const { error } = await supabase
      .from('production_lines')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // Quality Checks
  static async getQualityChecks(work_order_id?: string) {
    let query = supabase
      .from('quality_checks')
      .select(`
        *,
        work_orders(work_order_number, product_id),
        employees!quality_checks_inspector_id_fkey(first_name, last_name)
      `);

    if (work_order_id) {
      query = query.eq('work_order_id', work_order_id);
    }

    const { data, error } = await query.order('check_date', { ascending: false });
    if (error) throw error;
    return data;
  }

  static async createQualityCheck(checkData: CreateQualityCheckData) {
    const { data, error } = await supabase
      .from('quality_checks')
      .insert({
        ...checkData,
        check_date: new Date().toISOString(),
        status: 'pending'
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async updateQualityCheck(id: string, updates: QualityCheckUpdate) {
    const { data, error } = await supabase
      .from('quality_checks')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async completeQualityCheck(id: string, status: 'passed' | 'failed', notes?: string) {
    const updates: any = {
      status,
      completed_date: new Date().toISOString()
    };
    
    if (notes) updates.notes = notes;

    return this.updateQualityCheck(id, updates);
  }

  // Work Order Operations
  static async createWorkOrderOperations(work_order_id: string, product_id: string) {
    // This would typically be based on routing/operations defined for the product
    // For now, we'll create basic operations
    const defaultOperations = [
      { operation_name: 'Setup', sequence_number: 1, estimated_time_minutes: 30 },
      { operation_name: 'Production', sequence_number: 2, estimated_time_minutes: 120 },
      { operation_name: 'Quality Check', sequence_number: 3, estimated_time_minutes: 15 },
      { operation_name: 'Packaging', sequence_number: 4, estimated_time_minutes: 20 }
    ];

    const operations = defaultOperations.map(op => ({
      work_order_id,
      ...op,
      status: 'pending'
    }));

    const { data, error } = await supabase
      .from('work_order_operations')
      .insert(operations)
      .select();

    if (error) throw error;
    return data;
  }

  static async updateWorkOrderOperation(id: string, updates: WorkOrderOperationUpdate) {
    const { data, error } = await supabase
      .from('work_order_operations')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async startOperation(id: string, operator_id: string) {
    const { data, error } = await supabase
      .from('work_order_operations')
      .update({
        status: 'in_progress',
        operator_id,
        actual_start_time: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async completeOperation(id: string, notes?: string) {
    const updates: any = {
      status: 'completed',
      actual_end_time: new Date().toISOString()
    };
    
    if (notes) updates.notes = notes;

    const { data, error } = await supabase
      .from('work_order_operations')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Production Scheduling
  static async getProductionSchedule(date_from?: string, date_to?: string) {
    let query = supabase
      .from('production_schedules')
      .select(`
        *,
        work_orders(
          work_order_number, quantity_to_produce, status,
          erp_products!work_orders_product_id_fkey(name, sku)
        ),
        production_lines(name, capacity_per_hour)
      `);

    if (date_from) {
      query = query.gte('scheduled_date', date_from);
    }
    if (date_to) {
      query = query.lte('scheduled_date', date_to);
    }

    const { data, error } = await query.order('scheduled_date');
    if (error) throw error;
    return data;
  }

  static async createProductionSchedule(scheduleData: ProductionScheduleInsert) {
    const { data, error } = await supabase
      .from('production_schedules')
      .insert(scheduleData)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async updateProductionSchedule(id: string, updates: ProductionScheduleUpdate) {
    const { data, error } = await supabase
      .from('production_schedules')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Analytics and Reporting
  static async getProductionAnalytics(date_from?: string, date_to?: string): Promise<ProductionAnalytics> {
    const dateFilter = date_from && date_to ? 
      `created_at.gte.${date_from},created_at.lte.${date_to}` : '';

    // Get work order statistics
    const { data: workOrders } = await supabase
      .from('work_orders')
      .select('*')
      .or(dateFilter || 'id.neq.null');

    const totalWorkOrders = workOrders?.length || 0;
    const activeWorkOrders = workOrders?.filter(wo => wo.status === 'in_progress').length || 0;
    const completedWorkOrders = workOrders?.filter(wo => wo.status === 'completed').length || 0;
    const totalProductionQuantity = workOrders?.reduce((sum, wo) => sum + (wo.quantity_produced || 0), 0) || 0;

    // Calculate average completion time
    const completedWithTimes = workOrders?.filter(wo => 
      wo.status === 'completed' && wo.actual_start_date && wo.actual_end_date
    ) || [];
    
    const avgCompletionTime = completedWithTimes.length > 0 ?
      completedWithTimes.reduce((sum, wo) => {
        const start = new Date(wo.actual_start_date!).getTime();
        const end = new Date(wo.actual_end_date!).getTime();
        return sum + (end - start);
      }, 0) / completedWithTimes.length / (1000 * 60 * 60) : 0; // Convert to hours

    // Calculate efficiency rate (completed vs planned)
    const efficiencyRate = totalWorkOrders > 0 ? (completedWorkOrders / totalWorkOrders) * 100 : 0;

    // Get quality pass rate
    const { data: qualityChecks } = await supabase
      .from('quality_checks')
      .select('status')
      .or(dateFilter || 'id.neq.null');

    const totalQualityChecks = qualityChecks?.length || 0;
    const passedQualityChecks = qualityChecks?.filter(qc => qc.status === 'passed').length || 0;
    const qualityPassRate = totalQualityChecks > 0 ? (passedQualityChecks / totalQualityChecks) * 100 : 0;

    // Get top products
    const productStats = workOrders?.reduce((acc, wo) => {
      if (!acc[wo.product_id]) {
        acc[wo.product_id] = { quantity: 0, orders: 0 };
      }
      acc[wo.product_id].quantity += wo.quantity_produced || 0;
      acc[wo.product_id].orders += 1;
      return acc;
    }, {} as Record<string, { quantity: number; orders: number }>) || {};

    const { data: products } = await supabase
      .from('erp_products')
      .select('id, name')
      .in('id', Object.keys(productStats));

    const topProducts = Object.entries(productStats)
      .map(([productId, stats]) => ({
        product_id: productId,
        product_name: products?.find(p => p.id === productId)?.name || 'Unknown',
        total_quantity: stats.quantity,
        total_orders: stats.orders
      }))
      .sort((a, b) => b.total_quantity - a.total_quantity)
      .slice(0, 10);

    // Production trend (last 30 days)
    const productionTrend = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayOrders = workOrders?.filter(wo => 
        wo.actual_end_date && wo.actual_end_date.startsWith(dateStr)
      ) || [];
      
      productionTrend.push({
        date: dateStr,
        quantity_produced: dayOrders.reduce((sum, wo) => sum + (wo.quantity_produced || 0), 0),
        orders_completed: dayOrders.length
      });
    }

    // Capacity utilization
    const { data: productionLines } = await supabase
      .from('production_lines')
      .select('id, name, capacity_per_hour');

    const capacityUtilization = productionLines?.map(line => {
      const lineWorkOrders = workOrders?.filter(wo => wo.production_line_id === line.id) || [];
      const totalHoursUsed = lineWorkOrders.reduce((sum: number, wo: any) => {
        if (wo.actual_start_date && wo.actual_end_date) {
          const start = new Date(wo.actual_start_date).getTime();
          const end = new Date(wo.actual_end_date).getTime();
          return sum + (end - start) / (1000 * 60 * 60); // Convert to hours
        }
        return sum;
      }, 0);
      
      const availableHours = 24 * 30; // Assuming 24/7 operation for 30 days
      const utilizationPercentage = availableHours > 0 ? (totalHoursUsed / availableHours) * 100 : 0;
      
      return {
        production_line_id: line.id,
        line_name: line.name,
        utilization_percentage: Math.min(utilizationPercentage, 100)
      };
    }) || [];

    return {
      total_work_orders: totalWorkOrders,
      active_work_orders: activeWorkOrders,
      completed_work_orders: completedWorkOrders,
      total_production_quantity: totalProductionQuantity,
      average_completion_time: avgCompletionTime,
      efficiency_rate: efficiencyRate,
      quality_pass_rate: qualityPassRate,
      top_products: topProducts,
      production_trend: productionTrend,
      capacity_utilization: capacityUtilization
    };
  }

  static async getWorkOrdersByStatus() {
    const { data, error } = await supabase
      .from('work_orders')
      .select('status')
      .order('created_at', { ascending: false });

    if (error) throw error;

    const statusCounts = data.reduce((acc: Record<string, number>, wo: any) => {
      acc[wo.status] = (acc[wo.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return statusCounts;
  }

  static async getProductionCapacity(production_line_id?: string) {
    let query = supabase
      .from('production_lines')
      .select('id, name, capacity_per_hour, is_active');

    if (production_line_id) {
      query = query.eq('id', production_line_id);
    }

    const { data: lines, error } = await query;
    if (error) throw error;

    const capacity = lines?.map((line: any) => ({
      production_line_id: line.id,
      line_name: line.name,
      hourly_capacity: line.capacity_per_hour,
      daily_capacity: line.capacity_per_hour * 24,
      weekly_capacity: line.capacity_per_hour * 24 * 7,
      monthly_capacity: line.capacity_per_hour * 24 * 30,
      is_active: line.is_active
    })) || [];

    return capacity;
  }

  static async getMaterialRequirements(work_order_id: string) {
    const workOrder = await this.getWorkOrder(work_order_id);
    const bom = await this.getBOM(workOrder.product_id);
    
    const requirements = [];
    
    for (const bomItem of bom) {
      const requiredQuantity = bomItem.quantity_required * workOrder.quantity_to_produce;
      
      // Get current inventory
      const { data: inventory } = await supabase
        .from('current_inventory')
        .select('quantity_available')
        .eq('product_id', bomItem.component_product_id)
        .single();
      
      const availableQuantity = inventory?.quantity_available || 0;
      const shortfall = Math.max(0, requiredQuantity - availableQuantity);
      
      requirements.push({
        component_id: bomItem.component_product_id,
        component_name: bomItem.erp_products?.name,
        required_quantity: requiredQuantity,
        available_quantity: availableQuantity,
        shortfall_quantity: shortfall,
        unit_cost: bomItem.unit_cost || bomItem.erp_products?.unit_price || 0
      });
    }
    
    return requirements;
  }
}