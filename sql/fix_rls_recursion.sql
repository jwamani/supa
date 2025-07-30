-- ================================================================================
-- FIX RLS RECURSION ISSUE FOR DOCUMENTS TABLE
-- ================================================================================
-- This script fixes the infinite recursion in the documents RLS policy
-- First, drop the problematic policies
DROP POLICY IF EXISTS "documents_select_policy" ON documents;
DROP POLICY IF EXISTS "documents_update_policy" ON documents;
-- Recreate with simpler, non-recursive policies
-- Simple policy: users can only see their own documents + public ones
CREATE POLICY "documents_select_policy" ON documents FOR
SELECT USING (
        owner_id = auth.uid()
        OR is_public = true
        OR status = 'published'
    );
-- Simple update policy: only owners can update
CREATE POLICY "documents_update_policy" ON documents FOR
UPDATE USING (owner_id = auth.uid());
-- Alternative: If you want to completely disable RLS temporarily for testing
-- ALTER TABLE documents DISABLE ROW LEVEL SECURITY;
-- ================================================================================
-- VERIFICATION QUERY
-- ================================================================================
-- Test that the policy works without recursion
-- SELECT COUNT(*) FROM documents WHERE owner_id = auth.uid();