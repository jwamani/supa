-- ================================================================================
-- DOCCOLLAB PHASE 2: COLLABORATION FEATURES MIGRATION
-- ================================================================================
-- This file contains the SQL for Phase 2 collaboration features:
-- - Comments system with threading
-- - Document versions with delta storage  
-- - User presence for real-time collaboration
--
-- LEARNING OBJECTIVES:
-- - Hierarchical data structures (self-referencing FKs)
-- - Version control patterns and delta storage
-- - Real-time presence tracking and cleanup
-- - Advanced PostgreSQL features (recursive CTEs, etc.)
--
-- PREREQUISITES: 
-- - Phase 1 migration must be completed first
-- - All Phase 1 tables (profiles, documents, document_permissions) must exist
-- ================================================================================
-- ================================================================================
-- PHASE 2 UTILITY FUNCTIONS (Create first for use in triggers)
-- ================================================================================
-- Enhanced text extraction function for comments (recursive CTE pattern)
CREATE OR REPLACE FUNCTION extract_comment_text(content JSONB) RETURNS TEXT AS $$ WITH RECURSIVE recursive_text_nodes(json_node) AS (
        SELECT jsonb_array_elements(content->'content')
        UNION ALL
        SELECT jsonb_array_elements(json_node->'content')
        FROM recursive_text_nodes
        WHERE json_node ? 'content'
    )
SELECT string_agg(json_node->>'text', '')
FROM recursive_text_nodes
WHERE json_node->>'type' = 'text'
    AND json_node->>'text' IS NOT NULL
    AND btrim(json_node->>'text') <> '' $$ LANGUAGE SQL IMMUTABLE;
-- ================================================================================
-- TABLE 4: COMMENTS SYSTEM
-- ================================================================================
-- Threaded comment system for document collaboration
-- LEARNING: Self-referencing relationships, hierarchical data, soft deletion
CREATE TABLE comments (
    -- Primary identification
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    -- Relationships
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    parent_comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
    -- For threading
    -- Comment content
    content JSONB NOT NULL,
    -- Rich text content (similar to document content)
    content_text TEXT,
    -- Plain text for search and notifications
    search_vector tsvector,
    -- Pre-computed search vector for GIN index
    -- Comment positioning and organization
    position_in_document JSONB,
    -- { "line": 10, "column": 5, "selection": {...} }
    thread_root_id UUID,
    -- Points to the root comment of the thread
    depth_level INTEGER DEFAULT 0,
    -- How deep in the thread (0 = root level)
    sort_order INTEGER DEFAULT 0,
    -- For ordering within the same level
    -- Comment status and metadata
    status TEXT DEFAULT 'active' CHECK (
        status IN ('active', 'deleted', 'hidden', 'resolved')
    ),
    is_suggestion BOOLEAN DEFAULT false,
    -- Is this a suggested edit?
    suggestion_accepted BOOLEAN,
    -- If suggestion, was it accepted?
    -- Engagement tracking
    upvotes INTEGER DEFAULT 0,
    downvotes INTEGER DEFAULT 0,
    reply_count INTEGER DEFAULT 0,
    -- Denormalized count for performance
    -- Mentions and notifications
    mentioned_users UUID [] DEFAULT '{}',
    -- Array of mentioned user IDs
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ,
    resolved_by UUID REFERENCES auth.users(id)
);
-- Indexes for hierarchical queries and performance
CREATE INDEX idx_comments_thread_root ON comments(thread_root_id, sort_order)
WHERE thread_root_id IS NOT NULL;
CREATE INDEX idx_comments_parent ON comments(parent_comment_id, created_at)
WHERE parent_comment_id IS NOT NULL;
CREATE INDEX idx_comments_document ON comments(document_id, created_at DESC)
WHERE status = 'active';
CREATE INDEX idx_comments_document_position ON comments(document_id, status)
WHERE position_in_document IS NOT NULL;
CREATE INDEX idx_comments_author ON comments(author_id, created_at DESC);
CREATE INDEX idx_comments_mentions ON comments USING GIN(mentioned_users)
WHERE array_length(mentioned_users, 1) > 0;
CREATE INDEX idx_comments_resolved ON comments(document_id, resolved_at)
WHERE status = 'resolved';
CREATE INDEX idx_comments_suggestions ON comments(document_id, is_suggestion, suggestion_accepted)
WHERE is_suggestion = true;
CREATE INDEX idx_comments_search ON comments USING GIN(search_vector);
-- ================================================================================
-- COMMENT HELPER FUNCTIONS
-- ================================================================================
-- Function to get complete comment thread
CREATE OR REPLACE FUNCTION get_comment_thread(root_comment_id UUID) RETURNS TABLE (
        id UUID,
        content JSONB,
        author_username TEXT,
        depth_level INTEGER,
        created_at TIMESTAMPTZ,
        reply_count INTEGER
    ) AS $$ BEGIN RETURN QUERY WITH RECURSIVE comment_tree AS (
        -- Base case: get the root comment
        SELECT c.id,
            c.content,
            p.username,
            c.depth_level,
            c.created_at,
            c.reply_count,
            c.sort_order
        FROM comments c
            JOIN profiles p ON c.author_id = p.id
        WHERE c.id = root_comment_id
            AND c.status = 'active'
        UNION ALL
        -- Recursive case: get child comments
        SELECT c.id,
            c.content,
            p.username,
            c.depth_level,
            c.created_at,
            c.reply_count,
            c.sort_order
        FROM comments c
            JOIN profiles p ON c.author_id = p.id
            JOIN comment_tree ct ON c.parent_comment_id = ct.id
        WHERE c.status = 'active'
    )
