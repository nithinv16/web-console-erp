import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Database } from '@/types/database'
import type {
  ERPSalesOrder,
  ERPCustomer,
  ERPProduct
} from '@/types/database'

export interface CreateSalesOrderData {
  company_id: string
  so_number: string
  customer_id: string
  warehouse_id?: string
  order_date: string
  delivery_date?: string
  payment_terms?: string
  shipping_address?: any
  billing_address?: any
  notes?: string
  discount_type?: 'percentage' | 'fixed'
  discount_value?: number
  shipping_charges?: number
  other_charges?: number
  items: {
    product_id: string
    quantity: number
    unit_price: number
    tax_rate?: number
    discount_rate?: number
  }[]
}

export interface CreateQuotationData {
  company_id: string
  quotation_number: string
  customer_id: string
  quotation_date: string
  valid_until: string
  payment_terms?: string
  notes?: string
  discount_type?: 'percentage' | 'fixed'
  discount_value?: number
  shipping_charges?: number
  other_charges?: number
  items: {
    product_id: string
    quantity: number
    unit_price: number
    tax_rate?: number
    discount_rate?: number
  }[]
}

export interface SalesOrderFilters {
  search?: string
  status?: string
  customer_id?: string
  date_from?: string
  date_to?: string
  priority?: string
  limit?: number
  offset?: number
}

export interface SalesAnalytics {
  totalSales: number
  totalOrders: number
  averageOrderValue: number
  topProducts: {
    product_id: string
    product_name: string
    quantity_sold: number
    revenue: number
  }[]
  topCustomers: {
    customer_id: string
    customer_name: string
    total_orders: number
    total_revenue: number
  }[]
  salesTrend: {
    date: string
    sales: number
    orders: number
  }[]
}

export class SalesApi {
  private static supabase = createClientComponentClient<Database>()

  // Sales Order Management
  static async getSalesOrders(companyId: string, filters?: SalesOrderFilters): Promise<{ data: ERPSalesOrder[], count: number }> {
    let query = this.supabase
      .from('sales_orders')
      .select('*, customer:customers(*), items:sales_order_items(*, product:erp_products(*))', { count: 'exact' })
      .eq('company_id', companyId)
    
    if (filters?.search) {
      query = query.or(`so_number.ilike.%${filters.search}%`)
    }
    
    if (filters?.status) {
      query = query.eq('status', filters.status)
    }
    
    if (filters?.customer_id) {
      query = query.eq('customer_id', filters.customer_id)
    }
    
    if (filters?.date_from) {
      query = query.gte('order_date', filters.date_from)
    }
    
    if (filters?.date_to) {
      query = query.lte('order_date', filters.date_to)
    }
    
    if (filters?.priority) {
      query = query.eq('priority', filters.priority)
    }
    
    if (filters?.limit) {
      query = query.limit(filters.limit)
    }
    
    if (filters?.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1)
    }
    
    query = query.order('created_at', { ascending: false })
    
    const { data, error, count } = await query
    
