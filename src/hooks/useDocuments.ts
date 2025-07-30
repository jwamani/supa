import { useEffect } from "react";
import { useAuthStore } from "../store/authStore";
import { useDocumentsStore } from "../store/documentsStore";

export const useDocuments = () => {
    const { user } = useAuthStore();
    const {
        documents,
        loading,
        error,
        fetchDocuments,
        createDocument: storeCreateDocument,
        updateDocument: storeUpdateDocument,
        deleteDocument: storeDeleteDocument,
        getDocument: storeGetDocument,
        searchDocuments: storeSearchDocuments,
        shouldRefetch,
        forceRefresh
    } = useDocumentsStore();

    // Wrapper functions that include user ID
    const createDocument = async (title: string, content?: any) => {
        if (!user) {
            throw new Error("User not authenticated");
        }
        return storeCreateDocument(user.id, title, content);
    };

    const updateDocument = async (id: string, updates: any) => {
        return storeUpdateDocument(id, updates);
    };

    const deleteDocument = async (id: string) => {
        return storeDeleteDocument(id);
    };

    const getDocument = async (id: string) => {
        return storeGetDocument(id);
    };

    const searchDocuments = async (query: string) => {
        if (!user) return [];
        return storeSearchDocuments(user.id, query);
    };

    const refetch = async (forceRefresh = false) => {
        if (!user) return;
        return fetchDocuments(user.id, forceRefresh);
    };

    const forceRefreshDocuments = async () => {
        if (!user) return;
        return forceRefresh(user.id);
    };

    // Only fetch if we should refetch (smart caching)
    useEffect(() => {
        if (user && shouldRefetch(user.id)) {
            console.log(
                "📋 useDocuments: Fetching documents because cache is stale or user changed",
            );
            fetchDocuments(user.id);
        } else if (user) {
            console.log(
                "📋 useDocuments: Using cached documents, no fetch needed",
            );
        }
    }, [user, fetchDocuments, shouldRefetch]);

    return {
        documents,
        loading,
        error,
        createDocument,
        updateDocument,
        deleteDocument,
        getDocument,
        searchDocuments,
        refetch,
        forceRefresh: forceRefreshDocuments
    };
};
