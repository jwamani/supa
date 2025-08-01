import { supabase } from "../lib/supabaseClient";
import { useAuthStore } from "../store/authStore";
import { useDocuments } from "./useDocuments";
import type { Database } from "../lib/types";

type Permission = Database["public"]["Tables"]["document_permissions"]["Row"]
type PermissionInsert = Database["public"]["Tables"]["document_permissions"]["Insert"]

interface CollaborationState {
    addCollaborator: () => Promise<void>;
    removeCollaborator: () => Promise<void>;
}
// enter their email and find their id
export const useCollaboration = () => {
    const { user } = useAuthStore();
    const addCollaborator = async (userEmail: string, documentId: string, userRole: string) => {
        try {
            const owner_id = user?.id;
            const { data, error } = await supabase.from("profiles").select("id").eq('email', userEmail).single();

            if (error) throw error;

            const {data: permission, error: permissionError} = await supabase.from("document_permissions").insert({
                document_id: documentId,
                user_id: data.id,
                role: userRole,
                granted_by: owner_id
            }).select().single();

            if (permissionError) throw permissionError;
            
            return {success: true, permission}

        } catch(err) {
            console.error("Failed to add collaborator: ", err);
            return {success: false, error: err}
        }
    }

    const removeCollaborator = async () => {

    }

    const fetchPermission = async () => {

    }

    const revokePermission = async () => {

    }
    return {
        addCollaborator,
        removeCollaborator
    };
}