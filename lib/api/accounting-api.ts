import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Database } from '@/types/database'

export interface ChartOfAccount {
  id: string
  company_id: string
  account_code: string
  account_name: string
  account_type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense'
  account_subtype: string
  parent_account_id?: string
  is_active: boolean
  opening_balance: number
  current_balance: number
  description?: string
  created_at: string
  updated_at: string
}

export interface JournalEntry {
  id: string
  company_id: string
  entry_number: string
  entry_date: string
  reference_type?: string
  reference_id?: string
  description: string
  total_debit: number
  total_credit: number
  status: 'draft' | 'posted' | 'reversed'
  created_by: string
  posted_at?: string
  created_at: string
  updated_at: string
  line_items: JournalEntryLineItem[]
}

export interface JournalEntryLineItem {
  id: string
  journal_entry_id: string
  account_id: string
  description?: string
  debit_amount: number
  credit_amount: number
  line_number: number
  account?: ChartOfAccount
}

export interface CreateJournalEntryData {
  company_id: string
  entry_date: string
  reference_type?: string
  reference_id?: string
  description: string
  line_items: {
    account_id: string
    description?: string
    debit_amount: number
    credit_amount: number
  }[]
}

export interface FinancialStatement {
  balance_sheet: {
    assets: {
      current_assets: AccountBalance[]
      non_current_assets: AccountBalance[]
      total_assets: number
    }
    liabilities: {
      current_liabilities: AccountBalance[]
      non_current_liabilities: AccountBalance[]
      total_liabilities: number
    }
    equity: {
      equity_accounts: AccountBalance[]
      total_equity: number
    }
  }
  profit_loss: {
    revenue: AccountBalance[]
    cost_of_goods_sold: AccountBalance[]
    gross_profit: number
    operating_expenses: AccountBalance[]
    operating_profit: number
    other_income: AccountBalance[]
    other_expenses: AccountBalance[]
    net_profit: number
  }
  cash_flow: {
    operating_activities: number
    investing_activities: number
    financing_activities: number
    net_cash_flow: number
  }
}

export interface AccountBalance {
  account_id: string
  account_code: string
  account_name: string
  balance: number
}

export interface GSTReport {
  period_from: string
  period_to: string
  sales: {
    taxable_sales: number
    igst_collected: number
    cgst_collected: number
    sgst_collected: number
    total_tax_collected: number
  }
  purchases: {
    taxable_purchases: number
    igst_paid: number
    cgst_paid: number
    sgst_paid: number
    total_tax_paid: number
  }
  net_gst_liability: number
}

export interface TrialBalance {
  account_id: string
  account_code: string
  account_name: string
  account_type: string
  debit_balance: number
  credit_balance: number
}

export class AccountingApi {
  private static supabase = createClientComponentClient<Database>()

  // Chart of Accounts Management
  static async getChartOfAccounts(companyId: string): Promise<ChartOfAccount[]> {
    const { data, error } = await this.supabase
      .from('chart_of_accounts')
      .select('*')
      .eq('company_id', companyId)
      .eq('is_active', true)
      .order('account_code')
    
    if (error) throw error
    return data || []
  }

  static async createAccount(data: {
    company_id: string
    account_code: string
    account_name: string
    account_type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense'
    account_subtype: string
    parent_account_id?: string
    opening_balance?: number
    description?: string
  }): Promise<ChartOfAccount> {
    // Check if account code already exists
    const { data: existing } = await this.supabase
      .from('chart_of_accounts')
      .select('id')
      .eq('company_id', data.company_id)
      .eq('account_code', data.account_code)
      .single()
    
    if (existing) {
      throw new Error('Account code already exists')
    }

    const { data: account, error } = await this.supabase
      .from('chart_of_accounts')
      .insert({
        ...data,
        opening_balance: data.opening_balance || 0,
        current_balance: data.opening_balance || 0,
        is_active: true
      })
      .select()
      .single()
    
    if (error) throw error

    // Create opening balance journal entry if opening balance is not zero
    if (data.opening_balance && data.opening_balance !== 0) {
      await this.createOpeningBalanceEntry(data.company_id, account.id, data.opening_balance, data.account_type)
    }

    return account
  }

  static async updateAccount(id: string, data: Partial<{
    account_name: string
    account_subtype: string
    parent_account_id: string
    description: string
    is_active: boolean
  }>): Promise<ChartOfAccount> {
    const { data: account, error } = await this.supabase
      .from('chart_of_accounts')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return account
  }

