# 🤝 Collaboration Architecture & Workflow Guide

## 📋 **Current State Analysis**

### ✅ **What You Have**
1. **Two ShareModal Implementations**:
   - `src/components/ShareModal.tsx` - Basic email-based collaborator adding
   - Inline ShareModal in `DocumentPage.tsx` and `DashboardPage.tsx` - Public link sharing

2. **Database Foundation**:
   - `document_permissions` table with roles (viewer, commenter, editor, owner)
   - `user_presence` table for real-time collaboration
   - SQL functions for permission checking
   - RLS policies for security

3. **Incomplete Hook**:
   - `useCollaboration.ts` with partial implementations

## 🎯 **Recommended ShareModal Approach**

**Use your existing `src/components/ShareModal.tsx` but enhance it** to include both:
1. Email-based collaborator invitation (your current implementation)
2. Public link sharing functionality (from Dashboard/DocumentPage)

## 🏗️ **Complete Collaboration Workflow Architecture**

### **Phase 1: Document Sharing Workflow**

```
📄 Document Owner Actions:
├── 1. Click "Share" button
├── 2. ShareModal opens with two tabs:
│   ├── "Invite People" tab
│   │   ├── Enter email address
│   │   ├── Select role (viewer/commenter/editor)
│   │   └── Send invitation
│   └── "Public Link" tab
│       ├── Toggle public access on/off
│       ├── Copy shareable link
│       └── View current collaborators
└── 3. Permissions stored in database
```

### **Phase 2: Collaborator Experience**

```
👥 Invited Collaborators:
├── 1. Receive email notification (future)
├── 2. Click document link
├── 3. System checks permissions via SQL functions
├── 4. Role-based UI rendering:
│   ├── Viewer: Read-only access
│   ├── Commenter: Read + comment
│   └── Editor: Read + edit + comment
└── 5. Real-time presence tracking
```

### **Phase 3: Real-time Features**

```
⚡ Live Collaboration:
├── 1. User presence indicators
├── 2. Typing indicators
├── 3. Cursor tracking (future)
├── 4. Live content synchronization
└── 5. Conflict resolution
```

## 🔧 **Enhanced ShareModal Implementation**

Replace your current `ShareModal.tsx` with this comprehensive version:

