# 🗄️ DocCollab Database Design & Schema

## 📋 **Database Design Overview**

This document outlines the systematic database design for DocCollab, starting with core concepts and building up to complex relationships. Each section includes learning objectives, design decisions, and implementation details.

---

## 🎯 **Database Design Principles**

### **Learning Objectives**

- **Normalization**: Understand database normalization principles (1NF, 2NF, 3NF)
- **Relationships**: Master one-to-many, many-to-many, and self-referencing relationships
- **Performance**: Learn indexing strategies and query optimization
- **Security**: Implement Row Level Security (RLS) policies
- **Scalability**: Design for growth and performance at scale

### **Design Decisions**

- **Primary Keys**: UUID for all tables (better for distributed systems)
- **Timestamps**: TIMESTAMPTZ for proper timezone handling
- **JSON Storage**: JSONB for flexible document content and metadata
- **Text Search**: PostgreSQL full-text search with GIN indexes
- **Constraints**: Check constraints for data validation
- **Cascading**: Careful CASCADE vs RESTRICT decisions

---

## 🏗️ **Schema Development Phases**

### **Phase 1: Core Foundation Tables**

1. **User Profiles** - Extended user information
2. **Documents** - Core document storage
3. **Basic Permissions** - Document access control

### **Phase 2: Collaboration Features**

4. **Comments** - Document commenting system
5. **Document Versions** - Version history
6. **User Presence** - Real-time collaboration

### **Phase 3: Advanced Features**

7. **File Attachments** - Media and file storage
8. **Workspaces** - Team organization
9. **Audit Logs** - Security and compliance
10. **Analytics Tables** - Usage tracking

---

## 📊 **Phase 1: Core Foundation Tables**

### **1. Extended User Profiles**

#### **Learning Focus:**

- Extending Supabase Auth with custom user data
- JSONB for flexible user preferences
- Foreign key relationships to auth.users
- Storage integration for avatar uploads

#### **Design Considerations:**

```sql
-- 👤 PROFILES TABLE: Extended user information beyond Supabase Auth
--
-- Learning Points:
-- - References auth.users(id) for authentication integration
-- - JSONB for flexible preferences storage
-- - username with UNIQUE constraint for user-friendly handles
-- - avatar_url for profile image storage integration

CREATE TABLE profiles (
    -- Primary key matches Supabase Auth user ID
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,

    -- User identification and display
    username TEXT UNIQUE, -- Unique handle for mentions and display
    full_name TEXT,       -- Display name
    email TEXT,           -- Cached from auth.users for quick access

    -- Profile customization
    avatar_url TEXT,      -- Storage URL for profile picture
    bio TEXT CHECK (char_length(bio) <= 500), -- Short bio with length limit

    -- User preferences stored as flexible JSON
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

    -- Account status and metadata
    is_active BOOLEAN DEFAULT true,
    last_active_at TIMESTAMPTZ DEFAULT NOW(),

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 📚 LEARNING: Indexes for performance
-- Username lookups for mentions and user search
CREATE INDEX idx_profiles_username ON profiles(username) WHERE username IS NOT NULL;

-- Email lookups (though should primarily use auth.users)
CREATE INDEX idx_profiles_email ON profiles(email) WHERE email IS NOT NULL;

-- Active user queries
CREATE INDEX idx_profiles_active ON profiles(is_active, last_active_at);

-- JSON preference queries (GIN index for JSONB)
CREATE INDEX idx_profiles_preferences ON profiles USING GIN(preferences);

-- 🔔 LEARNING: Database triggers for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

#### **RLS Policies for Profiles:**

```sql
-- 🔒 LEARNING: Row Level Security (RLS) Policies
-- Enable RLS on the profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Users can view all profiles (for mentions, sharing, etc.)
CREATE POLICY "profiles_select_policy" ON profiles
    FOR SELECT USING (true);

-- Users can only insert their own profile
CREATE POLICY "profiles_insert_policy" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Users can only update their own profile
CREATE POLICY "profiles_update_policy" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- Users cannot delete profiles (handled by auth cascade)
-- No DELETE policy needed due to CASCADE relationship
```

---

### **2. Documents Table - Core Document Storage**

#### **Learning Focus:**

- JSONB for flexible document content storage
- Full-text search implementation
- Document metadata and organization
- Performance optimization with indexes

#### **Design Considerations:**

```sql
-- 📄 DOCUMENTS TABLE: Core document storage with rich metadata
--
-- Learning Points:
-- - JSONB content for flexible document structure
-- - Separate content_text for full-text search optimization
-- - Rich metadata for organization and filtering
-- - Performance considerations with proper indexing

