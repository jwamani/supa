import { useState, useEffect } from 'react'
import { supabase } from './lib/supabaseClient'
import type { User } from '@supabase/supabase-js'

interface FunctionResponse {
    message?: string
    data?: any
    error?: string
    timestamp?: string
}

function EdgeFunctionsDemo() {
    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)
    const [helloLoading, setHelloLoading] = useState(false)
    const [processLoading, setProcessLoading] = useState(false)
    const [reportLoading, setReportLoading] = useState(false)
    const [responses, setResponses] = useState<FunctionResponse[]>([])
    const [testData, setTestData] = useState('')
    const [selectedReportType, setSelectedReportType] = useState('user-activity')

    // Check for user
    useEffect(() => {
        checkUser()
    }, [])

    const checkUser = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        setUser(user)
        setLoading(false)
    }

    // Call a simple hello-world edge function
    const callHelloFunction = async () => {
        setHelloLoading(true)
        try {
            const { data, error } = await supabase.functions.invoke('hello-world', {
                body: { name: user?.email || 'Anonymous' }
            })

            if (error) {
                setResponses(prev => [{
                    error: `Function error: ${error.message}`,
                    timestamp: new Date().toLocaleString()
                }, ...prev])
            } else {
                setResponses(prev => [{
                    message: 'Hello World function called successfully!',
                    data: data,
                    timestamp: new Date().toLocaleString()
                }, ...prev])
            }
        } catch (err) {
            setResponses(prev => [{
                error: 'Edge Functions not set up yet. Follow the instructions below.',
                timestamp: new Date().toLocaleString()
            }, ...prev])
        }
        setHelloLoading(false)
    }

    // Call a data processing function
    const callDataProcessor = async () => {
        if (!testData.trim()) return

        setProcessLoading(true)
        try {
            const { data, error } = await supabase.functions.invoke('process-data', {
                body: {
                    input: testData,
                    userId: user?.id
                }
            })

            if (error) {
                setResponses(prev => [{
                    error: `Process function error: ${error.message}`,
                    timestamp: new Date().toLocaleString()
                }, ...prev])
            } else {
                setResponses(prev => [{
                    message: 'Data processing completed!',
                    data: data,
                    timestamp: new Date().toLocaleString()
                }, ...prev])
            }
        } catch (err) {
            setResponses(prev => [{
                error: 'Process function not available. Create it using the instructions below.',
                timestamp: new Date().toLocaleString()
            }, ...prev])
        }
        setProcessLoading(false)
        setTestData('')
    }

    // Generate a report (complex operation)
    const generateReport = async () => {
        setReportLoading(true)
        try {
            const { data, error } = await supabase.functions.invoke('generate-report', {
                body: {
                    userId: user?.id,
                    type: selectedReportType // Use the selected report type
                }
            })

            if (error) {
                setResponses(prev => [{
                    error: `Report error: ${error.message}`,
                    timestamp: new Date().toLocaleString()
                }, ...prev])
            } else {
                setResponses(prev => [{
                    message: `${selectedReportType} report generated successfully!`,
                    data: data,
                    timestamp: new Date().toLocaleString()
                }, ...prev])
            }
        } catch (err) {
            setResponses(prev => [{
                error: 'Report function not available. Create it using the CLI commands below.',
                timestamp: new Date().toLocaleString()
            }, ...prev])
        }
        setReportLoading(false)
    }

    if (loading) {
        return (
            <div className="max-w-6xl mx-auto">
                <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                    <div className="bg-gradient-to-r from-emerald-500 to-cyan-600 px-8 py-6">
                        <h2 className="text-3xl font-bold text-white mb-2">⚡ Edge Functions</h2>
                        <p className="text-emerald-100">Loading serverless functions...</p>
                    </div>
                    <div className="p-8 flex justify-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="max-w-6xl mx-auto">
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-emerald-500 to-cyan-600 px-8 py-6">
                    <h2 className="text-3xl font-bold text-white mb-2">⚡ Edge Functions Demo</h2>
                    <p className="text-emerald-100">Learn serverless functions, API endpoints, and background processing</p>
                </div>

                <div className="p-8">
                    {/* Not authenticated message */}
                    {!user && (
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 mb-6 text-center">
                            <p className="text-amber-800">🔒 Please sign in using the Auth Demo tab to test Edge Functions</p>
                        </div>
                    )}

                    {/* Setup Instructions */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
                        <h3 className="text-lg font-bold text-blue-800 mb-4">📋 Edge Functions Setup</h3>
                        <div className="text-sm text-blue-700 space-y-3">
                            <p><strong>Edge Functions need to be created and deployed first:</strong></p>
                            <div className="bg-blue-100 p-3 rounded overflow-x-auto">
                                <pre className="text-xs">{`# 1. Create hello-world function
supabase functions new hello-world

# 2. Add this code to supabase/functions/hello-world/index.ts:
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

serve(async (req) => {
  const { name } = await req.json()
  
  const data = {
    message: \`Hello \${name}! This is an Edge Function.\`,
    timestamp: new Date().toISOString(),
    location: Deno.env.get('SUPABASE_REGION') || 'local'
  }

  return new Response(
    JSON.stringify(data),
    { headers: { "Content-Type": "application/json" } },
  )
})

# 3. Deploy the function
supabase functions deploy hello-world

# 4. Create process-data function
supabase functions new process-data

# 5. Add processing logic to process-data/index.ts
# 6. Deploy: supabase functions deploy process-data`}</pre>
                            </div>
                            <p className="text-xs text-blue-600">
                                💡 <strong>Tip:</strong> Functions run on Deno runtime and can access your database, call external APIs, and perform complex computations.
                            </p>
                        </div>
                    </div>

                    {/* Function Testing Interface */}
                    {user && (
                        <div className="grid md:grid-cols-2 gap-6 mb-8">
                            {/* Simple Function Call */}
                            <div className="bg-gradient-to-r from-emerald-50 to-cyan-50 rounded-lg p-6">
                                <h4 className="text-xl font-bold text-emerald-800 mb-4">👋 Hello World Function</h4>
                                <p className="text-emerald-700 mb-4 text-sm">
                                    Test a simple Edge Function that returns a personalized greeting.
                                </p>
                                <button
                                    onClick={callHelloFunction}
                                    disabled={helloLoading}
                                    className="w-full bg-gradient-to-r from-emerald-500 to-cyan-600 text-white py-3 px-6 rounded-lg font-medium hover:from-emerald-600 hover:to-cyan-700 transition-all disabled:opacity-50"
                                >
                                    {helloLoading ? '⏳ Calling...' : '🚀 Call Hello Function'}
                                </button>
                            </div>

                            {/* Data Processing */}
                            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-6">
                                <h4 className="text-xl font-bold text-purple-800 mb-4">🔄 Data Processing</h4>
                                <p className="text-purple-700 mb-4 text-sm">
                                    Send data to an Edge Function for server-side processing.
                                </p>
                                <div className="space-y-3">
                                    <input
                                        type="text"
                                        value={testData}
                                        onChange={(e) => setTestData(e.target.value)}
                                        placeholder="Enter data to process..."
                                        className="w-full px-4 py-2 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    />
                                    <button
                                        onClick={callDataProcessor}
                                        disabled={processLoading || !testData.trim()}
                                        className="w-full bg-gradient-to-r from-purple-500 to-pink-600 text-white py-3 px-6 rounded-lg font-medium hover:from-purple-600 hover:to-pink-700 transition-all disabled:opacity-50"
                                    >
                                        {processLoading ? '⏳ Processing...' : '⚡ Process Data'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Advanced Function - Report Generation */}
                    {user && (
                        <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg p-6 mb-8">
                            <h4 className="text-xl font-bold text-indigo-800 mb-4">📊 Advanced Report Generation</h4>
                            <p className="text-indigo-700 mb-6">
                                Generate different types of complex reports using serverless functions. Each report type demonstrates different business logic and data processing patterns.
                            </p>

                            {/* Report Type Selection */}
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-indigo-700 mb-3">
                                    📋 Select Report Type:
                                </label>
                                <select
                                    value={selectedReportType}
                                    onChange={(e) => setSelectedReportType(e.target.value)}
                                    className="w-full px-4 py-3 border border-indigo-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
                                >
                                    <option value="user-activity">
                                        👤 User Activity Report - Session analytics, login patterns, feature usage
                                    </option>
                                    <option value="system-stats">
                                        🖥️ System Statistics - Performance metrics, resource usage, health status
                                    </option>
                                    <option value="data-insights">
                                        🔍 Data Insights - Analytics, predictions, recommendations, trends
                                    </option>
                                </select>
                            </div>

                            {/* Report Type Descriptions */}
                            <div className="mb-6 p-4 bg-white rounded-lg border border-indigo-200">
                                {selectedReportType === 'user-activity' && (
                                    <div>
                                        <h5 className="font-bold text-indigo-800 mb-2">👤 User Activity Report</h5>
                                        <p className="text-sm text-indigo-600 mb-2">
                                            <strong>Purpose:</strong> Analyzes user behavior, session patterns, and feature adoption
                                        </p>
                                        <p className="text-sm text-indigo-600 mb-2">
                                            <strong>Contains:</strong> Login statistics, session duration, recent activities, feature usage metrics
                                        </p>
                                        <p className="text-sm text-indigo-600">
                                            <strong>Use Cases:</strong> User engagement analysis, personalization, account management
                                        </p>
                                    </div>
                                )}

                                {selectedReportType === 'system-stats' && (
                                    <div>
                                        <h5 className="font-bold text-indigo-800 mb-2">🖥️ System Statistics Report</h5>
                                        <p className="text-sm text-indigo-600 mb-2">
                                            <strong>Purpose:</strong> Monitors system performance, resource utilization, and health metrics
                                        </p>
                                        <p className="text-sm text-indigo-600 mb-2">
                                            <strong>Contains:</strong> CPU/Memory usage, network latency, user counts, error rates, service health
                                        </p>
                                        <p className="text-sm text-indigo-600">
                                            <strong>Use Cases:</strong> Infrastructure monitoring, capacity planning, performance optimization
                                        </p>
                                    </div>
                                )}

                                {selectedReportType === 'data-insights' && (
                                    <div>
                                        <h5 className="font-bold text-indigo-800 mb-2">🔍 Data Insights Report</h5>
                                        <p className="text-sm text-indigo-600 mb-2">
                                            <strong>Purpose:</strong> Provides advanced analytics, predictions, and actionable business insights
                                        </p>
                                        <p className="text-sm text-indigo-600 mb-2">
                                            <strong>Contains:</strong> Usage patterns, trend analysis, confidence scores, growth predictions, recommendations
                                        </p>
                                        <p className="text-sm text-indigo-600">
                                            <strong>Use Cases:</strong> Business intelligence, strategic planning, ML-driven insights, optimization
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Generate Button */}
                            <button
                                onClick={generateReport}
                                disabled={reportLoading}
                                className="w-full bg-gradient-to-r from-indigo-500 to-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:from-indigo-600 hover:to-blue-700 transition-all disabled:opacity-50 flex items-center justify-center space-x-2"
                            >
                                {reportLoading ? (
                                    <>
                                        <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={4}></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        <span>⏳ Generating {selectedReportType.replace('-', ' ')} report...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>📈</span>
                                        <span>Generate {selectedReportType.replace('-', ' ').toUpperCase()} Report</span>
                                    </>
                                )}
                            </button>
                        </div>
                    )}

                    {/* Function Responses */}
                    <div className="space-y-6">
                        <h3 className="text-2xl font-bold text-slate-800">📡 Function Responses</h3>

                        {responses.length === 0 ? (
                            <div className="text-center py-12 bg-slate-50 rounded-lg">
                                <p className="text-slate-600">No function calls yet. Try the functions above! 👆</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {responses.map((response, index) => (
                                    <div
                                        key={index}
                                        className={`rounded-lg p-4 border ${response.error
                                            ? 'bg-red-50 border-red-200'
                                            : 'bg-green-50 border-green-200'
                                            }`}
                                    >
                                        <div className="flex items-start justify-between mb-2">
                                            <div className="flex items-center">
                                                {response.error ? (
                                                    <svg className="w-5 h-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                                    </svg>
                                                ) : (
                                                    <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                    </svg>
                                                )}
                                                <span className={`font-medium ${response.error ? 'text-red-800' : 'text-green-800'}`}>
                                                    {response.error ? 'Error' : 'Success'}
                                                </span>
                                            </div>
                                            <span className="text-xs text-slate-500">{response.timestamp}</span>
                                        </div>

                                        <p className={`mb-2 ${response.error ? 'text-red-700' : 'text-green-700'}`}>
                                            {response.error || response.message}
                                        </p>

                                        {response.data && (
                                            <div className="bg-slate-100 rounded p-3">
                                                <pre className="text-xs text-slate-700 overflow-x-auto">
                                                    {JSON.stringify(response.data, null, 2)}
                                                </pre>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Learning Section */}
                    <div className="mt-8 bg-gradient-to-r from-cyan-50 to-emerald-50 rounded-lg p-6">
                        <h4 className="text-xl font-bold text-cyan-800 mb-4">🎓 Edge Functions Learning</h4>
                        <div className="grid md:grid-cols-2 gap-6 text-sm">
                            <div>
                                <h5 className="font-bold text-cyan-700 mb-2">⚡ What are Edge Functions?</h5>
                                <ul className="space-y-1 text-cyan-600">
                                    <li>• Serverless functions that run on Deno runtime</li>
                                    <li>• Execute close to users for low latency</li>
                                    <li>• Perfect for API endpoints and webhooks</li>
                                    <li>• Can access your Supabase database</li>
                                </ul>
                            </div>
                            <div>
                                <h5 className="font-bold text-emerald-700 mb-2">🚀 Use Cases</h5>
                                <ul className="space-y-1 text-emerald-600">
                                    <li>• Custom API endpoints</li>
                                    <li>• Data processing and validation</li>
                                    <li>• Third-party integrations</li>
                                    <li>• Background tasks and cron jobs</li>
                                </ul>
                            </div>
                        </div>
                        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded">
                            <p className="text-xs text-yellow-800">
                                <strong>💡 Pro Tip:</strong> Edge Functions are great for operations that shouldn't run in the browser,
                                like processing payments, sending emails, or complex data transformations.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default EdgeFunctionsDemo