SELECT ct.id,
    ct.content,
    ct.username,
    ct.depth_level,
    ct.created_at,
    ct.reply_count
FROM comment_tree ct
ORDER BY ct.depth_level,
    ct.sort_order,
    ct.created_at;
END;
$$ LANGUAGE plpgsql;
-- Function to update reply counts when comments are added/removed
CREATE OR REPLACE FUNCTION update_comment_reply_counts() RETURNS TRIGGER AS $$ BEGIN IF TG_OP = 'INSERT' THEN -- Increment reply count for parent comment
    IF NEW.parent_comment_id IS NOT NULL THEN
UPDATE comments
SET reply_count = reply_count + 1
WHERE id = NEW.parent_comment_id;
END IF;
-- Set thread root ID if this is a reply
IF NEW.parent_comment_id IS NOT NULL THEN
UPDATE comments
SET thread_root_id = COALESCE(
        (
            SELECT thread_root_id
            FROM comments
            WHERE id = NEW.parent_comment_id
        ),
        NEW.parent_comment_id
    ),
    depth_level = COALESCE(
        (
            SELECT depth_level + 1
            FROM comments
            WHERE id = NEW.parent_comment_id
        ),
        1
    )
WHERE id = NEW.id;
END IF;
RETURN NEW;
END IF;
IF TG_OP = 'DELETE' THEN -- Decrement reply count for parent comment
IF OLD.parent_comment_id IS NOT NULL THEN
UPDATE comments
SET reply_count = reply_count - 1
WHERE id = OLD.parent_comment_id;
END IF;
RETURN OLD;
END IF;
RETURN NULL;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER comment_reply_count_trigger
AFTER
INSERT
    OR DELETE ON comments FOR EACH ROW EXECUTE FUNCTION update_comment_reply_counts();
-- Extract plain text from comment content and update search vector
CREATE OR REPLACE FUNCTION update_comment_text() RETURNS TRIGGER AS $$ BEGIN -- Extract plain text for search using the IMMUTABLE function
    NEW.content_text := extract_comment_text(NEW.content);
-- Update search vector for full-text search
NEW.search_vector := to_tsvector(
    'english',
    COALESCE(NEW.content_text, '')
);
-- Update timestamp
NEW.updated_at := NOW();
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER update_comment_text_trigger BEFORE
INSERT
    OR