CREATE TABLE documents (
    -- Primary identification
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL CHECK (char_length(title) >= 1 AND char_length(title) <= 200),

    -- Document content storage
    content JSONB DEFAULT '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":""}]}]}'::jsonb,
    content_text TEXT, -- Extracted plain text for full-text search

    -- Ownership and workspace
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    workspace_id UUID REFERENCES workspaces(id) ON DELETE SET NULL, -- Allow personal docs

    -- Document organization
    template_id UUID REFERENCES document_templates(id) ON DELETE SET NULL,
    parent_folder_id UUID REFERENCES document_folders(id) ON DELETE SET NULL,
    category TEXT DEFAULT 'general',
    tags TEXT[] DEFAULT '{}', -- Array of tags for flexible tagging

    -- Document status and metadata
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived', 'deleted')),
    is_favorite BOOLEAN DEFAULT false,
    is_public BOOLEAN DEFAULT false, -- Public sharing flag
    public_slug TEXT UNIQUE, -- URL-friendly slug for public sharing

    -- Statistics and tracking
    word_count INTEGER DEFAULT 0,
    character_count INTEGER DEFAULT 0,
    reading_time_minutes INTEGER DEFAULT 0, -- Estimated reading time
    view_count INTEGER DEFAULT 0,

    -- Collaboration settings
    allow_comments BOOLEAN DEFAULT true,
    allow_suggestions BOOLEAN DEFAULT true,
    lock_editing BOOLEAN DEFAULT false, -- Emergency edit lock

    -- Timestamps and activity
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_accessed_at TIMESTAMPTZ DEFAULT NOW(),
    published_at TIMESTAMPTZ, -- When made public/published

    -- Version tracking
    current_version INTEGER DEFAULT 1,
    last_saved_by UUID REFERENCES auth.users(id)
);

-- 📚 LEARNING: Performance Indexes
-- Primary queries: by owner, by workspace, by status
CREATE INDEX idx_documents_owner ON documents(owner_id, created_at DESC);
CREATE INDEX idx_documents_workspace ON documents(workspace_id, updated_at DESC) WHERE workspace_id IS NOT NULL;
CREATE INDEX idx_documents_status ON documents(status, updated_at DESC);

-- Organization queries
CREATE INDEX idx_documents_folder ON documents(parent_folder_id, title) WHERE parent_folder_id IS NOT NULL;
CREATE INDEX idx_documents_category ON documents(category, created_at DESC);
CREATE INDEX idx_documents_tags ON documents USING GIN(tags); -- GIN index for array operations

-- Public document queries
CREATE INDEX idx_documents_public ON documents(is_public, published_at DESC) WHERE is_public = true;
CREATE INDEX idx_documents_slug ON documents(public_slug) WHERE public_slug IS NOT NULL;

-- Activity and statistics
CREATE INDEX idx_documents_activity ON documents(last_accessed_at DESC);
CREATE INDEX idx_documents_favorites ON documents(owner_id, is_favorite) WHERE is_favorite = true;

-- 🔍 LEARNING: Full-Text Search Implementation
-- GIN index for full-text search on document content
CREATE INDEX idx_documents_search ON documents USING GIN(to_tsvector('english',
    coalesce(title, '') || ' ' ||
    coalesce(content_text, '') || ' ' ||
    coalesce(category, '') || ' ' ||
    coalesce(array_to_string(tags, ' '), '')
));

-- Composite search index for filtered searches
CREATE INDEX idx_documents_search_filtered ON documents USING GIN(
    to_tsvector('english', title || ' ' || coalesce(content_text, '')),
    owner_id,
    status
) WHERE status != 'deleted';
```

#### **Document Helper Functions:**

```sql
-- 🔧 LEARNING: Database functions for business logic
-- Function to extract plain text from JSONB content for search
CREATE OR REPLACE FUNCTION extract_document_text(content JSONB)
RETURNS TEXT AS $$
DECLARE
    text_content TEXT := '';
BEGIN
    -- Recursive function to extract text from ProseMirror/TipTap JSON structure
    -- This is a simplified version - real implementation would be more complex
    SELECT string_agg(
        CASE
            WHEN elem->>'type' = 'text' THEN elem->>'text'
            ELSE ''
        END, ' '
    ) INTO text_content
    FROM jsonb_array_elements(content->'content') AS elem;

    RETURN coalesce(text_content, '');
END;
$$ LANGUAGE plpgsql;

-- Function to calculate reading time (average 200 words per minute)
CREATE OR REPLACE FUNCTION calculate_reading_time(word_count INTEGER)
RETURNS INTEGER AS $$
BEGIN
    RETURN GREATEST(1, ROUND(word_count::NUMERIC / 200.0));
END;
$$ LANGUAGE plpgsql;

