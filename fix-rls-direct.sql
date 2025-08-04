-- Direct SQL to fix RLS policies for all ERP tables
-- Copy and paste this into Supabase SQL Editor

-- Drop all existing policies for customers table
DROP POLICY IF EXISTS "Users can view their company customers" ON customers;
DROP POLICY IF EXISTS "Users can insert customers for their company" ON customers;
DROP POLICY IF EXISTS "Users can update their company customers" ON customers;
DROP POLICY IF EXISTS "Users can delete their company customers" ON customers;
DROP POLICY IF EXISTS "Authenticated users can insert customers" ON customers;
DROP POLICY IF EXISTS "Authenticated users can update customers" ON customers;
DROP POLICY IF EXISTS "Authenticated users can delete customers" ON customers;
DROP POLICY IF EXISTS "Authenticated users can view customers" ON customers;
DROP POLICY IF EXISTS "Allow authenticated users to view customers" ON customers;
DROP POLICY IF EXISTS "Allow authenticated users to insert customers" ON customers;
DROP POLICY IF EXISTS "Allow authenticated users to update customers" ON customers;
DROP POLICY IF EXISTS "Allow authenticated users to delete customers" ON customers;

-- Drop all existing policies for invoices table
DROP POLICY IF EXISTS "Users can view their company invoices" ON invoices;
DROP POLICY IF EXISTS "Users can insert invoices for their company" ON invoices;
DROP POLICY IF EXISTS "Users can update their company invoices" ON invoices;
DROP POLICY IF EXISTS "Users can delete their company invoices" ON invoices;

-- Drop all existing policies for invoice_items table
DROP POLICY IF EXISTS "Users can view their company invoice items" ON invoice_items;
DROP POLICY IF EXISTS "Users can insert invoice items for their company" ON invoice_items;
DROP POLICY IF EXISTS "Users can update their company invoice items" ON invoice_items;
DROP POLICY IF EXISTS "Users can delete their company invoice items" ON invoice_items;

-- Drop all existing policies for erp_products table
DROP POLICY IF EXISTS "Users can view their company products" ON erp_products;
DROP POLICY IF EXISTS "Users can insert products for their company" ON erp_products;
DROP POLICY IF EXISTS "Users can update their company products" ON erp_products;
DROP POLICY IF EXISTS "Users can delete their company products" ON erp_products;

-- Drop all existing policies for payments table
DROP POLICY IF EXISTS "Users can view their company payments" ON payments;
DROP POLICY IF EXISTS "Users can insert payments for their company" ON payments;
DROP POLICY IF EXISTS "Users can update their company payments" ON payments;
DROP POLICY IF EXISTS "Users can delete their company payments" ON payments;

-- Create simple policies for customers table
CREATE POLICY "Allow authenticated users to view customers" 
ON customers FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow authenticated users to insert customers" 
ON customers FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Allow authenticated users to update customers" 
ON customers FOR UPDATE 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow authenticated users to delete customers" 
ON customers FOR DELETE 
USING (auth.uid() IS NOT NULL);

-- Create simple policies for invoices table
CREATE POLICY "Allow authenticated users to view invoices" 
ON invoices FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow authenticated users to insert invoices" 
ON invoices FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Allow authenticated users to update invoices" 
ON invoices FOR UPDATE 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow authenticated users to delete invoices" 
ON invoices FOR DELETE 
USING (auth.uid() IS NOT NULL);

-- Create simple policies for invoice_items table
CREATE POLICY "Allow authenticated users to view invoice_items" 
ON invoice_items FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow authenticated users to insert invoice_items" 
ON invoice_items FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Allow authenticated users to update invoice_items" 
ON invoice_items FOR UPDATE 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow authenticated users to delete invoice_items" 
ON invoice_items FOR DELETE 
USING (auth.uid() IS NOT NULL);

-- Create simple policies for erp_products table
CREATE POLICY "Allow authenticated users to view erp_products" 
ON erp_products FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow authenticated users to insert erp_products" 
ON erp_products FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Allow authenticated users to update erp_products" 
ON erp_products FOR UPDATE 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow authenticated users to delete erp_products" 
ON erp_products FOR DELETE 
USING (auth.uid() IS NOT NULL);

-- Create simple policies for payments table
CREATE POLICY "Allow authenticated users to view payments" 
ON payments FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow authenticated users to insert payments" 
ON payments FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Allow authenticated users to update payments" 
ON payments FOR UPDATE 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow authenticated users to delete payments" 
ON payments FOR DELETE 
USING (auth.uid() IS NOT NULL);

-- Verify the policies are created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('customers', 'invoices', 'invoice_items', 'erp_products', 'payments')
ORDER BY tablename, policyname;