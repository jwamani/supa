export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[];

export interface Database {
    public: {
        Tables: {
            documents: {
                Row: {
                    id: string;
                    title: string;
                    content: Json | null;
                    content_text: string | null;
                    search_vector: unknown | null;
                    owner_id: string;
                    workspace_id: string | null;
                    template_id: string | null;
                    parent_folder_id: string | null;
                    category: string;
                    tags: string[];
                    status: string;
                    is_favorite: boolean;
                    is_public: boolean;
                    public_slug: string | null;
                    word_count: number;
                    character_count: number;
                    reading_time_minutes: number;
                    view_count: number;
                    allow_comments: boolean;
                    allow_suggestions: boolean;
                    lock_editing: boolean;
                    created_at: string;
                    updated_at: string;
                    last_accessed_at: string | null;
                    published_at: string | null;
                    current_version: number;
                    last_saved_by: string | null;
                };
                Insert: {
                    id?: string;
                    title: string;
                    content?: Json | null;
                    content_text?: string | null;
                    search_vector?: unknown | null;
                    owner_id: string;
                    workspace_id?: string | null;
                    template_id?: string | null;
                    parent_folder_id?: string | null;
                    category?: string;
                    tags?: string[];
                    status?: string;
                    is_favorite?: boolean;
                    is_public?: boolean;
                    public_slug?: string | null;
                    word_count?: number;
                    character_count?: number;
                    reading_time_minutes?: number;
                    view_count?: number;
                    allow_comments?: boolean;
                    allow_suggestions?: boolean;
                    lock_editing?: boolean;
                    created_at?: string;
                    updated_at?: string;
                    last_accessed_at?: string | null;
                    published_at?: string | null;
                    current_version?: number;
                    last_saved_by?: string | null;
                };
                Update: {
                    id?: string;
                    title?: string;
                    content?: Json | null;
                    content_text?: string | null;
                    search_vector?: unknown | null;
                    owner_id?: string;
                    workspace_id?: string | null;
                    template_id?: string | null;
                    parent_folder_id?: string | null;
                    category?: string;
                    tags?: string[];
                    status?: string;
                    is_favorite?: boolean;
                    is_public?: boolean;
                    public_slug?: string | null;
                    word_count?: number;
                    character_count?: number;
                    reading_time_minutes?: number;
                    view_count?: number;
                    allow_comments?: boolean;
                    allow_suggestions?: boolean;
                    lock_editing?: boolean;
                    created_at?: string;
                    updated_at?: string;
                    last_accessed_at?: string | null;
                    published_at?: string | null;
                    current_version?: number;
                    last_saved_by?: string | null;
                };
            };
            profiles: {
                Row: {
                    id: string;
                    username: string | null;
                    full_name: string | null;
                    email: string | null;
                    avatar_url: string | null;
                    bio: string | null;
                    preferences: Json | null;
                    is_active: boolean;
                    last_active_at: string | null;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id: string;
                    username?: string | null;
                    full_name?: string | null;
                    email?: string | null;
                    avatar_url?: string | null;
                    bio?: string | null;
                    preferences?: Json | null;
                    is_active?: boolean;
                    last_active_at?: string | null;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    username?: string | null;
                    full_name?: string | null;
                    email?: string | null;
                    avatar_url?: string | null;
                    bio?: string | null;
                    preferences?: Json | null;
                    is_active?: boolean;
                    last_active_at?: string | null;
                    created_at?: string;
                    updated_at?: string;
                };
            };
            document_permissions: {
                Row: {
                    id: string;
                    document_id: string;
                    user_id: string;
                    role: string;
                    granted_by: string;
                    granted_at: string;
                    expires_at: string | null;
                    can_reshare: boolean;
                    notification_sent: boolean;
                    is_active: boolean;
                    revoked_at: string | null;
                    revoked_by: string | null;
                };
                Insert: {
                    id?: string;
                    document_id: string;
                    user_id: string;
                    role: string;
                    granted_by: string;
                    granted_at?: string;
                    expires_at?: string | null;
                    can_reshare?: boolean;
                    notification_sent?: boolean;
                    is_active?: boolean;
                    revoked_at?: string | null;
                    revoked_by?: string | null;
                };
                Update: {
                    id?: string;
                    document_id?: string;
                    user_id?: string;
                    role?: string;
                    granted_by?: string;
                    granted_at?: string;
                    expires_at?: string | null;
                    can_reshare?: boolean;
                    notification_sent?: boolean;
                    is_active?: boolean;
                    revoked_at?: string | null;
                    revoked_by?: string | null;
                };
            };
            comments: {
                Row: {
                    id: string;
                    document_id: string;
                    author_id: string;
                    parent_comment_id: string | null;
                    content: Json;
                    content_text: string | null;
                    search_vector: unknown | null;
                    position_in_document: Json | null;
                    thread_root_id: string | null;
                    depth_level: number;
                    sort_order: number;
                    status: string;
                    is_suggestion: boolean;
                    suggestion_accepted: boolean | null;
                    upvotes: number;
                    downvotes: number;
                    reply_count: number;
                    mentioned_users: string[];
                    created_at: string;
                    updated_at: string;
                    resolved_at: string | null;
                    resolved_by: string | null;
                };
                Insert: {
                    id?: string;
                    document_id: string;
                    author_id: string;
                    parent_comment_id?: string | null;
                    content: Json;
                    content_text?: string | null;
                    search_vector?: unknown | null;
                    position_in_document?: Json | null;
                    thread_root_id?: string | null;
                    depth_level?: number;
                    sort_order?: number;
                    status?: string;
                    is_suggestion?: boolean;
                    suggestion_accepted?: boolean | null;
                    upvotes?: number;
                    downvotes?: number;
                    reply_count?: number;
                    mentioned_users?: string[];
                    created_at?: string;
                    updated_at?: string;
                    resolved_at?: string | null;
                    resolved_by?: string | null;
                };
                Update: {
                    id?: string;
                    document_id?: string;
                    author_id?: string;
                    parent_comment_id?: string | null;
                    content?: Json;
                    content_text?: string | null;
                    search_vector?: unknown | null;
                    position_in_document?: Json | null;
                    thread_root_id?: string | null;
                    depth_level?: number;
                    sort_order?: number;
                    status?: string;
                    is_suggestion?: boolean;
                    suggestion_accepted?: boolean | null;
                    upvotes?: number;
                    downvotes?: number;
                    reply_count?: number;
                    mentioned_users?: string[];
                    created_at?: string;
                    updated_at?: string;
                    resolved_at?: string | null;
                    resolved_by?: string | null;
                };
            };
        };
        Views: {
            [_ in never]: never;
        };
        Functions: {
            [_ in never]: never;
        };
        Enums: {
            [_ in never]: never;
        };
    };
}
