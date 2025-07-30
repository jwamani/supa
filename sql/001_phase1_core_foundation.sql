CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
-- ================================================================================
-- UTILITY FUNCTIONS (Create first for use in triggers)
-- ================================================================================
-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW();
RETURN NEW;
END;
$$ language 'plpgsql';
-- Function to extract plain text from JSONB content for search
CREATE OR REPLACE FUNCTION extract_document_text(content JSONB) RETURNS TEXT AS $$ WITH RECURSIVE recursive_text_nodes(json_node) AS (
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
-- Function to calculate reading time (average 200 words per minute)
CREATE OR REPLACE FUNCTION calculate_reading_time(word_count INTEGER) RETURNS INTEGER AS $$ BEGIN RETURN GREATEST(1, ROUND(word_count::NUMERIC / 200.0));
END;
$$ LANGUAGE plpgsql IMMUTABLE;
-- ================================================================================
-- TABLE 1: USER PROFILES
-- ================================================================================
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE,
    full_name TEXT,
    email TEXT,
    avatar_url TEXT,
    bio TEXT CHECK (char_length(bio) <= 500),
    preferences JSONB DEFAULT '{
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
            "word_wrap": true
        }
    }'::jsonb,
    is_active BOOLEAN DEFAULT true,
    last_active_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- Indexes for performance
CREATE INDEX idx_profiles_username ON profiles(username)
WHERE username IS NOT NULL;
CREATE INDEX idx_profiles_email ON profiles(email)
WHERE email IS NOT NULL;
CREATE INDEX idx_profiles_active ON profiles(is_active, last_active_at);
CREATE INDEX idx_profiles_preferences ON profiles USING GIN(preferences);
-- Automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at BEFORE
UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
-- ================================================================================
-- TABLE 2: DOCUMENTS 
-- ================================================================================
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL CHECK (
        char_length(title) >= 1
        AND char_length(title) <= 200
    ),
    content JSONB DEFAULT '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":""}]}]}'::jsonb,
    content_text TEXT,
    -- Extracted plain text for full-text search
    search_vector tsvector,
    -- Pre-computed search vector for GIN index
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    workspace_id UUID,
    template_id UUID,
    parent_folder_id UUID,
    category TEXT DEFAULT 'general',
    tags TEXT [] DEFAULT '{}',
    status TEXT DEFAULT 'draft' CHECK (
        status IN ('draft', 'published', 'archived', 'deleted')
    ),
    is_favorite BOOLEAN DEFAULT false,
    is_public BOOLEAN DEFAULT false,
    public_slug TEXT UNIQUE,
    word_count INTEGER DEFAULT 0,
    character_count INTEGER DEFAULT 0,
    reading_time_minutes INTEGER DEFAULT 0,
    view_count INTEGER DEFAULT 0,
    allow_comments BOOLEAN DEFAULT true,
    allow_suggestions BOOLEAN DEFAULT true,
    lock_editing BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_accessed_at TIMESTAMPTZ DEFAULT NOW(),
    published_at TIMESTAMPTZ,
    current_version INTEGER DEFAULT 1,
    last_saved_by UUID REFERENCES auth.users(id)
);
-- Performance indexes
CREATE INDEX idx_documents_owner ON documents(owner_id, created_at DESC);
CREATE INDEX idx_documents_workspace ON documents(workspace_id, updated_at DESC)
WHERE workspace_id IS NOT NULL;
CREATE INDEX idx_documents_status ON documents(status, updated_at DESC);
CREATE INDEX idx_documents_folder ON documents(parent_folder_id, title)
WHERE parent_folder_id IS NOT NULL;
CREATE INDEX idx_documents_category ON documents(category, created_at DESC);
CREATE INDEX idx_documents_tags ON documents USING GIN(tags);
CREATE INDEX idx_documents_public ON documents(is_public, published_at DESC)
WHERE is_public = true;
CREATE INDEX idx_documents_slug ON documents(public_slug)
WHERE public_slug IS NOT NULL;
CREATE INDEX idx_documents_activity ON documents(last_accessed_at DESC);
CREATE INDEX idx_documents_favorites ON documents(owner_id, is_favorite)
WHERE is_favorite = true;
-- Full-text search indexes using the pre-computed tsvector column
CREATE INDEX idx_documents_search ON documents USING GIN(search_vector);
CREATE INDEX idx_documents_search_filtered ON documents USING GIN(search_vector)
WHERE status != 'deleted';
-- Additional indexes for search filtering
CREATE INDEX idx_documents_owner_status ON documents(owner_id, status)
WHERE status != 'deleted';
-- Trigger to update document statistics on content change
CREATE OR REPLACE FUNCTION update_document_statistics() RETURNS TRIGGER AS $$ BEGIN -- Extract plain text for search using the IMMUTABLE function
    NEW.content_text := extract_document_text(NEW.content);
