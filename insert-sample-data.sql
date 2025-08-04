-- Sample Data Insertion Script
-- Run this in Supabase SQL Editor to populate test data

-- First, temporarily allow all inserts (bypass RLS for data seeding)
DROP POLICY IF EXISTS "Users can insert customers for their company" ON customers;
DROP POLICY IF EXISTS "Users can insert invoices for their company" ON invoices;
DROP POLICY IF EXISTS "Users can insert invoice items for their company" ON invoice_items;

CREATE POLICY "Allow all customer inserts" ON customers FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all invoice inserts" ON invoices FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all invoice item inserts" ON invoice_items FOR INSERT WITH CHECK (true);

-- Get the company ID (assuming there's at least one company)
DO $$
DECLARE
    company_uuid UUID;
    customer1_uuid UUID;
    customer2_uuid UUID;
    customer3_uuid UUID;
    invoice1_uuid UUID;
    invoice2_uuid UUID;
    invoice3_uuid UUID;
BEGIN
    -- Get the first company ID
    SELECT id INTO company_uuid FROM companies LIMIT 1;
    
    IF company_uuid IS NULL THEN
        RAISE EXCEPTION 'No company found. Please create a company first.';
    END IF;
    
    RAISE NOTICE 'Using company ID: %', company_uuid;
    
    -- Insert sample customers
    INSERT INTO customers (id, company_id, name, email, phone, address, status, created_at, updated_at)
    VALUES 
        (gen_random_uuid(), company_uuid, 'John Doe', 'john.doe@example.com', '+91 98765 43210', 
         '{"street": "123 Main Street", "city": "Mumbai", "state": "Maharashtra", "pincode": "400001"}', 
         'active', NOW(), NOW()),
        (gen_random_uuid(), company_uuid, 'Jane Smith', 'jane.smith@example.com', '+91 87654 32109', 
         '{"street": "456 Business Avenue", "city": "Delhi", "state": "Delhi", "pincode": "110001"}', 
         'active', NOW(), NOW()),
        (gen_random_uuid(), company_uuid, 'ABC Corporation', 'contact@abccorp.com', '+91 76543 21098', 
         '{"street": "789 Corporate Plaza", "city": "Bangalore", "state": "Karnataka", "pincode": "560001"}', 
         'active', NOW(), NOW())
    RETURNING id INTO customer1_uuid, customer2_uuid, customer3_uuid;
    
    -- Get the customer IDs that were just inserted
    SELECT id INTO customer1_uuid FROM customers WHERE email = 'john.doe@example.com' AND company_id = company_uuid;
    SELECT id INTO customer2_uuid FROM customers WHERE email = 'jane.smith@example.com' AND company_id = company_uuid;
    SELECT id INTO customer3_uuid FROM customers WHERE email = 'contact@abccorp.com' AND company_id = company_uuid;
    
    RAISE NOTICE 'Created customers: %, %, %', customer1_uuid, customer2_uuid, customer3_uuid;
    
    -- Insert sample invoices
    INSERT INTO invoices (id, company_id, invoice_number, invoice_type, customer_id, invoice_date, due_date, 
                         subtotal, tax_amount, total_amount, paid_amount, status, notes, created_at, updated_at)
    VALUES 
        (gen_random_uuid(), company_uuid, 'INV-2024-001', 'sales', customer1_uuid, '2024-01-15', '2024-02-15',
         10000.00, 1800.00, 11800.00, 0.00, 'draft', 'Sample invoice for testing', NOW(), NOW()),
        (gen_random_uuid(), company_uuid, 'INV-2024-002', 'sales', customer2_uuid, '2024-01-20', '2024-02-20',
         25000.00, 4500.00, 29500.00, 15000.00, 'sent', 'Partially paid invoice', NOW(), NOW()),
        (gen_random_uuid(), company_uuid, 'INV-2024-003', 'sales', customer3_uuid, '2024-01-25', '2024-02-25',
         50000.00, 9000.00, 59000.00, 59000.00, 'paid', 'Fully paid invoice', NOW(), NOW())
    RETURNING id INTO invoice1_uuid, invoice2_uuid, invoice3_uuid;
    
    -- Get the invoice IDs that were just inserted
    SELECT id INTO invoice1_uuid FROM invoices WHERE invoice_number = 'INV-2024-001' AND company_id = company_uuid;
    SELECT id INTO invoice2_uuid FROM invoices WHERE invoice_number = 'INV-2024-002' AND company_id = company_uuid;
    SELECT id INTO invoice3_uuid FROM invoices WHERE invoice_number = 'INV-2024-003' AND company_id = company_uuid;
    
    RAISE NOTICE 'Created invoices: %, %, %', invoice1_uuid, invoice2_uuid, invoice3_uuid;
    
    -- Insert sample invoice items
    INSERT INTO invoice_items (id, invoice_id, description, quantity, unit_price, tax_rate, tax_amount, total_amount, created_at, updated_at)
    VALUES 
        -- Items for first invoice
        (gen_random_uuid(), invoice1_uuid, 'Product A - Premium Quality', 2, 3000.00, 18.00, 1080.00, 7080.00, NOW(), NOW()),
        (gen_random_uuid(), invoice1_uuid, 'Product B - Standard Quality', 1, 4000.00, 18.00, 720.00, 4720.00, NOW(), NOW()),
        
        -- Items for second invoice
        (gen_random_uuid(), invoice2_uuid, 'Service Package - Monthly', 1, 25000.00, 18.00, 4500.00, 29500.00, NOW(), NOW()),
        
        -- Items for third invoice
        (gen_random_uuid(), invoice3_uuid, 'Enterprise Solution', 1, 50000.00, 18.00, 9000.00, 59000.00, NOW(), NOW());
    
    RAISE NOTICE 'Sample data insertion completed successfully!';
    RAISE NOTICE 'Created 3 customers, 3 invoices, and 4 invoice items';
    
END $$;

-- Verify the data was inserted
SELECT 'Customers' as table_name, COUNT(*) as count FROM customers
UNION ALL
SELECT 'Invoices' as table_name, COUNT(*) as count FROM invoices
UNION ALL
SELECT 'Invoice Items' as table_name, COUNT(*) as count FROM invoice_items;

-- Show sample data
SELECT 
    i.invoice_number,
    i.status,
    c.name as customer_name,
    i.total_amount,
    i.paid_amount
FROM invoices i
JOIN customers c ON i.customer_id = c.id
ORDER BY i.invoice_number;