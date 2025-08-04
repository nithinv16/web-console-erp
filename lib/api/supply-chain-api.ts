import { supabase } from '../supabase';
import { Database } from '../../types/database';

type PurchaseRequisition = Database['public']['Tables']['purchase_requisitions']['Row'];
type PurchaseRequisitionInsert = Database['public']['Tables']['purchase_requisitions']['Insert'];
type PurchaseRequisitionUpdate = Database['public']['Tables']['purchase_requisitions']['Update'];

type SupplierEvaluation = Database['public']['Tables']['supplier_evaluations']['Row'];
type SupplierEvaluationInsert = Database['public']['Tables']['supplier_evaluations']['Insert'];
type SupplierEvaluationUpdate = Database['public']['Tables']['supplier_evaluations']['Update'];

type SupplierQuotation = Database['public']['Tables']['supplier_quotations']['Row'];
type SupplierQuotationInsert = Database['public']['Tables']['supplier_quotations']['Insert'];
type SupplierQuotationUpdate = Database['public']['Tables']['supplier_quotations']['Update'];

type ContractAgreement = Database['public']['Tables']['contract_agreements']['Row'];
type ContractAgreementInsert = Database['public']['Tables']['contract_agreements']['Insert'];
type ContractAgreementUpdate = Database['public']['Tables']['contract_agreements']['Update'];

interface CreatePurchaseRequisitionData {
  requested_by: string;
  department_id?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  required_date: string;
  justification?: string;
  items: Array<{
    product_id: string;
    quantity_requested: number;
    estimated_unit_price?: number;
    specifications?: string;
  }>;
}

interface CreateSupplierEvaluationData {
  supplier_id: string;
  evaluation_period_start: string;
  evaluation_period_end: string;
  evaluator_id: string;
  criteria_scores: Record<string, number>;
  comments?: string;
}

interface CreateSupplierQuotationData {
  supplier_id: string;
  purchase_requisition_id?: string;
  quotation_number: string;
  valid_until: string;
  terms_and_conditions?: string;
  items: Array<{
    product_id: string;
    quantity: number;
    unit_price: number;
    lead_time_days?: number;
    specifications?: string;
  }>;
}

interface CreateContractData {
  supplier_id: string;
  contract_type: 'purchase' | 'service' | 'framework' | 'blanket';
  start_date: string;
  end_date: string;
  total_value: number;
  terms_and_conditions: string;
  payment_terms?: string;
  delivery_terms?: string;
}

interface PurchaseRequisitionFilters {
  status?: string;
  priority?: string;
  department_id?: string;
  requested_by?: string;
  date_from?: string;
  date_to?: string;
  search?: string;
}

interface SupplyChainAnalytics {
  total_requisitions: number;
  pending_approvals: number;
  active_contracts: number;
  total_suppliers: number;
  average_supplier_rating: number;
  procurement_savings: number;
  on_time_delivery_rate: number;
  top_suppliers: Array<{
    supplier_id: string;
    supplier_name: string;
    total_orders: number;
    total_value: number;
    average_rating: number;
  }>;
  procurement_trend: Array<{
    month: string;
    total_value: number;
    order_count: number;
  }>;
  category_spending: Array<{
    category: string;
    total_value: number;
    percentage: number;
  }>;
}

