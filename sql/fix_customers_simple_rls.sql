-- Simple RLS Policy Fix for Customers Table
-- This creates a basic policy that allows authenticated users to insert customers
-- Run this in Supabase SQL Editor

-- Drop existing conflicting policies if they exist
DROP POLICY IF EXISTS "Users can insert customers for their company" ON customers;
DROP POLICY IF EXISTS "Users can update their company customers" ON customers;
DROP POLICY IF EXISTS "Users can delete their company customers" ON customers;

-- Create simple policies for authenticated users
CREATE POLICY "Authenticated users can insert customers" ON customers 
FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update customers" ON customers 
FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete customers" ON customers 
FOR DELETE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can view customers" ON customers 
FOR SELECT USING (auth.uid() IS NOT NULL);