-- ================================================================================
-- DOCCOLLAB PHASE 1: TEST DATA AND VALIDATION QUERIES
-- ================================================================================
-- This file contains sample data and validation queries to test the Phase 1 schema
-- Run this AFTER running 001_phase1_core_foundation.sql
--
-- LEARNING OBJECTIVES:
-- - Testing database constraints and validation
-- - Understanding JSONB operations and queries
-- - Validating RLS policies work correctly
-- - Testing full-text search functionality
-- - Performance testing with realistic data
-- ================================================================================
-- ================================================================================
-- SAMPLE DATA INSERTION
-- ================================================================================
-- NOTE: In a real application, user profiles would be created via Supabase Auth
-- For testing, we'll assume some users exist in auth.users
-- You'll need to replace these UUIDs with actual user IDs from your auth.users table
-- Insert sample profiles
INSERT INTO profiles (id, username, full_name, email, bio, preferences)
VALUES (
        '971a9f98-9878-4db8-ae96-5dbde394e234',
        -- Replace with actual user ID
        'johndev',
        'John Developer',
        'john@example.com',
        'Full-stack developer passionate about building collaborative tools.',
        '{
        "theme": "dark",
        "notifications": {
            "email": true,
            "mentions": true,
            "comments": true,
            "shares": false
        },
        "editor": {
            "auto_save": true,
            "spell_check": false,
            "word_wrap": true
        }
    }'::jsonb
    ),
    (
        'ac6dd71d-5d1d-464a-8373-d00423acfab2',
        -- Replace with actual user ID
        'sarahpm',
        'Sarah Product Manager',
        'sarah@example.com',
        'Product manager focused on user experience and feature strategy.',
        '{
        "theme": "light",
        "notifications": {
            "email": true,
            "mentions": true,
            "comments": true,
            "shares": true
        },
        "editor": {
            "auto_save": true,
            "spell_check": true,
            "word_wrap": false
        }
    }'::jsonb
    ),
    (
        'ad2ecbb4-bb2a-41b0-9f35-1ac5b9f26894',
        -- Replace with actual user ID
        'mikedesign',
        'Mike Designer',
        'mike@example.com',
        'UI/UX designer with a passion for clean, intuitive interfaces.',
        DEFAULT -- Will use default preferences
    );
-- Insert sample documents
INSERT INTO documents (
        title,
        content,
        owner_id,
        category,
        tags,
        status,
        is_public,
        allow_comments
    )
