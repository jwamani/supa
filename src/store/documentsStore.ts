import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { supabase } from "../lib/supabaseClient";
import type { Database } from "../lib/types";

type Document = Database["public"]["Tables"]["documents"]["Row"];
type DocumentInsert = Database["public"]["Tables"]["documents"]["Insert"];
type DocumentUpdate = Database["public"]["Tables"]["documents"]["Update"];

interface DocumentsState {
    // Core state
    documents: Document[];
    loading: boolean;
    error: string | null;
    lastFetch: number | null; // Timestamp of last successful fetch
    currentUserId: string | null; // Track which user's documents we have cached
    expectedDocumentCount: number | null; // Track expected count for change detection

    // Individual document cache (persisted as object, used as Map)
    documentCache: Map<string, Document>;

    // Actions (not persisted)
    setDocuments: (documents: Document[]) => void;
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;

    // Main operations (not persisted)
    fetchDocuments: (userId: string, forceRefresh?: boolean) => Promise<void>;
    createDocument: (
        userId: string,
        title: string,
        content?: any,
    ) => Promise<Document>;
    updateDocument: (id: string, updates: DocumentUpdate) => Promise<Document>;
    deleteDocument: (id: string) => Promise<void>;
    getDocument: (id: string) => Promise<Document>;
    searchDocuments: (userId: string, query: string) => Promise<Document[]>;

    // Cache management (not persisted)
    invalidateCache: () => void;
    shouldRefetch: (userId: string) => boolean;
    addToCache: (document: Document) => void;
    removeFromCache: (id: string) => void;

    forceRefresh: (userId: string) => Promise<void>;
}

// Define what gets persisted (exclude functions and loading states)
interface PersistedState {
    documents: Document[];
    lastFetch: number | null;
    currentUserId: string | null;
    expectedDocumentCount: number | null;
    documentCacheObject: Record<string, Document>; // Map serialized as object
}

const CACHE_DURATION = 20 * 60 * 1000; // 5 minutes
const MAX_CACHE_SIZE = 100; // Maximum documents to cache

