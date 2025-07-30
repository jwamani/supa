-- ================================================================================
-- DOCCOLLAB PHASE 2: COLLABORATION FEATURES TEST DATA
-- ================================================================================
-- This file contains sample data and validation queries for Phase 2 features:
-- - Comments with threading and mentions
-- - Document versions with history
-- - User presence simulation
--
-- Run this AFTER running 003_phase2_collaboration.sql
-- PREREQUISITES: Phase 1 test data should already exist
-- ================================================================================
-- ================================================================================
-- SAMPLE COMMENTS DATA
-- ================================================================================
-- Check available usernames first (for debugging)
SELECT 'Available usernames:' as info,
    username
FROM profiles
ORDER BY username;
-- Get document IDs for testing (using titles from Phase 1 test data)
-- Note: Replace these with actual document IDs from your database
-- Insert root level comments on the requirements document
INSERT INTO comments (
        document_id,
        author_id,
        content,
        position_in_document,
        mentioned_users,
        is_suggestion
    )
VALUES -- First user's comment on requirements doc
    (
        (
            SELECT id
            FROM documents
            WHERE title = 'DocCollab Project Requirements'
        ),
        (
            SELECT id
            FROM profiles
            ORDER BY created_at
            LIMIT 1 -- Use first available user
        ), jsonb_build_object(
            'type', 'doc', 'content', jsonb_build_array(
                jsonb_build_object(
                    'type', 'paragraph', 'content', jsonb_build_array(
                        jsonb_build_object(
                            'type', 'text', 'text', 'Great requirements document! I think we should also consider '
                        ), jsonb_build_object(
                            'type', 'mention', 'attrs', jsonb_build_object(
                                'id', (
                                    SELECT id
                                    FROM profiles
                                    ORDER BY created_at
                                    LIMIT 1 OFFSET 1
                                )::text,
                                -- Second user
                                'label',
                                '@' || (
                                    SELECT username
                                    FROM profiles
                                    ORDER BY created_at
                                    LIMIT 1 OFFSET 1
                                )
                            )
                        ),
                        jsonb_build_object(
                            'type',
                            'text',
                            'text',
                            ' adding offline support for mobile editing.'
                        )
                    )
                )
            )
        ),
        '{"line": 15, "column": 0, "selection": {"from": 245, "to": 280}}'::jsonb,
        ARRAY [(SELECT id FROM profiles ORDER BY created_at LIMIT 1 OFFSET 1)]::UUID [],
        -- Mention second user
        false -- Not a suggestion
    ),
    -- Second user's design feedback
    (
        (
            SELECT id
            FROM documents
            WHERE title = 'DocCollab Project Requirements'
        ),
        (
            SELECT id
            FROM profiles
            ORDER BY created_at
            LIMIT 1 OFFSET 1 -- Use second available user
        ),
        '{
        "type": "doc",
        "content": [
            {
                "type": "paragraph",
                "content": [
                    {"type": "text", "text": "From a design perspective, we need to ensure the real-time collaboration is visually clear. Users should easily see who is editing what."}
                ]
            }
        ]
    }'::jsonb,
        '{"line": 8, "column": 0, "selection": {"from": 120, "to": 150}}'::jsonb,
        ARRAY []::UUID [],
        false -- Not a suggestion
    ),
    -- Third user's suggestion comment
    (
        (
            SELECT id
            FROM documents
            WHERE title = 'API Design Draft'
        ),
        (
            SELECT id
            FROM profiles
            ORDER BY created_at
            LIMIT 1 OFFSET 2 -- Use third available user if exists, otherwise first
        ),
        '{
        "type": "doc",
        "content": [
            {
                "type": "paragraph",
                "content": [
                    {"type": "text", "text": "Should we add rate limiting to prevent API abuse? Something like 1000 requests per hour per user."}
                ]
            }
        ]
    }'::jsonb,
        '{"line": 25, "column": 0, "selection": {"from": 400, "to": 450}}'::jsonb,
        ARRAY []::UUID [],
        true -- This is a suggestion
    );
-- Insert threaded replies to the first comment
INSERT INTO comments (
        document_id,
        author_id,
        parent_comment_id,
        content,
        mentioned_users
    )
