import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Database } from '../../types/database'
import type {
  ERPInventory,
  ERPInventoryTransaction,
  ERPProduct,
  ERPWarehouse
} from '../../types/database'

export interface CreateWarehouseData {
  company_id: string
  warehouse_code: string
  name: string
  address?: any
  manager_name?: string
  contact_phone?: string
  contact_email?: string
  capacity?: number
  warehouse_type?: 'main' | 'branch' | 'virtual' | 'consignment'
  is_active?: boolean
}

export interface StockAdjustmentData {
  company_id: string
  warehouse_id: string
  product_id: string
  adjustment_type: 'increase' | 'decrease' | 'set'
  quantity: number
  reason: string
  reference_number?: string
  notes?: string
  unit_cost?: number
}

export interface StockTransferData {
  company_id: string
  from_warehouse_id: string
  to_warehouse_id: string
  transfer_number: string
  transfer_date: string
  notes?: string
  items: {
    product_id: string
    quantity: number
    unit_cost?: number
  }[]
}

export interface InventoryFilters {
  search?: string
  warehouse_id?: string
  category_id?: string
  low_stock_only?: boolean
  out_of_stock_only?: boolean
  negative_stock_only?: boolean
  limit?: number
  offset?: number
}

export interface InventoryValuation {
  total_value: number
  total_quantity: number
  by_warehouse: {
    warehouse_id: string
    warehouse_name: string
    value: number
    quantity: number
  }[]
  by_category: {
    category_id: string
    category_name: string
    value: number
    quantity: number
  }[]
}

export interface StockMovementReport {
  product_id: string
  product_name: string
  opening_stock: number
  stock_in: number
  stock_out: number
  adjustments: number
  closing_stock: number
  value: number
}

export class InventoryApi {
  private static supabase = createClientComponentClient<Database>()

  // Warehouse Management
  static async getWarehouses(companyId: string): Promise<ERPWarehouse[]> {
    const { data, error } = await this.supabase
      .from('warehouses')
      .select('*')
      .eq('company_id', companyId)
      .eq('is_active', true)
      .order('name')
    
    if (error) throw error
    return data || []
  }

  static async getWarehouse(id: string): Promise<ERPWarehouse | null> {
    const { data, error } = await this.supabase
      .from('warehouses')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  }

  static async createWarehouse(data: CreateWarehouseData): Promise<ERPWarehouse> {
    const { data: warehouse, error } = await this.supabase
      .from('warehouses')
      .insert({
        ...data,
        is_active: data.is_active ?? true
      })
      .select()
      .single()
    
    if (error) throw error
    return warehouse
  }

  static async updateWarehouse(id: string, data: Partial<CreateWarehouseData>): Promise<ERPWarehouse> {
    const { data: warehouse, error } = await this.supabase
      .from('warehouses')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return warehouse
  }

  static async deleteWarehouse(id: string): Promise<void> {
    // Check if warehouse has inventory
    const { data: inventory, error: invError } = await this.supabase
      .from('current_inventory')
      .select('id')
      .eq('warehouse_id', id)
      .gt('quantity', 0)
      .limit(1)
    
    if (invError) throw invError
    if (inventory && inventory.length > 0) {
      throw new Error('Cannot delete warehouse with existing inventory')
    }

    const { error } = await this.supabase
      .from('warehouses')
      .update({ is_active: false })
      .eq('id', id)
    
    if (error) throw error
  }

  // Inventory Management
  static async getInventory(companyId: string, filters?: InventoryFilters): Promise<{ data: ERPInventory[], count: number }> {
    let query = this.supabase
      .from('current_inventory')
      .select(`
        *,
        product:erp_products(*),
        warehouse:warehouses(*)
      `, { count: 'exact' })
      .eq('company_id', companyId)
    
    if (filters?.search) {
      query = query.or(`product.name.ilike.%${filters.search}%,product.sku.ilike.%${filters.search}%`)
    }
    
    if (filters?.warehouse_id) {
      query = query.eq('warehouse_id', filters.warehouse_id)
    }
    
    if (filters?.category_id) {
      query = query.eq('product.category_id', filters.category_id)
    }
    
    if (filters?.low_stock_only) {
      query = query.lt('quantity', 'product.min_stock_level')
    }
    
    if (filters?.out_of_stock_only) {
      query = query.eq('quantity', 0)
    }
    
    if (filters?.negative_stock_only) {
      query = query.lt('quantity', 0)
    }
    
    if (filters?.limit) {
      query = query.limit(filters.limit)
    }
    
    if (filters?.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1)
    }
    