-- Trigger to update document statistics on content change
CREATE OR REPLACE FUNCTION update_document_statistics()
RETURNS TRIGGER AS $$
BEGIN
    -- Extract plain text for search
    NEW.content_text := extract_document_text(NEW.content);

    -- Calculate statistics
    NEW.word_count := array_length(string_to_array(trim(NEW.content_text), ' '), 1);
    NEW.character_count := char_length(NEW.content_text);
    NEW.reading_time_minutes := calculate_reading_time(NEW.word_count);

    -- Update timestamp
    NEW.updated_at := NOW();

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_document_statistics_trigger
    BEFORE INSERT OR UPDATE OF content ON documents
    FOR EACH ROW
    EXECUTE FUNCTION update_document_statistics();
```

#### **RLS Policies for Documents:**

```sql
-- 🔒 LEARNING: Complex RLS policies with multiple conditions
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Users can view documents if:
-- 1. They own the document
-- 2. Document is public
-- 3. They have explicit permission (checked via document_permissions table)
CREATE POLICY "documents_select_policy" ON documents
    FOR SELECT USING (
        owner_id = auth.uid() OR  -- Owner can always view
        is_public = true OR       -- Public documents
        status = 'published' OR   -- Published documents (might be shared)
        EXISTS (                  -- Has explicit permission
            SELECT 1 FROM document_permissions dp
            WHERE dp.document_id = documents.id
            AND dp.user_id = auth.uid()
        )
    );

-- Users can insert documents (will be their own)
CREATE POLICY "documents_insert_policy" ON documents
    FOR INSERT WITH CHECK (auth.uid() = owner_id);

-- Users can update documents if they own them or have editor permissions
CREATE POLICY "documents_update_policy" ON documents
    FOR UPDATE USING (
        owner_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM document_permissions dp
            WHERE dp.document_id = documents.id
            AND dp.user_id = auth.uid()
            AND dp.role IN ('owner', 'editor')
        )
    );

-- Users can delete documents if they own them
CREATE POLICY "documents_delete_policy" ON documents
    FOR DELETE USING (owner_id = auth.uid());
```

---

### **3. Document Permissions - Access Control**

#### **Learning Focus:**

- Many-to-many relationships with additional metadata
- Role-based access control (RBAC)
- Permission inheritance and calculation
- Efficient permission queries

#### **Design Considerations:**

```sql
-- 🔐 DOCUMENT_PERMISSIONS TABLE: Granular access control
--
-- Learning Points:
-- - Many-to-many relationship between documents and users
-- - Role-based access with hierarchy (owner > editor > commenter > viewer)
-- - Permission granting audit trail
-- - Composite unique constraint to prevent duplicate permissions

CREATE TABLE document_permissions (
    -- Primary identification
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- The relationship: document + user + role
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Role hierarchy: owner > editor > commenter > viewer
    role TEXT NOT NULL CHECK (role IN ('owner', 'editor', 'commenter', 'viewer')),

    -- Permission metadata
    granted_by UUID NOT NULL REFERENCES auth.users(id), -- Who granted this permission
    granted_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ, -- Optional expiration

    -- Permission settings
    can_reshare BOOLEAN DEFAULT false, -- Can this user share with others?
    notification_sent BOOLEAN DEFAULT false, -- Track if user was notified

    -- Status tracking
    is_active BOOLEAN DEFAULT true,
    revoked_at TIMESTAMPTZ,
    revoked_by UUID REFERENCES auth.users(id),

    -- Prevent duplicate permissions
    CONSTRAINT unique_document_user_permission UNIQUE(document_id, user_id)
);

-- 📚 LEARNING: Strategic indexing for permission queries
-- Most common query: check user's permission for a document
CREATE INDEX idx_permissions_user_document ON document_permissions(user_id, document_id, is_active);

-- Document-centric queries: who has access to this document?
CREATE INDEX idx_permissions_document_role ON document_permissions(document_id, role, is_active);

-- User-centric queries: what documents can this user access?
CREATE INDEX idx_permissions_user_role ON document_permissions(user_id, role, is_active);

-- Permission management queries
CREATE INDEX idx_permissions_granted_by ON document_permissions(granted_by, granted_at);
CREATE INDEX idx_permissions_expiry ON document_permissions(expires_at) WHERE expires_at IS NOT NULL;
```

#### **Permission Helper Functions:**

```sql
-- 🔧 LEARNING: Permission checking functions
-- Function to check if user has specific permission level
CREATE OR REPLACE FUNCTION user_has_document_permission(
    doc_id UUID,
    user_id UUID,
    required_role TEXT DEFAULT 'viewer'
)
RETURNS BOOLEAN AS $$
DECLARE
    user_role TEXT;
    role_hierarchy INTEGER;
    required_hierarchy INTEGER;
