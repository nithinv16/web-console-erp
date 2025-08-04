-- Barcode Support Migration
-- Add barcode scanning support to products and create master_products table

-- Create master_products table for global product catalog
CREATE TABLE IF NOT EXISTS master_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    brand VARCHAR(100),
    category VARCHAR(100),
    subcategory VARCHAR(100),
    description TEXT,
    barcode VARCHAR(100) UNIQUE,
    ean_code VARCHAR(13),
    upc_code VARCHAR(12),
    gtin VARCHAR(14),
    hsn_code VARCHAR(20),
    unit_of_measure VARCHAR(50),
    weight DECIMAL(10,3),
    dimensions JSONB,
    image_url TEXT,
    manufacturer VARCHAR(255),
    country_of_origin VARCHAR(100),
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for barcode lookups
CREATE INDEX IF NOT EXISTS idx_master_products_barcode ON master_products(barcode);
CREATE INDEX IF NOT EXISTS idx_master_products_ean ON master_products(ean_code);
CREATE INDEX IF NOT EXISTS idx_master_products_upc ON master_products(upc_code);
CREATE INDEX IF NOT EXISTS idx_master_products_gtin ON master_products(gtin);
CREATE INDEX IF NOT EXISTS idx_master_products_name ON master_products(name);
CREATE INDEX IF NOT EXISTS idx_master_products_brand ON master_products(brand);

-- Add additional barcode fields to erp_products if not exists
ALTER TABLE erp_products 
ADD COLUMN IF NOT EXISTS ean_code VARCHAR(13),
ADD COLUMN IF NOT EXISTS upc_code VARCHAR(12),
ADD COLUMN IF NOT EXISTS gtin VARCHAR(14),
ADD COLUMN IF NOT EXISTS master_product_id UUID REFERENCES master_products(id);

-- Add indexes for barcode lookups on erp_products
CREATE INDEX IF NOT EXISTS idx_erp_products_barcode ON erp_products(barcode);
CREATE INDEX IF NOT EXISTS idx_erp_products_ean ON erp_products(ean_code);
CREATE INDEX IF NOT EXISTS idx_erp_products_upc ON erp_products(upc_code);
CREATE INDEX IF NOT EXISTS idx_erp_products_gtin ON erp_products(gtin);
CREATE INDEX IF NOT EXISTS idx_erp_products_sku ON erp_products(sku);
CREATE INDEX IF NOT EXISTS idx_erp_products_master_product ON erp_products(master_product_id);

-- Add barcode fields to products table (for marketplace products)
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS barcode VARCHAR(100),
ADD COLUMN IF NOT EXISTS ean_code VARCHAR(13),
ADD COLUMN IF NOT EXISTS upc_code VARCHAR(12),
ADD COLUMN IF NOT EXISTS gtin VARCHAR(14),
ADD COLUMN IF NOT EXISTS master_product_id UUID REFERENCES master_products(id);

-- Add indexes for barcode lookups on products
CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);
CREATE INDEX IF NOT EXISTS idx_products_ean ON products(ean_code);
CREATE INDEX IF NOT EXISTS idx_products_upc ON products(upc_code);
CREATE INDEX IF NOT EXISTS idx_products_gtin ON products(gtin);
CREATE INDEX IF NOT EXISTS idx_products_master_product ON products(master_product_id);

-- Create stock_taking_sessions table for inventory management
CREATE TABLE IF NOT EXISTS stock_taking_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    session_name VARCHAR(255) NOT NULL,
    warehouse_id UUID REFERENCES warehouses(id),
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'completed', 'cancelled'
    started_by UUID REFERENCES employees(id),
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create stock_taking_items table for individual scanned items
CREATE TABLE IF NOT EXISTS stock_taking_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES stock_taking_sessions(id) ON DELETE CASCADE,
    product_id UUID REFERENCES erp_products(id) ON DELETE CASCADE,
    warehouse_id UUID REFERENCES warehouses(id),
    system_quantity INTEGER DEFAULT 0,
    counted_quantity INTEGER DEFAULT 0,
    difference INTEGER GENERATED ALWAYS AS (counted_quantity - system_quantity) STORED,
    barcode_scanned VARCHAR(100),
    scan_count INTEGER DEFAULT 0,
    notes TEXT,
    scanned_by UUID REFERENCES employees(id),
    scanned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for stock taking
CREATE INDEX IF NOT EXISTS idx_stock_taking_sessions_company ON stock_taking_sessions(company_id);
CREATE INDEX IF NOT EXISTS idx_stock_taking_sessions_status ON stock_taking_sessions(status);
CREATE INDEX IF NOT EXISTS idx_stock_taking_items_session ON stock_taking_items(session_id);
CREATE INDEX IF NOT EXISTS idx_stock_taking_items_product ON stock_taking_items(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_taking_items_barcode ON stock_taking_items(barcode_scanned);

-- Create barcode_scan_logs table for audit trail
CREATE TABLE IF NOT EXISTS barcode_scan_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    barcode VARCHAR(100) NOT NULL,
    scan_type VARCHAR(50) NOT NULL, -- 'product_lookup', 'stock_taking', 'purchase_receipt', 'sales'
    product_id UUID REFERENCES erp_products(id),
    session_id UUID, -- Can reference different session types
    scanned_by UUID REFERENCES employees(id),
    scan_result VARCHAR(20) DEFAULT 'success', -- 'success', 'not_found', 'error'
    metadata JSONB DEFAULT '{}',
    scanned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for scan logs
CREATE INDEX IF NOT EXISTS idx_barcode_scan_logs_company ON barcode_scan_logs(company_id);
CREATE INDEX IF NOT EXISTS idx_barcode_scan_logs_barcode ON barcode_scan_logs(barcode);
CREATE INDEX IF NOT EXISTS idx_barcode_scan_logs_type ON barcode_scan_logs(scan_type);
CREATE INDEX IF NOT EXISTS idx_barcode_scan_logs_date ON barcode_scan_logs(scanned_at);
CREATE INDEX IF NOT EXISTS idx_barcode_scan_logs_user ON barcode_scan_logs(scanned_by);

-- Insert some sample master products with barcodes
INSERT INTO master_products (name, brand, category, barcode, ean_code, description, unit_of_measure) VALUES
('Coca Cola 500ml', 'Coca Cola', 'Beverages', '8901030895012', '8901030895012', 'Coca Cola Soft Drink 500ml Bottle', 'bottle'),
('Pepsi 500ml', 'Pepsi', 'Beverages', '8901030895029', '8901030895029', 'Pepsi Soft Drink 500ml Bottle', 'bottle'),
('Maggi Noodles 70g', 'Maggi', 'Food', '8901030895036', '8901030895036', 'Maggi 2-Minute Noodles Masala 70g', 'packet'),
('Parle-G Biscuits 200g', 'Parle', 'Food', '8901030895043', '8901030895043', 'Parle-G Glucose Biscuits 200g Pack', 'packet'),
('Amul Milk 1L', 'Amul', 'Dairy', '8901030895050', '8901030895050', 'Amul Fresh Milk Full Cream 1 Litre', 'litre')
ON CONFLICT (barcode) DO NOTHING;

COMMIT;