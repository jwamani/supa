import React from 'react';
import Header from './Header';

// 🎓 LEARNING: Page layout component for consistent structure
// This provides a standard layout wrapper for all application pages

export interface PageLayoutProps {
    children: React.ReactNode;
    title?: string;
    description?: string;
    showHeader?: boolean;
    showSearch?: boolean;
    onSearchChange?: (query: string) => void;
    searchValue?: string;
    searchPlaceholder?: string;
    className?: string;
    maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '7xl' | 'full';
}

const PageLayout: React.FC<PageLayoutProps> = ({
    children,
    title,
    description,
    showHeader = true,
    showSearch = false,
    onSearchChange,
    searchValue,
    searchPlaceholder,
    className = '',
    maxWidth = '7xl'
}) => {
    // Max width classes
    const maxWidthClasses = {
        sm: 'max-w-sm',
        md: 'max-w-md',
        lg: 'max-w-lg',
        xl: 'max-w-xl',
        '2xl': 'max-w-2xl',
        '7xl': 'max-w-7xl',
        full: 'max-w-full'
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            {showHeader && (
                <Header
                    showSearch={showSearch}
                    onSearchChange={onSearchChange}
                    searchValue={searchValue}
                    searchPlaceholder={searchPlaceholder}
                />
            )}

            {/* Page Content */}
            <main className={`${maxWidthClasses[maxWidth]} mx-auto px-4 sm:px-6 lg:px-8 ${className}`}>
                {/* Page Title Section */}
                {(title || description) && (
                    <div className="py-8">
                        {title && (
                            <h1 className="text-3xl font-bold text-gray-900 mb-2">
                                {title}
                            </h1>
                        )}
                        {description && (
                            <p className="text-lg text-gray-600">
                                {description}
                            </p>
                        )}
                    </div>
                )}

                {/* Page Content */}
                <div className={title || description ? '' : 'py-8'}>
                    {children}
                </div>
            </main>
        </div>
    );
};

export default PageLayout;
