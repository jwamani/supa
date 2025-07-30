-- ================================================================================
-- FIX ALL RLS RECURSION ISSUES - COMPREHENSIVE SOLUTION
-- ================================================================================
-- This script fixes infinite recursion in all RLS policies by removing circular references
-- ================================================================================
-- DOCUMENTS TABLE - Remove circular references with document_permissions
-- ================================================================================
DROP POLICY IF EXISTS "documents_select_policy" ON documents;
DROP POLICY IF EXISTS "documents_update_policy" ON documents;
-- Simple policies without circular references
CREATE POLICY "documents_select_policy" ON documents FOR
SELECT USING (
        owner_id = auth.uid()
        OR is_public = true
        OR status = 'published'
    );
CREATE POLICY "documents_update_policy" ON documents FOR
UPDATE USING (owner_id = auth.uid());
-- ================================================================================
-- DOCUMENT_PERMISSIONS TABLE - Remove circular references with documents
-- ================================================================================
DROP POLICY IF EXISTS "permissions_select_policy" ON document_permissions;
DROP POLICY IF EXISTS "permissions_insert_policy" ON document_permissions;
DROP POLICY IF EXISTS "permissions_update_policy" ON document_permissions;
DROP POLICY IF EXISTS "permissions_delete_policy" ON document_permissions;
-- Simple permission policies without checking documents table
CREATE POLICY "permissions_select_policy" ON document_permissions FOR
SELECT USING (
        user_id = auth.uid()
        OR granted_by = auth.uid()
    );
CREATE POLICY "permissions_insert_policy" ON document_permissions FOR
INSERT WITH CHECK (granted_by = auth.uid());
CREATE POLICY "permissions_update_policy" ON document_permissions FOR
UPDATE USING (granted_by = auth.uid());
CREATE POLICY "permissions_delete_policy" ON document_permissions FOR DELETE USING (granted_by = auth.uid());
-- ================================================================================
-- COMMENTS TABLE - Remove complex document permission checking
-- ================================================================================
DROP POLICY IF EXISTS "comments_select_policy" ON comments;
DROP POLICY IF EXISTS "comments_insert_policy" ON comments;
-- Simple comment policies - users can see comments on documents they own or that are public
CREATE POLICY "comments_select_policy" ON comments FOR
SELECT USING (
        author_id = auth.uid()
        OR EXISTS (
            SELECT 1
            FROM documents d
            WHERE d.id = comments.document_id
                AND (
                    d.owner_id = auth.uid()
                    OR d.is_public = true
                )
        )
    );
CREATE POLICY "comments_insert_policy" ON comments FOR
INSERT WITH CHECK (
        author_id = auth.uid()
        AND EXISTS (
            SELECT 1
            FROM documents d
            WHERE d.id = comments.document_id
                AND (
                    d.owner_id = auth.uid()
                    OR d.is_public = true
                )
                AND d.allow_comments = true
        )
    );
-- ================================================================================
-- DOCUMENT_VERSIONS TABLE - Remove complex permission checking
-- ================================================================================
DROP POLICY IF EXISTS "versions_select_policy" ON document_versions;
DROP POLICY IF EXISTS "versions_insert_policy" ON document_versions;
CREATE POLICY "versions_select_policy" ON document_versions FOR
SELECT USING (
        author_id = auth.uid()
        OR EXISTS (
            SELECT 1
            FROM documents d
            WHERE d.id = document_versions.document_id
                AND (
                    d.owner_id = auth.uid()
                    OR d.is_public = true
                )
        )
    );
CREATE POLICY "versions_insert_policy" ON document_versions FOR
INSERT WITH CHECK (
        author_id = auth.uid()
        AND EXISTS (
            SELECT 1
            FROM documents d
            WHERE d.id = document_versions.document_id
                AND d.owner_id = auth.uid()
        )
    );
-- ================================================================================
-- USER_PRESENCE TABLE - Simplify policies
-- ================================================================================
DROP POLICY IF EXISTS "presence_select_policy" ON user_presence;
CREATE POLICY "presence_select_policy" ON user_presence FOR
SELECT USING (
        user_id = auth.uid()
        OR EXISTS (
            SELECT 1
            FROM documents d
            WHERE d.id = user_presence.document_id
                AND (
                    d.owner_id = auth.uid()
                    OR d.is_public = true
                )
        )
    );
-- ================================================================================
-- VERIFICATION QUERIES
-- ================================================================================
-- Test that all policies work without recursion:
-- SELECT COUNT(*) FROM documents WHERE owner_id = auth.uid();
-- SELECT COUNT(*) FROM document_permissions WHERE user_id = auth.uid();
-- SELECT COUNT(*) FROM comments WHERE author_id = auth.uid();
-- SELECT COUNT(*) FROM document_versions WHERE author_id = auth.uid();
-- SELECT COUNT(*) FROM user_presence WHERE user_id = auth.uid();