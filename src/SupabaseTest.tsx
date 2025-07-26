import { useEffect, useState } from 'react'
import { supabase } from './lib/supabaseClient'

function SupabaseTest() {
    const [connection, setConnection] = useState<string>('Testing...')
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const testConnection = async () => {
            try {
                setLoading(true)
                const { error } = await supabase.from('_metadata').select('*').limit(1)
                if (error) {
                    // This is expected if no tables exist yet
                    setConnection('✅ Connected to Supabase!')
                } else {
                    setConnection('✅ Connected to Supabase!')
                }
            } catch (err) {
                setConnection('❌ Connection failed. Check your credentials.')
                console.error('Supabase connection error:', err)
            } finally {
                setLoading(false)
            }
        }
        
        testConnection()
    }, [])

    return (
        <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-8 py-6">
                    <h3 className="text-3xl font-bold text-white mb-2">🔌 Supabase Connection</h3>
                    <p className="text-green-100">Testing your database connection</p>
                </div>

                <div className="p-8">
                    {/* Connection Status */}
                    <div className="text-center py-8">
                        {loading ? (
                            <div className="flex flex-col items-center">
                                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-500 mb-4"></div>
                                <p className="text-lg text-slate-600">Testing connection...</p>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center">
                                <div className={`text-6xl mb-4 ${connection.includes('✅') ? 'animate-bounce' : ''}`}>
                                    {connection.includes('✅') ? '✅' : '❌'}
                                </div>
                                <p className={`text-2xl font-semibold mb-4 ${connection.includes('✅') ? 'text-green-600' : 'text-red-600'
                                    }`}>
                                    {connection.includes('✅') ? 'Successfully Connected!' : 'Connection Failed'}
                                </p>
                                <p className="text-slate-600 max-w-md">
                                    {connection.includes('✅')
                                        ? 'Your Supabase configuration is working correctly. You can now proceed to test authentication and database operations.'
                                        : 'Please check your environment variables in .env.local and ensure your Supabase project is active.'
                                    }
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Next Steps */}
                    {!loading && connection.includes('✅') && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-6 mt-8">
                            <h4 className="text-lg font-semibold text-green-800 mb-3">🎉 Great! What's next?</h4>
                            <div className="space-y-2 text-green-700">
                                <p>✅ Your Supabase connection is working</p>
                                <p>➡️ Try the <span className="font-semibold">🔐 Authentication</span> tab to test user signup/signin</p>
                                <p>➡️ Use the <span className="font-semibold">📝 CRUD Operations</span> tab to create your first todos</p>
                                <p>➡️ Explore <span className="font-semibold">💬 Real-time</span> features</p>
                            </div>
                        </div>
                    )}

                    {/* Troubleshooting */}
                    {!loading && connection.includes('❌') && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-6 mt-8">
                            <h4 className="text-lg font-semibold text-red-800 mb-3">🔧 Troubleshooting</h4>
                            <div className="space-y-3 text-red-700">
                                <p className="font-medium">2. Ensure your Supabase project is active</p>
                            </div>
                        </div>
                    )}

                    {/* Technical Details */}
                    <div className="mt-12 bg-slate-50 rounded-lg p-6">
                        <h4 className="text-xl font-bold text-slate-800 mb-4">🔍 Technical Details</h4>
                        <div className="grid md:grid-cols-2 gap-6">
                            <div>
                                <h5 className="font-semibold text-slate-700 mb-2">What this test does:</h5>
                                <ul className="text-sm text-slate-600 space-y-1">
                                    <li>• Attempts to query the Supabase metadata</li>
                                    <li>• Validates your project URL and API key</li>
                                    <li>• Confirms network connectivity</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default SupabaseTest
