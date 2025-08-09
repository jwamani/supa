import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
    Search,
    Bell,
    Settings,
    User,
    LogOut,
    FileText,
    Menu,
    X
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { Button, Input, Badge } from '../ui';

// 🎓 LEARNING: Global header component with search, notifications, and user menu
// This demonstrates consistent navigation patterns across the application

export interface HeaderProps {
    showSearch?: boolean;
    onSearchChange?: (query: string) => void;
    searchValue?: string;
    searchPlaceholder?: string;
}

const Header: React.FC<HeaderProps> = ({
    showSearch = true,
    onSearchChange,
    searchValue = '',
    searchPlaceholder = 'Search documents...'
}) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, signOut } = useAuthStore();

    const [showUserMenu, setShowUserMenu] = useState(false);
    const [showMobileMenu, setShowMobileMenu] = useState(false);

    // Handle sign out
    const handleSignOut = async () => {
        await signOut();
        navigate('/auth');
    };

    // Get user initials for avatar
    const getUserInitials = () => {
        if (!user?.email) return 'U';
        return user.email.charAt(0).toUpperCase();
    };

    // Navigation items
    const navItems = [
        { path: '/dashboard', label: 'Dashboard', icon: FileText },
        { path: '/profile', label: 'Profile', icon: User }
    ];

    return (
        <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo and Brand */}
                    <div className="flex items-center space-x-4">
                        <Link
                            to="/dashboard"
                            className="flex items-center space-x-2 text-xl font-bold text-gray-900 hover:text-blue-600 transition-colors"
                        >
                            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                                <FileText className="h-5 w-5 text-white" />
                            </div>
                            <span>DocCollab</span>
                        </Link>

                        {/* Desktop Navigation */}
                        <nav className="hidden md:flex space-x-6 ml-8">
                            {navItems.map((item) => {
                                const Icon = item.icon;
                                const isActive = location.pathname === item.path;
                                return (
                                    <Link
                                        key={item.path}
                                        to={item.path}
                                        className={`
                                            flex items-center space-x-1 px-3 py-2 text-sm font-medium rounded-md transition-colors
                                            ${isActive
                                                ? 'text-blue-600 bg-blue-50'
                                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                            }
                                        `}
                                    >
                                        <Icon className="h-4 w-4" />
                                        <span>{item.label}</span>
                                    </Link>
                                );
                            })}
                        </nav>
                    </div>

                    {/* Search Bar (Desktop) */}
                    {showSearch && (
                        <div className="hidden md:flex flex-1 max-w-lg mx-8">
                            <Input
                                variant="search"
                                placeholder={searchPlaceholder}
                                value={searchValue}
                                onChange={(e) => onSearchChange?.(e.target.value)}
                                leftIcon={<Search className="h-4 w-4" />}
                                className="w-full"
                            />
                        </div>
                    )}

                    {/* Right Side Actions */}
                    <div className="flex items-center space-x-3">
                        {/* Notifications */}
                        <div className="relative">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="p-2"
                                aria-label="Notifications"
                            >
                                <Bell className="h-5 w-5" />
                                {/* Notification badge */}
                                <Badge
                                    variant="error"
                                    size="sm"
                                    className="absolute -top-1 -right-1 min-w-0 h-5 w-5 p-0 text-xs"
                                >
                                    3
                                </Badge>
                            </Button>
                        </div>

                        {/* User Menu */}
                        <div className="relative">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowUserMenu(!showUserMenu)}
                                className="flex items-center space-x-2 p-2"
                            >
                                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                                    {getUserInitials()}
                                </div>
                                <span className="hidden md:block text-sm font-medium text-gray-700">
                                    {user?.email?.split('@')[0] || 'User'}
                                </span>
                            </Button>

                            {/* User Dropdown */}
                            {showUserMenu && (
                                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                                    <Link
                                        to="/profile"
                                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                        onClick={() => setShowUserMenu(false)}
                                    >
                                        <User className="h-4 w-4 mr-2" />
                                        Profile
                                    </Link>
                                    <Link
                                        to="/settings"
                                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                        onClick={() => setShowUserMenu(false)}
                                    >
                                        <Settings className="h-4 w-4 mr-2" />
                                        Settings
                                    </Link>
                                    <hr className="my-1" />
                                    <button
                                        onClick={handleSignOut}
                                        className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                                    >
                                        <LogOut className="h-4 w-4 mr-2" />
                                        Sign Out
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Mobile Menu Button */}
                        <Button
                            variant="ghost"
                            size="sm"
                            className="md:hidden p-2"
                            onClick={() => setShowMobileMenu(!showMobileMenu)}
                        >
                            {showMobileMenu ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                        </Button>
                    </div>
                </div>

                {/* Mobile Search Bar */}
                {showSearch && (
                    <div className="md:hidden pb-4">
                        <Input
                            variant="search"
                            placeholder={searchPlaceholder}
                            value={searchValue}
                            onChange={(e) => onSearchChange?.(e.target.value)}
                            leftIcon={<Search className="h-4 w-4" />}
                            className="w-full"
                        />
                    </div>
                )}

                {/* Mobile Navigation */}
                {showMobileMenu && (
                    <div className="md:hidden border-t border-gray-200 pt-4 pb-4">
                        <nav className="space-y-2">
                            {navItems.map((item) => {
                                const Icon = item.icon;
                                const isActive = location.pathname === item.path;
                                return (
                                    <Link
                                        key={item.path}
                                        to={item.path}
                                        className={`
                                            flex items-center space-x-2 px-3 py-2 text-sm font-medium rounded-md transition-colors
                                            ${isActive
                                                ? 'text-blue-600 bg-blue-50'
                                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                            }
                                        `}
                                        onClick={() => setShowMobileMenu(false)}
                                    >
                                        <Icon className="h-4 w-4" />
                                        <span>{item.label}</span>
                                    </Link>
                                );
                            })}
                        </nav>
                    </div>
                )}
            </div>

            {/* Backdrop for user menu */}
            {(showUserMenu || showMobileMenu) && (
                <div
                    className="fixed inset-0 z-30"
                    onClick={() => {
                        setShowUserMenu(false);
                        setShowMobileMenu(false);
                    }}
                />
            )}
        </header>
    );
};

export default Header;
