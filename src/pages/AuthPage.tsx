import React, { useState } from 'react';
import MultiModeAuth from '../components/auth/MultiModeAuth';
import { FileText, BugPlay } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useConnection } from '../hooks/useConnection';
import { Connectivity } from '../components/Connectivity';

export const AuthPage: React.FC = () => {
    const navigate = useNavigate();
    const { isOnline } = useConnection();

    const handlePlay = () => {
        navigate('/playground');
    }

    if (!isOnline) {
        return <Connectivity />
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                {/* Logo and Brand */}
                <div className="flex items-center justify-center mb-8">
                    <div className="flex items-center space-x-2">
                        <div className="bg-blue-600 p-2 rounded-lg">
                            <FileText className="h-8 w-8 text-white" />
                        </div>
                        <div className="text-2xl font-bold text-gray-900">DocCollab</div>
                    </div>
                </div>


                {/* Tagline */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-extrabold text-gray-900 mb-4">
                        Real-time Collaborative Documents
                    </h1>
                    <p className="text-lg text-gray-600 max-w-md mx-auto">
                        Write, edit, and collaborate on documents in real-time with your team.
                        Share ideas, leave comments, and track changes seamlessly.
                    </p>
                </div>

                {/* Auth Form */}
                <MultiModeAuth />

                <div className='flex mt-3 items-center px-4 gap-3 bg-gray-200 rounded-sm py-3' >
                    <p>Checkout supabase features in the playground</p>
                    <button onClick={handlePlay} className='cursor-pointer' >
                        <BugPlay color='teal' />
                    </button>
                </div>

                {/* Features Preview */}
                <div className="mt-12 max-w-3xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                        <div className="bg-white p-4 rounded-lg shadow-sm">
                            <div className="text-blue-600 text-2xl mb-2">⚡</div>
                            <h3 className="font-medium text-gray-900 mb-1">Real-time Editing</h3>
                            <p className="text-sm text-gray-600">
                                See changes as they happen with live collaborative editing
                            </p>
                        </div>

                        <div className="bg-white p-4 rounded-lg shadow-sm">
                            <div className="text-green-600 text-2xl mb-2">💬</div>
                            <h3 className="font-medium text-gray-900 mb-1">Comments & Reviews</h3>
                            <p className="text-sm text-gray-600">
                                Add threaded comments, mentions, and feedback on any part
                            </p>
                        </div>

                        <div className="bg-white p-4 rounded-lg shadow-sm">
                            <div className="text-purple-600 text-2xl mb-2">📚</div>
                            <h3 className="font-medium text-gray-900 mb-1">Version History</h3>
                            <p className="text-sm text-gray-600">
                                Track all changes and restore any previous version
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
