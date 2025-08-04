-- Add Missing RLS Policies for ERP Tables
-- This file adds INSERT, UPDATE, and DELETE policies that are missing from the current schema

-- Helper function to check if user belongs to a company
-- This assumes the profiles table has business_details JSONB column with company_id

-- Companies policies
CREATE POLICY "Users can update their company data" ON companies FOR UPDATE USING (auth.uid() IN (SELECT id FROM profiles WHERE business_details->>'company_id' = companies.id::text));

-- Departments policies
CREATE POLICY "Users can insert departments for their company" ON departments FOR INSERT WITH CHECK (company_id IN (SELECT id FROM companies WHERE auth.uid() IN (SELECT id FROM profiles WHERE business_details->>'company_id' = companies.id::text)));
CREATE POLICY "Users can update their company departments" ON departments FOR UPDATE USING (company_id IN (SELECT id FROM companies WHERE auth.uid() IN (SELECT id FROM profiles WHERE business_details->>'company_id' = companies.id::text)));
CREATE POLICY "Users can delete their company departments" ON departments FOR DELETE USING (company_id IN (SELECT id FROM companies WHERE auth.uid() IN (SELECT id FROM profiles WHERE business_details->>'company_id' = companies.id::text)));

-- Employees policies
CREATE POLICY "Users can insert employees for their company" ON employees FOR INSERT WITH CHECK (company_id IN (SELECT id FROM companies WHERE auth.uid() IN (SELECT id FROM profiles WHERE business_details->>'company_id' = companies.id::text)));
CREATE POLICY "Users can update their company employees" ON employees FOR UPDATE USING (company_id IN (SELECT id FROM companies WHERE auth.uid() IN (SELECT id FROM profiles WHERE business_details->>'company_id' = companies.id::text)));
CREATE POLICY "Users can delete their company employees" ON employees FOR DELETE USING (company_id IN (SELECT id FROM companies WHERE auth.uid() IN (SELECT id FROM profiles WHERE business_details->>'company_id' = companies.id::text)));

-- Suppliers policies
CREATE POLICY "Users can insert suppliers for their company" ON suppliers FOR INSERT WITH CHECK (company_id IN (SELECT id FROM companies WHERE auth.uid() IN (SELECT id FROM profiles WHERE business_details->>'company_id' = companies.id::text)));
CREATE POLICY "Users can update their company suppliers" ON suppliers FOR UPDATE USING (company_id IN (SELECT id FROM companies WHERE auth.uid() IN (SELECT id FROM profiles WHERE business_details->>'company_id' = companies.id::text)));
CREATE POLICY "Users can delete their company suppliers" ON suppliers FOR DELETE USING (company_id IN (SELECT id FROM companies WHERE auth.uid() IN (SELECT id FROM profiles WHERE business_details->>'company_id' = companies.id::text)));

-- Customers policies (THIS IS THE CRITICAL ONE FOR THE ERROR)
CREATE POLICY "Users can insert customers for their company" ON customers FOR INSERT WITH CHECK (company_id IN (SELECT id FROM companies WHERE auth.uid() IN (SELECT id FROM profiles WHERE business_details->>'company_id' = companies.id::text)));
CREATE POLICY "Users can update their company customers" ON customers FOR UPDATE USING (company_id IN (SELECT id FROM companies WHERE auth.uid() IN (SELECT id FROM profiles WHERE business_details->>'company_id' = companies.id::text)));
CREATE POLICY "Users can delete their company customers" ON customers FOR DELETE USING (company_id IN (SELECT id FROM companies WHERE auth.uid() IN (SELECT id FROM profiles WHERE business_details->>'company_id' = companies.id::text)));

-- Warehouses policies
CREATE POLICY "Users can insert warehouses for their company" ON warehouses FOR INSERT WITH CHECK (company_id IN (SELECT id FROM companies WHERE auth.uid() IN (SELECT id FROM profiles WHERE business_details->>'company_id' = companies.id::text)));
CREATE POLICY "Users can update their company warehouses" ON warehouses FOR UPDATE USING (company_id IN (SELECT id FROM companies WHERE auth.uid() IN (SELECT id FROM profiles WHERE business_details->>'company_id' = companies.id::text)));
CREATE POLICY "Users can delete their company warehouses" ON warehouses FOR DELETE USING (company_id IN (SELECT id FROM companies WHERE auth.uid() IN (SELECT id FROM profiles WHERE business_details->>'company_id' = companies.id::text)));

-- Product categories policies
CREATE POLICY "Users can insert product categories for their company" ON product_categories FOR INSERT WITH CHECK (company_id IN (SELECT id FROM companies WHERE auth.uid() IN (SELECT id FROM profiles WHERE business_details->>'company_id' = companies.id::text)));
CREATE POLICY "Users can update their company product categories" ON product_categories FOR UPDATE USING (company_id IN (SELECT id FROM companies WHERE auth.uid() IN (SELECT id FROM profiles WHERE business_details->>'company_id' = companies.id::text)));
CREATE POLICY "Users can delete their company product categories" ON product_categories FOR DELETE USING (company_id IN (SELECT id FROM companies WHERE auth.uid() IN (SELECT id FROM profiles WHERE business_details->>'company_id' = companies.id::text)));

