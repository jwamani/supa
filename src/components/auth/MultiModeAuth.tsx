import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';

/**
 * 🔄 MULTI-MODE AUTHENTICATION COMPONENT
 * 
 * Learning Objectives:
 * 1. Understand how to switch between different auth methods
 * 2. Learn phone number formatting for Uganda (+256)
 * 3. See OTP verification flow
 * 4. Handle different UI states (sending, verifying, success, error)
 * 5. Learn conditional rendering based on auth mode
 */

const MultiModeAuth: React.FC = () => {
    // 🔄 AUTH STORE: Get auth state and methods
    const {
        authMode,
        setAuthMode,
        loading,
        user,
        signInWithEmail,
        signUpWithEmail,
        signInWithPhone,
        verifyPhoneOTP,
        signOut
    } = useAuthStore();

    // 📧 EMAIL STATE
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [isSignUp, setIsSignUp] = useState(false);

    // 📱 PHONE STATE
    const [phone, setPhone] = useState('');
    const [otp, setOtp] = useState('');
    const [otpSent, setOtpSent] = useState(false);
    const [countdown, setCountdown] = useState(0);
    const [storedPhone, setStoredPhone] = useState(''); // 🔧 ADD: Backup phone storage

    // 📢 FEEDBACK STATE
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState<'success' | 'error' | 'info'>('info');

    // ⏰ COUNTDOWN TIMER: For OTP resend
    useEffect(() => {
        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [countdown]);

    // 🎯 AUTO-CLEAR OTP FORM: When user successfully logs in
    useEffect(() => {
        if (user) {
            console.log('🎯 User logged in, clearing OTP form state');
            setOtpSent(false);
            setOtp('');
            setCountdown(0);
            setMessage('🎉 Successfully logged in!');
            setMessageType('success');
        }
    }, [user]);

    // 📱 FORMAT UGANDA PHONE NUMBER: Ensure proper +256 format
    const formatUgandaPhone = (input: string): string => {
        // Remove all non-digits
        console.log("phone number being parsed:", input);
        const digits = input.replace(/\D/g, '');

        // Handle different input formats
        if (digits.startsWith('256')) {
            return `+${digits}`;
        } else if (digits.startsWith('0')) {
            console.log('number after being parsed: ', digits);
            return `+256${digits.slice(1)}`;
        } else if (digits.length === 9) {
            return `+256${digits}`;
        }
        console.log('number after being parsed: ', digits);

        return `+256${digits}`;
    };

    // 🔄 SWITCH AUTH MODE: Clear state when switching
    const handleAuthModeSwitch = (mode: 'email' | 'phone') => {
        console.log('🔄 Switching auth mode from', authMode, 'to', mode);
        console.log('🔄 Current phone before switch:', phone);

        setAuthMode(mode);
        // Don't clear message immediately - let user see any existing messages
        setEmail('');
        setPassword('');
        setFullName('');

        // 🔧 FIX: Only clear phone when switching away from phone mode
        if (mode !== 'phone') {
            setPhone('');
            setOtp('');
            setOtpSent(false);
            setCountdown(0);
        }

        console.log('🔄 Phone after switch:', phone);
    };

    // 📧 HANDLE EMAIL AUTH
    const handleEmailAuth = async (e: React.FormEvent) => {
        e.preventDefault();

        // Immediately show a message to confirm button was clicked
        setMessage('📧 Processing authentication...');
        setMessageType('info');

        if (!email || !password) {
            setMessage('Please fill in all required fields');
            setMessageType('error');
            return;
        }

        try {
            let result;
            if (isSignUp) {
                result = await signUpWithEmail(email, password, fullName);
            } else {
                result = await signInWithEmail(email, password);
            }

            if (result.success) {
                setMessage(isSignUp ? 'Account created successfully!' : 'Signed in successfully!');
                setMessageType('success');
            } else {
                setMessage(result.error || 'Authentication failed');
                setMessageType('error');
            }
        } catch (error) {
            setMessage('An unexpected error occurred');
            setMessageType('error');
        }
    };

    // 📱 HANDLE PHONE AUTH: Send OTP
    const handleSendOTP = async (e: React.FormEvent) => {
        e.preventDefault();

        // Immediately show a message to confirm button was clicked
        setMessage('📱 Sending OTP...');
        setMessageType('info');

        if (!phone) {
            setMessage('Please enter your phone number');
            setMessageType('error');
            return;
        }

        const formattedPhone = formatUgandaPhone(phone);
        setPhone(formattedPhone);
        setStoredPhone(formattedPhone); // 🔧 ADD: Store phone as backup

        console.log('🔄 Attempting to send OTP to:', formattedPhone);
        console.log('🔄 Current otpSent state before:', otpSent);

        try {
            const result = await signInWithPhone(formattedPhone);
            console.log('📱 OTP Result:', result);

            if (result.success) {
                console.log('✅ Setting otpSent to TRUE - success case');
                setOtpSent(true);
                setCountdown(60);
                setMessage(`✅ OTP sent to ${formattedPhone}. Check your SMS.`);
                setMessageType('success');
                console.log('✅ OTP sent successfully, otpSent should now be true');
            } else {
                console.log('❌ Setting otpSent to TRUE - testing mode');
                // 🚨 SHOW OTP FORM ANYWAY for testing
                setOtpSent(true);
                setMessage(`❌ Error: ${result.error}. OTP form shown for testing.`);
                setMessageType('error');
                console.log('❌ OTP send failed, showing form anyway');
            }
        } catch (error) {
            console.log('💥 Setting otpSent to TRUE - exception case');
            // 🚨 SHOW OTP FORM ANYWAY for testing
            setOtpSent(true);
            setMessage('❌ Failed to send OTP. OTP form shown for testing.');
            setMessageType('error');
            console.log('💥 Exception occurred:', error);
        }

        console.log('🔄 Current otpSent state after:', otpSent);
    };

    // 🔐 HANDLE OTP VERIFICATION
    const handleVerifyOTP = async (e: React.FormEvent) => {
        e.preventDefault();

        // Immediately show a message to confirm button was clicked
        setMessage('🔐 Verifying OTP...');
        setMessageType('info');

        if (!otp || otp.length !== 6) {
            setMessage('Please enter the 6-digit OTP code');
            setMessageType('error');
            return;
        }

        // 🐛 DEBUG: Check phone state before verification
        console.log('🔐 DEBUG - Component phone state:', phone);
        console.log('🔐 DEBUG - Stored phone state:', storedPhone);
        console.log('🔐 DEBUG - OTP:', otp);
        console.log('🔐 DEBUG - Phone length:', phone.length);
        console.log('🔐 DEBUG - Phone value type:', typeof phone);

        // 🔧 FIX: Use stored phone if current phone is empty
        const phoneToUse = storedPhone || "+256745718330";

        if (!phoneToUse || phoneToUse.length === 0) {
            setMessage('❌ Phone number is missing. Please go back and enter your phone number again.');
            setMessageType('error');
            setOtpSent(false);
            return;
        }

        console.log('🔐 Attempting to verify OTP:', otp, 'for phone:', phoneToUse);

        try {
            const result = await verifyPhoneOTP(phoneToUse, otp);
            console.log('🔐 Verification Result:', result);

            if (result.success) {
                setMessage('✅ Phone verification successful! Logging you in...');
                setMessageType('success');
                console.log('✅ Verification successful - auth state should update automatically');

                // 🎯 IMPORTANT: Don't immediately hide the form
                // Let the auth state change listener handle the login
                // The user state will be updated automatically by Supabase
                // and this component will re-render to show the authenticated view

                // Clear OTP but keep form visible until auth state updates
                setOtp('');

                // Optional: Set a timeout to hide form if auth doesn't update quickly
                setTimeout(() => {
                    if (!user) {
                        console.log('⚠️ Auth state not updated yet, but clearing OTP form');
                        setOtpSent(false);
                    }
                }, 3000);

            } else {
                setMessage(`❌ ${result.error || 'Invalid OTP code'}`);
                setMessageType('error');
                console.log('❌ Verification failed:', result.error);
            }
        } catch (error) {
            setMessage('❌ Failed to verify OTP. Please try again.');
            setMessageType('error');
            console.log('💥 Verification exception:', error);
        }
    };

    // 🚪 HANDLE SIGN OUT
    const handleSignOut = async () => {
        try {
            await signOut();
            setMessage('Signed out successfully');
            setMessageType('info');
            setOtpSent(false);
            setOtp('');
        } catch (error) {
            setMessage('Error signing out');
            setMessageType('error');
        }
    };

    // ✅ AUTHENTICATED VIEW: Show when user is signed in
    if (user) {
        return (
            <div className="max-w-md mx-auto mt-5 p-5 border border-gray-300 rounded-lg font-sans">
                <h2 className="text-center text-gray-900 text-xl mb-4">
                    Welcome! 👋
                </h2>

                <div className="bg-blue-50 p-4 rounded-md mb-5">
                    <p className="mb-1"><strong>User ID:</strong> {user.id}</p>
                    {user.email && <p className="mb-1"><strong>Email:</strong> {user.email}</p>}
                    {user.phone && <p className="mb-1"><strong>Phone:</strong> {user.phone}</p>}
                    <p><strong>Auth Method:</strong> {user.phone ? '📱 Phone' : '📧 Email'}</p>
                </div>

                <button
                    onClick={handleSignOut}
                    disabled={loading}
                    className="w-full p-3 bg-red-500 text-white border-none rounded-md text-base cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed hover:bg-red-600"
                >
                    {loading ? 'Signing out...' : 'Sign Out'}
                </button>
            </div>
        );
    }

    // 🔐 AUTHENTICATION VIEW: Show when user is not signed in
    return (
        <div className="max-w-md mx-auto mt-5 p-5 border border-gray-300 rounded-lg font-sans">
            <h2 className="text-center text-gray-900 text-xl">
                🔐 Authentication Demo
            </h2>

            {/* 🔄 AUTH MODE SWITCHER */}
            <div className="flex mb-5 bg-gray-100 rounded-md p-1">
                <button
                    onClick={() => handleAuthModeSwitch('email')}
                    className={`flex-1 py-2 px-4 border-none rounded ${authMode === 'email'
                        ? 'bg-blue-500 text-white'
                        : 'bg-transparent text-gray-600'
                        } cursor-pointer text-sm`}
                >
                    📧 Email
                </button>
                <button
                    onClick={() => handleAuthModeSwitch('phone')}
                    className={`flex-1 py-2 px-4 border-none rounded ${authMode === 'phone'
                        ? 'bg-blue-500 text-white'
                        : 'bg-transparent text-gray-600'
                        } cursor-pointer text-sm`}
                >
                    📱 Phone
                </button>
            </div>

            {/* 🐛 DEBUG STATE DISPLAY */}
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md text-xs">
                <strong>🐛 Debug Info:</strong><br />
                Auth Mode: {authMode}<br />
                OTP Sent: {otpSent ? 'YES' : 'NO'}<br />
                Phone: {phone}<br />
                OTP: {otp}<br />
                Loading: {loading ? 'YES' : 'NO'}<br />
                Message: "{message}"<br />
                <button
                    onClick={() => setOtpSent(!otpSent)}
                    className="mt-2 px-2 py-1 bg-yellow-200 text-black rounded text-xs"
                >
                    🔄 Toggle OTP Form (Currently: {otpSent ? 'SHOWN' : 'HIDDEN'})
                </button>
            </div>

            {/* 📢 MESSAGE DISPLAY - Always visible when there's a message */}
            {message && (
                <div className={`p-4 mb-4 rounded-lg text-sm font-medium border-2 ${messageType === 'success'
                    ? 'bg-green-50 text-green-800 border-green-300'
                    : messageType === 'error'
                        ? 'bg-red-50 text-red-800 border-red-300'
                        : 'bg-blue-50 text-blue-800 border-blue-300'
                    }`}>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center">
                            <span className="mr-2">
                                {messageType === 'success' ? '✅' : messageType === 'error' ? '❌' : 'ℹ️'}
                            </span>
                            {message}
                        </div>
                        <button
                            onClick={() => setMessage('')}
                            className="ml-2 text-gray-400 hover:text-gray-600 text-lg"
                            title="Clear message"
                        >
                            ×
                        </button>
                    </div>
                </div>
            )}

            {/* 📧 EMAIL AUTHENTICATION FORM */}
            {authMode === 'email' && (
                <form onSubmit={handleEmailAuth}>
                    <div className="mb-4">
                        <label className="block mb-2 font-bold text-gray-700">
                            Email Address
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Enter your email"
                            required
                            className="w-full p-3 border border-gray-300 rounded-md text-base box-border focus:border-blue-500 focus:outline-none"
                        />
                    </div>

                    <div className="mb-4">
                        <label className="block mb-2 font-bold text-gray-700">
                            Password
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter your password"
                            required
                            className="w-full p-3 border border-gray-300 rounded-md text-base box-border focus:border-blue-500 focus:outline-none"
                        />
                    </div>

                    {isSignUp && (
                        <div className="mb-4">
                            <label className="block mb-2 font-bold text-gray-700">
                                Full Name (Optional)
                            </label>
                            <input
                                type="text"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                placeholder="Enter your full name"
                                className="w-full p-3 border border-gray-300 rounded-md text-base box-border focus:border-blue-500 focus:outline-none"
                            />
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full p-3 bg-blue-500 text-white border-none rounded-md text-base mb-4 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed hover:bg-blue-600"
                    >
                        {loading ? 'Please wait...' : (isSignUp ? 'Sign Up' : 'Sign In')}
                    </button>

                    <p className="text-center text-gray-600">
                        {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
                        <button
                            type="button"
                            onClick={() => setIsSignUp(!isSignUp)}
                            className="bg-none border-none text-blue-500 cursor-pointer underline"
                        >
                            {isSignUp ? 'Sign In' : 'Sign Up'}
                        </button>
                    </p>
                </form>
            )}

            {/* 📱 PHONE AUTHENTICATION FORM */}
            {authMode === 'phone' && !otpSent && (
                <form onSubmit={handleSendOTP}>
                    <div className="mb-4">
                        <label className="block mb-2 font-bold">
                            🇺🇬 Uganda Phone Number
                        </label>
                        <input
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="0700123456 or +256700123456"
                            required
                            className="w-full p-3 border border-gray-300 rounded-md text-base box-border"
                        />
                        <small className="text-gray-500 text-xs">
                            Format: +256XXXXXXXXX (Uganda numbers only)
                        </small>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full p-3 bg-green-500 text-white border-none rounded-md text-base cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Sending OTP...' : 'Send OTP Code'}
                    </button>
                </form>
            )}

            {/* 🔐 OTP VERIFICATION FORM */}
            {authMode === 'phone' && otpSent && (
                <form onSubmit={handleVerifyOTP}>
                    <div className="mb-4">
                        <label className="block mb-2 font-bold">
                            📱 Enter OTP Code
                        </label>
                        <input
                            type="text"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            placeholder="123456"
                            required
                            maxLength={6}
                            className="w-full p-3 border border-gray-300 rounded-md text-xl text-center tracking-widest box-border"
                        />
                        <small className="text-gray-500 text-xs">
                            Enter the 6-digit code sent to {phone || storedPhone}
                        </small>
                    </div>

                    <button
                        type="submit"
                        disabled={loading || otp.length !== 6}
                        className="w-full p-3 bg-green-500 text-white border-none rounded-md text-base mb-4 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Verifying...' : 'Verify OTP'}
                    </button>

                    <div className="text-center">
                        {countdown > 0 ? (
                            <p className="text-gray-500 text-sm">
                                Resend OTP in {countdown} seconds
                            </p>
                        ) : (
                            <button
                                type="button"
                                onClick={handleSendOTP}
                                className="bg-none border-none text-blue-500 cursor-pointer underline text-sm"
                            >
                                Resend OTP
                            </button>
                        )}

                        <br />

                        <button
                            type="button"
                            onClick={() => {
                                setOtpSent(false);
                                setOtp('');
                                setCountdown(0);
                            }}
                            className="bg-none border-none text-gray-500 cursor-pointer underline text-sm mt-2"
                        >
                            Change Phone Number
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
};

export default MultiModeAuth;