    query = query.order('last_updated', { ascending: false })
    
    const { data, error, count } = await query
    
    if (error) throw error
    return { data: data || [], count: count || 0 }
  }

  static async getProductInventory(productId: string, companyId: string): Promise<ERPInventory[]> {
    const { data, error } = await this.supabase
      .from('current_inventory')
      .select('*, warehouse:warehouses(*)')
      .eq('product_id', productId)
      .eq('company_id', companyId)
      .order('warehouse.name')
    
    if (error) throw error
    return data || []
  }

  static async getWarehouseInventory(warehouseId: string, companyId: string): Promise<ERPInventory[]> {
    const { data, error } = await this.supabase
      .from('current_inventory')
      .select('*, product:erp_products(*)')
      .eq('warehouse_id', warehouseId)
      .eq('company_id', companyId)
      .order('product.name')
    
    if (error) throw error
    return data || []
  }

  // Stock Transactions
  static async getInventoryTransactions(
    companyId: string,
    filters?: {
      product_id?: string
      warehouse_id?: string
      transaction_type?: string
      date_from?: string
      date_to?: string
      limit?: number
      offset?: number
    }
  ): Promise<{ data: ERPInventoryTransaction[], count: number }> {
    let query = this.supabase
      .from('inventory_transactions')
      .select(`
        *,
        product:erp_products(*),
        warehouse:warehouses(*)
      `, { count: 'exact' })
      .eq('company_id', companyId)
    
    if (filters?.product_id) {
      query = query.eq('product_id', filters.product_id)
    }
    
    if (filters?.warehouse_id) {
      query = query.eq('warehouse_id', filters.warehouse_id)
    }
    
    if (filters?.transaction_type) {
      query = query.eq('transaction_type', filters.transaction_type)
    }
    
    if (filters?.date_from) {
      query = query.gte('created_at', filters.date_from)
    }
    
    if (filters?.date_to) {
      query = query.lte('created_at', filters.date_to)
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

  static async createInventoryTransaction(data: {
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
  }): Promise<ERPInventoryTransaction> {
    const { data: transaction, error } = await this.supabase
      .from('inventory_transactions')
      .insert(data)
      .select()
      .single()
    
    if (error) throw error

    // Update current inventory
    await this.updateCurrentInventory(
      data.product_id,
      data.warehouse_id,
      data.quantity,
      data.transaction_type,
      data.company_id
    )
    
    return transaction
  }

  private static async updateCurrentInventory(
    productId: string,
    warehouseId: string,
    quantity: number,
    transactionType: 'in' | 'out' | 'transfer' | 'adjustment',
    companyId: string
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
      case 'transfer':
        // For transfer, this handles the 'out' part
        newQuantity = currentQty - quantity
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
          company_id: companyId,
          product_id: productId,
          warehouse_id: warehouseId,
          quantity: newQuantity,
          reserved_quantity: 0
        })
    }
  }

  // Stock Adjustments
  static async createStockAdjustment(data: StockAdjustmentData): Promise<ERPInventoryTransaction> {
    const { data: currentInventory } = await this.supabase
      .from('current_inventory')
      .select('quantity')
      .eq('product_id', data.product_id)
      .eq('warehouse_id', data.warehouse_id)
      .single()
    
    const currentQty = currentInventory?.quantity || 0
    let adjustmentQty = 0
    let newQuantity = 0
    
    switch (data.adjustment_type) {
      case 'increase':
        adjustmentQty = data.quantity
        newQuantity = currentQty + data.quantity
        break
      case 'decrease':
        adjustmentQty = -data.quantity
        newQuantity = currentQty - data.quantity
        break
      case 'set':
        adjustmentQty = data.quantity - currentQty
        newQuantity = data.quantity
        break
    }
    
    return this.createInventoryTransaction({
      company_id: data.company_id,
      product_id: data.product_id,
      warehouse_id: data.warehouse_id,
      transaction_type: 'adjustment',
      quantity: newQuantity,
      unit_cost: data.unit_cost,
      reference_type: 'stock_adjustment',
      reference_id: data.reference_number,
      notes: `${data.reason}${data.notes ? ` - ${data.notes}` : ''}`,
      created_by: 'user'
    })
  }

  // Stock Transfers
  static async createStockTransfer(data: StockTransferData): Promise<{
    transfer_id: string
    transactions: ERPInventoryTransaction[]
  }> {
    const transferId = `TRF${Date.now()}`;
    const transactions: ERPInventoryTransaction[] = [];
    
    // Validate source warehouse has sufficient stock
    for (const item of data.items) {
      const { data: inventory } = await this.supabase
        .from('current_inventory')
        .select('quantity')
        .eq('product_id', item.product_id)
        .eq('warehouse_id', data.from_warehouse_id)
        .single()
      
      const availableQty = inventory?.quantity || 0
      if (availableQty < item.quantity) {
        const { data: product } = await this.supabase
          .from('erp_products')
          .select('name')
          .eq('id', item.product_id)
          .single()
        
        throw new Error(`Insufficient stock for ${product?.name}. Available: ${availableQty}, Required: ${item.quantity}`)
      }
    }
    
    // Create transfer transactions
    for (const item of data.items) {
      // Out transaction from source warehouse
      const outTransaction = await this.createInventoryTransaction({
        company_id: data.company_id,
        product_id: item.product_id,
        warehouse_id: data.from_warehouse_id,
        transaction_type: 'transfer',
        quantity: item.quantity,
        unit_cost: item.unit_cost,
        reference_type: 'stock_transfer',
        reference_id: transferId,
        notes: `Transfer to warehouse ${data.to_warehouse_id}${data.notes ? ` - ${data.notes}` : ''}`,
        created_by: 'user'
      })
      
      // In transaction to destination warehouse
      const inTransaction = await this.createInventoryTransaction({
        company_id: data.company_id,
        product_id: item.product_id,
        warehouse_id: data.to_warehouse_id,
        transaction_type: 'in',
        quantity: item.quantity,
        unit_cost: item.unit_cost,
        reference_type: 'stock_transfer',
        reference_id: transferId,
        notes: `Transfer from warehouse ${data.from_warehouse_id}${data.notes ? ` - ${data.notes}` : ''}`,
        created_by: 'user'
      })
      
      transactions.push(outTransaction, inTransaction)
    }
    
    return {
      transfer_id: transferId,
      transactions
    }
  }

  // Inventory Reports
  static async getInventoryValuation(companyId: string, warehouseId?: string): Promise<InventoryValuation> {
    let query = this.supabase
      .from('current_inventory')
      .select(`
        quantity,
        product:erp_products(cost_price, category_id),
        warehouse:warehouses(id, name)
      `)
      .eq('company_id', companyId)
      .gt('quantity', 0)
    
    if (warehouseId) {
      query = query.eq('warehouse_id', warehouseId)
    }
    
    const { data: inventory, error } = await query
    if (error) throw error
    
    let totalValue = 0
    let totalQuantity = 0
    const warehouseMap = new Map<string, { name: string, value: number, quantity: number }>()
    const categoryMap = new Map<string, { value: number, quantity: number }>()
    
    inventory?.forEach(inv => {
      const value = inv.quantity * ((inv.product as any)?.cost_price || 0)
      totalValue += value
      totalQuantity += inv.quantity
      
      // By warehouse
      const warehouseId = (inv.warehouse as any)?.id || ''
      const warehouseName = (inv.warehouse as any)?.name || 'Unknown'
      if (!warehouseMap.has(warehouseId)) {
        warehouseMap.set(warehouseId, { name: warehouseName, value: 0, quantity: 0 })
      }
      const warehouseData = warehouseMap.get(warehouseId)!
      warehouseData.value += value
      warehouseData.quantity += inv.quantity
      
      // By category
      const categoryId = (inv.product as any)?.category_id || ''
      if (!categoryMap.has(categoryId)) {
        categoryMap.set(categoryId, { value: 0, quantity: 0 })
      }
      const categoryData = categoryMap.get(categoryId)!
      categoryData.value += value
      categoryData.quantity += inv.quantity
    })
    
    // Get category names
    const categoryIds = Array.from(categoryMap.keys()).filter(id => id)
    const { data: categories } = await this.supabase
      .from('product_categories')
      .select('id, name')
      .in('id', categoryIds)
    
    const categoryNameMap = new Map(categories?.map(c => [c.id, c.name]) || [])
    
    return {
      total_value: totalValue,
      total_quantity: totalQuantity,
      by_warehouse: Array.from(warehouseMap.entries()).map(([id, data]) => ({
        warehouse_id: id,
        warehouse_name: data.name,
        value: data.value,
        quantity: data.quantity
      })),
      by_category: Array.from(categoryMap.entries()).map(([id, data]) => ({
        category_id: id,
        category_name: categoryNameMap.get(id) || 'Uncategorized',
        value: data.value,
        quantity: data.quantity
      }))
    }
  }

  static async getStockMovementReport(
    companyId: string,
    dateFrom: string,
    dateTo: string,
    warehouseId?: string
  ): Promise<StockMovementReport[]> {
    // Get all products with transactions in the period
    let transactionQuery = this.supabase
      .from('inventory_transactions')
      .select(`
        product_id,
        transaction_type,
        quantity,
        unit_cost,
        product:erp_products(name, cost_price)
      `)
      .eq('company_id', companyId)
      .gte('created_at', dateFrom)
      .lte('created_at', dateTo)
    
    if (warehouseId) {
      transactionQuery = transactionQuery.eq('warehouse_id', warehouseId)
    }
    
    const { data: transactions, error } = await transactionQuery
    if (error) throw error
    
    // Get opening stock (before the period)
    let openingQuery = this.supabase
      .from('inventory_transactions')
      .select('product_id, transaction_type, quantity')
      .eq('company_id', companyId)
      .lt('created_at', dateFrom)
    
    if (warehouseId) {
      openingQuery = openingQuery.eq('warehouse_id', warehouseId)
    }
    
    const { data: openingTransactions } = await openingQuery
    
    // Calculate opening stock by product
    const openingStock = new Map<string, number>()
    openingTransactions?.forEach(txn => {
      const current = openingStock.get(txn.product_id) || 0
      const change = txn.transaction_type === 'in' || txn.transaction_type === 'adjustment' 
        ? txn.quantity 
        : -txn.quantity
      openingStock.set(txn.product_id, current + change)
    })
    
    // Calculate movements by product
    const productMovements = new Map<string, {
      name: string
      stockIn: number
      stockOut: number
      adjustments: number
      cost_price: number
    }>()
    
    transactions?.forEach(txn => {
      const productId = txn.product_id
      if (!productMovements.has(productId)) {
        productMovements.set(productId, {
          name: (txn.product as any)?.name || 'Unknown',
          stockIn: 0,
          stockOut: 0,
          adjustments: 0,
          cost_price: (txn.product as any)?.cost_price || 0
        })
      }
      
      const movement = productMovements.get(productId)!
      
      switch (txn.transaction_type) {
        case 'in':
          movement.stockIn += txn.quantity
          break
        case 'out':
        case 'transfer':
          movement.stockOut += txn.quantity
          break
        case 'adjustment':
          movement.adjustments += txn.quantity
          break
      }
    })
    
    // Generate report
    return Array.from(productMovements.entries()).map(([productId, movement]) => {
      const opening = openingStock.get(productId) || 0
      const closing = opening + movement.stockIn - movement.stockOut + movement.adjustments
      
      return {
        product_id: productId,
        product_name: movement.name,
        opening_stock: opening,
        stock_in: movement.stockIn,
        stock_out: movement.stockOut,
        adjustments: movement.adjustments,
        closing_stock: closing,
        value: closing * movement.cost_price
      }
    })
  }

  static async getLowStockProducts(companyId: string, warehouseId?: string): Promise<{
    product_id: string
    product_name: string
    current_stock: number
    min_stock_level: number
    warehouse_name: string
  }[]> {
    let query = this.supabase
      .from('current_inventory')
      .select(`
        product_id,
        quantity,
        product:erp_products(name, min_stock_level),
        warehouse:warehouses(name)
      `)
      .eq('company_id', companyId)
      .lt('quantity', 'product.min_stock_level')
    
    if (warehouseId) {
      query = query.eq('warehouse_id', warehouseId)
    }
    
    const { data, error } = await query
    if (error) throw error
    
    return data?.map(inv => ({
      product_id: inv.product_id,
      product_name: (inv.product as any)?.name || 'Unknown',
      current_stock: inv.quantity,
      min_stock_level: (inv.product as any)?.min_stock_level || 0,
      warehouse_name: (inv.warehouse as any)?.name || 'Unknown'
    })) || []
  }

  static async getOutOfStockProducts(companyId: string, warehouseId?: string): Promise<{
    product_id: string
    product_name: string
    warehouse_name: string
  }[]> {
    let query = this.supabase
      .from('current_inventory')
      .select(`
        product_id,
        product:erp_products(name),
        warehouse:warehouses(name)
      `)
      .eq('company_id', companyId)
      .eq('quantity', 0)
    
    if (warehouseId) {
      query = query.eq('warehouse_id', warehouseId)
    }
    
    const { data, error } = await query
    if (error) throw error
    
    return data?.map(inv => ({
      product_id: inv.product_id,
      product_name: (inv.product as any)?.name || 'Unknown',
      warehouse_name: (inv.warehouse as any)?.name || 'Unknown'
    })) || []
  }
}

export default InventoryApi