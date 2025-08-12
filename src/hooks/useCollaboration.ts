import { supabase } from "../lib/supabaseClient";
import { useAuthStore } from "../store/authStore";
import { useDocuments } from "./useDocuments";
import type { Database } from "../lib/types";

export type Permission = Database["public"]["Tables"]["document_permissions"]["Row"];
type PermissionInsert =
    Database["public"]["Tables"]["document_permissions"]["Insert"];

interface CollaborationState {
    addCollaborator: (
        userEmail: string,
        documentId: string,
        userRole: string,
    ) => Promise<{ success: boolean;[k: string]: any }>;
    removeCollaborator: (
        documentId: string,
        userEmail: string,
    ) => Promise<{ success: boolean;[k: string]: any }>;
    fetchPermissions: (documentId: string) => Promise<Permission[]>;
    revokePermission: (
        documentId: string,
        userId: string,
    ) => Promise<{ success: true;[k: string]: any }>;
    checkUserPermission: (
        documentId: string,
        userId: string,
        requiredRole: string,
    ) => Promise<boolean>;
    getUserRole: (documentId: string, userId: string) => Promise<string | null>;
}
// enter their email and find their id
export const useCollaboration = () => {
    const { user } = useAuthStore();
    const addCollaborator: CollaborationState["addCollaborator"] = async (
        userEmail: string,
        documentId: string,
        userRole: string,
    ) => {
        try {
            const owner_id = user?.id;
            // find the user
            const { data, error } = await supabase.from("profiles").select("id")
                .eq("email", userEmail).single();

            if (error) throw error;

            const { data: permission, error: permissionError } = await supabase
                .from("document_permissions").insert({
                    document_id: documentId,
                    user_id: data.id,
                    role: userRole,
                    granted_by: owner_id,
                }).select().single();

            if (permissionError) throw permissionError;

            return { success: true, permission };
        } catch (err) {
            console.error("Failed to add collaborator: ", err);
            return { success: false, error: err };
        }
    };

    const removeCollaborator: CollaborationState["removeCollaborator"] = async (
        documentId: string,
        userEmail: string,
    ) => {
        try {
            const { data: userData, error: userError } = await supabase.from(
                "profiles",
            ).select("id").eq("email", userEmail).single();

            if (userError) throw userError;

            const { error: deleteError } = await supabase.from(
                "document_permissions",
            ).delete().eq("document_id", documentId).eq("user_id", userData.id);

            if (deleteError) throw deleteError;
            return { success: true };
        } catch (err) {
            console.error("Failed to remove collaborator", err);
            return { success: false };
        }
    };

    const fetchPermissions: CollaborationState["fetchPermissions"] = async (
        documentId: string,
    ) => {
        try {
            const { data, error } = await supabase.from("document_permissions")
                .select("*, profiles: user_id(id, email, full_name)").eq("document_id", documentId).eq("is_active", true).neq("revoked_at", null);
            
            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error("Failed to get permissions for document", error);
            return [];
        }
    };

    const revokePermission = async (documentId: string, userId: string) => {
        try {
            const { error } = await supabase
                .from("document_permissions")
                .update({ is_active: false })
                .eq('document_id', documentId)
                .eq('user_id', userId);

            if (error) throw error;
            return { success: true };
        } catch (err) {
            console.error("Failed to revoke permission:", err);
            return { success: false, error: err };
        }
    };

    const getUserRole: CollaborationState["getUserRole"] = async (documentId: string, userId: string) => {
        try {
            const { data } = await supabase.rpc('get_user_document_role', {
                doc_id: documentId,
                target_user_id: userId
            });
    
            return data;
        } catch (error) {
            console.error("Failed to retrieve user document role", error);
            return null;
        }
    } 

    const checkUserPermission = async (
        documentId: string,
        userId: string,
        requiredRole: string,
    ) => {
        const { data } = await supabase.rpc("user_has_document_permission", {
            doc_id: documentId,
            target_user_id: userId,
            required_role: requiredRole,
        });

        return data;
    };
    return {
        addCollaborator,
        removeCollaborator,
        getUserRole,
        checkUserPermission,
        revokePermission,
        fetchPermissions
    };
};