BEGIN
    -- Get user's role for this document
    SELECT dp.role INTO user_role
    FROM document_permissions dp
    WHERE dp.document_id = doc_id
    AND dp.user_id = user_id
    AND dp.is_active = true
    AND (dp.expires_at IS NULL OR dp.expires_at > NOW());

    -- Check if user is owner of document
    IF NOT FOUND THEN
        SELECT CASE WHEN d.owner_id = user_id THEN 'owner' ELSE NULL END
        INTO user_role
        FROM documents d
        WHERE d.id = doc_id;
    END IF;

    -- Return false if no role found
    IF user_role IS NULL THEN
        RETURN false;
    END IF;

    -- Convert roles to hierarchy levels for comparison
    role_hierarchy := CASE user_role
        WHEN 'owner' THEN 4
        WHEN 'editor' THEN 3
        WHEN 'commenter' THEN 2
        WHEN 'viewer' THEN 1
        ELSE 0
    END;

    required_hierarchy := CASE required_role
        WHEN 'owner' THEN 4
        WHEN 'editor' THEN 3
        WHEN 'commenter' THEN 2
        WHEN 'viewer' THEN 1
        ELSE 0
    END;

    RETURN role_hierarchy >= required_hierarchy;
END;
$$ LANGUAGE plpgsql;

-- Function to get user's effective role for a document
CREATE OR REPLACE FUNCTION get_user_document_role(doc_id UUID, user_id UUID)
RETURNS TEXT AS $$
DECLARE
    result TEXT;
BEGIN
    -- Check if user is document owner first
    SELECT CASE WHEN d.owner_id = user_id THEN 'owner' ELSE NULL END
    INTO result
    FROM documents d
    WHERE d.id = doc_id;

    -- If not owner, check explicit permissions
    IF result IS NULL THEN
        SELECT dp.role INTO result
        FROM document_permissions dp
        WHERE dp.document_id = doc_id
        AND dp.user_id = user_id
        AND dp.is_active = true
        AND (dp.expires_at IS NULL OR dp.expires_at > NOW())
        ORDER BY CASE dp.role  -- Get highest role if multiple exist
            WHEN 'owner' THEN 4
            WHEN 'editor' THEN 3
            WHEN 'commenter' THEN 2
            WHEN 'viewer' THEN 1
        END DESC
        LIMIT 1;
    END IF;

    RETURN result;
END;
$$ LANGUAGE plpgsql;
```

#### **RLS Policies for Document Permissions:**

```sql
-- 🔒 LEARNING: Permission table security
ALTER TABLE document_permissions ENABLE ROW LEVEL SECURITY;

-- Users can view permissions for documents they have access to
CREATE POLICY "permissions_select_policy" ON document_permissions
    FOR SELECT USING (
        user_id = auth.uid() OR  -- Can see own permissions
        EXISTS (  -- Can see permissions for documents they can access
            SELECT 1 FROM documents d
            WHERE d.id = document_permissions.document_id
            AND (
                d.owner_id = auth.uid() OR
                user_has_document_permission(d.id, auth.uid(), 'viewer')
            )
        )
    );

-- Only document owners and users with reshare permission can grant permissions
CREATE POLICY "permissions_insert_policy" ON document_permissions
    FOR INSERT WITH CHECK (
        granted_by = auth.uid() AND
        EXISTS (
            SELECT 1 FROM documents d
            WHERE d.id = document_permissions.document_id
            AND d.owner_id = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM document_permissions dp
            WHERE dp.document_id = document_permissions.document_id
            AND dp.user_id = auth.uid()
            AND dp.can_reshare = true
            AND dp.is_active = true
        )
    );

-- Similar restrictions for updates
CREATE POLICY "permissions_update_policy" ON document_permissions
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM documents d
            WHERE d.id = document_permissions.document_id
            AND d.owner_id = auth.uid()
        )
    );

-- Only owners can delete permissions
CREATE POLICY "permissions_delete_policy" ON document_permissions
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM documents d
            WHERE d.id = document_permissions.document_id
            AND d.owner_id = auth.uid()
        )
    );
```

---

## 🤝 **Phase 2: Collaboration Features**

### **Learning Objectives for Phase 2:**

- **Hierarchical Data**: Implement threaded comments with parent-child relationships
- **Version Control**: Design delta-based version storage for efficient history
- **Real-time Systems**: User presence tracking for live collaboration
- **Performance Optimization**: Handle high-frequency updates efficiently
- **Conflict Resolution**: Design for concurrent editing scenarios

---

### **4. Comments System - Threaded Discussions**

#### **Learning Focus:**

- Self-referencing foreign keys for hierarchical data
- Recursive queries for thread reconstruction
- Soft deletion for comment moderation
- Mention system with user notifications

#### **Design Considerations:**

```sql
-- 💬 COMMENTS TABLE: Threaded comment system for documents
--
-- Learning Points:
-- - Self-referencing for comment threading (parent_comment_id)
-- - Soft deletion to preserve thread structure
-- - Position tracking for comment ordering within documents
-- - Rich text content support with mentions

