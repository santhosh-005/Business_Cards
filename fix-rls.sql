-- Fix RLS Policy for business_cards table
-- Run this in Supabase SQL Editor

-- Drop existing policy if exists
DROP POLICY IF EXISTS "Enable all operations for all users" ON business_cards;
DROP POLICY IF EXISTS "Allow all access" ON business_cards;

-- Disable RLS temporarily to ensure it works
ALTER TABLE business_cards DISABLE ROW LEVEL SECURITY;

-- Re-enable RLS
ALTER TABLE business_cards ENABLE ROW LEVEL SECURITY;

-- Create new policy that allows all operations for anonymous and authenticated users
CREATE POLICY "Enable all access for everyone"
ON business_cards
FOR ALL
TO anon, authenticated
USING (true)
WITH CHECK (true);