    if (error) throw error
    return { data: data || [], count: count || 0 }
  }

  static async getSalesOrder(id: string): Promise<ERPSalesOrder | null> {
    const { data, error } = await this.supabase
      .from('sales_orders')
      .select('*, customer:customers(*), items:sales_order_items(*, product:erp_products(*)), invoices:invoices(*)')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  }

  static async createSalesOrder(data: CreateSalesOrderData): Promise<ERPSalesOrder> {
    // Calculate totals
    const subtotal = data.items.reduce((sum, item) => {
      const itemSubtotal = item.quantity * item.unit_price
      const itemDiscount = itemSubtotal * (item.discount_rate || 0) / 100
      return sum + (itemSubtotal - itemDiscount)
    }, 0)
    
    const taxAmount = data.items.reduce((sum, item) => {
      const itemSubtotal = item.quantity * item.unit_price
      const itemDiscount = itemSubtotal * (item.discount_rate || 0) / 100
      const taxableAmount = itemSubtotal - itemDiscount
      return sum + (taxableAmount * (item.tax_rate || 0)) / 100
    }, 0)
    
    let discountAmount = 0
    if (data.discount_type === 'percentage') {
      discountAmount = (subtotal * (data.discount_value || 0)) / 100
    } else if (data.discount_type === 'fixed') {
      discountAmount = data.discount_value || 0
    }
    
    const totalAmount = subtotal + taxAmount - discountAmount + (data.shipping_charges || 0) + (data.other_charges || 0)

    // Create sales order
    const { data: so, error: soError } = await this.supabase
      .from('sales_orders')
      .insert({
        ...data,
        subtotal,
        tax_amount: taxAmount,
        discount_amount: discountAmount,
        total_amount: totalAmount,
        status: 'pending',
        priority: 'medium'
      })
      .select()
      .single()
    
    if (soError) throw soError

    // Create sales order items
    const items = data.items.map(item => {
      const itemSubtotal = item.quantity * item.unit_price
      const itemDiscount = itemSubtotal * (item.discount_rate || 0) / 100
      const taxableAmount = itemSubtotal - itemDiscount
      const itemTaxAmount = (taxableAmount * (item.tax_rate || 0)) / 100
      
      return {
        so_id: so.id,
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        discount_rate: item.discount_rate || 0,
        discount_amount: itemDiscount,
        tax_rate: item.tax_rate || 0,
        tax_amount: itemTaxAmount,
        total_amount: taxableAmount + itemTaxAmount
      }
    })

    const { error: itemsError } = await this.supabase
      .from('sales_order_items')
      .insert(items)
    
    if (itemsError) throw itemsError

    return so
  }

  static async updateSalesOrder(id: string, data: Partial<CreateSalesOrderData>): Promise<ERPSalesOrder> {
    const { data: so, error } = await this.supabase
      .from('sales_orders')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return so
  }

  static async deleteSalesOrder(id: string): Promise<void> {
    // Delete items first
    await this.supabase
      .from('sales_order_items')
      .delete()
      .eq('so_id', id)
    
    // Delete sales order
    const { error } = await this.supabase
      .from('sales_orders')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }

  static async updateSalesOrderStatus(id: string, status: string, notes?: string): Promise<ERPSalesOrder> {
    const updateData: any = {
      status,
      updated_at: new Date().toISOString()
    }
    
    if (notes) {
      updateData.notes = notes
    }
    
    // Set specific dates based on status
    if (status === 'confirmed') {
      updateData.confirmed_at = new Date().toISOString()
    } else if (status === 'shipped') {
      updateData.shipped_at = new Date().toISOString()
    } else if (status === 'delivered') {
      updateData.delivered_at = new Date().toISOString()
    } else if (status === 'cancelled') {
      updateData.cancelled_at = new Date().toISOString()
    }
    
    const { data: so, error } = await this.supabase
      .from('sales_orders')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return so
  }

  static async confirmSalesOrder(id: string): Promise<ERPSalesOrder> {
    // Check inventory availability
    const salesOrder = await this.getSalesOrder(id)
    if (!salesOrder) throw new Error('Sales order not found')
    
    // Validate inventory for each item
    for (const item of salesOrder.items || []) {
      const { data: inventory } = await this.supabase
        .from('current_inventory')
        .select('quantity')
        .eq('product_id', item.product_id)
        .eq('warehouse_id', salesOrder.warehouse_id || '')
        .single()
      
      const availableQty = inventory?.quantity || 0
      if (availableQty < item.quantity) {
        throw new Error(`Insufficient inventory for product ${item.product?.name}. Available: ${availableQty}, Required: ${item.quantity}`)
      }
    }
    
    // Reserve inventory
    for (const item of salesOrder.items || []) {
      await this.supabase
        .from('current_inventory')
        .update({
          reserved_quantity: this.supabase.sql`reserved_quantity + ${item.quantity}`
        })
        .eq('product_id', item.product_id)
        .eq('warehouse_id', salesOrder.warehouse_id || '')
    }
    
    return this.updateSalesOrderStatus(id, 'confirmed')
  }

  static async shipSalesOrder(id: string, trackingNumber?: string, carrier?: string): Promise<ERPSalesOrder> {
    const updateData: any = {
      status: 'shipped',
      shipped_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    if (trackingNumber) {
      updateData.tracking_number = trackingNumber
    }
    
    if (carrier) {
      updateData.carrier = carrier
    }
    
    const { data: so, error } = await this.supabase
      .from('sales_orders')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    
    // Create inventory transactions for shipped items
    const salesOrder = await this.getSalesOrder(id)
    if (salesOrder?.items) {
      for (const item of salesOrder.items) {
        await this.supabase
          .from('inventory_transactions')
          .insert({
            company_id: salesOrder.company_id,
            product_id: item.product_id,
            warehouse_id: salesOrder.warehouse_id || '',
            transaction_type: 'out',
            quantity: item.quantity,
            unit_cost: item.unit_price,
            reference_type: 'sales_order',
            reference_id: salesOrder.id,
            notes: `Shipped via ${carrier || 'Unknown carrier'}`,
            created_by: 'system'
          })
        
        // Update current inventory
        await this.supabase
          .from('current_inventory')
          .update({
            quantity: this.supabase.sql`quantity - ${item.quantity}`,
            reserved_quantity: this.supabase.sql`reserved_quantity - ${item.quantity}`,
            last_updated: new Date().toISOString()
          })
          .eq('product_id', item.product_id)
          .eq('warehouse_id', salesOrder.warehouse_id || '')
      }
    }
    
    return so
  }

  static async deliverSalesOrder(id: string, deliveryNotes?: string): Promise<ERPSalesOrder> {
    return this.updateSalesOrderStatus(id, 'delivered', deliveryNotes)
  }

  static async cancelSalesOrder(id: string, reason?: string): Promise<ERPSalesOrder> {
    // Release reserved inventory
    const salesOrder = await this.getSalesOrder(id)
    if (salesOrder?.items && salesOrder.status === 'confirmed') {
      for (const item of salesOrder.items) {
        await this.supabase
          .from('current_inventory')
          .update({
            reserved_quantity: this.supabase.sql`reserved_quantity - ${item.quantity}`
          })
          .eq('product_id', item.product_id)
          .eq('warehouse_id', salesOrder.warehouse_id || '')
      }
    }
    
    return this.updateSalesOrderStatus(id, 'cancelled', reason)
  }

  // Quotation Management
  static async createQuotation(data: CreateQuotationData): Promise<any> {
    // Calculate totals (similar to sales order)
    const subtotal = data.items.reduce((sum, item) => {
      const itemSubtotal = item.quantity * item.unit_price
      const itemDiscount = itemSubtotal * (item.discount_rate || 0) / 100
      return sum + (itemSubtotal - itemDiscount)
    }, 0)
    
    const taxAmount = data.items.reduce((sum, item) => {
      const itemSubtotal = item.quantity * item.unit_price
      const itemDiscount = itemSubtotal * (item.discount_rate || 0) / 100
      const taxableAmount = itemSubtotal - itemDiscount
      return sum + (taxableAmount * (item.tax_rate || 0)) / 100
    }, 0)
    
    let discountAmount = 0
    if (data.discount_type === 'percentage') {
      discountAmount = (subtotal * (data.discount_value || 0)) / 100
    } else if (data.discount_type === 'fixed') {
      discountAmount = data.discount_value || 0
    }
    
    const totalAmount = subtotal + taxAmount - discountAmount + (data.shipping_charges || 0) + (data.other_charges || 0)

    // For now, store quotations in a separate table or use sales_orders with a 'quotation' status
    // This is a simplified implementation
    const quotationData = {
      ...data,
      so_number: data.quotation_number,
      order_date: data.quotation_date,
      delivery_date: data.valid_until,
      subtotal,
      tax_amount: taxAmount,
      discount_amount: discountAmount,
      total_amount: totalAmount,
      status: 'quotation'
    }
    
    return this.createSalesOrder(quotationData as CreateSalesOrderData)
  }

  static async convertQuotationToSalesOrder(quotationId: string, soNumber: string): Promise<ERPSalesOrder> {
    const { data: so, error } = await this.supabase
      .from('sales_orders')
      .update({
        so_number: soNumber,
        status: 'pending',
        order_date: new Date().toISOString().split('T')[0],
        updated_at: new Date().toISOString()
      })
      .eq('id', quotationId)
      .select()
      .single()
    
    if (error) throw error
    return so
  }

  // Sales Analytics
  static async getSalesAnalytics(companyId: string, dateFrom?: string, dateTo?: string): Promise<SalesAnalytics> {
    // Build date filters
    let salesQuery = this.supabase
      .from('sales_orders')
      .select('total_amount, order_date, customer_id, items:sales_order_items(quantity, product_id, total_amount, product:erp_products(name))')
      .eq('company_id', companyId)
      .neq('status', 'cancelled')
    
    if (dateFrom) {
      salesQuery = salesQuery.gte('order_date', dateFrom)
    }
    
    if (dateTo) {
      salesQuery = salesQuery.lte('order_date', dateTo)
    }

    const { data: salesOrders, error } = await salesQuery
    if (error) throw error

    const orders = salesOrders || []
    const totalSales = orders.reduce((sum, order) => sum + (order.total_amount || 0), 0)
    const totalOrders = orders.length
    const averageOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0

    // Calculate top products
    const productStats: { [key: string]: { name: string, quantity: number, revenue: number } } = {}
    orders.forEach(order => {
      order.items?.forEach(item => {
        const productId = item.product_id
        if (!productStats[productId]) {
          productStats[productId] = {
            name: item.product?.name || 'Unknown',
            quantity: 0,
            revenue: 0
          }
        }
        productStats[productId].quantity += item.quantity
        productStats[productId].revenue += item.total_amount || 0
      })
    })

    const topProducts = Object.entries(productStats)
      .map(([productId, stats]) => ({
        product_id: productId,
        product_name: stats.name,
        quantity_sold: stats.quantity,
        revenue: stats.revenue
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10)

    // Calculate top customers
    const customerStats: { [key: string]: { orders: number, revenue: number } } = {}
    orders.forEach(order => {
      const customerId = order.customer_id
      if (!customerStats[customerId]) {
        customerStats[customerId] = { orders: 0, revenue: 0 }
      }
      customerStats[customerId].orders += 1
      customerStats[customerId].revenue += order.total_amount || 0
    })

    // Get customer names
    const customerIds = Object.keys(customerStats)
    const { data: customers } = await this.supabase
      .from('customers')
      .select('id, name')
      .in('id', customerIds)

    const customerMap = new Map(customers?.map(c => [c.id, c.name]) || [])

    const topCustomers = Object.entries(customerStats)
      .map(([customerId, stats]) => ({
        customer_id: customerId,
        customer_name: customerMap.get(customerId) || 'Unknown',
        total_orders: stats.orders,
        total_revenue: stats.revenue
      }))
      .sort((a, b) => b.total_revenue - a.total_revenue)
      .slice(0, 10)

    // Calculate sales trend (daily)
    const trendData: { [key: string]: { sales: number, orders: number } } = {}
    orders.forEach(order => {
      const date = order.order_date
      if (!trendData[date]) {
        trendData[date] = { sales: 0, orders: 0 }
      }
      trendData[date].sales += order.total_amount || 0
      trendData[date].orders += 1
    })

    const salesTrend = Object.entries(trendData)
      .map(([date, data]) => ({
        date,
        sales: data.sales,
        orders: data.orders
      }))
      .sort((a, b) => a.date.localeCompare(b.date))

    return {
      totalSales,
      totalOrders,
      averageOrderValue,
      topProducts,
      topCustomers,
      salesTrend
    }
  }

  static async getSalesOrdersByStatus(companyId: string): Promise<{ [status: string]: number }> {
    const { data, error } = await this.supabase
      .from('sales_orders')
      .select('status')
      .eq('company_id', companyId)
    
    if (error) throw error

    const statusCounts: { [status: string]: number } = {}
    data?.forEach(order => {
      const status = order.status || 'unknown'
      statusCounts[status] = (statusCounts[status] || 0) + 1
    })

    return statusCounts
  }

  static async getRecentSalesOrders(companyId: string, limit: number = 10): Promise<ERPSalesOrder[]> {
    const { data, error } = await this.supabase
      .from('sales_orders')
      .select('*, customer:customers(name)')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })
      .limit(limit)
    
    if (error) throw error
    return data || []
  }
}

export default SalesApi