CREATE TABLE comments (
    -- Primary identification
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Relationships
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    parent_comment_id UUID REFERENCES comments(id) ON DELETE CASCADE, -- For threading

    -- Comment content
    content JSONB NOT NULL, -- Rich text content (similar to document content)
    content_text TEXT, -- Plain text for search and notifications

    -- Comment positioning and organization
    position_in_document JSONB, -- { "line": 10, "column": 5, "selection": {...} }
    thread_root_id UUID, -- Points to the root comment of the thread
    depth_level INTEGER DEFAULT 0, -- How deep in the thread (0 = root level)
    sort_order INTEGER DEFAULT 0, -- For ordering within the same level

    -- Comment status and metadata
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'deleted', 'hidden', 'resolved')),
    is_suggestion BOOLEAN DEFAULT false, -- Is this a suggested edit?
    suggestion_accepted BOOLEAN, -- If suggestion, was it accepted?

    -- Engagement tracking
    upvotes INTEGER DEFAULT 0,
    downvotes INTEGER DEFAULT 0,
    reply_count INTEGER DEFAULT 0, -- Denormalized count for performance

    -- Mentions and notifications
    mentioned_users UUID[] DEFAULT '{}', -- Array of mentioned user IDs

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ,
    resolved_by UUID REFERENCES auth.users(id)
);

-- 📚 LEARNING: Indexes for hierarchical queries and performance
-- Thread reconstruction queries
CREATE INDEX idx_comments_thread_root ON comments(thread_root_id, sort_order) WHERE thread_root_id IS NOT NULL;
CREATE INDEX idx_comments_parent ON comments(parent_comment_id, created_at) WHERE parent_comment_id IS NOT NULL;

-- Document-centric queries
CREATE INDEX idx_comments_document ON comments(document_id, created_at DESC) WHERE status = 'active';
CREATE INDEX idx_comments_document_position ON comments(document_id, status) WHERE position_in_document IS NOT NULL;

-- User activity queries
CREATE INDEX idx_comments_author ON comments(author_id, created_at DESC);
CREATE INDEX idx_comments_mentions ON comments USING GIN(mentioned_users) WHERE array_length(mentioned_users, 1) > 0;

-- Status and resolution tracking
CREATE INDEX idx_comments_resolved ON comments(document_id, resolved_at) WHERE status = 'resolved';
CREATE INDEX idx_comments_suggestions ON comments(document_id, is_suggestion, suggestion_accepted) WHERE is_suggestion = true;

-- Full-text search on comments
CREATE INDEX idx_comments_search ON comments USING GIN(to_tsvector('english', coalesce(content_text, '')));
```

#### **Comment Helper Functions:**

```sql
-- 🔧 LEARNING: Recursive functions for hierarchical data
-- Function to get complete comment thread
CREATE OR REPLACE FUNCTION get_comment_thread(root_comment_id UUID)
RETURNS TABLE (
    id UUID,
    content JSONB,
    author_username TEXT,
    depth_level INTEGER,
    created_at TIMESTAMPTZ,
    reply_count INTEGER
) AS $$
BEGIN
    RETURN QUERY
    WITH RECURSIVE comment_tree AS (
        -- Base case: get the root comment
        SELECT
            c.id,
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
        SELECT
            c.id,
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
    SELECT
        ct.id,
        ct.content,
        ct.username,
        ct.depth_level,
        ct.created_at,
        ct.reply_count
    FROM comment_tree ct
    ORDER BY ct.depth_level, ct.sort_order, ct.created_at;
END;
$$ LANGUAGE plpgsql;

-- Function to update reply counts when comments are added/removed
CREATE OR REPLACE FUNCTION update_comment_reply_counts()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Increment reply count for parent comment
        IF NEW.parent_comment_id IS NOT NULL THEN
            UPDATE comments
            SET reply_count = reply_count + 1
            WHERE id = NEW.parent_comment_id;
        END IF;

        -- Set thread root ID if this is a reply
        IF NEW.parent_comment_id IS NOT NULL THEN
            UPDATE comments
            SET thread_root_id = COALESCE(
                (SELECT thread_root_id FROM comments WHERE id = NEW.parent_comment_id),
                NEW.parent_comment_id
            )
            WHERE id = NEW.id;
        END IF;

        RETURN NEW;
    END IF;

    IF TG_OP = 'DELETE' THEN
        -- Decrement reply count for parent comment
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
    AFTER INSERT OR DELETE ON comments
    FOR EACH ROW
    EXECUTE FUNCTION update_comment_reply_counts();

-- Extract plain text from comment content for search
CREATE OR REPLACE FUNCTION update_comment_text()
RETURNS TRIGGER AS $$
BEGIN
    NEW.content_text := extract_document_text(NEW.content);
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_comment_text_trigger
    BEFORE INSERT OR UPDATE OF content ON comments
    FOR EACH ROW
    EXECUTE FUNCTION update_comment_text();
```

#### **RLS Policies for Comments:**

```sql
-- 🔒 LEARNING: Comments inherit document permissions
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Users can view comments if they can view the associated document
CREATE POLICY "comments_select_policy" ON comments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM documents d
            WHERE d.id = comments.document_id
            AND (
                d.owner_id = auth.uid() OR
                d.is_public = true OR
                user_has_document_permission(d.id, auth.uid(), 'viewer')
            )
        )
    );