VALUES -- Second user's reply to first user's comment
    (
        (
            SELECT id
            FROM documents
            WHERE title = 'DocCollab Project Requirements'
        ),
        (
            SELECT id
            FROM profiles
            ORDER BY created_at
            LIMIT 1 OFFSET 1 -- Use second available user
        ),
        (
            SELECT id
            FROM comments
            WHERE author_id = (
                    SELECT id
                    FROM profiles
                    ORDER BY created_at
                    LIMIT 1
                ) -- First user's comment
                AND document_id = (
                    SELECT id
                    FROM documents
                    WHERE title = 'DocCollab Project Requirements'
                )
            LIMIT 1
        ), jsonb_build_object(
            'type', 'doc', 'content', jsonb_build_array(
                jsonb_build_object(
                    'type', 'paragraph', 'content', jsonb_build_array(
                        jsonb_build_object('type', 'text', 'text', 'Excellent point '), jsonb_build_object(
                            'type', 'mention', 'attrs', jsonb_build_object(
                                'id', (
                                    SELECT id
                                    FROM profiles
                                    ORDER BY created_at
                                    LIMIT 1
                                )::text, -- First user
                                'label', '@' || (
                                    SELECT username
                                    FROM profiles
                                    ORDER BY created_at
                                    LIMIT 1
                                )
                            )
                        ), jsonb_build_object(
                            'type', 'text', 'text', '! Offline support is definitely a must-have feature. I''ll add it to the roadmap.'
                        )
                    )
                )
            )
        ), ARRAY [(SELECT id FROM profiles ORDER BY created_at LIMIT 1)]::UUID [] -- Mention first user back
    ), -- Third user's reply to the thread
    (
        (
            SELECT id
            FROM documents
            WHERE title = 'DocCollab Project Requirements'
        ),
        (
            SELECT id
            FROM profiles
            ORDER BY created_at
            LIMIT 1 OFFSET 2 -- Use third available user
        ),
        (
            SELECT id
            FROM comments
            WHERE author_id = (
                    SELECT id
                    FROM profiles
                    ORDER BY created_at
                    LIMIT 1
                ) -- First user's comment
                AND document_id = (
                    SELECT id
                    FROM documents
                    WHERE title = 'DocCollab Project Requirements'
                )
            LIMIT 1
        ), '{
        "type": "doc",
        "content": [
            {
                "type": "paragraph",
                "content": [
                    {"type": "text", "text": "For offline support, we should consider a conflict resolution UI when users come back online with conflicting changes."}
                ]
            }
        ]
    }'::jsonb, ARRAY []::UUID []
    );
-- ================================================================================
-- SAMPLE DOCUMENT VERSIONS DATA
-- ================================================================================
-- Create some version history for the API Design document
-- Version 2: First user adds authentication section
SELECT create_document_version(
        (
            SELECT id
            FROM documents
            WHERE title = 'API Design Draft'
        ),
        (
            SELECT id
            FROM profiles
            ORDER BY created_at
            LIMIT 1 -- Use first available user
        ), '{
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
                "type": "heading",
                "attrs": {"level": 2},
                "content": [{"type": "text", "text": "Authentication"}]
            },
            {
                "type": "paragraph",
                "content": [
                    {"type": "text", "text": "All API endpoints require authentication via JWT tokens. Users must include the Authorization header with Bearer token format."}
                ]
            },
            {
                "type": "codeBlock",
                "attrs": {"language": "javascript"},
                "content": [
                    {"type": "text", "text": "// GET /api/documents\\n// Returns list of documents for authenticated user\\napp.get(\"/api/documents\", authenticate, async (req, res) => {\\n  const documents = await getDocumentsForUser(req.user.id);\\n  res.json(documents);\\n});"}
                ]
            }
        ]
    }'::jsonb, 'Added authentication section and JWT token requirements', false -- Not a major version
    );
-- Version 3: Second user adds rate limiting based on suggestion
SELECT create_document_version(
        (
            SELECT id
            FROM documents
            WHERE title = 'API Design Draft'
        ),
        (
            SELECT id
            FROM profiles
            ORDER BY created_at
            LIMIT 1 OFFSET 1 -- Use second available user
        ),
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
                "type": "heading",
                "attrs": {"level": 2},
                "content": [{"type": "text", "text": "Authentication"}]
            },
            {
                "type": "paragraph",
                "content": [
                    {"type": "text", "text": "All API endpoints require authentication via JWT tokens. Users must include the Authorization header with Bearer token format."}
                ]
            },
            {
                "type": "heading",
                "attrs": {"level": 2},
                "content": [{"type": "text", "text": "Rate Limiting"}]
            },
            {
                "type": "paragraph",
                "content": [
                    {"type": "text", "text": "To prevent abuse, all API endpoints are rate limited to 1000 requests per hour per authenticated user. Rate limit information is returned in response headers."}
                ]
            },
            {
                "type": "codeBlock",
                "attrs": {"language": "javascript"},
                "content": [
                    {"type": "text", "text": "// GET /api/documents\\n// Returns list of documents for authenticated user\\napp.get(\"/api/documents\", authenticate, rateLimit, async (req, res) => {\\n  const documents = await getDocumentsForUser(req.user.id);\\n  res.json(documents);\\n});"}
                ]
            }
        ]
    }'::jsonb,
        'Added rate limiting section per Sarah''s suggestion',
        true -- Make this a major version
    );
