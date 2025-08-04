-- Add INSERT policy for companies table
-- Run this in Supabase SQL Editor

CREATE POLICY "Users can create companies" ON companies FOR INSERT WITH CHECK (true);