export const useDocumentsStore = create<DocumentsState>()(
    persist(
        (set, get) => ({
            // Initial state
            documents: [],
            loading: false,
            error: null,
            lastFetch: null,
            currentUserId: null,
            expectedDocumentCount: null,
            documentCache: new Map(),

            // Basic setters
            setDocuments: (documents) => set({ documents }),
            setLoading: (loading) => set({ loading }),
            setError: (error) => set({ error }),

            // Check if we should refetch based on cache freshness and user
            shouldRefetch: (userId: string) => {
                const state = get();

                // Always refetch if different user
                if (state.currentUserId !== userId) {
                    console.log("📋 Documents: Different user, refetching");
                    return true;
                }

                // Refetch if no previous fetch
                if (!state.lastFetch) {
                    console.log("📋 Documents: No previous fetch, refetching");
                    return true;
                }

                // Check if cache is stale (time-based) - this is the main check
                const now = Date.now();
                const cacheAge = now - state.lastFetch;
                const isStale = cacheAge > CACHE_DURATION;

                if (isStale) {
                    console.log(
                        `📋 Documents: Cache is stale (${
                            Math.round(cacheAge / 1000)
                        }s old), refetching`,
                    );
                    return true;
                }

                // Cache is fresh, use it
                return false;
            },

            // Fetch documents with intelligent caching
            fetchDocuments: async (userId: string, forceRefresh = false) => {
                const state = get();

                // Don't fetch if already loading for same user
                if (
                    state.loading && state.currentUserId === userId &&
                    !forceRefresh
                ) {
                    console.log(
                        "📋 Documents: Already loading for this user, skipping",
                    );
                    return;
                }

                // Use cache if fresh and same user
                if (!forceRefresh && !state.shouldRefetch(userId)) {
                    console.log("📋 Documents: Using cached data");
                    return;
                }

                try {
                    console.log(
                        "📋 Documents: Fetching from database for user:",
                        userId,
                    );
                    set({ loading: true, error: null });

                    const { data, error: fetchError } = await supabase
                        .from("documents")
                        .select("*")
                        .eq("owner_id", userId)
                        .order("updated_at", { ascending: false });

                    if (fetchError) {
                        throw fetchError;
                    }

                    const documents = data || [];
                    console.log(
                        `📋 Documents: Fetched ${documents.length} documents`,
                    );

                    // Update cache and state
                    documents.forEach((doc) => state.addToCache(doc));

                    set({
                        documents,
                        loading: false,
                        error: null,
                        lastFetch: Date.now(),
                        currentUserId: userId,
                        expectedDocumentCount: documents.length, // Track expected count
                    });

                    console.log(
                        `📋 Documents: Updated state with ${documents.length} documents`,
                    );
                } catch (err) {
                    console.error("📋 Documents: Fetch error:", err);
                    const errorMessage = err instanceof Error
                        ? err.message
                        : "Failed to fetch documents";

                    set({
                        loading: false,
                        error: errorMessage,
                    });
                }
            },

            // Create document with optimistic update
            createDocument: async (
                userId: string,
                title: string,
                content?: any,
            ) => {
                const state = get();

                // Optimistic update
                const tempId = `temp-${Date.now()}`;
                const optimisticDoc: Document = {
                    id: tempId,
                    title: title.trim(),
                    content: content || {
                        type: "doc",
                        content: [{
                            type: "paragraph",
                            content: [{ type: "text", text: "" }],
                        }],
                    },
                    content_text: null,
                    search_vector: null,
                    owner_id: userId,
                    workspace_id: null,
                    template_id: null,
                    parent_folder_id: null,
                    category: "general",
                    tags: [],
                    status: "draft",
                    is_favorite: false,
                    is_public: false,
                    public_slug: null,
                    word_count: 0,
                    character_count: 0,
                    reading_time_minutes: 0,
                    view_count: 0,
                    allow_comments: true,
                    allow_suggestions: true,
                    lock_editing: false,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                    last_accessed_at: null,
                    published_at: null,
                    current_version: 1,
                    last_saved_by: null,
                };

                // Add optimistically to state
                set({
                    documents: [optimisticDoc, ...state.documents],
                });

                try {
                    const documentData: DocumentInsert = {
                        title: title.trim(),
                        content: content || {
                            type: "doc",
                            content: [{
                                type: "paragraph",
                                content: [{ type: "text", text: "" }],
                            }],
                        },
                        owner_id: userId,
                        status: "draft",
                    };

                    const { data, error } = await supabase
                        .from("documents")
                        .insert([documentData])
                        .select()
                        .single();

                    if (error) {
                        throw error;
                    }

                    console.log("📋 Documents: Created document:", data.id);

                    // Replace optimistic update with real data
                    const updatedDocuments = get().documents.map((doc) =>
                        doc.id === tempId ? data : doc
                    );

                    // Add to cache
                    get().addToCache(data);

                    // Update state with real document and keep cache fresh
                    set({
                        documents: updatedDocuments,
                        lastFetch: Date.now(),
                        expectedDocumentCount: updatedDocuments.length,
                        currentUserId: userId, // Ensure user ID is maintained
                    });

                    console.log(
                        `📋 Documents: Successfully created and cached document. Total: ${updatedDocuments.length}`,
                    );

                    return data;
                } catch (err) {
                    console.error("📋 Documents: Create error:", err);

                    // Remove optimistic update on error
                    const rollbackDocuments = state.documents.filter((doc) =>
                        doc.id !== tempId
                    );
                    set({ documents: rollbackDocuments });

                    throw err;
                }
            },

            // Update document with optimistic update
            updateDocument: async (id: string, updates: DocumentUpdate) => {
                const state = get();

                console.log("📋 Documents: Starting update for document:", id);
                console.log("📋 Documents: Updates to apply:", updates);

                // Optimistic update
                const currentDoc = state.documents.find((doc) => doc.id === id);
                if (currentDoc) {
                    const optimisticDoc = {
                        ...currentDoc,
                        ...updates,
                        updated_at: new Date().toISOString(),
                    };
                    const updatedDocuments = state.documents.map((doc) =>
                        doc.id === id ? optimisticDoc : doc
                    );

                    console.log("📋 Documents: Applied optimistic update");
                    set({ documents: updatedDocuments });
                }

                try {
                    console.log(
                        "📋 Documents: Sending to Supabase...",
                        updates,
                    );

                    const { data, error } = await supabase
                        .from("documents")
                        .update(updates)
                        .eq("id", id)
                        .select()
                        .single();

                    if (error) {
                        console.error(
                            "📋 Documents: Supabase update error:",
                            error,
                        );
                        throw error;
                    }

                    console.log("📋 Documents: Supabase responded with:", data);
                    console.log(
                        "📋 Documents: Update successful for document:",
                        id,
                    );

                    // Update with real data from database
                    const currentState = get();
                    const finalDocuments = currentState.documents.map((doc) =>
                        doc.id === id ? data : doc
                    );

                    // Update cache
                    const newCache = new Map(currentState.documentCache);
                    newCache.set(data.id, data);

                    set({
                        documents: finalDocuments,
                        documentCache: newCache,
                        lastFetch: Date.now(), // Keep cache fresh after update
                    });

                    console.log("📋 Documents: State updated with real data");
                    return data;
                } catch (err) {
                    console.error("📋 Documents: Update error:", err);

                    // Rollback optimistic update
                    if (currentDoc) {
                        const rollbackDocuments = state.documents.map((doc) =>
                            doc.id === id ? currentDoc : doc
                        );
                        set({ documents: rollbackDocuments });
                    }

                    throw err;
                }
            },

            // Delete document with optimistic update
            deleteDocument: async (id: string) => {
                const state = get();

                // Optimistic update
                const documentToDelete = state.documents.find((doc) =>
                    doc.id === id
                );
                const optimisticDocuments = state.documents.filter((doc) =>
                    doc.id !== id
                );

                set({ documents: optimisticDocuments });

                try {
                    const { error } = await supabase
                        .from("documents")
                        .delete()
                        .eq("id", id);

                    if (error) {
                        throw error;
                    }

                    console.log("📋 Documents: Deleted document:", id);

                    // Remove from cache and update expected count
                    state.removeFromCache(id);

                    set({
                        expectedDocumentCount: state.documents.length, // Update expected count after deletion
                        lastFetch: Date.now(), // Keep cache fresh after deletion
                    });
                } catch (err) {
                    console.error("📋 Documents: Delete error:", err);

                    // Rollback optimistic update
                    if (documentToDelete) {
                        set({
                            documents: [...state.documents, documentToDelete],
                        });
                    }

                    throw err;
                }
            },

            // Get single document (with caching)
            getDocument: async (id: string) => {
                const state = get();

                // Check cache first
                const cached = state.documentCache.get(id);
                if (cached) {
                    console.log("📋 Documents: Using cached document:", id);
                    return cached;
                }

                try {
                    console.log("📋 Documents: Fetching single document:", id);

                    const { data, error } = await supabase
                        .from("documents")
                        .select("*")
                        .eq("id", id)
                        .single();

                    if (error) {
                        throw error;
                    }

                    // Add to cache
                    state.addToCache(data);

                    return data;
                } catch (err) {
                    console.error("📋 Documents: Get document error:", err);
                    throw err;
                }
            },

            // Search documents - server-side full-text search with client-side fallback
            searchDocuments: async (userId: string, query: string) => {
                const state = get();

                // If no query, return all documents
                if (!query.trim()) {
                    // Ensure we have documents loaded for this user
                    if (
                        state.currentUserId !== userId ||
                        state.shouldRefetch(userId)
                    ) {
                        await state.fetchDocuments(userId);
                    }
                    return get().documents;
                }

                const searchTerm = query.trim();
                console.log("📋 Documents: Searching for:", searchTerm);

                try {
                    // Try server-side full-text search first using Supabase textSearch
                    console.log(
                        "📋 Documents: Using server-side full-text search",
                    );

                    const { data, error } = await supabase
                        .from("documents")
                        .select("*")
                        .eq("owner_id", userId)
                        .textSearch("search_vector", searchTerm, {
                            type: "websearch",
                            config: "english",
                        })
                        .order("updated_at", { ascending: false });

                    if (error) {
                        console.warn(
                            "📋 Documents: Server-side search failed, falling back to client-side:",
                            error,
                        );
                        throw error; // This will trigger the fallback
                    }

                    const results = data || [];
                    console.log(
                        `📋 Documents: Server-side search found ${results.length} results for "${searchTerm}"`,
                    );

                    // Update cache with search results
                    results.forEach((doc) => state.addToCache(doc));

                    return results;
                } catch (serverError) {
                    // Fallback to client-side search if server-side fails
                    console.log(
                        "📋 Documents: Falling back to client-side search",
                    );

                    // Ensure we have documents loaded for this user
                    if (
                        state.currentUserId !== userId ||
                        state.shouldRefetch(userId)
                    ) {
                        await state.fetchDocuments(userId);
                    }

                    const searchTermLower = searchTerm.toLowerCase();

                    // Client-side search across multiple fields
                    const results = get().documents.filter((doc) => {
                        // Search in title
                        if (doc.title.toLowerCase().includes(searchTermLower)) {
                            return true;
                        }

                        // Search in tags
                        if (
                            doc.tags && doc.tags.some((tag) =>
                                tag.toLowerCase().includes(searchTermLower)
                            )
                        ) {
                            return true;
                        }

                        // Search in content_text if available
                        if (
                            doc.content_text &&
                            doc.content_text.toLowerCase().includes(
                                searchTermLower,
                            )
                        ) {
                            return true;
                        }

                        // Search in category
                        if (
                            doc.category &&
                            doc.category.toLowerCase().includes(searchTermLower)
                        ) {
                            return true;
                        }

                        return false;
                    });

                    console.log(
                        `📋 Documents: Client-side search found ${results.length} results for "${searchTerm}"`,
                    );
                    return results;
                }
            },

            // Cache management
            addToCache: (document: Document) => {
                const state = get();
                const cache = new Map(state.documentCache);

                // Implement LRU-like behavior
                if (cache.size >= MAX_CACHE_SIZE) {
                    const firstKey = cache.keys().next().value;
                    if (firstKey) {
                        cache.delete(firstKey);
                    }
                }

                cache.set(document.id, document);
                set({ documentCache: cache });
            },

            removeFromCache: (id: string) => {
                const state = get();
                const cache = new Map(state.documentCache);
                cache.delete(id);
                set({ documentCache: cache });
            },

            invalidateCache: () => {
                console.log("📋 Documents: Invalidating cache");
                set({
                    lastFetch: null,
                    currentUserId: null,
                    expectedDocumentCount: null,
                    documentCache: new Map(),
                });
            },

            forceRefresh: async (userId: string) => {
                console.log("📋 Documents: Force refreshing documents");
                const state = get();

                // clear cache to force refresh
                set({
                    lastFetch: null,
                    expectedDocumentCount: null,
                    documentCache: new Map(),
                });

                await state.fetchDocuments(userId, true);
            },
        }),
        {
            name: "documents-store", // name for localStorage key
            storage: createJSONStorage(() => localStorage),
            partialize: (state): PersistedState => ({
                // Only persist these fields, exclude loading states and functions
                documents: state.documents,
                lastFetch: state.lastFetch,
                currentUserId: state.currentUserId,
                expectedDocumentCount: state.expectedDocumentCount,
                // Don't persist documentCache - rebuild from documents on rehydration
                documentCacheObject: {}, // Remove this to avoid sync issues
            }),
            onRehydrateStorage: () => (state) => {
                if (state) {
                    // Rebuild cache from documents array - single source of truth
                    const cacheMap = new Map<string, Document>();

                    // Add all documents to cache
                    if (state.documents && Array.isArray(state.documents)) {
                        state.documents.forEach((doc) => {
                            cacheMap.set(doc.id, doc);
                        });
                    }

                    state.documentCache = cacheMap;

                    console.log(
                        `📋 Documents: Store rehydrated with ${
                            state.documents?.length || 0
                        } documents`,
                    );
                    console.log(
                        `📋 Documents: Rebuilt cache with ${cacheMap.size} documents (should match)`,
                    );
                }
            },
            // Optional: configure version for migration support
            version: 1,
        },
    ),
);
