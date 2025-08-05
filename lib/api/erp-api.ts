import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Database } from '../../types/database'
import type {
  ERPCompany,
  ERPProduct,
  ERPSupplier,
  ERPCustomer,
  ERPPurchaseOrder,
  ERPSalesOrder,
  ERPInvoice,
  ERPInventory,
  ERPInventoryTransaction,
  ERPPayment
} from '../../types/database'

export interface CreateCompanyData {
  name: string
  registration_number?: string
  gst_number?: string
  pan_number?: string
  address?: any
  phone?: string
  email?: string
  website?: string
  logo_url?: string
  subscription_plan?: string
  settings?: any
}

export interface CreateProductData {
  company_id: string
  category_id?: string
  sku: string
  name: string
  description?: string
  brand?: string
  unit_of_measure?: string
  weight?: number
  dimensions?: any
  cost_price?: number
  selling_price?: number
  mrp?: number
  tax_rate?: number
  hsn_code?: string
  barcode?: string
  min_stock_level?: number
  max_stock_level?: number
  reorder_point?: number
  lead_time_days?: number
  images?: any
  attributes?: any
}

export interface CreateSupplierData {
  company_id: string
  supplier_code?: string
  name: string
  contact_person?: string
  email?: string
  phone?: string
  address?: any
  gst_number?: string
  pan_number?: string
  payment_terms?: string
  credit_limit?: number
  rating?: number
  bank_details?: any
}

export interface CreateCustomerData {
  company_id: string
  customer_code?: string
  name: string
  contact_person?: string
  email?: string
  phone?: string
  address?: any
  gst_number?: string
  pan_number?: string
  customer_type?: string
  credit_limit?: number
  payment_terms?: string
}

export interface CreatePurchaseOrderData {
  company_id: string
  po_number: string
  supplier_id: string
  warehouse_id?: string
  order_date: string
  expected_delivery_date?: string
  payment_terms?: string
  notes?: string
  items: {
    product_id: string
    quantity: number
    unit_price: number
    tax_rate?: number
  }[]
}

export interface CreateSalesOrderData {
  company_id: string
  so_number: string
  customer_id: string
  warehouse_id?: string
  order_date: string
  delivery_date?: string
  payment_terms?: string
  notes?: string
  items: {
    product_id: string
    quantity: number
    unit_price: number
    tax_rate?: number
  }[]
}

export interface CreateInventoryTransactionData {
  company_id: string
  product_id: string
  warehouse_id: string
  transaction_type: 'in' | 'out' | 'transfer' | 'adjustment'
  quantity: number
  unit_cost?: number
  reference_type?: string
  reference_id?: string
  batch_number?: string
  expiry_date?: string
  notes?: string
  created_by?: string
}

export class ERPApi {
  private static supabase = createClientComponentClient<Database>()

  // Company Management
  static async getCompany(id: string): Promise<ERPCompany | null> {
    const { data, error } = await this.supabase
      .from('companies')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  }

  static async getCompanies(): Promise<ERPCompany[]> {
    const { data, error } = await this.supabase
      .from('companies')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  }

  static async createCompany(data: CreateCompanyData): Promise<ERPCompany> {
    const { data: company, error } = await this.supabase
      .from('companies')
      .insert(data)
      .select()
      .single()
    
    if (error) throw error
    return company
  }

  static async updateCompany(id: string, data: Partial<CreateCompanyData>): Promise<ERPCompany> {
    const { data: company, error } = await this.supabase
      .from('companies')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return company
  }

  static async deleteCompany(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('companies')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }

