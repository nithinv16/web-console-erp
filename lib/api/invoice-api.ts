import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Database } from '@/types/database'
import type {
  ERPInvoice,
  ERPPayment,
  ERPSalesOrder
} from '@/types/database'

export interface CreateInvoiceData {
  company_id: string
  invoice_number: string
  customer_id: string
  sales_order_id?: string
  invoice_date: string
  due_date: string
  payment_terms?: string
  notes?: string
  discount_type?: 'percentage' | 'fixed'
  discount_value?: number
  shipping_charges?: number
  other_charges?: number
  items: {
    product_id: string
    description?: string
    quantity: number
    unit_price: number
    tax_rate?: number
  }[]
}

export interface CreatePaymentData {
  company_id: string
  invoice_id?: string
  customer_id?: string
  supplier_id?: string
  payment_number: string
  payment_date: string
  payment_method: 'cash' | 'bank_transfer' | 'cheque' | 'card' | 'upi' | 'other'
  amount: number
  reference_number?: string
  notes?: string
  bank_details?: any
}

export interface InvoiceFilters {
  search?: string
  status?: string
  customer_id?: string
  date_from?: string
  date_to?: string
  overdue_only?: boolean
  limit?: number
  offset?: number
}

export interface PaymentFilters {
  search?: string
  payment_method?: string
  customer_id?: string
  supplier_id?: string
  date_from?: string
  date_to?: string
  limit?: number
  offset?: number
}

export interface FinancialSummary {
  totalSales: number
  totalPurchases: number
  totalReceivables: number
  totalPayables: number
  overdueReceivables: number
  overduePayables: number
  cashFlow: number
  profitLoss: number
}

export class InvoiceApi {
  private static supabase = createClientComponentClient<Database>()