UPDATE ON comments FOR EACH ROW EXECUTE FUNCTION update_comment_text();
-- ================================================================================
-- TABLE 5: DOCUMENT VERSIONS
-- ================================================================================
-- Complete version history with delta storage
-- LEARNING: Version control patterns, immutable audit trails, delta storage
CREATE TABLE document_versions (
    -- Primary identification
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    -- Relationships
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES auth.users(id),
    -- Version information
    version_number INTEGER NOT NULL,
    parent_version_id UUID REFERENCES document_versions(id),
    -- For branching
    is_major_version BOOLEAN DEFAULT false,
    -- Major milestones get full content snapshots
    -- Content storage strategy
    content_delta JSONB,
    -- Delta/diff from parent version
    full_content JSONB,
    -- Full content snapshot (for major versions or periodic backups)
    content_size_bytes INTEGER,
    -- Change metadata
    change_summary TEXT,
    -- User-provided description of changes
    change_type TEXT DEFAULT 'edit' CHECK (
        change_type IN ('edit', 'create', 'merge', 'revert', 'import')
    ),
    changes_word_count INTEGER DEFAULT 0,
    changes_character_count INTEGER DEFAULT 0,
    -- Collaboration metadata
    merge_base_version_id UUID REFERENCES document_versions(id),
    -- For merge tracking
    conflict_resolution JSONB,
    -- How conflicts were resolved in merges
    -- Status and visibility
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived', 'deleted')),
    is_auto_save BOOLEAN DEFAULT false,
    -- Distinguish user saves from auto-saves
    -- Analytics and tracking
    time_to_create_seconds INTEGER,
    -- How long this version took to create
    device_info JSONB,
    -- What device/browser created this version
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    -- Constraints
    CONSTRAINT unique_document_version UNIQUE(document_id, version_number)
);
-- Version history queries and performance indexes
CREATE INDEX idx_versions_document ON document_versions(document_id, version_number DESC);
CREATE INDEX idx_versions_author ON document_versions(author_id, created_at DESC);
CREATE INDEX idx_versions_major ON document_versions(document_id, is_major_version, created_at DESC)
WHERE is_major_version = true;
CREATE INDEX idx_versions_manual ON document_versions(document_id, created_at DESC)
WHERE is_auto_save = false;
CREATE INDEX idx_versions_parent ON document_versions(parent_version_id, created_at)
WHERE parent_version_id IS NOT NULL;
CREATE INDEX idx_versions_merge_base ON document_versions(merge_base_version_id)
WHERE merge_base_version_id IS NOT NULL;
CREATE INDEX idx_versions_size ON document_versions(document_id, content_size_bytes DESC);
-- ================================================================================
-- VERSION MANAGEMENT FUNCTIONS
-- ================================================================================
-- Function to create a new document version
CREATE OR REPLACE FUNCTION create_document_version(
        p_document_id UUID,
        p_author_id UUID,
        p_new_content JSONB,
        p_change_summary TEXT DEFAULT NULL,
        p_is_major BOOLEAN DEFAULT false
    ) RETURNS UUID AS $$
DECLARE v_version_number INTEGER;
v_version_id UUID;
v_current_content JSONB;
v_content_delta JSONB;
BEGIN -- Get next version number
SELECT COALESCE(MAX(version_number), 0) + 1 INTO v_version_number
FROM document_versions
WHERE document_id = p_document_id;
-- Get current document content for delta calculation
SELECT content INTO v_current_content
FROM documents
WHERE id = p_document_id;
-- Calculate delta (simplified - real implementation would use proper diff algorithm)
v_content_delta := json_build_object(
    'added',
    p_new_content,
    'removed',
    v_current_content,
    'timestamp',
    NOW()
);
-- Create version record
INSERT INTO document_versions (
        document_id,
        author_id,
        version_number,
        content_delta,
        full_content,
        change_summary,
        is_major_version,
        content_size_bytes
    )