```typescript
import React, { useState, useEffect } from 'react';
import { useCollaboration } from '../hooks/useCollaboration';
import { Globe, Mail, Users, Copy, X, Plus, Trash2 } from 'lucide-react';
import type { Database } from '../lib/types';

interface ShareModalProps {
    documentId: string;
    isOpen: boolean;
    onClose: () => void;
    document?: Database["public"]["Tables"]["documents"]["Row"];
}

type ROLES = 'editor' | 'commenter' | 'viewer';
type Permission = Database["public"]["Tables"]["document_permissions"]["Row"] & {
    profiles: {
        id: string;
        email: string;
        full_name: string;
        avatar_url?: string;
    };
};

export const ShareModal: React.FC<ShareModalProps> = ({ 
    documentId, 
    isOpen, 
    onClose, 
    document 
}) => {
    const [activeTab, setActiveTab] = useState<'invite' | 'public'>('invite');
    const [email, setEmail] = useState('');
    const [role, setRole] = useState<ROLES>('viewer');
    const [loading, setLoading] = useState(false);
    const [permissions, setPermissions] = useState<Permission[]>([]);
    const [publicLinkCopied, setPublicLinkCopied] = useState(false);
    
    const { 
        addCollaborator, 
        fetchPermissions, 
        removeCollaborator,
        updatePermission 
    } = useCollaboration();

    // Load permissions when modal opens
    useEffect(() => {
        if (isOpen && documentId) {
            loadPermissions();
        }
    }, [isOpen, documentId]);

    const loadPermissions = async () => {
        try {
            const data = await fetchPermissions(documentId);
            setPermissions(data);
        } catch (error) {
            console.error('Failed to load permissions:', error);
        }
    };

    const handleAddCollaborator = async () => {
        if (!email.trim()) return;
        
        setLoading(true);
        try {
            const result = await addCollaborator(email, documentId, role);
            if (result.success) {
                setEmail('');
                await loadPermissions(); // Refresh list
            } else {
                console.error("Failed to add collaborator:", result.error);
            }
        } catch (error) {
            console.error("Error adding collaborator:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveCollaborator = async (userEmail: string) => {
        try {
            const result = await removeCollaborator(documentId, userEmail);
            if (result.success) {
                await loadPermissions(); // Refresh list
            }
        } catch (error) {
            console.error('Failed to remove collaborator:', error);
        }
    };

    const copyPublicLink = async () => {
        const link = `${window.location.origin}/public/${document?.public_slug || documentId}`;
        await navigator.clipboard.writeText(link);
        setPublicLinkCopied(true);
        setTimeout(() => setPublicLinkCopied(false), 2000);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-lg w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b">
                    <div>
                        <h2 className="text-xl font-semibold text-gray-900">Share Document</h2>
                        <p className="text-sm text-gray-600 mt-1">"{document?.title}"</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600"
                    >
                        <X className="h-6 w-6" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b">
                    <button
                        onClick={() => setActiveTab('invite')}
                        className={`flex-1 py-3 px-4 text-sm font-medium ${
                            activeTab === 'invite'
                                ? 'text-blue-600 border-b-2 border-blue-600'
                                : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        <Mail className="h-4 w-4 inline mr-2" />
                        Invite People
                    </button>
                    <button
                        onClick={() => setActiveTab('public')}
                        className={`flex-1 py-3 px-4 text-sm font-medium ${
                            activeTab === 'public'
                                ? 'text-blue-600 border-b-2 border-blue-600'
                                : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        <Globe className="h-4 w-4 inline mr-2" />
                        Public Link
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 max-h-96 overflow-y-auto">
                    {activeTab === 'invite' ? (
                        <div className="space-y-6">
                            {/* Add Collaborator Form */}
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Email Address
                                    </label>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="Enter collaborator email"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Role
                                    </label>
                                    <select
                                        value={role}
                                        onChange={(e) => setRole(e.target.value as ROLES)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="viewer">Viewer - Can only read</option>
                                        <option value="commenter">Commenter - Can read and comment</option>
                                        <option value="editor">Editor - Can read, edit, and comment</option>
                                    </select>
                                </div>

                                <button
                                    onClick={handleAddCollaborator}
                                    disabled={loading || !email.trim()}
                                    className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading ? (
                                        <div className="flex items-center justify-center">
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                            Adding...
                                        </div>
                                    ) : (
                                        <>
                                            <Plus className="h-4 w-4 inline mr-2" />
                                            Add Collaborator
                                        </>
                                    )}
                                </button>
                            </div>

                            {/* Current Collaborators */}
                            <div>
                                <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                                    <Users className="h-4 w-4 mr-2" />
                                    Collaborators ({permissions.length})
                                </h3>
                                
                                <div className="space-y-2">
                                    {permissions.map((permission) => (
                                        <div key={permission.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-md">
                                            <div className="flex items-center space-x-3">
                                                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                                                    {permission.profiles?.full_name?.[0] || permission.profiles?.email?.[0]?.toUpperCase() || '?'}
                                                </div>
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {permission.profiles?.full_name || permission.profiles?.email}
                                                    </div>
                                                    <div className="text-xs text-gray-500">
                                                        {permission.profiles?.email}
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <div className="flex items-center space-x-2">
                                                <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded-full capitalize">
                                                    {permission.role}
                                                </span>
                                                <button
                                                    onClick={() => handleRemoveCollaborator(permission.profiles?.email)}
                                                    className="text-gray-400 hover:text-red-600 p-1"
                                                    title="Remove collaborator"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                    
                                    {permissions.length === 0 && (
                                        <div className="text-center py-8 text-gray-500">
                                            <Users className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                                            <p className="text-sm">No collaborators yet</p>
                                            <p className="text-xs">Add people to collaborate on this document</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* Public Access Toggle */}
                            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-md">
                                <div className="flex items-center space-x-3">
                                    <Globe className="h-5 w-5 text-blue-600" />
                                    <div>
                                        <div className="text-sm font-medium text-gray-900">Public Access</div>
                                        <div className="text-xs text-gray-500">Anyone with the link can view</div>
                                    </div>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={document?.is_public || false}
                                        onChange={async (e) => {
                                            // Handle public toggle
                                            console.log('Toggle public access:', e.target.checked);
                                        }}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                </label>
                            </div>

                            {/* Public Link */}
                            {document?.is_public && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Public Link
                                    </label>
                                    <div className="flex">
                                        <input
                                            type="text"
                                            value={`${window.location.origin}/public/${document?.public_slug || documentId}`}
                                            readOnly
                                            className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md bg-gray-50 text-sm"
                                        />
                                        <button
                                            onClick={copyPublicLink}
                                            className="px-4 py-2 bg-blue-600 text-white rounded-r-md hover:bg-blue-700 text-sm"
                                        >
                                            {publicLinkCopied ? (
                                                <span className="text-green-200">Copied!</span>
                                            ) : (
                                                <>
                                                    <Copy className="h-4 w-4 inline mr-1" />
                                                    Copy
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {!document?.is_public && (
                                <div className="text-center py-8 text-gray-500">
                                    <Globe className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                                    <p className="text-sm">Document is private</p>
                                    <p className="text-xs">Enable public access to share with anyone</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex justify-end space-x-3 p-6 border-t bg-gray-50">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};
```

## 🔐 **Permission System Workflow**

### **Database Permission Levels**:
```sql
-- Role Hierarchy (higher number = more permissions)
owner:     4 (full control)
editor:    3 (read, write, comment)
commenter: 2 (read, comment)
viewer:    1 (read only)
```

### **Frontend Permission Checks**:
```typescript
// Example usage in components
const userRole = await getUserRole(documentId, userId);

// Conditional rendering based on permissions
const canEdit = ['owner', 'editor'].includes(userRole);
const canComment = ['owner', 'editor', 'commenter'].includes(userRole);
const canView = ['owner', 'editor', 'commenter', 'viewer'].includes(userRole);
```

## 🔄 **Real-time Collaboration Flow**

### **Presence Tracking**:
```typescript
1. User joins document → Track presence
2. User types → Update typing status
3. User moves cursor → Broadcast position (future)
4. User leaves → Remove presence
```

### **Content Synchronization**:
```typescript
1. User makes edit → Optimistic update
2. Send to Supabase → Database update
3. Broadcast change → Real-time sync
4. Other users receive → Update their editors
```

## 📊 **Implementation Status**

### ✅ **Completed**:
- Database schema and permissions
- SQL functions for permission checking
- Basic ShareModal component structure
- Public sharing in Dashboard/DocumentPage

### 🚧 **In Progress**:
- Enhanced ShareModal with tabs
- Complete useCollaboration hook
- Permission-based UI rendering

### ⏳ **Next Steps**:
1. **Complete useCollaboration hook** (missing functions)
2. **Replace ShareModal** with enhanced version above
3. **Add real-time presence** tracking
4. **Implement permission-based UI** in DocumentPage
5. **Add email notifications** (future phase)

## 🎯 **Key Learning Concepts**

1. **Permission Management**: Role-based access control
2. **Real-time State**: Managing live collaboration state
3. **Optimistic Updates**: UI responsiveness during async operations
4. **WebSocket Management**: Supabase channels for real-time features
5. **Security**: RLS policies and server-side validation

This architecture provides a complete, scalable collaboration system that leverages Supabase's real-time capabilities while maintaining proper security and user experience patterns.