  private static async createOpeningBalanceEntry(
    companyId: string,
    accountId: string,
    amount: number,
    accountType: string
  ): Promise<void> {
    // Get or create opening balance equity account
    let { data: openingBalanceAccount } = await this.supabase
      .from('chart_of_accounts')
      .select('id')
      .eq('company_id', companyId)
      .eq('account_code', '3000')
      .single()
    
    if (!openingBalanceAccount) {
      const { data: newAccount } = await this.supabase
        .from('chart_of_accounts')
        .insert({
          company_id: companyId,
          account_code: '3000',
          account_name: 'Opening Balance Equity',
          account_type: 'equity',
          account_subtype: 'equity',
          opening_balance: 0,
          current_balance: 0,
          is_active: true
        })
        .select()
        .single()
      
      openingBalanceAccount = newAccount
    }

    // Create journal entry for opening balance
    const lineItems = []
    
    if (accountType === 'asset' || accountType === 'expense') {
      // Debit the account, credit opening balance equity
      lineItems.push(
        {
          account_id: accountId,
          description: 'Opening Balance',
          debit_amount: Math.abs(amount),
          credit_amount: 0
        },
        {
          account_id: openingBalanceAccount.id,
          description: 'Opening Balance',
          debit_amount: 0,
          credit_amount: Math.abs(amount)
        }
      )
    } else {
      // Credit the account, debit opening balance equity
      lineItems.push(
        {
          account_id: openingBalanceAccount.id,
          description: 'Opening Balance',
          debit_amount: Math.abs(amount),
          credit_amount: 0
        },
        {
          account_id: accountId,
          description: 'Opening Balance',
          debit_amount: 0,
          credit_amount: Math.abs(amount)
        }
      )
    }

    await this.createJournalEntry({
      company_id: companyId,
      entry_date: new Date().toISOString().split('T')[0],
      description: 'Opening Balance Entry',
      reference_type: 'opening_balance',
      line_items: lineItems
    })
  }