export class SupplyChainApi {
  // Purchase Requisitions
  static async getPurchaseRequisitions(filters: PurchaseRequisitionFilters = {}) {
    let query = supabase
      .from('purchase_requisitions')
      .select(`
        *,
        employees!purchase_requisitions_requested_by_fkey(first_name, last_name),
        departments(name),
        purchase_requisition_items(
          *,
          erp_products(name, sku, unit_price)
        )
      `);

    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    if (filters.priority) {
      query = query.eq('priority', filters.priority);
    }
    if (filters.department_id) {
      query = query.eq('department_id', filters.department_id);
    }
    if (filters.requested_by) {
      query = query.eq('requested_by', filters.requested_by);
    }
    if (filters.date_from) {
      query = query.gte('created_at', filters.date_from);
    }
    if (filters.date_to) {
      query = query.lte('created_at', filters.date_to);
    }
    if (filters.search) {
      query = query.or(`requisition_number.ilike.%${filters.search}%,justification.ilike.%${filters.search}%`);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  }

  static async getPurchaseRequisition(id: string) {
    const { data, error } = await supabase
      .from('purchase_requisitions')
      .select(`
        *,
        employees!purchase_requisitions_requested_by_fkey(first_name, last_name, email),
        departments(name),
        employees!purchase_requisitions_approved_by_fkey(first_name, last_name),
        purchase_requisition_items(
          *,
          erp_products(name, sku, description, unit_price)
        )
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  static async createPurchaseRequisition(requisitionData: CreatePurchaseRequisitionData) {
    // Generate requisition number
    const requisitionNumber = `PR-${Date.now()}`;

    const { data: requisition, error: requisitionError } = await supabase
      .from('purchase_requisitions')
      .insert({
        requisition_number: requisitionNumber,
        requested_by: requisitionData.requested_by,
        department_id: requisitionData.department_id,
        priority: requisitionData.priority,
        required_date: requisitionData.required_date,
        justification: requisitionData.justification,
        status: 'pending',
        total_estimated_value: requisitionData.items.reduce((sum, item) => 
          sum + (item.quantity_requested * (item.estimated_unit_price || 0)), 0
        )
      })
      .select()
      .single();

    if (requisitionError) throw requisitionError;

    // Create requisition items
    const items = requisitionData.items.map(item => ({
      purchase_requisition_id: requisition.id,
      ...item
    }));

    const { error: itemsError } = await supabase
      .from('purchase_requisition_items')
      .insert(items);

    if (itemsError) throw itemsError;

    return requisition;
  }

  static async updatePurchaseRequisition(id: string, updates: PurchaseRequisitionUpdate) {
    const { data, error } = await supabase
      .from('purchase_requisitions')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async approvePurchaseRequisition(id: string, approved_by: string, comments?: string) {
    const { data, error } = await supabase
      .from('purchase_requisitions')
      .update({
        status: 'approved',
        approved_by,
        approved_date: new Date().toISOString(),
        approval_comments: comments
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async rejectPurchaseRequisition(id: string, rejected_by: string, reason: string) {
    const { data, error } = await supabase
      .from('purchase_requisitions')
      .update({
        status: 'rejected',
        approved_by: rejected_by,
        approved_date: new Date().toISOString(),
        approval_comments: reason
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async convertToPurchaseOrder(requisition_id: string, supplier_id: string) {
    const requisition = await this.getPurchaseRequisition(requisition_id);
    
    // Generate PO number
    const poNumber = `PO-${Date.now()}`;
    
    // Create purchase order
    const { data: purchaseOrder, error: poError } = await supabase
      .from('purchase_orders')
      .insert({
        order_number: poNumber,
        supplier_id,
        order_date: new Date().toISOString().split('T')[0],
        expected_delivery_date: requisition.required_date,
        status: 'pending',
        total_amount: requisition.total_estimated_value,
        notes: `Created from requisition ${requisition.requisition_number}`
      })
      .select()
      .single();

    if (poError) throw poError;

    // Create purchase order items
    const poItems = requisition.purchase_requisition_items.map(item => ({
      purchase_order_id: purchaseOrder.id,
      product_id: item.product_id,
      quantity: item.quantity_requested,
      unit_price: item.estimated_unit_price || 0,
      total_price: item.quantity_requested * (item.estimated_unit_price || 0)
    }));

    const { error: itemsError } = await supabase
      .from('purchase_order_items')
      .insert(poItems);

    if (itemsError) throw itemsError;

    // Update requisition status
    await this.updatePurchaseRequisition(requisition_id, {
      status: 'converted',
      converted_to_po_id: purchaseOrder.id
    });

    return purchaseOrder;
  }

  // Supplier Evaluations
  static async getSupplierEvaluations(supplier_id?: string) {
    let query = supabase
      .from('supplier_evaluations')
      .select(`
        *,
        suppliers(name, contact_person),
        employees!supplier_evaluations_evaluator_id_fkey(first_name, last_name)
      `);

    if (supplier_id) {
      query = query.eq('supplier_id', supplier_id);
    }

    const { data, error } = await query.order('evaluation_date', { ascending: false });
    if (error) throw error;
    return data;
  }

  static async createSupplierEvaluation(evaluationData: CreateSupplierEvaluationData) {
    // Calculate overall score
    const scores = Object.values(evaluationData.criteria_scores);
    const overall_score = scores.reduce((sum, score) => sum + score, 0) / scores.length;

    const { data, error } = await supabase
      .from('supplier_evaluations')
      .insert({
        ...evaluationData,
        evaluation_date: new Date().toISOString(),
        overall_score
      })
      .select()
      .single();

    if (error) throw error;

    // Update supplier's average rating
    await this.updateSupplierRating(evaluationData.supplier_id);

    return data;
  }

  static async updateSupplierEvaluation(id: string, updates: SupplierEvaluationUpdate) {
    const { data, error } = await supabase
      .from('supplier_evaluations')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Update supplier's average rating if scores changed
    if (updates.criteria_scores || updates.overall_score) {
      const evaluation = await supabase
        .from('supplier_evaluations')
        .select('supplier_id')
        .eq('id', id)
        .single();
      
      if (evaluation.data) {
        await this.updateSupplierRating(evaluation.data.supplier_id);
      }
    }

    return data;
  }

  private static async updateSupplierRating(supplier_id: string) {
    const { data: evaluations } = await supabase
      .from('supplier_evaluations')
      .select('overall_score')
      .eq('supplier_id', supplier_id);

    if (evaluations && evaluations.length > 0) {
      const averageRating = evaluations.reduce((sum, eval) => sum + eval.overall_score, 0) / evaluations.length;
      
      await supabase
        .from('suppliers')
        .update({ rating: averageRating })
        .eq('id', supplier_id);
    }
  }

  // Supplier Quotations
  static async getSupplierQuotations(filters: { supplier_id?: string; status?: string } = {}) {
    let query = supabase
      .from('supplier_quotations')
      .select(`
        *,
        suppliers(name, contact_person),
        purchase_requisitions(requisition_number),
        supplier_quotation_items(
          *,
          erp_products(name, sku)
        )
      `);

    if (filters.supplier_id) {
      query = query.eq('supplier_id', filters.supplier_id);
    }
    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  }

  static async getSupplierQuotation(id: string) {
    const { data, error } = await supabase
      .from('supplier_quotations')
      .select(`
        *,
        suppliers(name, contact_person, email, phone),
        purchase_requisitions(requisition_number),
        supplier_quotation_items(
          *,
          erp_products(name, sku, description)
        )
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  static async createSupplierQuotation(quotationData: CreateSupplierQuotationData) {
    const totalValue = quotationData.items.reduce((sum, item) => 
      sum + (item.quantity * item.unit_price), 0
    );

    const { data: quotation, error: quotationError } = await supabase
      .from('supplier_quotations')
      .insert({
        supplier_id: quotationData.supplier_id,
        purchase_requisition_id: quotationData.purchase_requisition_id,
        quotation_number: quotationData.quotation_number,
        quotation_date: new Date().toISOString().split('T')[0],
        valid_until: quotationData.valid_until,
        total_value: totalValue,
        terms_and_conditions: quotationData.terms_and_conditions,
        status: 'pending'
      })
      .select()
      .single();

    if (quotationError) throw quotationError;

    // Create quotation items
    const items = quotationData.items.map(item => ({
      supplier_quotation_id: quotation.id,
      ...item,
      total_price: item.quantity * item.unit_price
    }));

    const { error: itemsError } = await supabase
      .from('supplier_quotation_items')
      .insert(items);

    if (itemsError) throw itemsError;

    return quotation;
  }

  static async updateSupplierQuotation(id: string, updates: SupplierQuotationUpdate) {
    const { data, error } = await supabase
      .from('supplier_quotations')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async acceptQuotation(id: string, accepted_by: string) {
    const { data, error } = await supabase
      .from('supplier_quotations')
      .update({
        status: 'accepted',
        accepted_by,
        accepted_date: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async rejectQuotation(id: string, rejected_by: string, reason?: string) {
    const { data, error } = await supabase
      .from('supplier_quotations')
      .update({
        status: 'rejected',
        rejected_by,
        rejected_date: new Date().toISOString(),
        rejection_reason: reason
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Contract Management
  static async getContracts(filters: { supplier_id?: string; status?: string } = {}) {
    let query = supabase
      .from('contract_agreements')
      .select(`
        *,
        suppliers(name, contact_person)
      `);

    if (filters.supplier_id) {
      query = query.eq('supplier_id', filters.supplier_id);
    }
    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  }

  static async getContract(id: string) {
    const { data, error } = await supabase
      .from('contract_agreements')
      .select(`
        *,
        suppliers(name, contact_person, email, phone, address)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  static async createContract(contractData: CreateContractData) {
    const contractNumber = `CT-${Date.now()}`;

    const { data, error } = await supabase
      .from('contract_agreements')
      .insert({
        contract_number: contractNumber,
        ...contractData,
        status: 'draft'
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async updateContract(id: string, updates: ContractAgreementUpdate) {
    const { data, error } = await supabase
      .from('contract_agreements')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async activateContract(id: string, activated_by: string) {
    const { data, error } = await supabase
      .from('contract_agreements')
      .update({
        status: 'active',
        activated_by,
        activated_date: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async terminateContract(id: string, terminated_by: string, reason?: string) {
    const { data, error } = await supabase
      .from('contract_agreements')
      .update({
        status: 'terminated',
        terminated_by,
        terminated_date: new Date().toISOString(),
        termination_reason: reason
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Analytics and Reporting
  static async getSupplyChainAnalytics(date_from?: string, date_to?: string): Promise<SupplyChainAnalytics> {
    const dateFilter = date_from && date_to ? 
      `created_at.gte.${date_from},created_at.lte.${date_to}` : '';

    // Get purchase requisition statistics
    const { data: requisitions } = await supabase
      .from('purchase_requisitions')
      .select('*')
      .or(dateFilter || 'id.neq.null');

    const totalRequisitions = requisitions?.length || 0;
    const pendingApprovals = requisitions?.filter(pr => pr.status === 'pending').length || 0;

    // Get contract statistics
    const { data: contracts } = await supabase
      .from('contract_agreements')
      .select('status')
      .eq('status', 'active');

    const activeContracts = contracts?.length || 0;

    // Get supplier statistics
    const { data: suppliers } = await supabase
      .from('suppliers')
      .select('id, name, rating');

    const totalSuppliers = suppliers?.length || 0;
    const averageSupplierRating = suppliers && suppliers.length > 0 ?
      suppliers.reduce((sum, s) => sum + (s.rating || 0), 0) / suppliers.length : 0;

    // Get purchase order statistics for savings and delivery metrics
    const { data: purchaseOrders } = await supabase
      .from('purchase_orders')
      .select('*')
      .or(dateFilter || 'id.neq.null');

    // Calculate procurement savings (simplified)
    const procurementSavings = 0; // This would require historical pricing data

    // Calculate on-time delivery rate
    const deliveredOrders = purchaseOrders?.filter(po => po.status === 'delivered') || [];
    const onTimeDeliveries = deliveredOrders.filter(po => 
      po.actual_delivery_date && po.expected_delivery_date &&
      new Date(po.actual_delivery_date) <= new Date(po.expected_delivery_date)
    ).length;
    const onTimeDeliveryRate = deliveredOrders.length > 0 ? 
      (onTimeDeliveries / deliveredOrders.length) * 100 : 0;

    // Get top suppliers
    const supplierStats = purchaseOrders?.reduce((acc, po) => {
      if (!acc[po.supplier_id]) {
        acc[po.supplier_id] = { orders: 0, value: 0 };
      }
      acc[po.supplier_id].orders += 1;
      acc[po.supplier_id].value += po.total_amount || 0;
      return acc;
    }, {} as Record<string, { orders: number; value: number }>) || {};

    const topSuppliers = Object.entries(supplierStats)
      .map(([supplierId, stats]) => {
        const supplier = suppliers?.find(s => s.id === supplierId);
        return {
          supplier_id: supplierId,
          supplier_name: supplier?.name || 'Unknown',
          total_orders: stats.orders,
          total_value: stats.value,
          average_rating: supplier?.rating || 0
        };
      })
      .sort((a, b) => b.total_value - a.total_value)
      .slice(0, 10);

    // Procurement trend (last 12 months)
    const procurementTrend = [];
    for (let i = 11; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthStr = date.toISOString().substring(0, 7); // YYYY-MM
      
      const monthOrders = purchaseOrders?.filter(po => 
        po.order_date && po.order_date.startsWith(monthStr)
      ) || [];
      
      procurementTrend.push({
        month: monthStr,
        total_value: monthOrders.reduce((sum, po) => sum + (po.total_amount || 0), 0),
        order_count: monthOrders.length
      });
    }

    // Category spending (simplified - would need product categories)
    const categorySpending = [
      { category: 'Raw Materials', total_value: 0, percentage: 0 },
      { category: 'Equipment', total_value: 0, percentage: 0 },
      { category: 'Services', total_value: 0, percentage: 0 },
      { category: 'Other', total_value: 0, percentage: 0 }
    ];

    return {
      total_requisitions: totalRequisitions,
      pending_approvals: pendingApprovals,
      active_contracts: activeContracts,
      total_suppliers: totalSuppliers,
      average_supplier_rating: averageSupplierRating,
      procurement_savings: procurementSavings,
      on_time_delivery_rate: onTimeDeliveryRate,
      top_suppliers: topSuppliers,
      procurement_trend: procurementTrend,
      category_spending: categorySpending
    };
  }

  static async getSupplierPerformance(supplier_id: string, date_from?: string, date_to?: string) {
    const dateFilter = date_from && date_to ? 
      `order_date.gte.${date_from},order_date.lte.${date_to}` : '';

    // Get purchase orders for the supplier
    const { data: orders } = await supabase
      .from('purchase_orders')
      .select('*')
      .eq('supplier_id', supplier_id)
      .or(dateFilter || 'id.neq.null');

    // Get evaluations for the supplier
    const { data: evaluations } = await supabase
      .from('supplier_evaluations')
      .select('*')
      .eq('supplier_id', supplier_id);

    const totalOrders = orders?.length || 0;
    const totalValue = orders?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;
    const averageOrderValue = totalOrders > 0 ? totalValue / totalOrders : 0;

    // Calculate delivery performance
    const deliveredOrders = orders?.filter(o => o.status === 'delivered') || [];
    const onTimeDeliveries = deliveredOrders.filter(o => 
      o.actual_delivery_date && o.expected_delivery_date &&
      new Date(o.actual_delivery_date) <= new Date(o.expected_delivery_date)
    ).length;
    const onTimeDeliveryRate = deliveredOrders.length > 0 ? 
      (onTimeDeliveries / deliveredOrders.length) * 100 : 0;

    // Calculate quality performance
    const averageRating = evaluations && evaluations.length > 0 ?
      evaluations.reduce((sum: number, eval: any) => sum + eval.overall_score, 0) / evaluations.length : 0;

    return {
      total_orders: totalOrders,
      total_value: totalValue,
      average_order_value: averageOrderValue,
      on_time_delivery_rate: onTimeDeliveryRate,
      average_rating: averageRating,
      recent_evaluations: evaluations?.slice(0, 5) || []
    };
  }

  static async getProcurementSummary() {
    // Get pending requisitions
    const { data: pendingRequisitions } = await supabase
      .from('purchase_requisitions')
      .select('id, requisition_number, total_estimated_value, required_date')
      .eq('status', 'pending')
      .order('required_date');

    // Get pending quotations
    const { data: pendingQuotations } = await supabase
      .from('supplier_quotations')
      .select('id, quotation_number, total_value, valid_until')
      .eq('status', 'pending')
      .order('valid_until');

    // Get expiring contracts
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    
    const { data: expiringContracts } = await supabase
      .from('contract_agreements')
      .select('id, contract_number, end_date, total_value')
      .eq('status', 'active')
      .lte('end_date', thirtyDaysFromNow.toISOString().split('T')[0])
      .order('end_date');

    return {
      pending_requisitions: pendingRequisitions || [],
      pending_quotations: pendingQuotations || [],
      expiring_contracts: expiringContracts || []
    };
  }

  static async getSupplierComparison(product_id: string) {
    // Get recent quotations for the product
    const { data: quotations } = await supabase
      .from('supplier_quotation_items')
      .select(`
        *,
        supplier_quotations!inner(
          supplier_id,
          quotation_date,
          valid_until,
          suppliers(name, rating)
        )
      `)
      .eq('product_id', product_id)
      .gte('supplier_quotations.quotation_date', 
        new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // Last 90 days
      )
      .order('supplier_quotations.quotation_date', { ascending: false });

    const comparison = quotations?.map((q: any) => ({
      supplier_id: q.supplier_quotations.supplier_id,
      supplier_name: q.supplier_quotations.suppliers.name,
      supplier_rating: q.supplier_quotations.suppliers.rating,
      unit_price: q.unit_price,
      lead_time_days: q.lead_time_days,
      quotation_date: q.supplier_quotations.quotation_date,
      valid_until: q.supplier_quotations.valid_until
    })) || [];

    return comparison;
  }
}