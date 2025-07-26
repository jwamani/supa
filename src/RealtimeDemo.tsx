import { useState, useEffect } from 'react'
import { supabase } from './lib/supabaseClient'
import type { RealtimeChannel } from '@supabase/supabase-js'

interface Message {
    id: number
    message: string
    user_email: string
    created_at: string
}

function RealtimeDemo() {
    const [messages, setMessages] = useState<Message[]>([])
    const [newMessage, setNewMessage] = useState('')
    const [userEmail, setUserEmail] = useState('')
    const [isConnected, setIsConnected] = useState(false)
    const [channel, setChannel] = useState<RealtimeChannel | null>(null)

    useEffect(() => {
        // Get current user
        const getCurrentUser = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                setUserEmail(user.email || 'Anonymous')
            } else {
                setUserEmail('Anonymous')
            }
        }

        getCurrentUser()

        // Fetch existing messages
        fetchMessages()

        // Set up real-time subscription
        const messageChannel = supabase
            .channel('messages')
            .on(
                'postgres_changes',
                {
                    event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
                    schema: 'public',
                    table: 'messages'
                },
                (payload) => {
                    console.log('Real-time update:', payload)

                    if (payload.eventType === 'INSERT') {
                        setMessages(current => [payload.new as Message, ...current])
                    } else if (payload.eventType === 'DELETE') {
                        setMessages(current => current.filter(msg => msg.id !== payload.old.id))
                    } else if (payload.eventType === 'UPDATE') {
                        setMessages(current =>
                            current.map(msg =>
                                msg.id === payload.new.id ? payload.new as Message : msg
                            )
                        )
                    }
                }
            )
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    setIsConnected(true)
                    console.log('Connected to real-time messages!')
                } else if (status === 'CLOSED') {
                    setIsConnected(false)
                    console.log('Disconnected from real-time messages')
                }
            })

        setChannel(messageChannel)

        // Cleanup subscription on unmount
        return () => {
            messageChannel.unsubscribe()
        }
    }, [])

    const fetchMessages = async () => {
        try {
            const { data, error } = await supabase
                .from('messages')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(20)

            if (error) {
                console.error('Error fetching messages:', error)
            } else {
                setMessages(data || [])
            }
        } catch (err) {
            console.error('Failed to fetch messages:', err)
        }
    }

    const sendMessage = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newMessage.trim()) return

        try {
            const { error } = await supabase
                .from('messages')
                .insert([{
                    message: newMessage.trim(),
                    user_email: userEmail
                }])

            if (error) {
                console.error('Error sending message:', error)
                alert(`Error: ${error.message}`)
            } else {
                setNewMessage('')
            }
        } catch (err) {
            console.error('Failed to send message:', err)
            alert('Failed to send message')
        }
    }

    const deleteMessage = async (id: number) => {
        try {
            const { error } = await supabase
                .from('messages')
                .delete()
                .eq('id', id)

            if (error) {
                console.error('Error deleting message:', error)
            }
        } catch (err) {
            console.error('Failed to delete message:', err)
        }
    }

    return (
        <div style={{
            maxWidth: '600px',
            margin: '20px auto',
            padding: '20px',
            border: '1px solid #ddd',
            borderRadius: '8px'
        }}>
            <h2>💬 Real-time Chat Demo</h2>

            {/* Connection status */}
            <div style={{
                padding: '10px',
                borderRadius: '4px',
                marginBottom: '20px',
                backgroundColor: isConnected ? '#d4edda' : '#fff3cd',
                color: isConnected ? '#155724' : '#856404',
                border: `1px solid ${isConnected ? '#c3e6cb' : '#ffeaa7'}`
            }}>
                {isConnected ? '🟢 Connected to real-time updates' : '🟡 Connecting...'}
            </div>

            {/* Error message for missing table */}
            {messages.length === 0 && (
                <div style={{
                    padding: '15px',
                    backgroundColor: '#f8d7da',
                    borderRadius: '4px',
                    marginBottom: '20px',
                    color: '#721c24'
                }}>
                    <strong>Table might not exist!</strong> Create it with this SQL:
                    <pre style={{ backgroundColor: '#f5f5f5', padding: '10px', marginTop: '10px' }}>
                        {`create table messages (
  id bigint generated by default as identity primary key,
  message text not null,
  user_email text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (recommended)
alter table messages enable row level security;

-- Allow anyone to read messages
create policy "Anyone can read messages" on messages for select using (true);

-- Allow authenticated users to insert messages
create policy "Authenticated users can insert messages" on messages for insert with check (true);

-- Allow users to delete their own messages
create policy "Users can delete own messages" on messages for delete using (auth.email() = user_email);`}
                    </pre>
                </div>
            )}

            {/* Message form */}
            <form onSubmit={sendMessage} style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type your message..."
                        style={{
                            flex: 1,
                            padding: '10px',
                            border: '1px solid #ccc',
                            borderRadius: '4px'
                        }}
                    />
                    <button
                        type="submit"
                        disabled={!newMessage.trim()}
                        style={{
                            padding: '10px 20px',
                            backgroundColor: '#007bff',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer'
                        }}
                    >
                        Send
                    </button>
                </div>
                <small style={{ color: '#666' }}>
                    Posting as: {userEmail}
                </small>
            </form>

            {/* Messages */}
            <div style={{
                height: '400px',
                overflowY: 'auto',
                border: '1px solid #eee',
                borderRadius: '4px',
                padding: '10px'
            }}>
                {messages.length === 0 ? (
                    <p style={{ textAlign: 'center', color: '#666' }}>
                        No messages yet. Be the first to send one! 👆
                    </p>
                ) : (
                    messages.map((message) => (
                        <div
                            key={message.id}
                            style={{
                                padding: '10px',
                                margin: '5px 0',
                                backgroundColor: '#f8f9fa',
                                borderRadius: '4px',
                                borderLeft: '3px solid #007bff'
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div style={{ flex: 1 }}>
                                    <strong style={{ color: '#007bff' }}>{message.user_email}</strong>
                                    <p style={{ margin: '5px 0' }}>{message.message}</p>
                                    <small style={{ color: '#666' }}>
                                        {new Date(message.created_at).toLocaleString()}
                                    </small>
                                </div>
                                {message.user_email === userEmail && (
                                    <button
                                        onClick={() => deleteMessage(message.id)}
                                        style={{
                                            backgroundColor: '#dc3545',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '4px',
                                            padding: '5px 8px',
                                            cursor: 'pointer',
                                            fontSize: '12px'
                                        }}
                                    >
                                        Delete
                                    </button>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Explanation */}
            <div style={{
                marginTop: '20px',
                padding: '15px',
                backgroundColor: '#f8f9fa',
                borderRadius: '4px',
                fontSize: '14px'
            }}>
                <h4>🎓 What you're learning:</h4>
                <ul>
                    <li><strong>Real-time subscriptions:</strong> <code>supabase.channel().on('postgres_changes')</code></li>
                    <li><strong>Channel management:</strong> Subscribe and unsubscribe to channels</li>
                    <li><strong>Event types:</strong> INSERT, UPDATE, DELETE events</li>
                    <li><strong>Live updates:</strong> See changes instantly across all connected clients</li>
                </ul>
                <p><strong>Try this:</strong> Open this page in multiple browser tabs and send messages to see real-time sync!</p>
            </div>
        </div>
    )
}

export default RealtimeDemo