-- Users can insert comments if they can comment on the document
CREATE POLICY "comments_insert_policy" ON comments
    FOR INSERT WITH CHECK (
        author_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM documents d
            WHERE d.id = comments.document_id
            AND d.allow_comments = true
            AND (
                d.owner_id = auth.uid() OR
                user_has_document_permission(d.id, auth.uid(), 'commenter')
            )
        )
    );

-- Users can update their own comments
CREATE POLICY "comments_update_policy" ON comments
    FOR UPDATE USING (author_id = auth.uid());

-- Users can delete their own comments or document owners can delete any
CREATE POLICY "comments_delete_policy" ON comments
    FOR DELETE USING (
        author_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM documents d
            WHERE d.id = comments.document_id
            AND d.owner_id = auth.uid()
        )
    );
```

---

### **5. Document Versions - Version History System**

#### **Learning Focus:**

- Delta-based storage for efficient versioning
- Immutable version records for audit trails
- Branch and merge concepts for collaboration
- Automated backup and recovery systems

#### **Design Considerations:**

```sql
-- 📝 DOCUMENT_VERSIONS TABLE: Complete version history with delta storage
--
-- Learning Points:
-- - Delta storage: only store changes, not full content
-- - Immutable records for reliable audit trails
-- - Branch/merge support for advanced collaboration
-- - Automatic snapshot creation for major versions

CREATE TABLE document_versions (
    -- Primary identification
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Relationships
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES auth.users(id),

    -- Version information
    version_number INTEGER NOT NULL,
    parent_version_id UUID REFERENCES document_versions(id), -- For branching
    is_major_version BOOLEAN DEFAULT false, -- Major milestones get full content snapshots

    -- Content storage strategy
    content_delta JSONB, -- Delta/diff from parent version
    full_content JSONB, -- Full content snapshot (for major versions or periodic backups)
    content_size_bytes INTEGER,

    -- Change metadata
    change_summary TEXT, -- User-provided description of changes
    change_type TEXT DEFAULT 'edit' CHECK (change_type IN ('edit', 'create', 'merge', 'revert', 'import')),
    changes_word_count INTEGER DEFAULT 0,
    changes_character_count INTEGER DEFAULT 0,

    -- Collaboration metadata
    merge_base_version_id UUID REFERENCES document_versions(id), -- For merge tracking
    conflict_resolution JSONB, -- How conflicts were resolved in merges

    -- Status and visibility
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived', 'deleted')),
    is_auto_save BOOLEAN DEFAULT false, -- Distinguish user saves from auto-saves

    -- Analytics and tracking
    time_to_create_seconds INTEGER, -- How long this version took to create
    device_info JSONB, -- What device/browser created this version

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),

    -- Constraints
    CONSTRAINT unique_document_version UNIQUE(document_id, version_number)
);

-- 📚 LEARNING: Version history queries and performance
-- Most common: get version history for a document
CREATE INDEX idx_versions_document ON document_versions(document_id, version_number DESC);

-- Author activity tracking
CREATE INDEX idx_versions_author ON document_versions(author_id, created_at DESC);

-- Major version queries (for snapshots)
CREATE INDEX idx_versions_major ON document_versions(document_id, is_major_version, created_at DESC) WHERE is_major_version = true;

-- Auto-save vs manual save filtering
CREATE INDEX idx_versions_manual ON document_versions(document_id, created_at DESC) WHERE is_auto_save = false;

-- Merge and branch tracking
CREATE INDEX idx_versions_parent ON document_versions(parent_version_id, created_at) WHERE parent_version_id IS NOT NULL;
CREATE INDEX idx_versions_merge_base ON document_versions(merge_base_version_id) WHERE merge_base_version_id IS NOT NULL;

-- Content size analysis
CREATE INDEX idx_versions_size ON document_versions(document_id, content_size_bytes DESC);
```

#### **Version Management Functions:**

```sql
-- 🔧 LEARNING: Version control business logic
-- Function to create a new document version
CREATE OR REPLACE FUNCTION create_document_version(
    p_document_id UUID,
    p_author_id UUID,
    p_new_content JSONB,
    p_change_summary TEXT DEFAULT NULL,
    p_is_major BOOLEAN DEFAULT false
)
RETURNS UUID AS $$
DECLARE
    v_version_number INTEGER;
    v_version_id UUID;
    v_current_content JSONB;
    v_content_delta JSONB;
