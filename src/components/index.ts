// 🎓 LEARNING: Main Component System Index
// This file provides centralized access to all UI components in our system

// ========================================
// BASE UI COMPONENTS
// ========================================
export { default as Button } from './ui/Button';
export type { ButtonProps } from './ui/Button';

export { default as Input } from './ui/Input';
export type { InputProps } from './ui/Input';

export { default as Modal } from './ui/Modal';
export type { ModalProps } from './ui/Modal';

export { default as Card } from './ui/Card';
export type { CardProps } from './ui/Card';

export { default as Badge } from './ui/Badge';
export type { BadgeProps } from './ui/Badge';

export { LoadingSpinner } from './ui/LoadingSpinner';

// ========================================
// LAYOUT COMPONENTS
// ========================================
export { default as Header } from './layout/Header';
export type { HeaderProps } from './layout/Header';

export { default as PageLayout } from './layout/PageLayout';
export type { PageLayoutProps } from './layout/PageLayout';

// ========================================
// DOCUMENT COMPONENTS
// ========================================
export {
    DocumentCard,
    DocumentGrid,
    CreateDocumentModal,
    ShareDocumentModal
} from './documents';
export type {
    DocumentCardProps,
    DocumentGridProps,
    CreateDocumentModalProps,
    ShareDocumentModalProps,
    DocumentShare,
    PermissionLevel
} from './documents';

// ========================================
// EDITOR COMPONENTS
// ========================================
export {
    EditorToolbar,
    EditorStatus,
    EditorSidebar
} from './editor';
export type {
    EditorToolbarProps,
    EditorStatusProps,
    EditorSidebarProps
} from './editor';

// ========================================
// EXISTING SPECIALIZED COMPONENTS
// ========================================
export { default as TiptapEditor } from './TiptapEditor';

// Auth components (named export)
export { AuthForm } from './auth/AuthForm';
