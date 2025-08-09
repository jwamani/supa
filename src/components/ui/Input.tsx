import React, { forwardRef } from 'react';
import { AlertCircle, CheckCircle } from 'lucide-react';

// 🎓 LEARNING: Input component with validation states and accessibility
// This demonstrates proper form input patterns with TypeScript

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    success?: string;
    hint?: string;
    variant?: 'default' | 'search';
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(({
    label,
    error,
    success,
    hint,
    variant = 'default',
    leftIcon,
    rightIcon,
    className = '',
    id,
    type = 'text',
    ...props
}, ref) => {
    // Generate unique ID if not provided
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

    // Base input classes
    const baseClasses = 'block w-full rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';

    // State-specific styles
    const stateClasses = error
        ? 'border-red-300 text-red-900 placeholder-red-300 focus:ring-red-500 focus:border-red-500'
        : success
            ? 'border-green-300 text-green-900 placeholder-green-300 focus:ring-green-500 focus:border-green-500'
            : 'border-gray-300 text-gray-900 placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500';

    // Size and padding classes
    const sizeClasses = variant === 'search'
        ? 'px-4 py-2.5 text-sm'
        : 'px-3 py-2 text-sm';

    // Icon padding adjustments
    const iconClasses = leftIcon
        ? 'pl-10'
        : rightIcon
            ? 'pr-10'
            : '';

    const inputClasses = `${baseClasses} ${stateClasses} ${sizeClasses} ${iconClasses} ${className}`;

    return (
        <div className="space-y-1">
            {/* Label */}
            {label && (
                <label
                    htmlFor={inputId}
                    className="block text-sm font-medium text-gray-700"
                >
                    {label}
                </label>
            )}

            {/* Input Container */}
            <div className="relative">
                {/* Left Icon */}
                {leftIcon && (
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <div className="h-4 w-4 text-gray-400">
                            {leftIcon}
                        </div>
                    </div>
                )}

                {/* Input */}
                <input
                    ref={ref}
                    id={inputId}
                    type={type}
                    className={inputClasses}
                    aria-invalid={error ? 'true' : 'false'}
                    aria-describedby={
                        error ? `${inputId}-error` :
                            success ? `${inputId}-success` :
                                hint ? `${inputId}-hint` :
                                    undefined
                    }
                    {...props}
                />

                {/* Right Icon */}
                {rightIcon && (
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <div className="h-4 w-4 text-gray-400">
                            {rightIcon}
                        </div>
                    </div>
                )}

                {/* Validation Icons */}
                {error && !rightIcon && (
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <AlertCircle className="h-4 w-4 text-red-500" />
                    </div>
                )}

                {success && !rightIcon && (
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                    </div>
                )}
            </div>

            {/* Helper Text */}
            {error && (
                <p id={`${inputId}-error`} className="text-sm text-red-600">
                    {error}
                </p>
            )}

            {success && (
                <p id={`${inputId}-success`} className="text-sm text-green-600">
                    {success}
                </p>
            )}

            {hint && !error && !success && (
                <p id={`${inputId}-hint`} className="text-sm text-gray-500">
                    {hint}
                </p>
            )}
        </div>
    );
});

Input.displayName = 'Input';

export default Input;