VALUES (
        p_document_id,
        p_author_id,
        v_version_number,
        CASE
            WHEN p_is_major THEN NULL
            ELSE v_content_delta
        END,
        CASE
            WHEN p_is_major THEN p_new_content
            ELSE NULL
        END,
        p_change_summary,
        p_is_major,
        length(p_new_content::text)
    )
RETURNING id INTO v_version_id;
-- Update main document
UPDATE documents
SET content = p_new_content,
    current_version = v_version_number,
    last_saved_by = p_author_id,
    updated_at = NOW()
WHERE id = p_document_id;
RETURN v_version_id;
END;
$$ LANGUAGE plpgsql;
-- Function to restore document to a specific version
CREATE OR REPLACE FUNCTION restore_document_version(
        p_document_id UUID,
        p_version_number INTEGER,
        p_restored_by UUID
    ) RETURNS BOOLEAN AS $$
DECLARE v_version_content JSONB;
v_restored_version_id UUID;
BEGIN -- Get the content from the specified version
SELECT COALESCE(full_content, content_delta),
    id INTO v_version_content,
    v_restored_version_id
FROM document_versions
WHERE document_id = p_document_id
    AND version_number = p_version_number
    AND status = 'active';
IF NOT FOUND THEN RETURN false;
END IF;
-- If this is a delta version, we'd need to reconstruct full content
-- For now, assuming we have full content or can reconstruct it
-- Create a new version marking this as a revert
PERFORM create_document_version(
    p_document_id,
    p_restored_by,
    v_version_content,
    'Restored to version ' || p_version_number,
    true
);
RETURN true;
END;
$$ LANGUAGE plpgsql;
-- Function to get version history with author information
CREATE OR REPLACE FUNCTION get_document_version_history(p_document_id UUID) RETURNS TABLE (
        version_id UUID,
        version_number INTEGER,
        author_username TEXT,
        change_summary TEXT,
        is_major_version BOOLEAN,
        created_at TIMESTAMPTZ,
        content_size_bytes INTEGER
    ) AS $$ BEGIN RETURN QUERY
SELECT dv.id,
    dv.version_number,
    p.username,
    dv.change_summary,
    dv.is_major_version,
    dv.created_at,
    dv.content_size_bytes
FROM document_versions dv
    JOIN profiles p ON dv.author_id = p.id
WHERE dv.document_id = p_document_id
    AND dv.status = 'active'
ORDER BY dv.version_number DESC;
END;
$$ LANGUAGE plpgsql;
-- ================================================================================
-- TABLE 6: USER PRESENCE
-- ================================================================================
-- Real-time collaboration tracking
-- LEARNING: High-frequency updates, presence state management, TTL patterns
CREATE TABLE user_presence (
    -- Primary identification
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    -- Relationships
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    -- Presence state
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'idle', 'disconnected')),
    last_seen_at TIMESTAMPTZ DEFAULT NOW(),
    -- Editing context
    cursor_position JSONB,
    -- Current cursor/selection position in document
    current_selection JSONB,
    -- What text is currently selected
    editing_area JSONB,
    -- What part of document user is focused on
    -- Connection metadata
    connection_id TEXT,
    -- WebSocket or connection identifier
    session_id TEXT,
    -- Browser session identifier
    user_agent TEXT,
    -- Browser/device information
    ip_address INET,
    -- For security and analytics
    -- Activity tracking
    actions_count INTEGER DEFAULT 0,
    -- Number of actions in this session
    keystrokes_count INTEGER DEFAULT 0,
    -- Typing activity
    mouse_events_count INTEGER DEFAULT 0,
    -- Mouse/touch activity
    -- Collaboration features
    is_typing BOOLEAN DEFAULT false,
    typing_indicator_expires_at TIMESTAMPTZ,
    is_following_user UUID REFERENCES auth.users(id),
    -- Following another user's cursor
    -- Timestamps
    session_start_at TIMESTAMPTZ DEFAULT NOW(),
    last_activity_at TIMESTAMPTZ DEFAULT NOW(),
    -- Constraints
    CONSTRAINT unique_user_document_session UNIQUE(user_id, document_id, session_id)
);
-- High-performance indexes for real-time queries
CREATE INDEX idx_presence_document_active ON user_presence(document_id, status, last_seen_at)
WHERE status = 'active';
CREATE INDEX idx_presence_user_sessions ON user_presence(user_id, status, last_activity_at);
CREATE INDEX idx_presence_connection ON user_presence(connection_id, last_seen_at)
WHERE connection_id IS NOT NULL;
CREATE INDEX idx_presence_stale ON user_presence(last_seen_at)
WHERE status != 'disconnected';
CREATE INDEX idx_presence_typing ON user_presence(
    document_id,
    is_typing,
    typing_indicator_expires_at
)
WHERE is_typing = true;
-- ================================================================================
-- PRESENCE MANAGEMENT FUNCTIONS
-- ================================================================================
-- Function to update user presence
CREATE OR REPLACE FUNCTION update_user_presence(
        p_user_id UUID,
        p_document_id UUID,
        p_session_id TEXT,
        p_cursor_position JSONB DEFAULT NULL,
        p_is_typing BOOLEAN DEFAULT false,
        p_connection_id TEXT DEFAULT NULL
    ) RETURNS VOID AS $$ BEGIN
