-- Chart of Accounts table
CREATE TABLE IF NOT EXISTS chart_of_accounts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    account_code VARCHAR(20) NOT NULL,
    account_name VARCHAR(255) NOT NULL,
    account_type VARCHAR(20) NOT NULL CHECK (account_type IN ('asset', 'liability', 'equity', 'revenue', 'expense')),
    account_subtype VARCHAR(50) NOT NULL,
    parent_account_id UUID REFERENCES chart_of_accounts(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT true,
    opening_balance DECIMAL(15,2) DEFAULT 0,
    current_balance DECIMAL(15,2) DEFAULT 0,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(company_id, account_code)
);

-- Journal Entries table
CREATE TABLE IF NOT EXISTS journal_entries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    entry_number VARCHAR(50) NOT NULL,
    entry_date DATE NOT NULL,
    reference_type VARCHAR(50),
    reference_id UUID,
    description TEXT NOT NULL,
    total_debit DECIMAL(15,2) NOT NULL DEFAULT 0,
    total_credit DECIMAL(15,2) NOT NULL DEFAULT 0,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'posted', 'reversed')),
    created_by VARCHAR(255),
    posted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(company_id, entry_number)
);

-- Journal Entry Line Items table
CREATE TABLE IF NOT EXISTS journal_entry_line_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    journal_entry_id UUID NOT NULL REFERENCES journal_entries(id) ON DELETE CASCADE,
    account_id UUID NOT NULL REFERENCES chart_of_accounts(id) ON DELETE RESTRICT,
    description TEXT,
    debit_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    credit_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    line_number INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CHECK (debit_amount >= 0 AND credit_amount >= 0),
    CHECK (NOT (debit_amount > 0 AND credit_amount > 0))
);

-- Budget table
CREATE TABLE IF NOT EXISTS budgets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    budget_name VARCHAR(255) NOT NULL,
    budget_year INTEGER NOT NULL,
    budget_type VARCHAR(20) DEFAULT 'annual' CHECK (budget_type IN ('annual', 'quarterly', 'monthly')),
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'approved', 'active', 'closed')),
    total_revenue_budget DECIMAL(15,2) DEFAULT 0,
    total_expense_budget DECIMAL(15,2) DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(company_id, budget_name, budget_year)
);

-- Budget Line Items table
CREATE TABLE IF NOT EXISTS budget_line_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    budget_id UUID NOT NULL REFERENCES budgets(id) ON DELETE CASCADE,
    account_id UUID NOT NULL REFERENCES chart_of_accounts(id) ON DELETE CASCADE,
    period_type VARCHAR(20) DEFAULT 'monthly' CHECK (period_type IN ('monthly', 'quarterly', 'annual')),
    period_number INTEGER, -- 1-12 for monthly, 1-4 for quarterly, 1 for annual
    budgeted_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    actual_amount DECIMAL(15,2) DEFAULT 0,
    variance_amount DECIMAL(15,2) GENERATED ALWAYS AS (actual_amount - budgeted_amount) STORED,
    variance_percentage DECIMAL(5,2) GENERATED ALWAYS AS (
        CASE 
            WHEN budgeted_amount = 0 THEN 0
            ELSE ROUND(((actual_amount - budgeted_amount) / ABS(budgeted_amount)) * 100, 2)
        END
    ) STORED,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tax Rates table
CREATE TABLE IF NOT EXISTS tax_rates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    tax_name VARCHAR(100) NOT NULL,
    tax_type VARCHAR(50) NOT NULL, -- 'GST', 'VAT', 'Sales Tax', etc.
    tax_rate DECIMAL(5,2) NOT NULL,
    tax_account_id UUID REFERENCES chart_of_accounts(id),
    is_compound BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    effective_from DATE,
    effective_to DATE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Financial Periods table
CREATE TABLE IF NOT EXISTS financial_periods (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    period_name VARCHAR(100) NOT NULL,
    period_type VARCHAR(20) NOT NULL CHECK (period_type IN ('monthly', 'quarterly', 'annual')),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_closed BOOLEAN DEFAULT false,
    closed_at TIMESTAMP WITH TIME ZONE,
    closed_by VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(company_id, period_name),
    CHECK (end_date > start_date)
);