-- ================================================================================
-- SAMPLE USER PRESENCE DATA
-- ================================================================================
-- Simulate active users on documents
-- First user is actively editing the API document
SELECT update_user_presence(
        (
            SELECT id
            FROM profiles
            ORDER BY created_at
            LIMIT 1
        )::UUID, (
            SELECT id
            FROM documents
            WHERE title = 'API Design Draft'
        ),
        'session_user1_123',
        '{"line": 20, "column": 45, "offset": 350}'::jsonb,
        true,
        -- is typing
        'ws_connection_user1_456'
    );
-- Second user is viewing the requirements document
SELECT update_user_presence(
        (
            SELECT id
            FROM profiles
            ORDER BY created_at
            LIMIT 1 OFFSET 1
        )::UUID,
        (
            SELECT id
            FROM documents
            WHERE title = 'DocCollab Project Requirements'
        ),
        'session_user2_789',
        '{"line": 10, "column": 0, "offset": 180}'::jsonb,
        false,
        -- not typing
        'ws_connection_user2_101'
    );
-- Third user is reviewing the UI mockups document (if exists)
SELECT update_user_presence(
        (
            SELECT id
            FROM profiles
            ORDER BY created_at
            LIMIT 1 OFFSET 2
        )::UUID,
        (
            SELECT id
            FROM documents
            WHERE title = 'UI Mockups and Wireframes'
        ),
        'session_user3_456',
        '{"line": 5, "column": 12, "offset": 85}'::jsonb,
        false,
        -- not typing
        'ws_connection_user3_789'
    );
-- ================================================================================
-- VALIDATION QUERIES - PHASE 2 FEATURES
-- ================================================================================
-- Test 1: Verify comment threading structure with UUIDs
SELECT c.id::text as comment_id,
    c.document_id::text as document_id,
    d.title as document_title,
    c.content_text as comment_text,
    p.username as author,
    p.id::text as author_id,
    c.parent_comment_id::text as parent_comment_id,
    c.thread_root_id::text as thread_root_id,
    c.depth_level,
    c.reply_count,
    c.is_suggestion,
    c.suggestion_accepted,
    array_length(c.mentioned_users, 1) as mentions_count,
    c.created_at
FROM comments c
    JOIN profiles p ON c.author_id = p.id
    JOIN documents d ON c.document_id = d.id
ORDER BY d.title,
    c.thread_root_id NULLS FIRST,
    c.depth_level,
    c.created_at;
-- Test 2: Test comment thread reconstruction function
SELECT *
FROM get_comment_thread(
        (
            SELECT id
            FROM comments
            WHERE parent_comment_id IS NULL
            LIMIT 1
        )
    );
-- Test 3: Verify document version history
SELECT d.title,
    dv.version_number,
    p.username as author,
    dv.change_summary,
    dv.is_major_version,
    dv.is_auto_save,
    dv.content_size_bytes,
    dv.created_at
FROM document_versions dv
    JOIN documents d ON dv.document_id = d.id
    JOIN profiles p ON dv.author_id = p.id
ORDER BY d.title,
    dv.version_number;
-- Test 4: Test version history function
SELECT *
FROM get_document_version_history(
        (
            SELECT id
            FROM documents
            WHERE title = 'API Design Draft'
        )
    );
-- Test 5: Verify user presence tracking
SELECT d.title,
    p.username,
    up.status,
    up.cursor_position,
    up.is_typing,
    up.last_seen_at,
    up.session_id
FROM user_presence up
    JOIN documents d ON up.document_id = d.id
    JOIN profiles p ON up.user_id = p.id
ORDER BY d.title,
    up.last_activity_at DESC;
-- Test 6: Test active users function
SELECT *
FROM get_document_active_users(
        (
            SELECT id
            FROM documents
            WHERE title = 'API Design Draft'
        )
    );
-- Test 7: Verify mention tracking in comments
SELECT d.title,
    c.content_text,
    p.username as author,
    array_length(c.mentioned_users, 1) as mention_count,
    (
        SELECT array_agg(mentioned_p.username)
        FROM unnest(c.mentioned_users) AS mentioned_user_id
            JOIN profiles mentioned_p ON mentioned_p.id = mentioned_user_id
    ) as mentioned_usernames
FROM comments c
    JOIN documents d ON c.document_id = d.id
    JOIN profiles p ON c.author_id = p.id
