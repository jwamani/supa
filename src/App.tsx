import { useState } from 'react'
import SupabaseTest from './SupabaseTest'
import TodoApp from './TodoApp'
import AuthDemo from './AuthDemo'
import StorageDemo from './StorageDemo'
import RelationshipsDemo from './RelationshipsDemo'
import RealtimeDemo from './RealtimeDemo'
import EdgeFunctionsDemo from './EdgeFunctionsDemo'

function App() {
    const [activeTab, setActiveTab] = useState('connection')

    const tabs = [
        { id: 'connection', label: '🔌 Connection', component: <SupabaseTest /> },
        { id: 'auth', label: '🔐 Authentication', component: <AuthDemo /> },
        { id: 'storage', label: '📁 Storage', component: <StorageDemo /> },
        { id: 'relationships', label: '🔗 Relationships', component: <RelationshipsDemo /> },
        { id: 'crud', label: '📝 CRUD Operations', component: <TodoApp /> },
        { id: 'realtime', label: '💬 Real-time', component: <RealtimeDemo /> },
        { id: 'edge-functions', label: '⚡ Edge Functions', component: <EdgeFunctionsDemo /> },
    ]

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header */}
            <header className="bg-gradient-to-r from-sky-600 to-green-600 text-white">
                <div className="container mx-auto px-4 py-8 text-center">
                    <h1 className="text-4xl font-bold mb-2">🚀 Supabase Learning Journey</h1>
                    <p className="text-lg opacity-90">Learn Supabase concepts step by step</p>
                </div>
            </header>

            {/* Tab Navigation */}
            <nav className="bg-white shadow-md sticky top-0 z-10">
                <div className="container mx-auto px-4">
                    <div className="flex justify-center items-center space-x-1">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`px-6 py-4 font-medium text-base transition-all duration-300 border-b-3 hover:bg-slate-50 ${activeTab === tab.id
                                    ? 'border-blue-500 text-blue-600 bg-blue-50'
                                    : 'border-transparent text-slate-600 hover:text-slate-900'
                                    }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>
            </nav>

            {/* Content */}
            <main className="container mx-auto px-4 py-8 min-h-screen">
                <div className="max-w-6xl mx-auto">
                    {tabs.find(tab => tab.id === activeTab)?.component}
                </div>
            </main>

            {/* Footer */}
            <footer className="bg-slate-100 border-t border-slate-200">
                <div className="container mx-auto px-4 py-6 text-center text-slate-600">
                    <p className="text-sm">
                        📚 Learning Supabase: Database, Auth, Real-time, and more! |{' '}
                        <a
                            href="https://supabase.com/docs"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-supabase-600 hover:text-supabase-700 font-medium"
                        >
                            Official Docs
                        </a>
                    </p>
                </div>
            </footer>
        </div>
    )
}

export default App