BEGIN
    -- Get next version number
    SELECT COALESCE(MAX(version_number), 0) + 1
    INTO v_version_number
    FROM document_versions
    WHERE document_id = p_document_id;

    -- Get current document content for delta calculation
    SELECT content INTO v_current_content
    FROM documents
    WHERE id = p_document_id;

    -- Calculate delta (simplified - real implementation would use proper diff algorithm)
    v_content_delta := json_build_object(
        'added', p_new_content,
        'removed', v_current_content,
        'timestamp', NOW()
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
    ) VALUES (
        p_document_id,
        p_author_id,
        v_version_number,
        CASE WHEN p_is_major THEN NULL ELSE v_content_delta END,
        CASE WHEN p_is_major THEN p_new_content ELSE NULL END,
        p_change_summary,
        p_is_major,
        length(p_new_content::text)
    ) RETURNING id INTO v_version_id;

    -- Update main document
    UPDATE documents
    SET
        content = p_new_content,
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
)
RETURNS BOOLEAN AS $$
DECLARE
    v_version_content JSONB;
    v_restored_version_id UUID;
BEGIN
    -- Get the content from the specified version
    SELECT
        COALESCE(full_content, content_delta),
        id
    INTO v_version_content, v_restored_version_id
    FROM document_versions
    WHERE document_id = p_document_id
    AND version_number = p_version_number
    AND status = 'active';

    IF NOT FOUND THEN
        RETURN false;
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
CREATE OR REPLACE FUNCTION get_document_version_history(p_document_id UUID)
RETURNS TABLE (
    version_id UUID,
    version_number INTEGER,
    author_username TEXT,
    change_summary TEXT,
    is_major_version BOOLEAN,
    created_at TIMESTAMPTZ,
    content_size_bytes INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        dv.id,
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
```

#### **RLS Policies for Document Versions:**

```sql
-- 🔒 LEARNING: Version access follows document permissions
ALTER TABLE document_versions ENABLE ROW LEVEL SECURITY;

-- Users can view versions if they can view the document
CREATE POLICY "versions_select_policy" ON document_versions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM documents d
            WHERE d.id = document_versions.document_id
            AND (
                d.owner_id = auth.uid() OR
                d.is_public = true OR
                user_has_document_permission(d.id, auth.uid(), 'viewer')
            )
        )
    );

-- Users can create versions if they can edit the document
CREATE POLICY "versions_insert_policy" ON document_versions
    FOR INSERT WITH CHECK (
        author_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM documents d
            WHERE d.id = document_versions.document_id
            AND (
                d.owner_id = auth.uid() OR
                user_has_document_permission(d.id, auth.uid(), 'editor')
            )
        )
    );

-- No direct updates to versions (immutable audit trail)
-- No direct deletes (soft delete through status)
```

---

### **6. User Presence - Real-time Collaboration Tracking**

#### **Learning Focus:**

- High-frequency update handling
- Presence state management
- Real-time synchronization patterns
- Efficient cleanup of stale presence data

#### **Design Considerations:**

```sql
-- 👥 USER_PRESENCE TABLE: Real-time collaboration tracking
--
-- Learning Points:
-- - High-frequency updates require special handling
-- - TTL-based cleanup for stale presence data
-- - Cursor position tracking for real-time editing
-- - Connection state management for reliability

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
    cursor_position JSONB, -- Current cursor/selection position in document
    current_selection JSONB, -- What text is currently selected
    editing_area JSONB, -- What part of document user is focused on

    -- Connection metadata
    connection_id TEXT, -- WebSocket or connection identifier
    session_id TEXT, -- Browser session identifier
    user_agent TEXT, -- Browser/device information
    ip_address INET, -- For security and analytics

    -- Activity tracking
    actions_count INTEGER DEFAULT 0, -- Number of actions in this session
    keystrokes_count INTEGER DEFAULT 0, -- Typing activity
    mouse_events_count INTEGER DEFAULT 0, -- Mouse/touch activity

    -- Collaboration features
    is_typing BOOLEAN DEFAULT false,
    typing_indicator_expires_at TIMESTAMPTZ,
    is_following_user UUID REFERENCES auth.users(id), -- Following another user's cursor

    -- Timestamps
    session_start_at TIMESTAMPTZ DEFAULT NOW(),
    last_activity_at TIMESTAMPTZ DEFAULT NOW(),

    -- Constraints
    CONSTRAINT unique_user_document_session UNIQUE(user_id, document_id, session_id)
);

-- 📚 LEARNING: High-performance indexes for real-time queries
-- Active users on a document (most frequent query)
CREATE INDEX idx_presence_document_active ON user_presence(document_id, status, last_seen_at)
WHERE status = 'active';