-- Bank Accounts table
CREATE TABLE IF NOT EXISTS bank_accounts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    account_name VARCHAR(255) NOT NULL,
    bank_name VARCHAR(255) NOT NULL,
    account_number VARCHAR(50) NOT NULL,
    account_type VARCHAR(50) DEFAULT 'checking',
    routing_number VARCHAR(50),
    swift_code VARCHAR(20),
    iban VARCHAR(50),
    currency VARCHAR(3) DEFAULT 'INR',
    opening_balance DECIMAL(15,2) DEFAULT 0,
    current_balance DECIMAL(15,2) DEFAULT 0,
    chart_account_id UUID REFERENCES chart_of_accounts(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bank Transactions table
CREATE TABLE IF NOT EXISTS bank_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    bank_account_id UUID NOT NULL REFERENCES bank_accounts(id) ON DELETE CASCADE,
    transaction_date DATE NOT NULL,
    transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('debit', 'credit')),
    amount DECIMAL(15,2) NOT NULL,
    balance_after DECIMAL(15,2),
    reference_number VARCHAR(100),
    description TEXT,
    payee_payer VARCHAR(255),
    category VARCHAR(100),
    is_reconciled BOOLEAN DEFAULT false,
    reconciled_at TIMESTAMP WITH TIME ZONE,
    journal_entry_id UUID REFERENCES journal_entries(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_chart_of_accounts_company_id ON chart_of_accounts(company_id);
CREATE INDEX IF NOT EXISTS idx_chart_of_accounts_account_type ON chart_of_accounts(account_type);
CREATE INDEX IF NOT EXISTS idx_chart_of_accounts_parent_account_id ON chart_of_accounts(parent_account_id);

CREATE INDEX IF NOT EXISTS idx_journal_entries_company_id ON journal_entries(company_id);
CREATE INDEX IF NOT EXISTS idx_journal_entries_entry_date ON journal_entries(entry_date);
CREATE INDEX IF NOT EXISTS idx_journal_entries_status ON journal_entries(status);
CREATE INDEX IF NOT EXISTS idx_journal_entries_reference ON journal_entries(reference_type, reference_id);

CREATE INDEX IF NOT EXISTS idx_journal_entry_line_items_journal_entry_id ON journal_entry_line_items(journal_entry_id);
CREATE INDEX IF NOT EXISTS idx_journal_entry_line_items_account_id ON journal_entry_line_items(account_id);

CREATE INDEX IF NOT EXISTS idx_budgets_company_id ON budgets(company_id);
CREATE INDEX IF NOT EXISTS idx_budget_line_items_budget_id ON budget_line_items(budget_id);
CREATE INDEX IF NOT EXISTS idx_budget_line_items_account_id ON budget_line_items(account_id);

CREATE INDEX IF NOT EXISTS idx_tax_rates_company_id ON tax_rates(company_id);
CREATE INDEX IF NOT EXISTS idx_financial_periods_company_id ON financial_periods(company_id);
CREATE INDEX IF NOT EXISTS idx_bank_accounts_company_id ON bank_accounts(company_id);
CREATE INDEX IF NOT EXISTS idx_bank_transactions_bank_account_id ON bank_transactions(bank_account_id);
CREATE INDEX IF NOT EXISTS idx_bank_transactions_transaction_date ON bank_transactions(transaction_date);

-- Enable Row Level Security
ALTER TABLE chart_of_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entry_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_transactions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their company's chart of accounts" ON chart_of_accounts
    FOR SELECT USING (company_id IN (
        SELECT c.id FROM companies c
        JOIN auth.users u ON u.id = auth.uid()
        WHERE c.created_by = u.email OR c.id = ANY(
            SELECT company_id FROM employees WHERE user_id = u.id
        )
    ));

CREATE POLICY "Users can manage their company's chart of accounts" ON chart_of_accounts
    FOR ALL USING (company_id IN (
        SELECT c.id FROM companies c
        JOIN auth.users u ON u.id = auth.uid()
        WHERE c.created_by = u.email OR c.id = ANY(
            SELECT company_id FROM employees WHERE user_id = u.id
        )
    ));

CREATE POLICY "Users can view their company's journal entries" ON journal_entries
    FOR SELECT USING (company_id IN (
        SELECT c.id FROM companies c
        JOIN auth.users u ON u.id = auth.uid()
        WHERE c.created_by = u.email OR c.id = ANY(
            SELECT company_id FROM employees WHERE user_id = u.id
        )
    ));

CREATE POLICY "Users can manage their company's journal entries" ON journal_entries
    FOR ALL USING (company_id IN (
        SELECT c.id FROM companies c
        JOIN auth.users u ON u.id = auth.uid()
        WHERE c.created_by = u.email OR c.id = ANY(
            SELECT company_id FROM employees WHERE user_id = u.id
        )
    ));

CREATE POLICY "Users can view journal entry line items" ON journal_entry_line_items
    FOR SELECT USING (journal_entry_id IN (
        SELECT id FROM journal_entries WHERE company_id IN (
            SELECT c.id FROM companies c
            JOIN auth.users u ON u.id = auth.uid()
            WHERE c.created_by = u.email OR c.id = ANY(
                SELECT company_id FROM employees WHERE user_id = u.id
            )
        )
    ));

CREATE POLICY "Users can manage journal entry line items" ON journal_entry_line_items
    FOR ALL USING (journal_entry_id IN (
        SELECT id FROM journal_entries WHERE company_id IN (
            SELECT c.id FROM companies c
            JOIN auth.users u ON u.id = auth.uid()
            WHERE c.created_by = u.email OR c.id = ANY(
                SELECT company_id FROM employees WHERE user_id = u.id
            )
        )
    ));

-- Similar policies for other tables
CREATE POLICY "Users can view their company's budgets" ON budgets
    FOR SELECT USING (company_id IN (
        SELECT c.id FROM companies c
        JOIN auth.users u ON u.id = auth.uid()
        WHERE c.created_by = u.email OR c.id = ANY(
            SELECT company_id FROM employees WHERE user_id = u.id
        )
    ));

CREATE POLICY "Users can manage their company's budgets" ON budgets
    FOR ALL USING (company_id IN (
        SELECT c.id FROM companies c
        JOIN auth.users u ON u.id = auth.uid()
        WHERE c.created_by = u.email OR c.id = ANY(
            SELECT company_id FROM employees WHERE user_id = u.id
        )
    ));

CREATE POLICY "Users can view their company's tax rates" ON tax_rates
    FOR SELECT USING (company_id IN (
        SELECT c.id FROM companies c
        JOIN auth.users u ON u.id = auth.uid()
        WHERE c.created_by = u.email OR c.id = ANY(
            SELECT company_id FROM employees WHERE user_id = u.id
        )
    ));

CREATE POLICY "Users can manage their company's tax rates" ON tax_rates
    FOR ALL USING (company_id IN (
        SELECT c.id FROM companies c
        JOIN auth.users u ON u.id = auth.uid()
        WHERE c.created_by = u.email OR c.id = ANY(
            SELECT company_id FROM employees WHERE user_id = u.id
        )
    ));

CREATE POLICY "Users can view their company's financial periods" ON financial_periods
    FOR SELECT USING (company_id IN (
        SELECT c.id FROM companies c
        JOIN auth.users u ON u.id = auth.uid()
        WHERE c.created_by = u.email OR c.id = ANY(
            SELECT company_id FROM employees WHERE user_id = u.id
        )
    ));

CREATE POLICY "Users can manage their company's financial periods" ON financial_periods
    FOR ALL USING (company_id IN (
        SELECT c.id FROM companies c
        JOIN auth.users u ON u.id = auth.uid()
        WHERE c.created_by = u.email OR c.id = ANY(
            SELECT company_id FROM employees WHERE user_id = u.id
        )
    ));

CREATE POLICY "Users can view their company's bank accounts" ON bank_accounts
    FOR SELECT USING (company_id IN (
        SELECT c.id FROM companies c
        JOIN auth.users u ON u.id = auth.uid()
        WHERE c.created_by = u.email OR c.id = ANY(
            SELECT company_id FROM employees WHERE user_id = u.id
        )
    ));

CREATE POLICY "Users can manage their company's bank accounts" ON bank_accounts
    FOR ALL USING (company_id IN (
        SELECT c.id FROM companies c
        JOIN auth.users u ON u.id = auth.uid()
        WHERE c.created_by = u.email OR c.id = ANY(
            SELECT company_id FROM employees WHERE user_id = u.id
        )
    ));

-- Insert default chart of accounts for Indian companies
INSERT INTO chart_of_accounts (company_id, account_code, account_name, account_type, account_subtype, opening_balance, current_balance) 
SELECT 
    c.id,
    accounts.account_code,
    accounts.account_name,
    accounts.account_type,
    accounts.account_subtype,
    0,
    0
FROM companies c
CROSS JOIN (
    VALUES 
    -- Assets
    ('1000', 'Cash and Cash Equivalents', 'asset', 'current_asset'),
    ('1100', 'Petty Cash', 'asset', 'current_asset'),
    ('1200', 'Accounts Receivable', 'asset', 'current_asset'),
    ('1300', 'Inventory', 'asset', 'current_asset'),
    ('1400', 'Prepaid Expenses', 'asset', 'current_asset'),
    ('1500', 'Other Current Assets', 'asset', 'current_asset'),
    ('1600', 'Property, Plant & Equipment', 'asset', 'non_current_asset'),
    ('1700', 'Accumulated Depreciation', 'asset', 'non_current_asset'),
    ('1800', 'Intangible Assets', 'asset', 'non_current_asset'),
    ('1900', 'Other Non-Current Assets', 'asset', 'non_current_asset'),
    
    -- Liabilities
    ('2000', 'Accounts Payable', 'liability', 'current_liability'),
    ('2100', 'Short-term Loans', 'liability', 'current_liability'),
    ('2200', 'Accrued Expenses', 'liability', 'current_liability'),
    ('2300', 'GST Payable', 'liability', 'current_liability'),
    ('2400', 'TDS Payable', 'liability', 'current_liability'),
    ('2500', 'Other Current Liabilities', 'liability', 'current_liability'),
    ('2600', 'Long-term Loans', 'liability', 'non_current_liability'),
    ('2700', 'Other Non-Current Liabilities', 'liability', 'non_current_liability'),
    
    -- Equity
    ('3000', 'Share Capital', 'equity', 'equity'),
    ('3100', 'Retained Earnings', 'equity', 'equity'),
    ('3200', 'Current Year Earnings', 'equity', 'equity'),
    ('3300', 'Owner''s Equity', 'equity', 'equity'),
    
    -- Revenue
    ('4000', 'Sales Revenue', 'revenue', 'operating_revenue'),
    ('4100', 'Service Revenue', 'revenue', 'operating_revenue'),
    ('4200', 'Other Operating Revenue', 'revenue', 'operating_revenue'),
    ('4300', 'Non-Operating Revenue', 'revenue', 'non_operating_revenue'),
    ('4400', 'Interest Income', 'revenue', 'non_operating_revenue'),
    
    -- Expenses
    ('5000', 'Cost of Goods Sold', 'expense', 'cogs'),
    ('5100', 'Purchase Returns', 'expense', 'cogs'),
    ('5200', 'Direct Labor', 'expense', 'cogs'),
    ('5300', 'Manufacturing Overhead', 'expense', 'cogs'),
    ('6000', 'Salaries and Wages', 'expense', 'operating_expense'),
    ('6100', 'Rent Expense', 'expense', 'operating_expense'),
    ('6200', 'Utilities Expense', 'expense', 'operating_expense'),
    ('6300', 'Office Supplies', 'expense', 'operating_expense'),
    ('6400', 'Marketing and Advertising', 'expense', 'operating_expense'),
    ('6500', 'Professional Fees', 'expense', 'operating_expense'),
    ('6600', 'Insurance Expense', 'expense', 'operating_expense'),
    ('6700', 'Depreciation Expense', 'expense', 'operating_expense'),
    ('6800', 'Travel and Entertainment', 'expense', 'operating_expense'),
    ('6900', 'Other Operating Expenses', 'expense', 'operating_expense'),
    ('7000', 'Interest Expense', 'expense', 'non_operating_expense'),
    ('7100', 'Bank Charges', 'expense', 'non_operating_expense'),
    ('7200', 'Other Non-Operating Expenses', 'expense', 'non_operating_expense')
) AS accounts(account_code, account_name, account_type, account_subtype)
WHERE NOT EXISTS (
    SELECT 1 FROM chart_of_accounts coa 
    WHERE coa.company_id = c.id AND coa.account_code = accounts.account_code
);

-- Create triggers for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_chart_of_accounts_updated_at BEFORE UPDATE ON chart_of_accounts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_journal_entries_updated_at BEFORE UPDATE ON journal_entries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_budgets_updated_at BEFORE UPDATE ON budgets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_budget_line_items_updated_at BEFORE UPDATE ON budget_line_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tax_rates_updated_at BEFORE UPDATE ON tax_rates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_financial_periods_updated_at BEFORE UPDATE ON financial_periods
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bank_accounts_updated_at BEFORE UPDATE ON bank_accounts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bank_transactions_updated_at BEFORE UPDATE ON bank_transactions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();