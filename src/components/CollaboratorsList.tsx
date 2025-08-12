import React, { useEffect, useState } from 'react';
import { useCollaboration } from '../hooks/useCollaboration';
import { Permission } from '../hooks/useCollaboration';

interface CollaboratorsListProps {
    documentId: string
}

type PermissionWithProfile = Permission & {
    profiles?: {
        full_name: string,
        email: string
    }
}

export const CollaboratorsList: React.FC<CollaboratorsListProps> = ({ documentId }) => {
    const [permissions, setPermissions] = useState<PermissionWithProfile[]>([]);
    const [loading, setLoading] = useState(false);
    const { fetchPermissions, removeCollaborator } = useCollaboration();

    useEffect(() => { loadPermissions(); }, [documentId]);

    const loadPermissions = async () => {
        setLoading(true);
        try {
            const data = await fetchPermissions(documentId);

            setPermissions(data);
        } catch (error) {
            console.error("Failed to load permissions :(", error);
        } finally {
            setLoading(false);
        }
    }

    const handleRemoveCollaborator = async (userEmail: string | undefined) => {
        if (!userEmail) {
            console.error('No email provided for removal');
            return;
        }

        try {
            const result = await removeCollaborator(documentId, userEmail);
            if (result.success) {
                await loadPermissions(); // Refresh list
            }
        } catch (error) {
            console.error('Failed to remove collaborator:', error);
        }
    };

    if (loading) return <div>Loading collaborators...</div>;

    return (
        <div className="space-y-2">
            <h3 className="font-medium text-gray-900">Collaborators</h3>
            {permissions.map((permission) => (
                <div key={permission.id} className="flex items-center justify-between p-2 border rounded">
                    <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                            {permission.profiles?.full_name?.[0] || '?'}
                        </div>
                        <div>
                            <div className="text-sm font-medium">{permission.profiles?.full_name}</div>
                            <div className="text-xs text-gray-500">{permission.profiles?.email}</div>
                        </div>
                    </div>
                    <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600 capitalize">{permission.role}</span>
                        <button
                            onClick={() => {
                                const email = permission.profiles?.email;
                                if (email) {
                                    handleRemoveCollaborator(email);
                                } else {
                                    console.error('Cannot remove collaborator: email is undefined');
                                }
                            }}
                            className="text-red-600 hover:text-red-700 text-sm"
                        >
                            Remove
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
}