WHERE array_length(c.mentioned_users, 1) > 0;
-- Test 8: Check comment reply counts are accurate
SELECT c.id,
    c.content_text,
    c.reply_count,
    (
        SELECT COUNT(*)
        FROM comments replies
        WHERE replies.parent_comment_id = c.id
    ) as actual_reply_count
FROM comments c
WHERE c.reply_count > 0
ORDER BY c.created_at;
-- Test 9: Test suggestions and their acceptance status
SELECT d.title,
    c.content_text,
    p.username as suggester,
    c.is_suggestion,
    c.suggestion_accepted,
    c.created_at
FROM comments c
    JOIN documents d ON c.document_id = d.id
    JOIN profiles p ON c.author_id = p.id
WHERE c.is_suggestion = true;
-- ================================================================================
-- PERFORMANCE TESTING QUERIES
-- ================================================================================
-- Test comment search performance
EXPLAIN (ANALYZE, BUFFERS)
SELECT c.*,
    p.username
FROM comments c
    JOIN profiles p ON c.author_id = p.id
WHERE c.search_vector @@ plainto_tsquery('english', 'offline support');
-- Test version history query performance
EXPLAIN (ANALYZE, BUFFERS)
SELECT *
FROM document_versions
WHERE document_id = (
        SELECT id
        FROM documents
        WHERE title = 'API Design Draft'
    )
ORDER BY version_number DESC;
-- Test presence query performance
EXPLAIN (ANALYZE, BUFFERS)
SELECT *
FROM user_presence
WHERE document_id = (
        SELECT id
        FROM documents
        WHERE title = 'API Design Draft'
    )
    AND status = 'active'
    AND last_seen_at > NOW() - INTERVAL '5 minutes';
-- ================================================================================
-- COLLABORATION WORKFLOW SIMULATION
-- ================================================================================
-- Simulate a collaborative editing session:
-- 1. Mark suggestion as accepted
UPDATE comments
SET suggestion_accepted = true,
    resolved_at = NOW(),
    resolved_by = (
        SELECT id
        FROM profiles
        ORDER BY created_at
        LIMIT 1
    ) -- First user accepts it
WHERE is_suggestion = true
    AND author_id = (
        SELECT id
        FROM profiles
        ORDER BY created_at
        LIMIT 1 OFFSET 2
    );
-- Third user suggested it
-- 2. Add a follow-up comment after accepting the suggestion
INSERT INTO comments (
        document_id,
        author_id,
        content,
        parent_comment_id
    )
VALUES (
        (
            SELECT id
            FROM documents
            WHERE title = 'API Design Draft'
        ),
        (
            SELECT id
            FROM profiles
            ORDER BY created_at
            LIMIT 1
        ), -- First user
        '{
        "type": "doc",
        "content": [
            {
                "type": "paragraph",
                "content": [
                    {"type": "text", "text": "Great suggestion! I''ve implemented the rate limiting. Thanks for the feedback."}
                ]
            }
        ]
    }'::jsonb, (
            SELECT id
            FROM comments
            WHERE is_suggestion = true
                AND author_id = (
                    SELECT id
                    FROM profiles
                    ORDER BY created_at
                    LIMIT 1 OFFSET 2
                ) -- Third user's suggestion
            LIMIT 1
        )
    );
-- 3. Simulate stale presence cleanup
SELECT cleanup_stale_presence();
-- ================================================================================
-- SUMMARY STATISTICS - PHASE 2
-- ================================================================================
SELECT 'Comments' as feature,
    COUNT(*) as total_count,
    COUNT(*) FILTER (
        WHERE parent_comment_id IS NOT NULL
    ) as replies,
    COUNT(*) FILTER (
        WHERE is_suggestion = true
    ) as suggestions,
    COUNT(*) FILTER (
        WHERE array_length(mentioned_users, 1) > 0
    ) as with_mentions
FROM comments
UNION ALL
SELECT 'Document Versions' as feature,
    COUNT(*) as total_count,
    COUNT(*) FILTER (
        WHERE is_major_version = true
    ) as major_versions,
    COUNT(*) FILTER (
        WHERE is_auto_save = true
    ) as auto_saves,
    AVG(content_size_bytes)::integer as avg_size_bytes
FROM document_versions
UNION ALL
SELECT 'User Presence' as feature,
    COUNT(*) as total_count,
    COUNT(*) FILTER (
        WHERE status = 'active'
    ) as active_sessions,
    COUNT(*) FILTER (
        WHERE is_typing = true
    ) as typing_sessions,
    EXTRACT(
        EPOCH
        FROM AVG(last_activity_at - session_start_at)
    )::integer as avg_session_seconds
FROM user_presence;
-- ================================================================================
-- END OF PHASE 2 TEST DATA
-- ================================================================================