  // Product Management
  static async getProducts(companyId: string, filters?: {
    search?: string
    category?: string
    status?: string
    limit?: number
    offset?: number
  }): Promise<{ data: ERPProduct[], count: number }> {
    let query = this.supabase
      .from('erp_products')
      .select('*, category:product_categories(*)', { count: 'exact' })
      .eq('company_id', companyId)
    
    if (filters?.search) {
      query = query.or(`name.ilike.%${filters.search}%,sku.ilike.%${filters.search}%,brand.ilike.%${filters.search}%`)
    }
    
    if (filters?.category) {
      query = query.eq('category_id', filters.category)
    }
    
    if (filters?.status) {
      query = query.eq('status', filters.status)
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

  static async getProduct(id: string): Promise<ERPProduct | null> {
    const { data, error } = await this.supabase
      .from('erp_products')
      .select('*, category:product_categories(*)')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  }

  static async createProduct(data: CreateProductData): Promise<ERPProduct> {
    const { data: product, error } = await this.supabase
      .from('erp_products')
      .insert(data)
      .select()
      .single()
    
    if (error) throw error
    return product
  }

  static async updateProduct(id: string, data: Partial<CreateProductData>): Promise<ERPProduct> {
    const { data: product, error } = await this.supabase
      .from('erp_products')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return product
  }

  static async deleteProduct(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('erp_products')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }

  // Supplier Management
  static async getSuppliers(companyId: string, filters?: {
    search?: string
    status?: string
    limit?: number
    offset?: number
  }): Promise<{ data: ERPSupplier[], count: number }> {
    let query = this.supabase
      .from('suppliers')
      .select('*', { count: 'exact' })
      .eq('company_id', companyId)
    
    if (filters?.search) {
      query = query.or(`name.ilike.%${filters.search}%,supplier_code.ilike.%${filters.search}%,contact_person.ilike.%${filters.search}%`)
    }
    
    if (filters?.status) {
      query = query.eq('status', filters.status)
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

  static async getSupplier(id: string): Promise<ERPSupplier | null> {
    const { data, error } = await this.supabase
      .from('suppliers')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  }

  static async createSupplier(data: CreateSupplierData): Promise<ERPSupplier> {
    // Generate supplier code if not provided
    if (!data.supplier_code) {
      const { count } = await this.supabase
        .from('suppliers')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', data.company_id)
      
      data.supplier_code = `SUP${String((count || 0) + 1).padStart(4, '0')}`
    }

    const { data: supplier, error } = await this.supabase
      .from('suppliers')
      .insert(data)
      .select()
      .single()
    
    if (error) throw error
    return supplier
  }

  static async updateSupplier(id: string, data: Partial<CreateSupplierData>): Promise<ERPSupplier> {
    const { data: supplier, error } = await this.supabase
      .from('suppliers')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return supplier
  }

  static async deleteSupplier(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('suppliers')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }

  // Customer Management
  static async getCustomers(companyId: string, filters?: {
    search?: string
    status?: string
    customer_type?: string
    limit?: number
    offset?: number
  }): Promise<{ data: ERPCustomer[], count: number }> {
    let query = this.supabase
      .from('customers')
      .select('*', { count: 'exact' })
      .eq('company_id', companyId)
    
    if (filters?.search) {
      query = query.or(`name.ilike.%${filters.search}%,customer_code.ilike.%${filters.search}%,contact_person.ilike.%${filters.search}%`)
    }
    
    if (filters?.status) {
      query = query.eq('status', filters.status)
    }
    
    if (filters?.customer_type) {
      query = query.eq('customer_type', filters.customer_type)
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

  static async getCustomer(id: string): Promise<ERPCustomer | null> {
    const { data, error } = await this.supabase
      .from('customers')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  }

  static async createCustomer(data: CreateCustomerData): Promise<ERPCustomer> {
    // Generate customer code if not provided
    if (!data.customer_code) {
      const { count } = await this.supabase
        .from('customers')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', data.company_id)
      
      data.customer_code = `CUS${String((count || 0) + 1).padStart(4, '0')}`
    }

    const { data: customer, error } = await this.supabase
      .from('customers')
      .insert(data)
      .select()
      .single()
    
    if (error) throw error
    return customer
  }

  static async updateCustomer(id: string, data: Partial<CreateCustomerData>): Promise<ERPCustomer> {
    const { data: customer, error } = await this.supabase
      .from('customers')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return customer
  }

  static async deleteCustomer(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('customers')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }

  // Purchase Order Management
  static async getPurchaseOrders(companyId: string, filters?: {
    search?: string
    status?: string
    supplier_id?: string
    date_from?: string
    date_to?: string
    limit?: number
    offset?: number
  }): Promise<{ data: ERPPurchaseOrder[], count: number }> {
    let query = this.supabase
      .from('purchase_orders')
      .select('*, supplier:suppliers(*), items:purchase_order_items(*)', { count: 'exact' })
      .eq('company_id', companyId)
    
    if (filters?.search) {
      query = query.or(`po_number.ilike.%${filters.search}%`)
    }
    
    if (filters?.status) {
      query = query.eq('status', filters.status)
    }
    
    if (filters?.supplier_id) {
      query = query.eq('supplier_id', filters.supplier_id)
    }
    
    if (filters?.date_from) {
      query = query.gte('order_date', filters.date_from)
    }
    
    if (filters?.date_to) {
      query = query.lte('order_date', filters.date_to)
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

  static async getPurchaseOrder(id: string): Promise<ERPPurchaseOrder | null> {
    const { data, error } = await this.supabase
      .from('purchase_orders')
      .select('*, supplier:suppliers(*), items:purchase_order_items(*, product:erp_products(*))')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  }

  static async createPurchaseOrder(data: CreatePurchaseOrderData): Promise<ERPPurchaseOrder> {
    // Calculate totals
    const subtotal = data.items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0)
    const taxAmount = data.items.reduce((sum, item) => {
      const itemSubtotal = item.quantity * item.unit_price
      return sum + (itemSubtotal * (item.tax_rate || 0)) / 100
    }, 0)
    const totalAmount = subtotal + taxAmount

    // Create purchase order
    const { data: po, error: poError } = await this.supabase
      .from('purchase_orders')
      .insert({
        ...data,
        subtotal,
        tax_amount: taxAmount,
        total_amount: totalAmount,
        status: 'draft'
      })
      .select()
      .single()
    
    if (poError) throw poError

    // Create purchase order items
    const items = data.items.map(item => ({
      po_id: po.id,
      product_id: item.product_id,
      quantity: item.quantity,
      unit_price: item.unit_price,
      tax_rate: item.tax_rate || 0,
      tax_amount: (item.quantity * item.unit_price * (item.tax_rate || 0)) / 100,
      total_amount: item.quantity * item.unit_price + (item.quantity * item.unit_price * (item.tax_rate || 0)) / 100
    }))

    const { error: itemsError } = await this.supabase
      .from('purchase_order_items')
      .insert(items)
    
    if (itemsError) throw itemsError

    return po
  }

  static async updatePurchaseOrder(id: string, data: Partial<CreatePurchaseOrderData>): Promise<ERPPurchaseOrder> {
    const { data: po, error } = await this.supabase
      .from('purchase_orders')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return po
  }

  static async deletePurchaseOrder(id: string): Promise<void> {
    // Delete items first
    await this.supabase
      .from('purchase_order_items')
      .delete()
      .eq('po_id', id)
    
    // Delete purchase order
    const { error } = await this.supabase
      .from('purchase_orders')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }

  // Inventory Management
  static async getInventory(companyId: string, warehouseId?: string): Promise<ERPInventory[]> {
    let query = this.supabase
      .from('current_inventory')
      .select('*, product:erp_products(*), warehouse:warehouses(*)')
      .eq('company_id', companyId)
    
    if (warehouseId) {
      query = query.eq('warehouse_id', warehouseId)
    }
    
    const { data, error } = await query.order('last_updated', { ascending: false })
    
    if (error) throw error
    return data || []
  }

  static async createInventoryTransaction(data: CreateInventoryTransactionData): Promise<ERPInventoryTransaction> {
    const { data: transaction, error } = await this.supabase
      .from('inventory_transactions')
      .insert(data)
      .select()
      .single()
    
    if (error) throw error

    // Update current inventory
    await this.updateCurrentInventory(data.product_id, data.warehouse_id, data.quantity, data.transaction_type)
    
    return transaction
  }

  private static async updateCurrentInventory(
    productId: string,
    warehouseId: string,
    quantity: number,
    transactionType: 'in' | 'out' | 'transfer' | 'adjustment'
  ): Promise<void> {
    const { data: currentInventory } = await this.supabase
      .from('current_inventory')
      .select('*')
      .eq('product_id', productId)
      .eq('warehouse_id', warehouseId)
      .single()
    
    const currentQty = currentInventory?.quantity || 0
    let newQuantity = currentQty
    
    switch (transactionType) {
      case 'in':
        newQuantity = currentQty + quantity
        break
      case 'out':
        newQuantity = currentQty - quantity
        break
      case 'adjustment':
        newQuantity = quantity
        break
    }
    
    if (currentInventory) {
      await this.supabase
        .from('current_inventory')
        .update({
          quantity: newQuantity,
          last_updated: new Date().toISOString()
        })
        .eq('id', currentInventory.id)
    } else {
      await this.supabase
        .from('current_inventory')
        .insert({
          product_id: productId,
          warehouse_id: warehouseId,
          quantity: newQuantity,
          reserved_quantity: 0
        })
    }
  }

  // Dashboard Stats
  static async getDashboardStats(companyId: string): Promise<{
    totalRevenue: number
    totalOrders: number
    totalProducts: number
    totalCustomers: number
    lowStockProducts: number
    pendingInvoices: number
  }> {
    const [revenue, orders, products, customers, lowStock, invoices] = await Promise.all([
      this.supabase
        .from('sales_orders')
        .select('total_amount')
        .eq('company_id', companyId)
        .eq('status', 'delivered'),
      
      this.supabase
        .from('sales_orders')
        .select('id', { count: 'exact', head: true })
        .eq('company_id', companyId),
      
      this.supabase
        .from('erp_products')
        .select('id', { count: 'exact', head: true })
        .eq('company_id', companyId)
        .eq('status', 'active'),
      
      this.supabase
        .from('customers')
        .select('id', { count: 'exact', head: true })
        .eq('company_id', companyId)
        .eq('status', 'active'),
      
      this.supabase
        .from('current_inventory')
        .select('quantity, product:erp_products(min_stock_level)')
        .eq('company_id', companyId),
      
      this.supabase
        .from('invoices')
        .select('id', { count: 'exact', head: true })
        .eq('company_id', companyId)
        .eq('status', 'pending')
    ])

    const totalRevenue = revenue.data?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0
    const lowStockCount = lowStock.data?.filter(inv => 
      (inv.quantity || 0) <= ((inv.product as any)?.min_stock_level || 0)
    ).length || 0

    return {
      totalRevenue,
      totalOrders: orders.count || 0,
      totalProducts: products.count || 0,
      totalCustomers: customers.count || 0,
      lowStockProducts: lowStockCount,
      pendingInvoices: invoices.count || 0
    }
  }
}

export default ERPApi