-- Products policies
CREATE POLICY "Users can insert products for their company" ON erp_products FOR INSERT WITH CHECK (company_id IN (SELECT id FROM companies WHERE auth.uid() IN (SELECT id FROM profiles WHERE business_details->>'company_id' = companies.id::text)));
CREATE POLICY "Users can update their company products" ON erp_products FOR UPDATE USING (company_id IN (SELECT id FROM companies WHERE auth.uid() IN (SELECT id FROM profiles WHERE business_details->>'company_id' = companies.id::text)));
CREATE POLICY "Users can delete their company products" ON erp_products FOR DELETE USING (company_id IN (SELECT id FROM companies WHERE auth.uid() IN (SELECT id FROM profiles WHERE business_details->>'company_id' = companies.id::text)));

-- Inventory transactions policies
CREATE POLICY "Users can insert inventory transactions for their company" ON inventory_transactions FOR INSERT WITH CHECK (company_id IN (SELECT id FROM companies WHERE auth.uid() IN (SELECT id FROM profiles WHERE business_details->>'company_id' = companies.id::text)));
CREATE POLICY "Users can update their company inventory transactions" ON inventory_transactions FOR UPDATE USING (company_id IN (SELECT id FROM companies WHERE auth.uid() IN (SELECT id FROM profiles WHERE business_details->>'company_id' = companies.id::text)));
CREATE POLICY "Users can delete their company inventory transactions" ON inventory_transactions FOR DELETE USING (company_id IN (SELECT id FROM companies WHERE auth.uid() IN (SELECT id FROM profiles WHERE business_details->>'company_id' = companies.id::text)));

-- Current inventory policies
CREATE POLICY "Users can insert current inventory for their company" ON current_inventory FOR INSERT WITH CHECK (company_id IN (SELECT id FROM companies WHERE auth.uid() IN (SELECT id FROM profiles WHERE business_details->>'company_id' = companies.id::text)));
CREATE POLICY "Users can update their company current inventory" ON current_inventory FOR UPDATE USING (company_id IN (SELECT id FROM companies WHERE auth.uid() IN (SELECT id FROM profiles WHERE business_details->>'company_id' = companies.id::text)));
CREATE POLICY "Users can delete their company current inventory" ON current_inventory FOR DELETE USING (company_id IN (SELECT id FROM companies WHERE auth.uid() IN (SELECT id FROM profiles WHERE business_details->>'company_id' = companies.id::text)));

-- Purchase orders policies
CREATE POLICY "Users can insert purchase orders for their company" ON purchase_orders FOR INSERT WITH CHECK (company_id IN (SELECT id FROM companies WHERE auth.uid() IN (SELECT id FROM profiles WHERE business_details->>'company_id' = companies.id::text)));
CREATE POLICY "Users can update their company purchase orders" ON purchase_orders FOR UPDATE USING (company_id IN (SELECT id FROM companies WHERE auth.uid() IN (SELECT id FROM profiles WHERE business_details->>'company_id' = companies.id::text)));
CREATE POLICY "Users can delete their company purchase orders" ON purchase_orders FOR DELETE USING (company_id IN (SELECT id FROM companies WHERE auth.uid() IN (SELECT id FROM profiles WHERE business_details->>'company_id' = companies.id::text)));

-- Purchase order items policies
CREATE POLICY "Users can insert purchase order items for their company" ON purchase_order_items FOR INSERT WITH CHECK (purchase_order_id IN (SELECT id FROM purchase_orders WHERE company_id IN (SELECT id FROM companies WHERE auth.uid() IN (SELECT id FROM profiles WHERE business_details->>'company_id' = companies.id::text))));
CREATE POLICY "Users can update their company purchase order items" ON purchase_order_items FOR UPDATE USING (purchase_order_id IN (SELECT id FROM purchase_orders WHERE company_id IN (SELECT id FROM companies WHERE auth.uid() IN (SELECT id FROM profiles WHERE business_details->>'company_id' = companies.id::text))));
CREATE POLICY "Users can delete their company purchase order items" ON purchase_order_items FOR DELETE USING (purchase_order_id IN (SELECT id FROM purchase_orders WHERE company_id IN (SELECT id FROM companies WHERE auth.uid() IN (SELECT id FROM profiles WHERE business_details->>'company_id' = companies.id::text))));

-- Sales orders policies
CREATE POLICY "Users can insert sales orders for their company" ON sales_orders FOR INSERT WITH CHECK (company_id IN (SELECT id FROM companies WHERE auth.uid() IN (SELECT id FROM profiles WHERE business_details->>'company_id' = companies.id::text)));
CREATE POLICY "Users can update their company sales orders" ON sales_orders FOR UPDATE USING (company_id IN (SELECT id FROM companies WHERE auth.uid() IN (SELECT id FROM profiles WHERE business_details->>'company_id' = companies.id::text)));
CREATE POLICY "Users can delete their company sales orders" ON sales_orders FOR DELETE USING (company_id IN (SELECT id FROM companies WHERE auth.uid() IN (SELECT id FROM profiles WHERE business_details->>'company_id' = companies.id::text)));