-- Calculate statistics
NEW.word_count := COALESCE(
    array_length(string_to_array(trim(NEW.content_text), ' '), 1),
    0
);
NEW.character_count := char_length(NEW.content_text);
NEW.reading_time_minutes := calculate_reading_time(NEW.word_count);
-- Update search vector for full-text search
NEW.search_vector := to_tsvector(
    'english',
    COALESCE(NEW.title, '') || ' ' || COALESCE(NEW.content_text, '') || ' ' || COALESCE(NEW.category, '') || ' ' || COALESCE(array_to_string(NEW.tags, ' '), '')
);
-- Update timestamp
NEW.updated_at := NOW();
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER update_document_statistics_trigger BEFORE
INSERT
    OR
UPDATE ON documents FOR EACH ROW EXECUTE FUNCTION update_document_statistics();
-- ================================================================================
-- TABLE 3: DOCUMENT PERMISSIONS
-- ================================================================================
CREATE TABLE document_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (
        role IN ('owner', 'editor', 'commenter', 'viewer')
    ),
    granted_by UUID NOT NULL REFERENCES auth.users(id),
    granted_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    can_reshare BOOLEAN DEFAULT false,
    notification_sent BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    revoked_at TIMESTAMPTZ,
    revoked_by UUID REFERENCES auth.users(id),
    CONSTRAINT unique_document_user_permission UNIQUE(document_id, user_id)
);
-- Strategic indexing for permission queries
CREATE INDEX idx_permissions_user_document ON document_permissions(user_id, document_id, is_active);
CREATE INDEX idx_permissions_document_role ON document_permissions(document_id, role, is_active);
CREATE INDEX idx_permissions_user_role ON document_permissions(user_id, role, is_active);
CREATE INDEX idx_permissions_granted_by ON document_permissions(granted_by, granted_at);
CREATE INDEX idx_permissions_expiry ON document_permissions(expires_at)
WHERE expires_at IS NOT NULL;
-- ================================================================================
-- PERMISSION HELPER FUNCTIONS
-- ================================================================================
-- Function to check if user has specific permission level
CREATE OR REPLACE FUNCTION user_has_document_permission(
        doc_id UUID,
        target_user_id UUID,
        required_role TEXT DEFAULT 'viewer'
    ) RETURNS BOOLEAN AS $$
DECLARE user_role TEXT;
role_hierarchy INTEGER;
required_hierarchy INTEGER;
BEGIN -- Get user's role for this document
SELECT dp.role INTO user_role
FROM document_permissions dp
WHERE dp.document_id = doc_id
    AND dp.user_id = target_user_id
    AND dp.is_active = true
    AND (
        dp.expires_at IS NULL
        OR dp.expires_at > NOW()
    );
-- Check if user is owner of document
IF NOT FOUND THEN
SELECT CASE
        WHEN d.owner_id = target_user_id THEN 'owner'
        ELSE NULL
    END INTO user_role
FROM documents d
WHERE d.id = doc_id;
END IF;
-- Return false if no role found
IF user_role IS NULL THEN RETURN false;
END IF;
-- Convert roles to hierarchy levels for comparison
role_hierarchy := CASE
    user_role
    WHEN 'owner' THEN 4
    WHEN 'editor' THEN 3
    WHEN 'commenter' THEN 2
    WHEN 'viewer' THEN 1
    ELSE 0
END;
required_hierarchy := CASE
    required_role
    WHEN 'owner' THEN 4
    WHEN 'editor' THEN 3
    WHEN 'commenter' THEN 2
    WHEN 'viewer' THEN 1
    ELSE 0
END;
RETURN role_hierarchy >= required_hierarchy;
END;
$$ LANGUAGE plpgsql STABLE;
-- Function to get user's effective role for a document
CREATE OR REPLACE FUNCTION get_user_document_role(doc_id UUID, target_user_id UUID) RETURNS TEXT AS $$
DECLARE result TEXT;
BEGIN -- Check if user is document owner first
SELECT CASE
        WHEN d.owner_id = target_user_id THEN 'owner'
        ELSE NULL
    END INTO result
