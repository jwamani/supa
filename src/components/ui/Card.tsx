import React from 'react';

// 🎓 LEARNING: Card component for content organization
// This demonstrates flexible container components with variants

export interface CardProps {
    children: React.ReactNode;
    variant?: 'default' | 'outline' | 'shadow';
    padding?: 'none' | 'sm' | 'md' | 'lg';
    className?: string;
    hover?: boolean;
    onClick?: () => void;
}

const Card: React.FC<CardProps> = ({
    children,
    variant = 'default',
    padding = 'md',
    className = '',
    hover = false,
    onClick
}) => {
    // Base classes
    const baseClasses = 'bg-white rounded-lg transition-all';

    // Variant classes
    const variantClasses = {
        default: 'border border-gray-200',
        outline: 'border-2 border-gray-200',
        shadow: 'shadow-sm border border-gray-200'
    };

    // Padding classes
    const paddingClasses = {
        none: '',
        sm: 'p-3',
        md: 'p-4',
        lg: 'p-6'
    };

    // Hover effects
    const hoverClasses = hover
        ? 'hover:shadow-md hover:border-gray-300 cursor-pointer'
        : '';

    // Click handling
    const clickClasses = onClick
        ? 'cursor-pointer'
        : '';

    const cardClasses = `
        ${baseClasses} 
        ${variantClasses[variant]} 
        ${paddingClasses[padding]} 
        ${hoverClasses} 
        ${clickClasses}
        ${className}
    `.trim();

    const CardComponent = onClick ? 'button' : 'div';

    return (
        <CardComponent
            className={cardClasses}
            onClick={onClick}
            type={onClick ? 'button' : undefined}
        >
            {children}
        </CardComponent>
    );
};

// 🎓 LEARNING: Card sub-components for better organization
export const CardHeader: React.FC<{
    children: React.ReactNode;
    className?: string;
}> = ({ children, className = '' }) => (
    <div className={`border-b border-gray-200 pb-4 mb-4 ${className}`}>
        {children}
    </div>
);

export const CardTitle: React.FC<{
    children: React.ReactNode;
    className?: string;
}> = ({ children, className = '' }) => (
    <h3 className={`text-lg font-medium text-gray-900 ${className}`}>
        {children}
    </h3>
);

export const CardContent: React.FC<{
    children: React.ReactNode;
    className?: string;
}> = ({ children, className = '' }) => (
    <div className={className}>
        {children}
    </div>
);

export const CardFooter: React.FC<{
    children: React.ReactNode;
    className?: string;
}> = ({ children, className = '' }) => (
    <div className={`border-t border-gray-200 pt-4 mt-4 ${className}`}>
        {children}
    </div>
);

export default Card;
