import React from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

// 🎓 LEARNING: Modal component with backdrop, animations, and accessibility
// This demonstrates proper modal patterns with focus management

export interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    children: React.ReactNode;
    showCloseButton?: boolean;
    closeOnBackdrop?: boolean;
    className?: string;
}

const Modal: React.FC<ModalProps> = React.memo(({
    isOpen,
    onClose,
    title,
    size = 'md',
    children,
    showCloseButton = true,
    closeOnBackdrop = true,
    className = ''
}) => {
    // 🎓 LEARNING: Use a ref to ensure consistent portal target
    const [portalTarget] = React.useState(() => {
        if (typeof document !== 'undefined') {
            return document.body;
        }
        return null;
    });

    // 🎓 LEARNING: Stable render without early returns to prevent fiber corruption
    const shouldRender = isOpen && portalTarget;

    // Size classes for the modal content
    const sizeClasses = {
        sm: 'max-w-md',
        md: 'max-w-lg',
        lg: 'max-w-2xl',
        xl: 'max-w-4xl'
    };

    // Handle backdrop click - use useCallback for stability
    const handleBackdropClick = React.useCallback((e: React.MouseEvent) => {
        if (e.target === e.currentTarget && closeOnBackdrop) {
            onClose();
        }
    }, [closeOnBackdrop, onClose]);

    // Handle escape key and prevent body scroll
    React.useEffect(() => {
        if (!isOpen) return;

        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        document.addEventListener('keydown', handleEscape);

        // Prevent body scrolling when modal is open
        const originalOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = originalOverflow;
        };
    }, [isOpen, onClose]);

    // 🎓 LEARNING: Stable modal content to prevent re-creation
    const modalContent = React.useMemo(() => {
        if (!shouldRender) return null;

        return (
            <div className="fixed inset-0 z-50 overflow-y-auto">
                {/* Backdrop */}
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                    onClick={handleBackdropClick}
                />

                {/* Modal Container */}
                <div className="flex min-h-full items-center justify-center p-4">
                    {/* Modal Content */}
                    <div className={`
                        relative w-full ${sizeClasses[size]} 
                        bg-white rounded-lg shadow-xl 
                        transform transition-all
                        ${className}
                    `}>
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b border-gray-200">
                            <h3 className="text-lg font-medium text-gray-900">
                                {title || ' '}
                            </h3>
                            {showCloseButton && (
                                <button
                                    onClick={onClose}
                                    className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                                    aria-label="Close modal"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            )}
                        </div>

                        {/* Content */}
                        <div className="p-6">
                            {children}
                        </div>
                    </div>
                </div>
            </div>
        );
    }, [shouldRender, handleBackdropClick, sizeClasses, size, className, title, showCloseButton, onClose, children]);

    // Only create portal if we have content and target
    if (!modalContent || !portalTarget) {
        return null;
    }

    return createPortal(modalContent, portalTarget);
});

Modal.displayName = 'Modal';

export default Modal;