VALUES (
        'DocCollab Project Requirements',
        '{
        "type": "doc",
        "content": [
            {
                "type": "heading",
                "attrs": {"level": 1},
                "content": [{"type": "text", "text": "DocCollab Requirements"}]
            },
            {
                "type": "paragraph",
                "content": [
                    {"type": "text", "text": "This document outlines the requirements for our collaborative document editing platform. The platform should support real-time editing, comments, version history, and secure sharing capabilities."}
                ]
            },
            {
                "type": "heading",
                "attrs": {"level": 2},
                "content": [{"type": "text", "text": "Core Features"}]
            },
            {
                "type": "bulletList",
                "content": [
                    {
                        "type": "listItem",
                        "content": [
                            {"type": "paragraph", "content": [{"type": "text", "text": "Real-time collaborative editing"}]}
                        ]
                    },
                    {
                        "type": "listItem",
                        "content": [
                            {"type": "paragraph", "content": [{"type": "text", "text": "Document sharing and permissions"}]}
                        ]
                    },
                    {
                        "type": "listItem",
                        "content": [
                            {"type": "paragraph", "content": [{"type": "text", "text": "Version history and recovery"}]}
                        ]
                    }
                ]
            }
        ]
    }'::jsonb,
        'ac6dd71d-5d1d-464a-8373-d00423acfab2',
        'project',
        ARRAY ['requirements', 'collaboration', 'platform'],
        'published',
        true,
        true
    ),
    (
        'API Design Draft',
        '{
        "type": "doc",
        "content": [
            {
                "type": "heading",
                "attrs": {"level": 1},
                "content": [{"type": "text", "text": "API Design Document"}]
            },
            {
                "type": "paragraph",
                "content": [
                    {"type": "text", "text": "This document describes the REST API endpoints for DocCollab. All endpoints follow RESTful conventions and include proper authentication and authorization."}
                ]
            },
            {
                "type": "codeBlock",
                "attrs": {"language": "javascript"},
                "content": [
                    {"type": "text", "text": "// GET /api/documents\n// Returns list of documents for authenticated user\napp.get(\"/api/documents\", authenticate, async (req, res) => {\n  const documents = await getDocumentsForUser(req.user.id);\n  res.json(documents);\n});"}
                ]
            }
        ]
    }'::jsonb,
        '971a9f98-9878-4db8-ae96-5dbde394e234',
        'technical',
        ARRAY ['api', 'backend', 'development'],
        'draft',
        false,
        true
    ),
    (
        'UI Mockups and Wireframes',
        '{
        "type": "doc",
        "content": [
            {
                "type": "heading",
                "attrs": {"level": 1},
                "content": [{"type": "text", "text": "DocCollab UI Design"}]
            },
            {
                "type": "paragraph",
                "content": [
                    {"type": "text", "text": "Initial wireframes and mockups for the DocCollab user interface. Focus on clean, intuitive design that promotes collaboration."}
                ]
            },
            {
                "type": "paragraph",
                "content": [
                    {"type": "text", "text": "Key design principles:"}
                ]
            },
            {
                "type": "bulletList",
                "content": [
                    {
                        "type": "listItem",
                        "content": [
                            {"type": "paragraph", "content": [{"type": "text", "text": "Minimalist interface to reduce cognitive load"}]}
                        ]
                    },
                    {
                        "type": "listItem",
                        "content": [
                            {"type": "paragraph", "content": [{"type": "text", "text": "Clear visual hierarchy for document structure"}]}
                        ]
                    },
                    {
                        "type": "listItem",
                        "content": [
                            {"type": "paragraph", "content": [{"type": "text", "text": "Prominent collaboration indicators"}]}
                        ]
                    }
                ]
            }
        ]
    }'::jsonb,
        '971a9f98-9878-4db8-ae96-5dbde394e234',
        'design',
        ARRAY ['ui', 'ux', 'wireframes', 'mockups'],
        'published',
        false,
        true
    );
-- Insert sample document permissions
INSERT INTO document_permissions (
        document_id,
        user_id,
        role,
        granted_by,
        can_reshare
    )
VALUES -- Give John editor access to Sarah's requirements document
    (
        (
            SELECT id
            FROM documents
            WHERE title = 'DocCollab Project Requirements'
        ),
        '971a9f98-9878-4db8-ae96-5dbde394e234',
        'editor',
        'ac6dd71d-5d1d-464a-8373-d00423acfab2',
        true
    ),
    -- Give Mike commenter access to Sarah's requirements document
    (
        (
            SELECT id
            FROM documents
            WHERE title = 'DocCollab Project Requirements'
        ),
        'ad2ecbb4-bb2a-41b0-9f35-1ac5b9f26894',
        'commenter',
        'ac6dd71d-5d1d-464a-8373-d00423acfab2',
        false
    ),
    -- Give Sarah viewer access to John's API document
    (
        (
            SELECT id
            FROM documents
            WHERE title = 'API Design Draft'
        ),
        'ac6dd71d-5d1d-464a-8373-d00423acfab2',
        'viewer',
        '971a9f98-9878-4db8-ae96-5dbde394e234',
        false
    );
-- ================================================================================
-- VALIDATION QUERIES
-- ================================================================================
-- Test 1: Verify profiles were created correctly
SELECT username,
    full_name,
    preferences->>'theme' as theme,
    preferences->'notifications'->>'email' as email_notifications,
    created_at
FROM profiles
ORDER BY created_at;
-- Test 2: Verify document statistics were calculated automatically
SELECT title,
    word_count,
    character_count,
    reading_time_minutes,
    array_length(tags, 1) as tag_count,
    status
FROM documents
ORDER BY created_at;
-- Test 3: Test full-text search functionality
-- Search for documents containing "collaboration"
SELECT title,
    category,
    tags,
    content_text,
    search_vector,
    ts_rank(
        search_vector,
        plainto_tsquery('english', 'collaboration')
    ) as rank
FROM documents
WHERE search_vector @@ plainto_tsquery('english', 'collaboration')
ORDER BY rank DESC;
-- Test 4: Verify permission system works
SELECT d.title,
    p.username as owner,
    dp.role,
    granted_user.username as granted_to,
    dp.can_reshare,
    dp.granted_at