-- User's current sessions
CREATE INDEX idx_presence_user_sessions ON user_presence(user_id, status, last_activity_at);

-- Connection-based queries for cleanup
CREATE INDEX idx_presence_connection ON user_presence(connection_id, last_seen_at)
WHERE connection_id IS NOT NULL;

-- Stale presence cleanup
CREATE INDEX idx_presence_stale ON user_presence(last_seen_at)
WHERE status != 'disconnected';

-- Typing indicators
CREATE INDEX idx_presence_typing ON user_presence(document_id, is_typing, typing_indicator_expires_at)
WHERE is_typing = true;
```

#### **Presence Management Functions:**

```sql
-- 🔧 LEARNING: Real-time presence management
-- Function to update user presence
CREATE OR REPLACE FUNCTION update_user_presence(
    p_user_id UUID,
    p_document_id UUID,
    p_session_id TEXT,
    p_cursor_position JSONB DEFAULT NULL,
    p_is_typing BOOLEAN DEFAULT false,
    p_connection_id TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
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
    ) VALUES (
        p_user_id,
        p_document_id,
        p_session_id,
        p_cursor_position,
        p_is_typing,
        CASE WHEN p_is_typing THEN NOW() + INTERVAL '3 seconds' ELSE NULL END,
        p_connection_id,
        NOW(),
        NOW()
    )
    ON CONFLICT (user_id, document_id, session_id)
    DO UPDATE SET
        cursor_position = EXCLUDED.cursor_position,
        is_typing = EXCLUDED.is_typing,
        typing_indicator_expires_at = EXCLUDED.typing_indicator_expires_at,
        last_seen_at = NOW(),
        last_activity_at = NOW(),
        status = 'active';
END;
$$ LANGUAGE plpgsql;

-- Function to get active users on a document
CREATE OR REPLACE FUNCTION get_document_active_users(p_document_id UUID)
RETURNS TABLE (
    user_id UUID,
    username TEXT,
    avatar_url TEXT,
    cursor_position JSONB,
    is_typing BOOLEAN,
    last_seen_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        up.user_id,
        p.username,
        p.avatar_url,
        up.cursor_position,
        up.is_typing AND up.typing_indicator_expires_at > NOW(),
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
CREATE OR REPLACE FUNCTION cleanup_stale_presence()
RETURNS INTEGER AS $$
DECLARE
    cleanup_count INTEGER;
BEGIN
    -- Mark users as disconnected if no activity for 5 minutes
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

-- Automatic cleanup of expired typing indicators
CREATE OR REPLACE FUNCTION cleanup_expired_typing_indicators()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE user_presence
    SET
        is_typing = false,
        typing_indicator_expires_at = NULL
    WHERE is_typing = true
    AND typing_indicator_expires_at <= NOW();

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Run cleanup periodically (would be called by a cron job or background task)
-- This is just for demonstration - in production, use pg_cron or external scheduler
```

#### **RLS Policies for User Presence:**

```sql
-- 🔒 LEARNING: Presence data is sensitive - careful access control
ALTER TABLE user_presence ENABLE ROW LEVEL SECURITY;

-- Users can view presence for documents they have access to
CREATE POLICY "presence_select_policy" ON user_presence
    FOR SELECT USING (
        user_id = auth.uid() OR -- Users can always see their own presence
        EXISTS (
            SELECT 1 FROM documents d
            WHERE d.id = user_presence.document_id
            AND (
                d.owner_id = auth.uid() OR
                d.is_public = true OR
                user_has_document_permission(d.id, auth.uid(), 'viewer')
            )
        )
    );

-- Users can only insert/update their own presence
CREATE POLICY "presence_insert_policy" ON user_presence
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "presence_update_policy" ON user_presence
    FOR UPDATE USING (user_id = auth.uid());

-- Users can delete their own presence records
CREATE POLICY "presence_delete_policy" ON user_presence
    FOR DELETE USING (user_id = auth.uid());
```

---

## 🎯 **Phase 2 Summary & Implementation Ready**

### **What We've Added in Phase 2:**

1. ✅ **Comments System** with threaded discussions and mentions
2. ✅ **Document Versions** with delta storage and version control
3. ✅ **User Presence** for real-time collaboration awareness

### **Key Learning Achievements:**

- **Hierarchical Data**: Self-referencing relationships and recursive queries
- **Version Control**: Delta-based storage patterns and audit trails
- **Real-time Systems**: High-frequency update handling and cleanup strategies
- **Advanced SQL**: Recursive CTEs, complex triggers, and performance optimization

### **Next Steps:**

1. **Create Phase 2 Migration File** - SQL implementation ready
2. **Begin Phase 3 Design** - Advanced features (attachments, workspaces, analytics)
3. **Start Frontend Implementation** - Begin building React components

Ready to create the Phase 2 migration file or continue to Phase 3? 🚀
