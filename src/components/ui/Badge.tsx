import React from 'react';

// 🎓 LEARNING: Badge component for status indicators and labels
// This demonstrates how to create flexible indicator components

export interface BadgeProps {
    children: React.ReactNode;
    variant?: 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info';
    size?: 'sm' | 'md' | 'lg';
    icon?: React.ReactNode;
    className?: string;
    dot?: boolean;
}

const Badge: React.FC<BadgeProps> = ({
    children,
    variant = 'default',
    size = 'md',
    icon,
    className = '',
    dot = false
}) => {
    // Base classes
    const baseClasses = 'inline-flex items-center font-medium rounded-full';

    // Variant classes
    const variantClasses = {
        default: 'bg-gray-100 text-gray-800',
        primary: 'bg-blue-100 text-blue-800',
        success: 'bg-green-100 text-green-800',
        warning: 'bg-yellow-100 text-yellow-800',
        error: 'bg-red-100 text-red-800',
        info: 'bg-indigo-100 text-indigo-800'
    };

    // Size classes
    const sizeClasses = {
        sm: 'px-2 py-1 text-xs',
        md: 'px-2.5 py-1.5 text-sm',
        lg: 'px-3 py-2 text-base'
    };

    // Dot variant classes
    const dotClasses = {
        default: 'bg-gray-400',
        primary: 'bg-blue-400',
        success: 'bg-green-400',
        warning: 'bg-yellow-400',
        error: 'bg-red-400',
        info: 'bg-indigo-400'
    };

    const badgeClasses = `
        ${baseClasses} 
        ${variantClasses[variant]} 
        ${sizeClasses[size]} 
        ${className}
    `.trim();

    return (
        <span className={badgeClasses}>
            {/* Dot indicator */}
            {dot && (
                <span className={`
                    w-2 h-2 rounded-full mr-1.5 
                    ${dotClasses[variant]}
                `} />
            )}

            {/* Icon */}
            {icon && !dot && (
                <span className="mr-1">
                    {React.cloneElement(icon as React.ReactElement<any>, {
                        className: size === 'sm' ? 'h-3 w-3' : size === 'md' ? 'h-4 w-4' : 'h-5 w-5'
                    })}
                </span>
            )}

            {/* Content */}
            {children}
        </span>
    );
};

export default Badge;