FROM documents d
    JOIN profiles p ON d.owner_id = p.id
    LEFT JOIN document_permissions dp ON d.id = dp.document_id
    LEFT JOIN profiles granted_user ON dp.user_id = granted_user.id
ORDER BY d.title,
    dp.role;
-- Test 5: Test permission helper functions
-- Check if John has editor permission on the requirements document
SELECT user_has_document_permission(
        (
            SELECT id
            FROM documents
            WHERE title = 'DocCollab Project Requirements'
        ),
        '971a9f98-9878-4db8-ae96-5dbde394e234',
        'editor'
    ) as john_can_edit;
-- Get user roles for all documents
SELECT d.title,
    p.username,
    get_user_document_role(d.id, p.id) as role
FROM documents d
    CROSS JOIN profiles p
WHERE get_user_document_role(d.id, p.id) IS NOT NULL
ORDER BY d.title,
    p.username;
-- Test 6: Test JSONB preference queries
-- Find users who prefer dark theme
SELECT username,
    full_name
FROM profiles
WHERE preferences->>'theme' = 'dark';
-- Find users with email notifications enabled
SELECT username,
    full_name
FROM profiles
WHERE (preferences->'notifications'->>'email')::boolean = true;
-- Test 7: Test document organization queries
-- Group documents by category
SELECT category,
    COUNT(*) as document_count,
    AVG(word_count) as avg_word_count
FROM documents
WHERE status != 'deleted'
GROUP BY category
ORDER BY document_count DESC;
-- Test 8: Test tag-based queries (array operations)
-- Find documents with specific tags
SELECT title,
    tags
FROM documents
WHERE 'collaboration' = ANY(tags);
-- Find most used tags
SELECT unnest(tags) as tag,
    COUNT(*) as usage_count
FROM documents
WHERE status != 'deleted'
GROUP BY tag
ORDER BY usage_count DESC;
-- ================================================================================
-- PERFORMANCE TESTING QUERIES
-- ================================================================================
-- Test index usage for common queries
EXPLAIN (ANALYZE, BUFFERS)
SELECT *
FROM documents
WHERE owner_id = '971a9f98-9878-4db8-ae96-5dbde394e234'
ORDER BY created_at DESC;
EXPLAIN (ANALYZE, BUFFERS)
SELECT *
FROM documents
WHERE search_vector @@ plainto_tsquery('english', 'api design');
EXPLAIN (ANALYZE, BUFFERS)
SELECT dp.*
FROM document_permissions dp
WHERE dp.user_id = 'ac6dd71d-5d1d-464a-8373-d00423acfab2'
    AND dp.is_active = true;
-- ================================================================================
-- DATA VALIDATION CONSTRAINTS TESTING
-- ================================================================================
-- Test constraint violations (these should fail)

 -- This should fail: title too long
 INSERT INTO documents (title, owner_id) VALUES 
 (REPEAT('A', 201), '550e8400-e29b-41d4-a716-446655440000');
 
 -- This should fail: bio too long
 UPDATE profiles SET bio = REPEAT('A', 501) 
 WHERE id = '550e8400-e29b-41d4-a716-446655440000';
 
 -- This should fail: invalid status
 INSERT INTO documents (title, owner_id, status) VALUES 
 ('Test Doc', '550e8400-e29b-41d4-a716-446655440000', 'invalid_status');
 
 -- This should fail: duplicate username
    INSERT INTO profiles (id, username) VALUES 
    ('550e8400-e29b-41d4-a716-446655440003', 'johndev');
    
-- ================================================================================
-- CLEANUP QUERIES (for testing)
-- ================================================================================

 -- Uncomment to clean up test data
 DELETE FROM document_permissions;
 DELETE FROM documents;
 DELETE FROM profiles;
 
-- ================================================================================
-- SUMMARY STATISTICS
-- ================================================================================
-- Final summary of the test data
SELECT 'Profiles' as table_name,
    COUNT(*) as record_count
FROM profiles
UNION ALL
SELECT 'Documents' as table_name,
    COUNT(*) as record_count
FROM documents
UNION ALL
SELECT 'Document Permissions' as table_name,
    COUNT(*) as record_count
FROM document_permissions
ORDER BY table_name;
-- ================================================================================
-- END OF TEST DATA AND VALIDATION
-- ================================================================================