  // Invoice Management
  static async getInvoices(companyId: string, filters?: InvoiceFilters): Promise<{ data: ERPInvoice[], count: number }> {
    let query = this.supabase
      .from('invoices')
      .select('*, customer:customers(*), sales_order:sales_orders(*), items:invoice_items(*, product:erp_products(*))', { count: 'exact' })
      .eq('company_id', companyId)
    
    if (filters?.search) {
      query = query.or(`invoice_number.ilike.%${filters.search}%`)
    }
    
    if (filters?.status) {
      query = query.eq('status', filters.status)
    }
    
    if (filters?.customer_id) {
      query = query.eq('customer_id', filters.customer_id)
    }
    
    if (filters?.date_from) {
      query = query.gte('invoice_date', filters.date_from)
    }
    
    if (filters?.date_to) {
      query = query.lte('invoice_date', filters.date_to)
    }
    
    if (filters?.overdue_only) {
      const today = new Date().toISOString().split('T')[0]
      query = query.lt('due_date', today).neq('status', 'paid')
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

  static async getInvoice(id: string): Promise<ERPInvoice | null> {
    const { data, error } = await this.supabase
      .from('invoices')
      .select('*, customer:customers(*), sales_order:sales_orders(*), items:invoice_items(*, product:erp_products(*)), payments:payments(*)')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  }

  static async createInvoice(data: CreateInvoiceData): Promise<ERPInvoice> {
    // Calculate totals
    const subtotal = data.items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0)
    const taxAmount = data.items.reduce((sum, item) => {
      const itemSubtotal = item.quantity * item.unit_price
      return sum + (itemSubtotal * (item.tax_rate || 0)) / 100
    }, 0)
    
    let discountAmount = 0
    if (data.discount_type === 'percentage') {
      discountAmount = (subtotal * (data.discount_value || 0)) / 100
    } else if (data.discount_type === 'fixed') {
      discountAmount = data.discount_value || 0
    }
    
    const totalAmount = subtotal + taxAmount - discountAmount + (data.shipping_charges || 0) + (data.other_charges || 0)

    // Create invoice
    const { data: invoice, error: invoiceError } = await this.supabase
      .from('invoices')
      .insert({
        ...data,
        subtotal,
        tax_amount: taxAmount,
        discount_amount: discountAmount,
        total_amount: totalAmount,
        paid_amount: 0,
        balance_amount: totalAmount,
        status: 'pending'
      })
      .select()
      .single()
    
    if (invoiceError) throw invoiceError

    // Create invoice items
    const items = data.items.map(item => ({
      invoice_id: invoice.id,
      product_id: item.product_id,
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unit_price,
      tax_rate: item.tax_rate || 0,
      tax_amount: (item.quantity * item.unit_price * (item.tax_rate || 0)) / 100,
      total_amount: item.quantity * item.unit_price + (item.quantity * item.unit_price * (item.tax_rate || 0)) / 100
    }))

    const { error: itemsError } = await this.supabase
      .from('invoice_items')
      .insert(items)
    
    if (itemsError) throw itemsError

    // Update sales order status if linked
    if (data.sales_order_id) {
      await this.supabase
        .from('sales_orders')
        .update({ status: 'invoiced' })
        .eq('id', data.sales_order_id)
    }

    return invoice
  }

  static async createInvoiceFromSalesOrder(salesOrderId: string): Promise<ERPInvoice> {
    // Get sales order with items
    const { data: salesOrder, error: soError } = await this.supabase
      .from('sales_orders')
      .select('*, customer:customers(*), items:sales_order_items(*, product:erp_products(*))')
      .eq('id', salesOrderId)
      .single()
    
    if (soError) throw soError
    if (!salesOrder) throw new Error('Sales order not found')

    // Generate invoice number
    const { count } = await this.supabase
      .from('invoices')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', salesOrder.company_id)
    
    const invoiceNumber = `INV${String((count || 0) + 1).padStart(6, '0')}`
    
    // Create invoice data from sales order
    const invoiceData: CreateInvoiceData = {
      company_id: salesOrder.company_id,
      invoice_number: invoiceNumber,
      customer_id: salesOrder.customer_id,
      sales_order_id: salesOrder.id,
      invoice_date: new Date().toISOString().split('T')[0],
      due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
      payment_terms: salesOrder.payment_terms,
      notes: salesOrder.notes,
      items: salesOrder.items?.map(item => ({
        product_id: item.product_id,
        description: item.product?.name,
        quantity: item.quantity,
        unit_price: item.unit_price,
        tax_rate: item.tax_rate
      })) || []
    }

    return this.createInvoice(invoiceData)
  }

  static async updateInvoice(id: string, data: Partial<CreateInvoiceData>): Promise<ERPInvoice> {
    const { data: invoice, error } = await this.supabase
      .from('invoices')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return invoice
  }

  static async deleteInvoice(id: string): Promise<void> {
    // Delete items first
    await this.supabase
      .from('invoice_items')
      .delete()
      .eq('invoice_id', id)
    
    // Delete invoice
    const { error } = await this.supabase
      .from('invoices')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }

  static async markInvoiceAsPaid(id: string, paymentData?: Partial<CreatePaymentData>): Promise<void> {
    const invoice = await this.getInvoice(id)
    if (!invoice) throw new Error('Invoice not found')

    // Create payment record if payment data provided
    if (paymentData) {
      const { count } = await this.supabase
        .from('payments')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', invoice.company_id)
      
      const paymentNumber = `PAY${String((count || 0) + 1).padStart(6, '0')}`
      
      await this.createPayment({
        company_id: invoice.company_id,
        invoice_id: id,
        customer_id: invoice.customer_id,
        payment_number: paymentNumber,
        payment_date: new Date().toISOString().split('T')[0],
        payment_method: paymentData.payment_method || 'cash',
        amount: invoice.balance_amount,
        ...paymentData
      })
    }

    // Update invoice status
    await this.supabase
      .from('invoices')
      .update({
        status: 'paid',
        paid_amount: invoice.total_amount,
        balance_amount: 0,
        payment_date: new Date().toISOString().split('T')[0]
      })
      .eq('id', id)
  }

  // Payment Management
  static async getPayments(companyId: string, filters?: PaymentFilters): Promise<{ data: ERPPayment[], count: number }> {
    let query = this.supabase
      .from('payments')
      .select('*, invoice:invoices(*), customer:customers(*), supplier:suppliers(*)', { count: 'exact' })
      .eq('company_id', companyId)
    
    if (filters?.search) {
      query = query.or(`payment_number.ilike.%${filters.search}%,reference_number.ilike.%${filters.search}%`)
    }
    
    if (filters?.payment_method) {
      query = query.eq('payment_method', filters.payment_method)
    }
    
    if (filters?.customer_id) {
      query = query.eq('customer_id', filters.customer_id)
    }
    
    if (filters?.supplier_id) {
      query = query.eq('supplier_id', filters.supplier_id)
    }
    
    if (filters?.date_from) {
      query = query.gte('payment_date', filters.date_from)
    }
    
    if (filters?.date_to) {
      query = query.lte('payment_date', filters.date_to)
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

  static async getPayment(id: string): Promise<ERPPayment | null> {
    const { data, error } = await this.supabase
      .from('payments')
      .select('*, invoice:invoices(*), customer:customers(*), supplier:suppliers(*)')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  }

  static async createPayment(data: CreatePaymentData): Promise<ERPPayment> {
    const { data: payment, error } = await this.supabase
      .from('payments')
      .insert(data)
      .select()
      .single()
    
    if (error) throw error

    // Update invoice if payment is linked to an invoice
    if (data.invoice_id) {
      const { data: invoice } = await this.supabase
        .from('invoices')
        .select('paid_amount, total_amount')
        .eq('id', data.invoice_id)
        .single()
      
      if (invoice) {
        const newPaidAmount = (invoice.paid_amount || 0) + data.amount
        const newBalanceAmount = invoice.total_amount - newPaidAmount
        const newStatus = newBalanceAmount <= 0 ? 'paid' : newPaidAmount > 0 ? 'partially_paid' : 'pending'
        
        await this.supabase
          .from('invoices')
          .update({
            paid_amount: newPaidAmount,
            balance_amount: newBalanceAmount,
            status: newStatus,
            payment_date: newStatus === 'paid' ? data.payment_date : null
          })
          .eq('id', data.invoice_id)
      }
    }

    return payment
  }

  static async updatePayment(id: string, data: Partial<CreatePaymentData>): Promise<ERPPayment> {
    const { data: payment, error } = await this.supabase
      .from('payments')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return payment
  }

  static async deletePayment(id: string): Promise<void> {
    // Get payment details before deletion
    const payment = await this.getPayment(id)
    if (!payment) throw new Error('Payment not found')

    // Delete payment
    const { error } = await this.supabase
      .from('payments')
      .delete()
      .eq('id', id)
    
    if (error) throw error

    // Update invoice if payment was linked
    if (payment.invoice_id) {
      const { data: invoice } = await this.supabase
        .from('invoices')
        .select('paid_amount, total_amount')
        .eq('id', payment.invoice_id)
        .single()
      
      if (invoice) {
        const newPaidAmount = (invoice.paid_amount || 0) - payment.amount
        const newBalanceAmount = invoice.total_amount - newPaidAmount
        const newStatus = newBalanceAmount <= 0 ? 'paid' : newPaidAmount > 0 ? 'partially_paid' : 'pending'
        
        await this.supabase
          .from('invoices')
          .update({
            paid_amount: Math.max(0, newPaidAmount),
            balance_amount: newBalanceAmount,
            status: newStatus,
            payment_date: newStatus === 'paid' ? null : invoice.payment_date
          })
          .eq('id', payment.invoice_id)
      }
    }
  }

  // Financial Reports
  static async getFinancialSummary(companyId: string, dateFrom?: string, dateTo?: string): Promise<FinancialSummary> {
    const today = new Date().toISOString().split('T')[0]
    
    // Build date filters
    let salesQuery = this.supabase
      .from('invoices')
      .select('total_amount, paid_amount, due_date, status')
      .eq('company_id', companyId)
    
    let purchaseQuery = this.supabase
      .from('purchase_orders')
      .select('total_amount, status')
      .eq('company_id', companyId)
    
    if (dateFrom) {
      salesQuery = salesQuery.gte('invoice_date', dateFrom)
      purchaseQuery = purchaseQuery.gte('order_date', dateFrom)
    }
    
    if (dateTo) {
      salesQuery = salesQuery.lte('invoice_date', dateTo)
      purchaseQuery = purchaseQuery.lte('order_date', dateTo)
    }

    const [salesData, purchaseData] = await Promise.all([
      salesQuery,
      purchaseQuery
    ])

    if (salesData.error) throw salesData.error
    if (purchaseData.error) throw purchaseData.error

    const sales = salesData.data || []
    const purchases = purchaseData.data || []

    const totalSales = sales.reduce((sum, inv) => sum + (inv.total_amount || 0), 0)
    const totalPurchases = purchases.reduce((sum, po) => sum + (po.total_amount || 0), 0)
    const totalReceivables = sales.reduce((sum, inv) => sum + ((inv.total_amount || 0) - (inv.paid_amount || 0)), 0)
    const overdueReceivables = sales
      .filter(inv => inv.due_date < today && inv.status !== 'paid')
      .reduce((sum, inv) => sum + ((inv.total_amount || 0) - (inv.paid_amount || 0)), 0)
    
    // For payables, we'd need purchase invoices/bills - using purchase orders as approximation
    const totalPayables = purchases
      .filter(po => po.status === 'received' || po.status === 'partially_received')
      .reduce((sum, po) => sum + (po.total_amount || 0), 0)
    
    const cashFlow = totalSales - totalPurchases
    const profitLoss = cashFlow // Simplified - would need COGS calculation

    return {
      totalSales,
      totalPurchases,
      totalReceivables,
      totalPayables,
      overdueReceivables,
      overduePayables: 0, // Would need proper purchase invoice tracking
      cashFlow,
      profitLoss
    }
  }

  static async getAgeingReport(companyId: string, type: 'receivables' | 'payables' = 'receivables'): Promise<{
    current: number
    days_1_30: number
    days_31_60: number
    days_61_90: number
    days_90_plus: number
  }> {
    const today = new Date()
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const sixtyDaysAgo = new Date(today.getTime() - 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const ninetyDaysAgo = new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const todayStr = today.toISOString().split('T')[0]

    if (type === 'receivables') {
      const { data: invoices, error } = await this.supabase
        .from('invoices')
        .select('total_amount, paid_amount, due_date')
        .eq('company_id', companyId)
        .neq('status', 'paid')
      
      if (error) throw error

      const result = {
        current: 0,
        days_1_30: 0,
        days_31_60: 0,
        days_61_90: 0,
        days_90_plus: 0
      }

      invoices?.forEach(inv => {
        const balance = (inv.total_amount || 0) - (inv.paid_amount || 0)
        const dueDate = inv.due_date
        
        if (dueDate >= todayStr) {
          result.current += balance
        } else if (dueDate >= thirtyDaysAgo) {
          result.days_1_30 += balance
        } else if (dueDate >= sixtyDaysAgo) {
          result.days_31_60 += balance
        } else if (dueDate >= ninetyDaysAgo) {
          result.days_61_90 += balance
        } else {
          result.days_90_plus += balance
        }
      })

      return result
    }

    // For payables, return empty for now (would need purchase invoices)
    return {
      current: 0,
      days_1_30: 0,
      days_31_60: 0,
      days_61_90: 0,
      days_90_plus: 0
    }
  }
}

export default InvoiceApi