-- Sales order items policies
CREATE POLICY "Users can insert sales order items for their company" ON sales_order_items FOR INSERT WITH CHECK (sales_order_id IN (SELECT id FROM sales_orders WHERE company_id IN (SELECT id FROM companies WHERE auth.uid() IN (SELECT id FROM profiles WHERE business_details->>'company_id' = companies.id::text))));
CREATE POLICY "Users can update their company sales order items" ON sales_order_items FOR UPDATE USING (sales_order_id IN (SELECT id FROM sales_orders WHERE company_id IN (SELECT id FROM companies WHERE auth.uid() IN (SELECT id FROM profiles WHERE business_details->>'company_id' = companies.id::text))));
CREATE POLICY "Users can delete their company sales order items" ON sales_order_items FOR DELETE USING (sales_order_id IN (SELECT id FROM sales_orders WHERE company_id IN (SELECT id FROM companies WHERE auth.uid() IN (SELECT id FROM profiles WHERE business_details->>'company_id' = companies.id::text))));

-- Invoices policies
CREATE POLICY "Users can insert invoices for their company" ON invoices FOR INSERT WITH CHECK (company_id IN (SELECT id FROM companies WHERE auth.uid() IN (SELECT id FROM profiles WHERE business_details->>'company_id' = companies.id::text)));
CREATE POLICY "Users can update their company invoices" ON invoices FOR UPDATE USING (company_id IN (SELECT id FROM companies WHERE auth.uid() IN (SELECT id FROM profiles WHERE business_details->>'company_id' = companies.id::text)));
CREATE POLICY "Users can delete their company invoices" ON invoices FOR DELETE USING (company_id IN (SELECT id FROM companies WHERE auth.uid() IN (SELECT id FROM profiles WHERE business_details->>'company_id' = companies.id::text)));

-- Invoice items policies
CREATE POLICY "Users can insert invoice items for their company" ON invoice_items FOR INSERT WITH CHECK (invoice_id IN (SELECT id FROM invoices WHERE company_id IN (SELECT id FROM companies WHERE auth.uid() IN (SELECT id FROM profiles WHERE business_details->>'company_id' = companies.id::text))));
CREATE POLICY "Users can update their company invoice items" ON invoice_items FOR UPDATE USING (invoice_id IN (SELECT id FROM invoices WHERE company_id IN (SELECT id FROM companies WHERE auth.uid() IN (SELECT id FROM profiles WHERE business_details->>'company_id' = companies.id::text))));
CREATE POLICY "Users can delete their company invoice items" ON invoice_items FOR DELETE USING (invoice_id IN (SELECT id FROM invoices WHERE company_id IN (SELECT id FROM companies WHERE auth.uid() IN (SELECT id FROM profiles WHERE business_details->>'company_id' = companies.id::text))));

-- Payments policies
CREATE POLICY "Users can insert payments for their company" ON payments FOR INSERT WITH CHECK (company_id IN (SELECT id FROM companies WHERE auth.uid() IN (SELECT id FROM profiles WHERE business_details->>'company_id' = companies.id::text)));
CREATE POLICY "Users can update their company payments" ON payments FOR UPDATE USING (company_id IN (SELECT id FROM companies WHERE auth.uid() IN (SELECT id FROM profiles WHERE business_details->>'company_id' = companies.id::text)));
CREATE POLICY "Users can delete their company payments" ON payments FOR DELETE USING (company_id IN (SELECT id FROM companies WHERE auth.uid() IN (SELECT id FROM profiles WHERE business_details->>'company_id' = companies.id::text)));

-- Add missing SELECT policies for purchase_order_items, sales_order_items, and invoice_items
CREATE POLICY "Users can view their company purchase order items" ON purchase_order_items FOR SELECT USING (purchase_order_id IN (SELECT id FROM purchase_orders WHERE company_id IN (SELECT id FROM companies WHERE auth.uid() IN (SELECT id FROM profiles WHERE business_details->>'company_id' = companies.id::text))));
CREATE POLICY "Users can view their company sales order items" ON sales_order_items FOR SELECT USING (sales_order_id IN (SELECT id FROM sales_orders WHERE company_id IN (SELECT id FROM companies WHERE auth.uid() IN (SELECT id FROM profiles WHERE business_details->>'company_id' = companies.id::text))));
CREATE POLICY "Users can view their company invoice items" ON invoice_items FOR SELECT USING (invoice_id IN (SELECT id FROM invoices WHERE company_id IN (SELECT id FROM companies WHERE auth.uid() IN (SELECT id FROM profiles WHERE business_details->>'company_id' = companies.id::text))));
CREATE POLICY "Users can view their company inventory transactions" ON inventory_transactions FOR SELECT USING (company_id IN (SELECT id FROM companies WHERE auth.uid() IN (SELECT id FROM profiles WHERE business_details->>'company_id' = companies.id::text)));