FROM documents d
WHERE d.id = doc_id;
-- If not owner, check explicit permissions
IF result IS NULL THEN
SELECT dp.role INTO result
FROM document_permissions dp
WHERE dp.document_id = doc_id
    AND dp.user_id = target_user_id
    AND dp.is_active = true
    AND (
        dp.expires_at IS NULL
        OR dp.expires_at > NOW()
    )
ORDER BY CASE
        dp.role
        WHEN 'owner' THEN 4
        WHEN 'editor' THEN 3
        WHEN 'commenter' THEN 2
        WHEN 'viewer' THEN 1
    END DESC
LIMIT 1;
END IF;
RETURN result;
END;
$$ LANGUAGE plpgsql STABLE;
-- ================================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ================================================================================
-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_permissions ENABLE ROW LEVEL SECURITY;
-- PROFILES POLICIES
CREATE POLICY "profiles_select_policy" ON profiles FOR
SELECT USING (true);
CREATE POLICY "profiles_insert_policy" ON profiles FOR
INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_policy" ON profiles FOR
UPDATE USING (auth.uid() = id);
-- DOCUMENTS POLICIES
CREATE POLICY "documents_select_policy" ON documents FOR
SELECT USING (
        owner_id = auth.uid()
        OR is_public = true
        OR status = 'published'
        OR EXISTS (
            SELECT 1
            FROM document_permissions dp
            WHERE dp.document_id = documents.id
                AND dp.user_id = auth.uid()
                AND dp.is_active = true
                AND (
                    dp.expires_at IS NULL
                    OR dp.expires_at > NOW()
                )
        )
    );
CREATE POLICY "documents_insert_policy" ON documents FOR
INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "documents_update_policy" ON documents FOR
UPDATE USING (
        owner_id = auth.uid()
        OR EXISTS (
            SELECT 1
            FROM document_permissions dp
            WHERE dp.document_id = documents.id
                AND dp.user_id = auth.uid()
                AND dp.is_active = true
                AND (
                    dp.expires_at IS NULL
                    OR dp.expires_at > NOW()
                )
                AND dp.role IN ('owner', 'editor')
        )
    );
CREATE POLICY "documents_delete_policy" ON documents FOR DELETE USING (owner_id = auth.uid());
-- DOCUMENT PERMISSIONS POLICIES
CREATE POLICY "permissions_select_policy" ON document_permissions FOR
SELECT USING (
        user_id = auth.uid()
        OR EXISTS (
            SELECT 1
            FROM documents d
            WHERE d.id = document_permissions.document_id
                AND d.owner_id = auth.uid()
        )
    );
CREATE POLICY "permissions_insert_policy" ON document_permissions FOR
INSERT WITH CHECK (
        granted_by = auth.uid()
        AND EXISTS (
            SELECT 1
            FROM documents d
            WHERE d.id = document_permissions.document_id
                AND d.owner_id = auth.uid()
        )
    );
CREATE POLICY "permissions_update_policy" ON document_permissions FOR
UPDATE USING (
        EXISTS (
            SELECT 1
            FROM documents d
            WHERE d.id = document_permissions.document_id
                AND d.owner_id = auth.uid()
        )
    );
CREATE POLICY "permissions_delete_policy" ON document_permissions FOR DELETE USING (
    EXISTS (
        SELECT 1
        FROM documents d
        WHERE d.id = document_permissions.document_id
            AND d.owner_id = auth.uid()
    )
);
-- ================================================================================
-- UPDATE EXISTING DOCUMENTS (if any exist)
-- ================================================================================
-- This will trigger the update_document_statistics function for existing documents
UPDATE documents
SET updated_at = NOW()
WHERE content_text IS NULL
    OR search_vector IS NULL;
-- ================================================================================
-- TEST TEXT EXTRACTION (remove after testing)
-- ================================================================================
-- Test the text extraction function with sample data
SELECT extract_document_text(
        '{
    "type": "doc",
    "content": [
        {
            "type": "heading",
            "attrs": {"level": 1},
            "content": [{"type": "text", "text": "Test Heading"}]
        },
        {
            "type": "paragraph",
            "content": [
                {"type": "text", "text": "This is a test paragraph with some content."}
            ]
        }
    ]
}'::jsonb
    ) as extracted_text;