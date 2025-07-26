import { useState, useEffect } from 'react'
import { supabase } from './lib/supabaseClient'
import type { User } from '@supabase/supabase-js'

// Define the Todo type with user relationship
interface Todo {
    id: number
    task: string
    is_complete: boolean
    created_at: string
    user_id: string
}

function TodoApp() {
    const [todos, setTodos] = useState<Todo[]>([])
    const [newTodo, setNewTodo] = useState('')
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [user, setUser] = useState<User | null>(null)

    // Check for user session when component mounts
    useEffect(() => {
        checkUser()
        fetchTodos()
    }, [])

    // Check if user is authenticated
    const checkUser = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        setUser(user)
        if (!user) {
            setError('Please sign in to use the Todo app')
            setLoading(false)
        }
    }

    // READ: Fetch all todos from Supabase (only user's todos due to RLS)
    const fetchTodos = async () => {
        try {
            setLoading(true)
            const { data, error } = await supabase
                .from('todos')
                .select('*')
                .order('created_at', { ascending: false })

            if (error) {
                setError(`Error fetching todos: ${error.message}`)
                console.error('Error:', error)
            } else {
                setTodos(data || [])
                setError(null)
            }
        } catch (err) {
            setError('Failed to fetch todos. Make sure you are signed in and the table exists!')
            console.error('Fetch error:', err)
        } finally {
            setLoading(false)
        }
    }

    // CREATE: Add a new todo (automatically associated with current user)
    const addTodo = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newTodo.trim() || !user) return

        try {
            const { data, error } = await supabase
                .from('todos')
                .insert([{
                    task: newTodo.trim(),
                    is_complete: false,
                    user_id: user.id
                }])
                .select()

            if (error) {
                setError(`Error adding todo: ${error.message}`)
                console.error('Error:', error)
            } else {
                // Add the new todo to our local state
                if (data) {
                    setTodos([data[0], ...todos])
                }
                setNewTodo('')
                setError(null)
            }
        } catch (err) {
            setError('Failed to add todo')
            console.error('Add error:', err)
        }
    }

    // UPDATE: Toggle todo completion
    const toggleTodo = async (id: number, currentStatus: boolean) => {
        try {
            const { error } = await supabase
                .from('todos')
                .update({ is_complete: !currentStatus })
                .eq('id', id)

            if (error) {
                setError(`Error updating todo: ${error.message}`)
                console.error('Error:', error)
            } else {
                // Update local state
                setTodos(todos.map(todo =>
                    todo.id === id ? { ...todo, is_complete: !currentStatus } : todo
                ))
                setError(null)
            }
        } catch (err) {
            setError('Failed to update todo')
            console.error('Update error:', err)
        }
    }

    // DELETE: Remove a todo
    const deleteTodo = async (id: number) => {
        try {
            const { error } = await supabase
                .from('todos')
                .delete()
                .eq('id', id)

            if (error) {
                setError(`Error deleting todo: ${error.message}`)
                console.error('Error:', error)
            } else {
                // Remove from local state
                setTodos(todos.filter(todo => todo.id !== id))
                setError(null)
            }
        } catch (err) {
            setError('Failed to delete todo')
            console.error('Delete error:', err)
        }
    }

    return (
        <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-500 to-purple-600 px-8 py-6">
                    <h2 className="text-3xl font-bold text-white mb-2">📝 Todo App</h2>
                    <p className="text-blue-100">Learning Supabase CRUD with User Authentication</p>
                </div>

                <div className="p-8">
                    {/* User info */}
                    {user && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <svg className="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <div className="ml-3">
                                    <p className="text-sm font-medium text-green-800">
                                        👤 Signed in as: <span className="font-bold">{user.email}</span>
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Not authenticated message */}
                    {!user && !loading && (
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 mb-6 text-center">
                            <div className="flex justify-center mb-3">
                                <svg className="h-12 w-12 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-medium text-amber-800 mb-2">Authentication Required</h3>
                            <p className="text-amber-700">Please sign in using the <span className="font-semibold">🔐 Authentication</span> tab to use the Todo app</p>
                        </div>
                    )}

                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                            <div className="flex">
                                <div className="flex-shrink-0">
                                    <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <div className="ml-3 flex-1">
                                    <p className="text-sm font-medium text-red-800">{error}</p>
                                    {error.includes('table') && (
                                        <div className="mt-3">
                                            <p className="text-sm text-red-700 font-semibold mb-2">Need to create the table? Run this SQL in your Supabase SQL Editor:</p>
                                            <pre className="bg-slate-800 text-green-400 p-4 rounded-md text-xs overflow-x-auto">
                                                {`CREATE TABLE todos (
  id BIGSERIAL PRIMARY KEY,
  task TEXT NOT NULL,
  is_complete BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Enable Row Level Security
ALTER TABLE todos ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own todos" ON todos
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own todos" ON todos
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own todos" ON todos
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own todos" ON todos
  FOR DELETE USING (auth.uid() = user_id);`}
                                            </pre>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Form to add new todos - only show if user is authenticated */}
                    {user && (
                        <form onSubmit={addTodo} className="mb-8">
                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <input
                                        type="text"
                                        value={newTodo}
                                        onChange={(e) => setNewTodo(e.target.value)}
                                        placeholder="Enter a new todo..."
                                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={!newTodo.trim()}
                                    className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium rounded-lg hover:from-blue-600 hover:to-purple-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Add Todo
                                </button>
                            </div>
                        </form>
                    )}

                    {/* Loading state */}
                    {loading && (
                        <div className="flex justify-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                        </div>
                    )}

                    {/* Todos list - only show if user is authenticated */}
                    {user && !loading && (
                        <div>
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-2xl font-bold text-slate-800">Your Todos</h3>
                                <span className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">
                                    {todos.length} {todos.length === 1 ? 'todo' : 'todos'}
                                </span>
                            </div>

                            {todos.length === 0 ? (
                                <div className="text-center py-12">
                                    <svg className="mx-auto h-12 w-12 text-slate-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                    </svg>
                                    <p className="text-slate-500 text-lg">No todos yet!</p>
                                    <p className="text-slate-400">Add your first todo above to get started 👆</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {todos.map((todo) => (
                                        <div
                                            key={todo.id}
                                            className={`flex items-center p-4 bg-white border rounded-lg shadow-sm transition-all hover:shadow-md ${todo.is_complete ? 'bg-slate-50 border-slate-200' : 'border-slate-200'
                                                }`}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={todo.is_complete}
                                                onChange={() => toggleTodo(todo.id, todo.is_complete)}
                                                className="h-5 w-5 text-blue-600 rounded focus:ring-blue-500 border-slate-300"
                                            />
                                            <div className="ml-4 flex-1">
                                                <span className={`text-lg ${todo.is_complete
                                                    ? 'line-through text-slate-500'
                                                    : 'text-slate-800'
                                                    }`}>
                                                    {todo.task}
                                                </span>
                                                <div className="text-sm text-slate-400 mt-1">
                                                    {new Date(todo.created_at).toLocaleDateString('en-US', {
                                                        year: 'numeric',
                                                        month: 'short',
                                                        day: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => deleteTodo(todo.id)}
                                                className="ml-4 p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                                title="Delete todo"
                                            >
                                                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Explanation */}
                    <div className="mt-12 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-200">
                        <h4 className="text-xl font-bold text-slate-800 mb-4 flex items-center">
                            <span className="mr-2">🎓</span>
                            What you're learning:
                        </h4>
                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-3">
                                <div className="flex items-start">
                                    <span className="flex-shrink-0 w-2 h-2 bg-green-400 rounded-full mt-2 mr-3"></span>
                                    <div>
                                        <strong className="text-slate-700">CREATE:</strong>
                                        <p className="text-sm text-slate-600 mt-1">Adding new todos with <code className="bg-slate-200 px-1 rounded text-xs">supabase.from('todos').insert()</code></p>
                                    </div>
                                </div>
                                <div className="flex items-start">
                                    <span className="flex-shrink-0 w-2 h-2 bg-blue-400 rounded-full mt-2 mr-3"></span>
                                    <div>
                                        <strong className="text-slate-700">READ:</strong>
                                        <p className="text-sm text-slate-600 mt-1">Fetching todos with <code className="bg-slate-200 px-1 rounded text-xs">supabase.from('todos').select()</code></p>
                                    </div>
                                </div>
                                <div className="flex items-start">
                                    <span className="flex-shrink-0 w-2 h-2 bg-yellow-400 rounded-full mt-2 mr-3"></span>
                                    <div>
                                        <strong className="text-slate-700">UPDATE:</strong>
                                        <p className="text-sm text-slate-600 mt-1">Toggling completion with <code className="bg-slate-200 px-1 rounded text-xs">supabase.from('todos').update()</code></p>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-3">
                                <div className="flex items-start">
                                    <span className="flex-shrink-0 w-2 h-2 bg-red-400 rounded-full mt-2 mr-3"></span>
                                    <div>
                                        <strong className="text-slate-700">DELETE:</strong>
                                        <p className="text-sm text-slate-600 mt-1">Removing todos with <code className="bg-slate-200 px-1 rounded text-xs">supabase.from('todos').delete()</code></p>
                                    </div>
                                </div>
                                <div className="flex items-start">
                                    <span className="flex-shrink-0 w-2 h-2 bg-purple-400 rounded-full mt-2 mr-3"></span>
                                    <div>
                                        <strong className="text-slate-700">AUTH:</strong>
                                        <p className="text-sm text-slate-600 mt-1">User authentication with Row Level Security (RLS)</p>
                                    </div>
                                </div>
                                <div className="flex items-start">
                                    <span className="flex-shrink-0 w-2 h-2 bg-indigo-400 rounded-full mt-2 mr-3"></span>
                                    <div>
                                        <strong className="text-slate-700">RELATIONSHIPS:</strong>
                                        <p className="text-sm text-slate-600 mt-1">Todos are linked to users via <code className="bg-slate-200 px-1 rounded text-xs">user_id</code></p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default TodoApp
