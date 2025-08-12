import React, { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from './store/authStore';
// import { AuthPage } from './pages/AuthPage';
// import { DashboardPage } from './pages/DashboardPage';
import { ModernDashboardPage } from './pages/ModernDashboardPage';
// import { DocumentPage } from './pages/DocumentPage';
import { ModernDocumentPage } from './pages/ModernDocumentPage';
// import { ProfilePage } from './pages/ProfilePage';
import { LoadingSpinner } from './components/ui/LoadingSpinner';

// Lazy load pages for code splitting
const AuthPage = lazy(() => import('./pages/AuthPage').then(module => ({ default: module.AuthPage })));
const DashboardPage = lazy(() => import('./pages/DashboardPage').then(module => ({ default: module.DashboardPage })));
const DocumentPage = lazy(() => import('./pages/DocumentPage').then(module => ({ default: module.DocumentPage })));
const ProfilePage = lazy(() => import('./pages/ProfilePage').then(module => ({ default: module.ProfilePage })));
const PlayGround = lazy(() => import('./Ground').then(module => ({ default: module.default })));

// Create React Query client
const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: 1,
            refetchOnWindowFocus: false,
        },
    },
});

// Protected Route component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user, loading, initialized } = useAuthStore();

    if (!initialized || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/auth" replace />;
    }

    return <>{children}</>;
};

// Public Route component (redirect if authenticated)
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user, loading, initialized } = useAuthStore();

    if (!initialized || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    if (user) {
        return <Navigate to="/dashboard" replace />;
    }

    return <>{children}</>;
};

const AppRoutes: React.FC = () => {
    return (
        <Routes>
            {/* Public routes */}
            <Route
                path="/auth"
                element={
                    <PublicRoute>
                        <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><LoadingSpinner size="lg" /></div>}>
                            <AuthPage />
                        </Suspense>
                    </PublicRoute>
                }
            />

            {/* Protected routes */}
            <Route
                path="/dashboard"
                element={
                    <ProtectedRoute>
                        <ModernDashboardPage />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/document/:id"
                element={
                    <ProtectedRoute>
                        <ModernDocumentPage />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/profile"
                element={
                    <ProtectedRoute>
                        <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><LoadingSpinner size="lg" /></div>}>
                            <ProfilePage />
                        </Suspense>
                    </ProtectedRoute>
                }
            />

            <Route path='/playground' element={
                <PublicRoute>
                    <PlayGround />
                </PublicRoute>
            } />

            {/* Default redirect */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />

            {/* 404 fallback */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
    );
};

const App: React.FC = () => {
    const { initialize } = useAuthStore();

    useEffect(() => {
        initialize();
    }, [initialize]);

    return (
        <QueryClientProvider client={queryClient}>
            <Router>
                <div className="App">
                    <AppRoutes />
                </div>
            </Router>
        </QueryClientProvider>
    );
};

export default App;