  // Journal Entry Management
  static async getJournalEntries(
    companyId: string,
    filters?: {
      date_from?: string
      date_to?: string
      account_id?: string
      status?: string
      limit?: number
      offset?: number
    }
  ): Promise<{ data: JournalEntry[], count: number }> {
    let query = this.supabase
      .from('journal_entries')
      .select(`
        *,
        line_items:journal_entry_line_items(
          *,
          account:chart_of_accounts(*)
        )
      `, { count: 'exact' })
      .eq('company_id', companyId)
    
    if (filters?.date_from) {
      query = query.gte('entry_date', filters.date_from)
    }
    
    if (filters?.date_to) {
      query = query.lte('entry_date', filters.date_to)
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
    
    query = query.order('entry_date', { ascending: false })
    
    const { data, error, count } = await query
    
    if (error) throw error
    return { data: data || [], count: count || 0 }
  }

  static async createJournalEntry(data: CreateJournalEntryData): Promise<JournalEntry> {
    // Validate that debits equal credits
    const totalDebits = data.line_items.reduce((sum, item) => sum + item.debit_amount, 0)
    const totalCredits = data.line_items.reduce((sum, item) => sum + item.credit_amount, 0)
    
    if (Math.abs(totalDebits - totalCredits) > 0.01) {
      throw new Error('Total debits must equal total credits')
    }

    // Generate entry number
    const { count } = await this.supabase
      .from('journal_entries')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', data.company_id)
    
    const entryNumber = `JE${String((count || 0) + 1).padStart(6, '0')}`

    // Create journal entry
    const { data: entry, error: entryError } = await this.supabase
      .from('journal_entries')
      .insert({
        company_id: data.company_id,
        entry_number: entryNumber,
        entry_date: data.entry_date,
        reference_type: data.reference_type,
        reference_id: data.reference_id,
        description: data.description,
        total_debit: totalDebits,
        total_credit: totalCredits,
        status: 'draft',
        created_by: 'user'
      })
      .select()
      .single()
    
    if (entryError) throw entryError

    // Create line items
    const lineItems = data.line_items.map((item, index) => ({
      journal_entry_id: entry.id,
      account_id: item.account_id,
      description: item.description,
      debit_amount: item.debit_amount,
      credit_amount: item.credit_amount,
      line_number: index + 1
    }))

    const { error: lineItemsError } = await this.supabase
      .from('journal_entry_line_items')
      .insert(lineItems)
    
    if (lineItemsError) throw lineItemsError

    return this.getJournalEntry(entry.id)
  }

  static async getJournalEntry(id: string): Promise<JournalEntry> {
    const { data, error } = await this.supabase
      .from('journal_entries')
      .select(`
        *,
        line_items:journal_entry_line_items(
          *,
          account:chart_of_accounts(*)
        )
      `)
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  }

  static async postJournalEntry(id: string): Promise<JournalEntry> {
    // Get journal entry with line items
    const entry = await this.getJournalEntry(id)
    
    if (entry.status !== 'draft') {
      throw new Error('Only draft entries can be posted')
    }

    // Update account balances
    for (const lineItem of entry.line_items) {
      const { data: account } = await this.supabase
        .from('chart_of_accounts')
        .select('current_balance, account_type')
        .eq('id', lineItem.account_id)
        .single()
      
      if (account) {
        let balanceChange = 0
        
        // Calculate balance change based on account type and normal balance
        if (account.account_type === 'asset' || account.account_type === 'expense') {
          // Normal debit balance accounts
          balanceChange = lineItem.debit_amount - lineItem.credit_amount
        } else {
          // Normal credit balance accounts (liability, equity, revenue)
          balanceChange = lineItem.credit_amount - lineItem.debit_amount
        }
        
        await this.supabase
          .from('chart_of_accounts')
          .update({
            current_balance: account.current_balance + balanceChange,
            updated_at: new Date().toISOString()
          })
          .eq('id', lineItem.account_id)
      }
    }

    // Update journal entry status
    const { data: updatedEntry, error } = await this.supabase
      .from('journal_entries')
      .update({
        status: 'posted',
        posted_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    
    return this.getJournalEntry(id)
  }

  static async reverseJournalEntry(id: string, reverseDate: string, reason: string): Promise<JournalEntry> {
    const originalEntry = await this.getJournalEntry(id)
    
    if (originalEntry.status !== 'posted') {
      throw new Error('Only posted entries can be reversed')
    }

    // Create reversing entry
    const reversingLineItems = originalEntry.line_items.map(item => ({
      account_id: item.account_id,
      description: `Reversal: ${item.description}`,
      debit_amount: item.credit_amount, // Swap debits and credits
      credit_amount: item.debit_amount
    }))

    const reversingEntry = await this.createJournalEntry({
      company_id: originalEntry.company_id,
      entry_date: reverseDate,
      description: `Reversal: ${originalEntry.description} - ${reason}`,
      reference_type: 'reversal',
      reference_id: originalEntry.id,
      line_items: reversingLineItems
    })

    // Post the reversing entry
    await this.postJournalEntry(reversingEntry.id)

    // Mark original entry as reversed
    await this.supabase
      .from('journal_entries')
      .update({ status: 'reversed' })
      .eq('id', id)

    return reversingEntry
  }

  // Financial Reports
  static async getTrialBalance(companyId: string, asOfDate?: string): Promise<TrialBalance[]> {
    const { data: accounts, error } = await this.supabase
      .from('chart_of_accounts')
      .select('id, account_code, account_name, account_type, current_balance')
      .eq('company_id', companyId)
      .eq('is_active', true)
      .order('account_code')
    
    if (error) throw error

    return accounts?.map(account => {
      const isNormalDebitAccount = account.account_type === 'asset' || account.account_type === 'expense'
      const balance = account.current_balance
      
      return {
        account_id: account.id,
        account_code: account.account_code,
        account_name: account.account_name,
        account_type: account.account_type,
        debit_balance: (isNormalDebitAccount && balance > 0) || (!isNormalDebitAccount && balance < 0) ? Math.abs(balance) : 0,
        credit_balance: (!isNormalDebitAccount && balance > 0) || (isNormalDebitAccount && balance < 0) ? Math.abs(balance) : 0
      }
    }) || []
  }

  static async getBalanceSheet(companyId: string, asOfDate?: string): Promise<FinancialStatement['balance_sheet']> {
    const { data: accounts, error } = await this.supabase
      .from('chart_of_accounts')
      .select('id, account_code, account_name, account_type, account_subtype, current_balance')
      .eq('company_id', companyId)
      .eq('is_active', true)
      .in('account_type', ['asset', 'liability', 'equity'])
      .order('account_code')
    
    if (error) throw error

    const assets = accounts?.filter(acc => acc.account_type === 'asset') || []
    const liabilities = accounts?.filter(acc => acc.account_type === 'liability') || []
    const equity = accounts?.filter(acc => acc.account_type === 'equity') || []

    const currentAssets = assets.filter(acc => acc.account_subtype?.includes('current'))
    const nonCurrentAssets = assets.filter(acc => !acc.account_subtype?.includes('current'))
    const currentLiabilities = liabilities.filter(acc => acc.account_subtype?.includes('current'))
    const nonCurrentLiabilities = liabilities.filter(acc => !acc.account_subtype?.includes('current'))

    const mapToAccountBalance = (accounts: any[]): AccountBalance[] => 
      accounts.map(acc => ({
        account_id: acc.id,
        account_code: acc.account_code,
        account_name: acc.account_name,
        balance: acc.current_balance
      }))

    return {
      assets: {
        current_assets: mapToAccountBalance(currentAssets),
        non_current_assets: mapToAccountBalance(nonCurrentAssets),
        total_assets: assets.reduce((sum, acc) => sum + acc.current_balance, 0)
      },
      liabilities: {
        current_liabilities: mapToAccountBalance(currentLiabilities),
        non_current_liabilities: mapToAccountBalance(nonCurrentLiabilities),
        total_liabilities: liabilities.reduce((sum, acc) => sum + acc.current_balance, 0)
      },
      equity: {
        equity_accounts: mapToAccountBalance(equity),
        total_equity: equity.reduce((sum, acc) => sum + acc.current_balance, 0)
      }
    }
  }

  static async getProfitLossStatement(
    companyId: string,
    dateFrom: string,
    dateTo: string
  ): Promise<FinancialStatement['profit_loss']> {
    const { data: accounts, error } = await this.supabase
      .from('chart_of_accounts')
      .select('id, account_code, account_name, account_type, account_subtype, current_balance')
      .eq('company_id', companyId)
      .eq('is_active', true)
      .in('account_type', ['revenue', 'expense'])
      .order('account_code')
    
    if (error) throw error

    const revenue = accounts?.filter(acc => acc.account_type === 'revenue') || []
    const expenses = accounts?.filter(acc => acc.account_type === 'expense') || []

    const costOfGoodsSold = expenses.filter(acc => acc.account_subtype?.includes('cogs'))
    const operatingExpenses = expenses.filter(acc => acc.account_subtype?.includes('operating'))
    const otherExpenses = expenses.filter(acc => !acc.account_subtype?.includes('cogs') && !acc.account_subtype?.includes('operating'))

    const mapToAccountBalance = (accounts: any[]): AccountBalance[] => 
      accounts.map(acc => ({
        account_id: acc.id,
        account_code: acc.account_code,
        account_name: acc.account_name,
        balance: Math.abs(acc.current_balance) // Show as positive amounts
      }))

    const totalRevenue = revenue.reduce((sum, acc) => sum + Math.abs(acc.current_balance), 0)
    const totalCOGS = costOfGoodsSold.reduce((sum, acc) => sum + Math.abs(acc.current_balance), 0)
    const totalOperatingExpenses = operatingExpenses.reduce((sum, acc) => sum + Math.abs(acc.current_balance), 0)
    const totalOtherExpenses = otherExpenses.reduce((sum, acc) => sum + Math.abs(acc.current_balance), 0)

    const grossProfit = totalRevenue - totalCOGS
    const operatingProfit = grossProfit - totalOperatingExpenses
    const netProfit = operatingProfit - totalOtherExpenses

    return {
      revenue: mapToAccountBalance(revenue),
      cost_of_goods_sold: mapToAccountBalance(costOfGoodsSold),
      gross_profit: grossProfit,
      operating_expenses: mapToAccountBalance(operatingExpenses),
      operating_profit: operatingProfit,
      other_income: [], // Would need separate classification
      other_expenses: mapToAccountBalance(otherExpenses),
      net_profit: netProfit
    }
  }

  // GST Reports
  static async getGSTReport(companyId: string, dateFrom: string, dateTo: string): Promise<GSTReport> {
    // Get sales data from invoices
    const { data: salesData, error: salesError } = await this.supabase
      .from('invoices')
      .select('subtotal, tax_amount')
      .eq('company_id', companyId)
      .gte('invoice_date', dateFrom)
      .lte('invoice_date', dateTo)
      .eq('status', 'paid')
    
    if (salesError) throw salesError

    // Get purchase data from purchase orders (simplified)
    const { data: purchaseData, error: purchaseError } = await this.supabase
      .from('purchase_orders')
      .select('subtotal, tax_amount')
      .eq('company_id', companyId)
      .gte('order_date', dateFrom)
      .lte('order_date', dateTo)
      .in('status', ['received', 'partially_received'])
    
    if (purchaseError) throw purchaseError

    const totalSales = salesData?.reduce((sum, inv) => sum + (inv.subtotal || 0), 0) || 0
    const totalSalesTax = salesData?.reduce((sum, inv) => sum + (inv.tax_amount || 0), 0) || 0
    
    const totalPurchases = purchaseData?.reduce((sum, po) => sum + (po.subtotal || 0), 0) || 0
    const totalPurchaseTax = purchaseData?.reduce((sum, po) => sum + (po.tax_amount || 0), 0) || 0

    // Simplified GST calculation (assuming CGST + SGST = 18%, IGST = 18%)
    const cgstCollected = totalSalesTax * 0.5 // Assuming 50% is CGST
    const sgstCollected = totalSalesTax * 0.5 // Assuming 50% is SGST
    const cgstPaid = totalPurchaseTax * 0.5
    const sgstPaid = totalPurchaseTax * 0.5

    return {
      period_from: dateFrom,
      period_to: dateTo,
      sales: {
        taxable_sales: totalSales,
        igst_collected: 0, // Would need state-wise calculation
        cgst_collected: cgstCollected,
        sgst_collected: sgstCollected,
        total_tax_collected: totalSalesTax
      },
      purchases: {
        taxable_purchases: totalPurchases,
        igst_paid: 0,
        cgst_paid: cgstPaid,
        sgst_paid: sgstPaid,
        total_tax_paid: totalPurchaseTax
      },
      net_gst_liability: totalSalesTax - totalPurchaseTax
    }
  }

  // Automated Journal Entries
  static async createSalesJournalEntry(invoiceId: string): Promise<JournalEntry> {
    // Get invoice details
    const { data: invoice, error } = await this.supabase
      .from('invoices')
      .select('*, customer:customers(*), items:invoice_items(*, product:erp_products(*))')
      .eq('id', invoiceId)
      .single()
    
    if (error) throw error
    if (!invoice) throw new Error('Invoice not found')

    // Get default accounts (would be configurable in a real system)
    const accountsReceivable = await this.getDefaultAccount(invoice.company_id, 'accounts_receivable')
    const salesRevenue = await this.getDefaultAccount(invoice.company_id, 'sales_revenue')
    const salesTax = await this.getDefaultAccount(invoice.company_id, 'sales_tax_payable')

    const lineItems = [
      {
        account_id: accountsReceivable.id,
        description: `Sales to ${invoice.customer?.name}`,
        debit_amount: invoice.total_amount,
        credit_amount: 0
      },
      {
        account_id: salesRevenue.id,
        description: `Sales to ${invoice.customer?.name}`,
        debit_amount: 0,
        credit_amount: invoice.subtotal
      }
    ]

    if (invoice.tax_amount > 0) {
      lineItems.push({
        account_id: salesTax.id,
        description: `Sales tax on invoice ${invoice.invoice_number}`,
        debit_amount: 0,
        credit_amount: invoice.tax_amount
      })
    }

    return this.createJournalEntry({
      company_id: invoice.company_id,
      entry_date: invoice.invoice_date,
      description: `Sales Invoice ${invoice.invoice_number}`,
      reference_type: 'invoice',
      reference_id: invoiceId,
      line_items: lineItems
    })
  }

  private static async getDefaultAccount(companyId: string, accountType: string): Promise<ChartOfAccount> {
    const accountCodes: { [key: string]: string } = {
      accounts_receivable: '1200',
      sales_revenue: '4000',
      sales_tax_payable: '2300',
      accounts_payable: '2100',
      inventory: '1300',
      cost_of_goods_sold: '5000'
    }

    const { data: account, error } = await this.supabase
      .from('chart_of_accounts')
      .select('*')
      .eq('company_id', companyId)
      .eq('account_code', accountCodes[accountType])
      .single()
    
    if (error || !account) {
      throw new Error(`Default account for ${accountType} not found. Please set up chart of accounts.`)
    }

    return account
  }
}

export default AccountingApi