INSERT INTO user_presence (
        user_id,
        document_id,
        session_id,
        cursor_position,
        is_typing,
        typing_indicator_expires_at,
        connection_id,
        last_seen_at,
        last_activity_at
    )
VALUES (
        p_user_id,
        p_document_id,
        p_session_id,
        p_cursor_position,
        p_is_typing,
        CASE
            WHEN p_is_typing THEN NOW() + INTERVAL '3 seconds'
            ELSE NULL
        END,
        p_connection_id,
        NOW(),
        NOW()
    ) ON CONFLICT (user_id, document_id, session_id) DO
UPDATE
SET cursor_position = EXCLUDED.cursor_position,
    is_typing = EXCLUDED.is_typing,
    typing_indicator_expires_at = EXCLUDED.typing_indicator_expires_at,
    last_seen_at = NOW(),
    last_activity_at = NOW(),
    status = 'active';
END;
$$ LANGUAGE plpgsql;
-- Function to get active users on a document
CREATE OR REPLACE FUNCTION get_document_active_users(p_document_id UUID) RETURNS TABLE (
        user_id UUID,
        username TEXT,
        avatar_url TEXT,
        cursor_position JSONB,
        is_typing BOOLEAN,
        last_seen_at TIMESTAMPTZ
    ) AS $$ BEGIN RETURN QUERY
SELECT up.user_id,
    p.username,
    p.avatar_url,
    up.cursor_position,
    up.is_typing
    AND up.typing_indicator_expires_at > NOW(),
    up.last_seen_at
FROM user_presence up
    JOIN profiles p ON up.user_id = p.id
WHERE up.document_id = p_document_id
    AND up.status = 'active'
    AND up.last_seen_at > NOW() - INTERVAL '5 minutes'
ORDER BY up.last_activity_at DESC;
END;
$$ LANGUAGE plpgsql;
-- Function to cleanup stale presence data
CREATE OR REPLACE FUNCTION cleanup_stale_presence() RETURNS INTEGER AS $$
DECLARE cleanup_count INTEGER;
BEGIN -- Mark users as disconnected if no activity for 5 minutes
UPDATE user_presence
SET status = 'disconnected'
WHERE status != 'disconnected'
    AND last_seen_at < NOW() - INTERVAL '5 minutes';
GET DIAGNOSTICS cleanup_count = ROW_COUNT;
-- Delete very old disconnected sessions (older than 1 day)
DELETE FROM user_presence
WHERE status = 'disconnected'
    AND last_seen_at < NOW() - INTERVAL '1 day';
