import React, { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { LogIn, UserPlus, Eye, EyeOff, Phone, Mail } from 'lucide-react';

interface AuthFormProps {
    mode: 'signin' | 'signup';
    onToggleMode: () => void;
}

export const AuthForm: React.FC<AuthFormProps> = ({ mode, onToggleMode }) => {
    // 🔄 AUTH STORE: Get auth state and methods
    const {
        authMode,
        setAuthMode,
        loading,
        signInWithEmail,
        signUpWithEmail,
        signInWithPhone,
        verifyPhoneOTP
    } = useAuthStore();

    // 📧 EMAIL STATE
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    // 📱 PHONE STATE
    const [phone, setPhone] = useState('');
    const [otp, setOtp] = useState('');
    const [otpSent, setOtpSent] = useState(false);

    // 📢 MESSAGE STATE
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // 📱 FORMAT UGANDA PHONE: Ensure +256 format
    const formatUgandaPhone = (input: string): string => {
        const digits = input.replace(/\D/g, '');
        if (digits.startsWith('256')) return `+${digits}`;
        if (digits.startsWith('0')) return `+256${digits.slice(1)}`;
        if (digits.length === 9) return `+256${digits}`;
        return `+256${digits}`;
    };

    // 📧 HANDLE EMAIL AUTHENTICATION
    const handleEmailAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);

        if (!email || !password) {
            setMessage({ type: 'error', text: 'Please fill in all required fields' });
            return;
        }

        try {
            let result;
            if (mode === 'signup') {
                result = await signUpWithEmail(email, password, fullName);
            } else {
                result = await signInWithEmail(email, password);
            }

            if (result.success) {
                setMessage({
                    type: 'success',
                    text: mode === 'signup' ? 'Account created successfully!' : 'Signed in successfully!'
                });
            } else {
                setMessage({ type: 'error', text: result.error || 'Authentication failed' });
            }
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message || 'An unexpected error occurred' });
        }
    };

    // 📱 HANDLE PHONE AUTHENTICATION: Send OTP
    const handleSendOTP = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);

        if (!phone) {
            setMessage({ type: 'error', text: 'Please enter your phone number' });
            return;
        }

        const formattedPhone = formatUgandaPhone(phone);
        setPhone(formattedPhone);

        try {
            const result = await signInWithPhone(formattedPhone);
            if (result.success) {
                setOtpSent(true);
                setMessage({ type: 'success', text: `OTP sent to ${formattedPhone}. Check your SMS.` });
            } else {
                setMessage({ type: 'error', text: result.error || 'Failed to send OTP' });
            }
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message || 'Failed to send OTP' });
        }
    };

    // 🔐 HANDLE OTP VERIFICATION
    const handleVerifyOTP = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);

        if (!otp || otp.length !== 6) {
            setMessage({ type: 'error', text: 'Please enter the 6-digit OTP code' });
            return;
        }

        try {
            const result = await verifyPhoneOTP(phone, otp);
            if (result.success) {
                setMessage({ type: 'success', text: 'Phone verification successful!' });
                setOtpSent(false);
                setOtp('');
            } else {
                setMessage({ type: 'error', text: result.error || 'Invalid OTP code' });
            }
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message || 'Failed to verify OTP' });
        }
    };

    return (
        <div className="w-full max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
            <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    {mode === 'signin' ? 'Welcome Back' : 'Create Account'}
                </h2>
                <p className="text-gray-600">
                    {mode === 'signin'
                        ? 'Sign in to your DocCollab account'
                        : 'Join DocCollab to start collaborating'
                    }
                </p>
            </div>

            {/* 🔄 AUTH MODE SWITCHER */}
            <div className="flex mb-6 bg-gray-100 rounded-lg p-1">
                <button
                    type="button"
                    onClick={() => {
                        setAuthMode('email');
                        setMessage(null);
                        setOtpSent(false);
                    }}
                    className={`flex-1 flex items-center justify-center py-2 px-4 rounded-md text-sm font-medium transition-colors ${authMode === 'email'
                            ? 'bg-white text-blue-600 shadow-sm'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                >
                    <Mail className="w-4 h-4 mr-2" />
                    Email
                </button>
                <button
                    type="button"
                    onClick={() => {
                        setAuthMode('phone');
                        setMessage(null);
                        setOtpSent(false);
                    }}
                    className={`flex-1 flex items-center justify-center py-2 px-4 rounded-md text-sm font-medium transition-colors ${authMode === 'phone'
                            ? 'bg-white text-blue-600 shadow-sm'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                >
                    <Phone className="w-4 h-4 mr-2" />
                    Phone
                </button>
            </div>

            {/* 📢 MESSAGE DISPLAY */}
            {message && (
                <div className={`p-3 rounded-md text-sm ${message.type === 'success'
                        ? 'bg-green-50 text-green-700 border border-green-200'
                        : 'bg-red-50 text-red-700 border border-red-200'
                    }`}>
                    {message.text}
                </div>
            )}

            {/* 📧 EMAIL AUTHENTICATION FORM */}
            {authMode === 'email' && (
                <form onSubmit={handleEmailAuth} className="space-y-4">
                    {mode === 'signup' && (
                        <div>
                            <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
                                Full Name
                            </label>
                            <input
                                type="text"
                                id="fullName"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Enter your full name"
                            />
                        </div>
                    )}

                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                            Email Address
                        </label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Enter your email"
                        />
                    </div>

                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                            Password
                        </label>
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                id="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-10"
                                placeholder="Enter your password"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                            >
                                {showPassword ? (
                                    <EyeOff className="h-4 w-4 text-gray-400" />
                                ) : (
                                    <Eye className="h-4 w-4 text-gray-400" />
                                )}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full flex items-center justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        ) : mode === 'signin' ? (
                            <LogIn className="w-4 h-4 mr-2" />
                        ) : (
                            <UserPlus className="w-4 h-4 mr-2" />
                        )}
                        {loading ? 'Please wait...' : mode === 'signin' ? 'Sign In' : 'Sign Up'}
                    </button>
                </form>
            )}

            {/* 📱 PHONE AUTHENTICATION FORM */}
            {authMode === 'phone' && !otpSent && (
                <form onSubmit={handleSendOTP} className="space-y-4">
                    <div>
                        <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                            🇺🇬 Uganda Phone Number
                        </label>
                        <input
                            type="tel"
                            id="phone"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="0700123456 or +256700123456"
                        />
                        <p className="mt-1 text-xs text-gray-500">
                            Format: +256XXXXXXXXX (Uganda numbers only)
                        </p>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full flex items-center justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        ) : (
                            <Phone className="w-4 h-4 mr-2" />
                        )}
                        {loading ? 'Sending OTP...' : 'Send OTP Code'}
                    </button>
                </form>
            )}

            {/* 🔐 OTP VERIFICATION FORM */}
            {authMode === 'phone' && otpSent && (
                <form onSubmit={handleVerifyOTP} className="space-y-4">
                    <div>
                        <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-1">
                            📱 Enter OTP Code
                        </label>
                        <input
                            type="text"
                            id="otp"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            required
                            maxLength={6}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center text-lg tracking-widest"
                            placeholder="123456"
                        />
                        <p className="mt-1 text-xs text-gray-500 text-center">
                            Enter the 6-digit code sent to {phone}
                        </p>
                    </div>

                    <button
                        type="submit"
                        disabled={loading || otp.length !== 6}
                        className="w-full flex items-center justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        ) : (
                            <Phone className="w-4 h-4 mr-2" />
                        )}
                        {loading ? 'Verifying...' : 'Verify OTP'}
                    </button>

                    <div className="text-center space-y-2">
                        <button
                            type="button"
                            onClick={handleSendOTP}
                            className="text-sm text-blue-600 hover:text-blue-500"
                        >
                            Resend OTP
                        </button>
                        <br />
                        <button
                            type="button"
                            onClick={() => {
                                setOtpSent(false);
                                setOtp('');
                            }}
                            className="text-sm text-gray-500 hover:text-gray-700"
                        >
                            Change Phone Number
                        </button>
                    </div>
                </form>
            )}

            {/* 🔄 MODE TOGGLE */}
            <div className="mt-6 text-center">
                <p className="text-sm text-gray-600">
                    {mode === 'signin' ? "Don't have an account? " : "Already have an account? "}
                    <button
                        onClick={onToggleMode}
                        className="font-medium text-blue-600 hover:text-blue-500"
                    >
                        {mode === 'signin' ? 'Sign up' : 'Sign in'}
                    </button>
                </p>
            </div>
        </div>
    );
};
