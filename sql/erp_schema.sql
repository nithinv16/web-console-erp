-- Enhanced ERP Database Schema for DukaaOn
-- Phase 1: Core ERP Foundation

-- Companies table (Multi-tenant support)
CREATE TABLE IF NOT EXISTS companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    registration_number VARCHAR(100),
    gst_number VARCHAR(15),
    pan_number VARCHAR(10),
    address JSONB,
    phone VARCHAR(20),
    email VARCHAR(255),
    website VARCHAR(255),
    logo_url TEXT,
    subscription_plan VARCHAR(50) DEFAULT 'basic',
    subscription_status VARCHAR(20) DEFAULT 'active',
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Departments table
CREATE TABLE IF NOT EXISTS departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    manager_id UUID,
    budget DECIMAL(15,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enhanced employees table
CREATE TABLE IF NOT EXISTS employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    department_id UUID REFERENCES departments(id),
    employee_code VARCHAR(50) UNIQUE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(20),
    position VARCHAR(100),
    salary DECIMAL(12,2),
    hire_date DATE,
    status VARCHAR(20) DEFAULT 'active',
    permissions JSONB DEFAULT '{}',
    address JSONB,
    emergency_contact JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enhanced suppliers table
CREATE TABLE IF NOT EXISTS suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    supplier_code VARCHAR(50) UNIQUE,
    name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(20),
    address JSONB,
    gst_number VARCHAR(15),
    pan_number VARCHAR(10),
    payment_terms VARCHAR(100),
    credit_limit DECIMAL(15,2),
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    status VARCHAR(20) DEFAULT 'active',
    bank_details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enhanced customers table
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    customer_code VARCHAR(50) UNIQUE,
    name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(20),
    address JSONB,
    gst_number VARCHAR(15),
    pan_number VARCHAR(10),
    customer_type VARCHAR(50) DEFAULT 'regular',
    credit_limit DECIMAL(15,2),
    payment_terms VARCHAR(100),
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Warehouses table
CREATE TABLE IF NOT EXISTS warehouses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE,
    address JSONB,
    manager_id UUID REFERENCES employees(id),
    capacity DECIMAL(12,2),
    current_utilization DECIMAL(12,2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Product categories table
CREATE TABLE IF NOT EXISTS product_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    parent_id UUID REFERENCES product_categories(id),
    image_url TEXT,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enhanced products table
CREATE TABLE IF NOT EXISTS erp_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    category_id UUID REFERENCES product_categories(id),
    sku VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    brand VARCHAR(100),
    unit_of_measure VARCHAR(50),
    weight DECIMAL(10,3),
    dimensions JSONB,
    cost_price DECIMAL(12,2),
    selling_price DECIMAL(12,2),
    mrp DECIMAL(12,2),
    tax_rate DECIMAL(5,2),
    hsn_code VARCHAR(20),
    barcode VARCHAR(100),
    min_stock_level INTEGER DEFAULT 0,
    max_stock_level INTEGER,
    reorder_point INTEGER,
    lead_time_days INTEGER,
    status VARCHAR(20) DEFAULT 'active',
    images JSONB DEFAULT '[]',
    attributes JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inventory transactions table
CREATE TABLE IF NOT EXISTS inventory_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    product_id UUID REFERENCES erp_products(id) ON DELETE CASCADE,
    warehouse_id UUID REFERENCES warehouses(id) ON DELETE CASCADE,
    transaction_type VARCHAR(50) NOT NULL, -- 'in', 'out', 'transfer', 'adjustment'
    quantity INTEGER NOT NULL,
    unit_cost DECIMAL(12,2),
    reference_type VARCHAR(50), -- 'purchase', 'sale', 'transfer', 'adjustment'
    reference_id UUID,
    batch_number VARCHAR(100),
    expiry_date DATE,
    notes TEXT,
    created_by UUID REFERENCES employees(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Current inventory view
CREATE TABLE IF NOT EXISTS current_inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    product_id UUID REFERENCES erp_products(id) ON DELETE CASCADE,
    warehouse_id UUID REFERENCES warehouses(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 0,
    reserved_quantity INTEGER DEFAULT 0,
    available_quantity INTEGER GENERATED ALWAYS AS (quantity - reserved_quantity) STORED,
    average_cost DECIMAL(12,2),
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(product_id, warehouse_id)
);

-- Purchase orders table
CREATE TABLE IF NOT EXISTS purchase_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    po_number VARCHAR(100) UNIQUE NOT NULL,
    supplier_id UUID REFERENCES suppliers(id),
    warehouse_id UUID REFERENCES warehouses(id),
    order_date DATE NOT NULL,
    expected_delivery_date DATE,
    status VARCHAR(50) DEFAULT 'draft', -- 'draft', 'sent', 'confirmed', 'partial', 'received', 'cancelled'
    subtotal DECIMAL(15,2),
    tax_amount DECIMAL(15,2),
    total_amount DECIMAL(15,2),
    payment_terms VARCHAR(100),
    notes TEXT,
    created_by UUID REFERENCES employees(id),
    approved_by UUID REFERENCES employees(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Purchase order items table
CREATE TABLE IF NOT EXISTS purchase_order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    purchase_order_id UUID REFERENCES purchase_orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES erp_products(id),
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(12,2) NOT NULL,
    tax_rate DECIMAL(5,2),
    tax_amount DECIMAL(12,2),
    total_amount DECIMAL(12,2),
    received_quantity INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sales orders table
CREATE TABLE IF NOT EXISTS sales_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    so_number VARCHAR(100) UNIQUE NOT NULL,
    customer_id UUID REFERENCES customers(id),
    warehouse_id UUID REFERENCES warehouses(id),
    order_date DATE NOT NULL,
    delivery_date DATE,
    status VARCHAR(50) DEFAULT 'draft', -- 'draft', 'confirmed', 'partial', 'shipped', 'delivered', 'cancelled'
    subtotal DECIMAL(15,2),
    tax_amount DECIMAL(15,2),
    total_amount DECIMAL(15,2),
    payment_terms VARCHAR(100),
    shipping_address JSONB,
    notes TEXT,
    created_by UUID REFERENCES employees(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sales order items table
CREATE TABLE IF NOT EXISTS sales_order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sales_order_id UUID REFERENCES sales_orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES erp_products(id),
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(12,2) NOT NULL,
    tax_rate DECIMAL(5,2),
    tax_amount DECIMAL(12,2),
    total_amount DECIMAL(12,2),
    shipped_quantity INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Invoices table
CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    invoice_number VARCHAR(100) UNIQUE NOT NULL,
    invoice_type VARCHAR(50) NOT NULL, -- 'sales', 'purchase'
    customer_id UUID REFERENCES customers(id),
    supplier_id UUID REFERENCES suppliers(id),
    sales_order_id UUID REFERENCES sales_orders(id),
    purchase_order_id UUID REFERENCES purchase_orders(id),
    invoice_date DATE NOT NULL,
    due_date DATE,
    subtotal DECIMAL(15,2),
    tax_amount DECIMAL(15,2),
    total_amount DECIMAL(15,2),
    paid_amount DECIMAL(15,2) DEFAULT 0,
    balance_amount DECIMAL(15,2) GENERATED ALWAYS AS (total_amount - paid_amount) STORED,
    status VARCHAR(50) DEFAULT 'draft', -- 'draft', 'sent', 'paid', 'overdue', 'cancelled'
    payment_terms VARCHAR(100),
    notes TEXT,
    created_by UUID REFERENCES employees(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Invoice items table
CREATE TABLE IF NOT EXISTS invoice_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
    product_id UUID REFERENCES erp_products(id),
    description TEXT,
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(12,2) NOT NULL,
    tax_rate DECIMAL(5,2),
    tax_amount DECIMAL(12,2),
    total_amount DECIMAL(12,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payments table
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    payment_number VARCHAR(100) UNIQUE NOT NULL,
    payment_type VARCHAR(50) NOT NULL, -- 'received', 'made'
    customer_id UUID REFERENCES customers(id),
    supplier_id UUID REFERENCES suppliers(id),
    invoice_id UUID REFERENCES invoices(id),
    amount DECIMAL(15,2) NOT NULL,
    payment_method VARCHAR(50), -- 'cash', 'bank_transfer', 'cheque', 'card'
    payment_date DATE NOT NULL,
    reference_number VARCHAR(100),
    notes TEXT,
    status VARCHAR(50) DEFAULT 'completed',
    created_by UUID REFERENCES employees(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_companies_subscription ON companies(subscription_status);
CREATE INDEX IF NOT EXISTS idx_employees_company ON employees(company_id);
CREATE INDEX IF NOT EXISTS idx_suppliers_company ON suppliers(company_id);
CREATE INDEX IF NOT EXISTS idx_customers_company ON customers(company_id);
CREATE INDEX IF NOT EXISTS idx_products_company ON erp_products(company_id);
CREATE INDEX IF NOT EXISTS idx_products_sku ON erp_products(sku);
CREATE INDEX IF NOT EXISTS idx_inventory_product_warehouse ON current_inventory(product_id, warehouse_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_company ON purchase_orders(company_id);
CREATE INDEX IF NOT EXISTS idx_sales_orders_company ON sales_orders(company_id);
CREATE INDEX IF NOT EXISTS idx_invoices_company ON invoices(company_id);
CREATE INDEX IF NOT EXISTS idx_payments_company ON payments(company_id);

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_departments_updated_at BEFORE UPDATE ON departments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON employees FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON suppliers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_warehouses_updated_at BEFORE UPDATE ON warehouses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_product_categories_updated_at BEFORE UPDATE ON product_categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_erp_products_updated_at BEFORE UPDATE ON erp_products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_purchase_orders_updated_at BEFORE UPDATE ON purchase_orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sales_orders_updated_at BEFORE UPDATE ON sales_orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) policies
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE current_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies (to be customized based on authentication setup)
-- These policies ensure users can only access data from their company
CREATE POLICY "Users can view their company data" ON companies FOR SELECT USING (auth.uid() IN (SELECT id FROM profiles WHERE business_details->>'company_id' = companies.id::text));
CREATE POLICY "Users can create companies" ON companies FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can view their company departments" ON departments FOR SELECT USING (company_id IN (SELECT id FROM companies WHERE auth.uid() IN (SELECT id FROM profiles WHERE business_details->>'company_id' = companies.id::text)));
CREATE POLICY "Users can view their company employees" ON employees FOR SELECT USING (company_id IN (SELECT id FROM companies WHERE auth.uid() IN (SELECT id FROM profiles WHERE business_details->>'company_id' = companies.id::text)));
CREATE POLICY "Users can view their company suppliers" ON suppliers FOR SELECT USING (company_id IN (SELECT id FROM companies WHERE auth.uid() IN (SELECT id FROM profiles WHERE business_details->>'company_id' = companies.id::text)));
CREATE POLICY "Users can view their company customers" ON customers FOR SELECT USING (company_id IN (SELECT id FROM companies WHERE auth.uid() IN (SELECT id FROM profiles WHERE business_details->>'company_id' = companies.id::text)));
CREATE POLICY "Users can view their company warehouses" ON warehouses FOR SELECT USING (company_id IN (SELECT id FROM companies WHERE auth.uid() IN (SELECT id FROM profiles WHERE business_details->>'company_id' = companies.id::text)));
CREATE POLICY "Users can view their company product categories" ON product_categories FOR SELECT USING (company_id IN (SELECT id FROM companies WHERE auth.uid() IN (SELECT id FROM profiles WHERE business_details->>'company_id' = companies.id::text)));
CREATE POLICY "Users can view their company products" ON erp_products FOR SELECT USING (company_id IN (SELECT id FROM companies WHERE auth.uid() IN (SELECT id FROM profiles WHERE business_details->>'company_id' = companies.id::text)));
CREATE POLICY "Users can view their company inventory" ON current_inventory FOR SELECT USING (company_id IN (SELECT id FROM companies WHERE auth.uid() IN (SELECT id FROM profiles WHERE business_details->>'company_id' = companies.id::text)));
CREATE POLICY "Users can view their company purchase orders" ON purchase_orders FOR SELECT USING (company_id IN (SELECT id FROM companies WHERE auth.uid() IN (SELECT id FROM profiles WHERE business_details->>'company_id' = companies.id::text)));
CREATE POLICY "Users can view their company sales orders" ON sales_orders FOR SELECT USING (company_id IN (SELECT id FROM companies WHERE auth.uid() IN (SELECT id FROM profiles WHERE business_details->>'company_id' = companies.id::text)));
CREATE POLICY "Users can view their company invoices" ON invoices FOR SELECT USING (company_id IN (SELECT id FROM companies WHERE auth.uid() IN (SELECT id FROM profiles WHERE business_details->>'company_id' = companies.id::text)));
CREATE POLICY "Users can view their company payments" ON payments FOR SELECT USING (company_id IN (SELECT id FROM companies WHERE auth.uid() IN (SELECT id FROM profiles WHERE business_details->>'company_id' = companies.id::text)));