RETURN cleanup_count;
END;
$$ LANGUAGE plpgsql;
-- ================================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES - PHASE 2
-- ================================================================================
-- COMMENTS TABLE RLS
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
-- Users can view comments if they can view the associated document
CREATE POLICY "comments_select_policy" ON comments FOR
SELECT USING (
        EXISTS (
            SELECT 1
            FROM documents d
            WHERE d.id = comments.document_id
                AND (
                    d.owner_id = auth.uid()
                    OR d.is_public = true
                    OR user_has_document_permission(d.id, auth.uid(), 'viewer')
                )
        )
    );
-- Users can insert comments if they can comment on the document
CREATE POLICY "comments_insert_policy" ON comments FOR
INSERT WITH CHECK (
        author_id = auth.uid()
        AND EXISTS (
            SELECT 1
            FROM documents d
            WHERE d.id = comments.document_id
                AND d.allow_comments = true
                AND (
                    d.owner_id = auth.uid()
                    OR user_has_document_permission(d.id, auth.uid(), 'commenter')
                )
        )
    );
-- Users can update their own comments
CREATE POLICY "comments_update_policy" ON comments FOR
UPDATE USING (author_id = auth.uid());
-- Users can delete their own comments or document owners can delete any
CREATE POLICY "comments_delete_policy" ON comments FOR DELETE USING (
    author_id = auth.uid()
    OR EXISTS (
        SELECT 1
        FROM documents d
        WHERE d.id = comments.document_id
            AND d.owner_id = auth.uid()
    )
);
-- DOCUMENT VERSIONS TABLE RLS
ALTER TABLE document_versions ENABLE ROW LEVEL SECURITY;
-- Users can view versions if they can view the document
CREATE POLICY "versions_select_policy" ON document_versions FOR
SELECT USING (
        EXISTS (
            SELECT 1
            FROM documents d
            WHERE d.id = document_versions.document_id
                AND (
                    d.owner_id = auth.uid()
                    OR d.is_public = true
                    OR user_has_document_permission(d.id, auth.uid(), 'viewer')
                )
        )
    );
-- Users can create versions if they can edit the document
CREATE POLICY "versions_insert_policy" ON document_versions FOR
INSERT WITH CHECK (
        author_id = auth.uid()
        AND EXISTS (
            SELECT 1
            FROM documents d
            WHERE d.id = document_versions.document_id
                AND (
                    d.owner_id = auth.uid()
                    OR user_has_document_permission(d.id, auth.uid(), 'editor')
                )
        )
    );
-- USER PRESENCE TABLE RLS
ALTER TABLE user_presence ENABLE ROW LEVEL SECURITY;
-- Users can view presence for documents they have access to
CREATE POLICY "presence_select_policy" ON user_presence FOR
SELECT USING (
        user_id = auth.uid()
        OR -- Users can always see their own presence
        EXISTS (
            SELECT 1
            FROM documents d
            WHERE d.id = user_presence.document_id
                AND (
                    d.owner_id = auth.uid()
                    OR d.is_public = true
                    OR user_has_document_permission(d.id, auth.uid(), 'viewer')
                )
        )
    );
-- Users can only insert/update their own presence
CREATE POLICY "presence_insert_policy" ON user_presence FOR
INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "presence_update_policy" ON user_presence FOR
UPDATE USING (user_id = auth.uid());
-- Users can delete their own presence records
CREATE POLICY "presence_delete_policy" ON user_presence FOR DELETE USING (user_id = auth.uid());
-- ================================================================================
-- POST-MIGRATION DATA UPDATES
-- ================================================================================
-- Backfill search vectors for any existing comments
-- This will trigger the update_comment_text function for existing comments
UPDATE comments
SET content = content;
-- ================================================================================
-- END OF PHASE 2 MIGRATION
-- ================================================================================
-- 
-- This completes the collaboration features for DocCollab Phase 2.
-- Features added:
-- - Threaded comments system with mentions
-- - Document version history with delta storage
-- - Real-time user presence tracking
-- 
-- Next steps:
-- 1. Run this migration in your Supabase SQL editor
-- 2. Test with sample collaboration data
-- 3. Proceed to Phase 3: Advanced Features (attachments, workspaces, analytics)
-- 
-- ================================================================================