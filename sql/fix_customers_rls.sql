-- Quick Fix for Customers Table RLS Policy Error
-- This addresses the immediate error: "new row violates row-level security policy for table 'customers'"

-- Add INSERT policy for customers table (CRITICAL FIX)
CREATE POLICY "Users can insert customers for their company" ON customers 
FOR INSERT WITH CHECK (
  company_id IN (
    SELECT id FROM companies 
    WHERE auth.uid() IN (
      SELECT id FROM profiles 
      WHERE business_details->>'company_id' = companies.id::text
    )
  )
);

-- Add UPDATE policy for customers table
CREATE POLICY "Users can update their company customers" ON customers 
FOR UPDATE USING (
  company_id IN (
    SELECT id FROM companies 
    WHERE auth.uid() IN (
      SELECT id FROM profiles 
      WHERE business_details->>'company_id' = companies.id::text
    )
  )
);

-- Add DELETE policy for customers table
CREATE POLICY "Users can delete their company customers" ON customers 
FOR DELETE USING (
  company_id IN (
    SELECT id FROM companies 
    WHERE auth.uid() IN (
      SELECT id FROM profiles 
      WHERE business_details->>'company_id' = companies.id::text
    )
  )
);

-- Add INSERT policy for invoices table (may also be needed)
CREATE POLICY "Users can insert invoices for their company" ON invoices 
FOR INSERT WITH CHECK (
  company_id IN (
    SELECT id FROM companies 
    WHERE auth.uid() IN (
      SELECT id FROM profiles 
      WHERE business_details->>'company_id' = companies.id::text
    )
  )
);

-- Add UPDATE policy for invoices table
CREATE POLICY "Users can update their company invoices" ON invoices 
FOR UPDATE USING (
  company_id IN (
    SELECT id FROM companies 
    WHERE auth.uid() IN (
      SELECT id FROM profiles 
      WHERE business_details->>'company_id' = companies.id::text
    )
  )
);

-- Add INSERT policy for invoice_items table
CREATE POLICY "Users can insert invoice items for their company" ON invoice_items 
FOR INSERT WITH CHECK (
  invoice_id IN (
    SELECT id FROM invoices 
    WHERE company_id IN (
      SELECT id FROM companies 
      WHERE auth.uid() IN (
        SELECT id FROM profiles 
        WHERE business_details->>'company_id' = companies.id::text
      )
    )
  )
);

-- Add UPDATE policy for invoice_items table
CREATE POLICY "Users can update invoice items for their company" ON invoice_items 
FOR UPDATE USING (
  invoice_id IN (
    SELECT id FROM invoices 
    WHERE company_id IN (
      SELECT id FROM companies 
      WHERE auth.uid() IN (
        SELECT id FROM profiles 
        WHERE business_details->>'company_id' = companies.id::text
      )
    )
  )
);