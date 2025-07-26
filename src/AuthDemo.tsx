import { useState, useEffect } from 'react'
import { supabase } from './lib/supabaseClient'
import type { User } from '@supabase/supabase-js'

function AuthDemo() {
    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [isSignUp, setIsSignUp] = useState(false)
    const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)

    // Check if user is logged in when component mounts
    useEffect(() => {
        // Get initial session
        const getSession = async () => {
            const { data: { session } } = await supabase.auth.getSession()
            setUser(session?.user ?? null)
            setLoading(false)
        }

        getSession()

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                setUser(session?.user ?? null)
                setLoading(false)

                if (event === 'SIGNED_IN') {
                    setMessage({ text: '✅ Successfully signed in!', type: 'success' })
                } else if (event === 'SIGNED_OUT') {
                    setMessage({ text: '👋 Signed out successfully!', type: 'success' })
                }
            }
        )

        return () => subscription.unsubscribe()
    }, [])

    // Sign up new user
    const signUp = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setMessage(null)

        const { data, error } = await supabase.auth.signUp({
            email,
            password,
        })

        if (error) {
            setMessage({ text: `Error: ${error.message}`, type: 'error' })
        } else if (data?.user) {
            setMessage({
                text: '🎉 Account created! Check your email for verification.',
                type: 'success'
            })
            setEmail('')
            setPassword('')
        }

        setLoading(false)
    }

    // Sign in existing user
    const signIn = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setMessage(null)

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        })

        if (error) {
            setMessage({ text: `Error: ${error.message}`, type: 'error' })
        } else {
            setEmail('')
            setPassword('')
        }

        setLoading(false)
    }

    // Sign out user
    const signOut = async () => {
        setLoading(true)
        const { error } = await supabase.auth.signOut()

        if (error) {
            setMessage({ text: `Error: ${error.message}`, type: 'error' })
        }

        setLoading(false)
    }

    if (loading) {
        return (
            <div className="max-w-4xl mx-auto">
                <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                    <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-8 py-6">
                        <h2 className="text-3xl font-bold text-white mb-2">🔐 Authentication</h2>
                        <p className="text-indigo-100">Loading authentication state...</p>
                    </div>
                    <div className="p-8 flex justify-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-8 py-6">
                    <h2 className="text-3xl font-bold text-white mb-2">🔐 Authentication Demo</h2>
                    <p className="text-indigo-100">Sign up, sign in, and manage user sessions</p>
                </div>

                <div className="p-8">
                    {/* Message Display */}
                    {message && (
                        <div className={`p-4 rounded-lg mb-6 border ${message.type === 'success'
                                ? 'bg-green-50 border-green-200 text-green-800'
                                : 'bg-red-50 border-red-200 text-red-800'
                            }`}>
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    {message.type === 'success' ? (
                                        <svg className="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                    ) : (
                                        <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                        </svg>
                                    )}
                                </div>
                                <div className="ml-3">
                                    <p className="text-sm font-medium">{message.text}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="grid md:grid-cols-2 gap-8">
                        {/* Auth Form */}
                        <div>
                            {!user ? (
                                <div className="bg-slate-50 rounded-lg p-6">
                                    <div className="text-center mb-6">
                                        <button
                                            onClick={() => setIsSignUp(!isSignUp)}
                                            className="text-indigo-600 hover:text-indigo-800 font-medium underline"
                                        >
                                            {isSignUp ? 'Already have an account? Sign In' : 'Need an account? Sign Up'}
                                        </button>
                                    </div>

                                    <form onSubmit={isSignUp ? signUp : signIn} className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                                Email Address
                                            </label>
                                            <input
                                                type="email"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                required
                                                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                                                placeholder="Enter your email"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                                Password
                                            </label>
                                            <input
                                                type="password"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                required
                                                minLength={6}
                                                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                                                placeholder="Enter your password (min 6 characters)"
                                            />
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className={`w-full py-3 px-4 rounded-lg font-medium text-white transition-all ${isSignUp
                                                    ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700'
                                                    : 'bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700'
                                                } focus:ring-2 focus:ring-offset-2 ${isSignUp ? 'focus:ring-green-500' : 'focus:ring-indigo-500'
                                                } disabled:opacity-50 disabled:cursor-not-allowed`}
                                        >
                                            {loading ? (
                                                <div className="flex items-center justify-center">
                                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                                    Processing...
                                                </div>
                                            ) : (
                                                isSignUp ? '🚀 Create Account' : '🔑 Sign In'
                                            )}
                                        </button>
                                    </form>
                                </div>
                            ) : (
                                <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                                    <div className="text-center mb-6">
                                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                            </svg>
                                        </div>
                                        <h3 className="text-xl font-bold text-green-800 mb-2">Welcome Back!</h3>
                                        <p className="text-green-600">You are successfully signed in</p>
                                    </div>

                                    <div className="space-y-3 mb-6">
                                        <div className="flex items-center justify-between py-2 border-b border-green-200">
                                            <span className="text-sm font-medium text-green-700">Email:</span>
                                            <span className="text-sm text-green-800">{user.email}</span>
                                        </div>
                                        <div className="flex items-center justify-between py-2 border-b border-green-200">
                                            <span className="text-sm font-medium text-green-700">User ID:</span>
                                            <span className="text-xs text-green-800 font-mono">{user.id.slice(0, 8)}...</span>
                                        </div>
                                        <div className="flex items-center justify-between py-2">
                                            <span className="text-sm font-medium text-green-700">Last sign in:</span>
                                            <span className="text-sm text-green-800">
                                                {new Date(user.last_sign_in_at || '').toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>

                                    <button
                                        onClick={signOut}
                                        className="w-full py-3 px-4 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white font-medium rounded-lg transition-all focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                    >
                                        🚪 Sign Out
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Information Panel */}
                        <div>
                            <div className="bg-indigo-50 rounded-lg p-6 mb-6">
                                <h4 className="text-lg font-bold text-indigo-800 mb-4">
                                    🎓 Authentication Learning Guide
                                </h4>
                                <div className="space-y-3 text-sm text-indigo-700">
                                    <div className="flex items-start">
                                        <span className="flex-shrink-0 w-2 h-2 bg-indigo-400 rounded-full mt-2 mr-3"></span>
                                        <div>
                                            <strong>Sign Up:</strong> Creates a new user account
                                            <p className="text-xs text-indigo-600 mt-1">Uses <code className="bg-indigo-200 px-1 rounded">supabase.auth.signUp()</code></p>
                                        </div>
                                    </div>
                                    <div className="flex items-start">
                                        <span className="flex-shrink-0 w-2 h-2 bg-purple-400 rounded-full mt-2 mr-3"></span>
                                        <div>
                                            <strong>Sign In:</strong> Authenticates existing users
                                            <p className="text-xs text-indigo-600 mt-1">Uses <code className="bg-indigo-200 px-1 rounded">supabase.auth.signInWithPassword()</code></p>
                                        </div>
                                    </div>
                                    <div className="flex items-start">
                                        <span className="flex-shrink-0 w-2 h-2 bg-blue-400 rounded-full mt-2 mr-3"></span>
                                        <div>
                                            <strong>Session Management:</strong> Tracks user state
                                            <p className="text-xs text-indigo-600 mt-1">Uses <code className="bg-indigo-200 px-1 rounded">supabase.auth.onAuthStateChange()</code></p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                                <div className="flex items-start">
                                    <div className="flex-shrink-0">
                                        <svg className="h-5 w-5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <div className="ml-3">
                                        <h5 className="text-sm font-medium text-amber-800">Important Note</h5>
                                        <p className="text-sm text-amber-700 mt-1">
                                            Email confirmation is enabled by default. After signing up, check your email
                                            for a verification link before you can sign in.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Status Section */}
                    <div className="mt-8 bg-slate-50 rounded-lg p-6">
                        <h4 className="text-xl font-bold text-slate-800 mb-4">🔍 Current Status</h4>
                        <div className="grid md:grid-cols-3 gap-4">
                            <div className="text-center">
                                <div className={`w-12 h-12 mx-auto mb-2 rounded-full flex items-center justify-center ${user ? 'bg-green-100' : 'bg-slate-200'
                                    }`}>
                                    {user ? (
                                        <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    ) : (
                                        <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    )}
                                </div>
                                <p className="text-sm font-medium text-slate-700">Authentication</p>
                                <p className="text-xs text-slate-500">{user ? 'Signed In' : 'Not Signed In'}</p>
                            </div>
                            <div className="text-center">
                                <div className={`w-12 h-12 mx-auto mb-2 rounded-full flex items-center justify-center ${user ? 'bg-blue-100' : 'bg-slate-200'
                                    }`}>
                                    <svg className={`w-6 h-6 ${user ? 'text-blue-600' : 'text-slate-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                    </svg>
                                </div>
                                <p className="text-sm font-medium text-slate-700">Session</p>
                                <p className="text-xs text-slate-500">{user ? 'Active' : 'Inactive'}</p>
                            </div>
                            <div className="text-center">
                                <div className={`w-12 h-12 mx-auto mb-2 rounded-full flex items-center justify-center ${user ? 'bg-purple-100' : 'bg-slate-200'
                                    }`}>
                                    <svg className={`w-6 h-6 ${user ? 'text-purple-600' : 'text-slate-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                </div>
                                <p className="text-sm font-medium text-slate-700">Access</p>
                                <p className="text-xs text-slate-500">{user ? 'Granted' : 'Denied'}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default AuthDemo
