import { useState, useEffect, useCallback } from 'react'
import { supabase } from './lib/supabaseClient'
import type { User } from '@supabase/supabase-js'

// 🗂️ INTERFACE: File structure for uploaded files
interface UploadedFile {
    name: string
    size: number
    created_at: string
    url?: string
    type?: string
    fullPath?: string
}

function StorageDemo() {
    // 📊 STATE MANAGEMENT: All the component state
    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)
    const [uploading, setUploading] = useState(false)
    const [fetchingFiles, setFetchingFiles] = useState(false)
    const [files, setFiles] = useState<UploadedFile[]>([])
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)
    const [bucketExists, setBucketExists] = useState<boolean | null>(null)    // 🪣 BUCKET VERIFICATION: Check if storage bucket exists
    const checkBucketExists = useCallback(async () => {
        try {
            const { data, error } = await supabase.storage.listBuckets()

            if (error) {
                console.error('Error checking buckets:', error)
                setBucketExists(false)
                setError(`Storage access error: ${error.message}`)
                return false
            }

            // Check if our bucket exists
            const bucketFound = data?.some(bucket => bucket.name === 'user-uploads')
            setBucketExists(bucketFound)

            if (!bucketFound) {
                setError('Storage bucket "user-uploads" not found. Please create it first.')
                return false
            }
            return true
        } catch (err) {
            console.error('Failed to check bucket:', err)
            setBucketExists(false)
            setError('Failed to access storage. Please check your setup.')
            return false
        }
    }, [])

    // 📂 FETCH FILES: Load user's uploaded files with proper error handling
    const fetchUserFiles = useCallback(async (currentUser?: User | null) => {
        const userToUse = currentUser || user
        if (!userToUse) {
            console.log('No user provided for file fetching')
            return
        }

        setFetchingFiles(true)
        setError(null)

        try {
            // List files in user's folder - try even if bucket check failed initially
            const { data, error } = await supabase.storage
                .from('user-uploads')
                .list(userToUse.id, {
                    limit: 50,
                    offset: 0,
                    sortBy: { column: 'created_at', order: 'desc' }
                })

            if (error) {
                console.error('Error fetching files:', error)
                // Don't set error for bucket not found - let user know more clearly
                if (error.message.includes('bucket')) {
                    setBucketExists(false)
                    setError('Storage bucket "user-uploads" not found. Please create it first.')
                } else {
                    setError(`Error loading files: ${error.message}`)
                }
                setFiles([])
                return
            }

            if (!data || data.length === 0) {
                console.log('No files found for user:', userToUse.id)
                setFiles([])
                // Clear any existing errors if we successfully connected but found no files
                if (error === null) {
                    setError(null)
                }
                return
            }

            console.log(`Found ${data.length} files for user:`, userToUse.id)

            // 🔗 GET URLS: Generate public URLs for each file
            const filesWithUrls = await Promise.all(
                data
                    .filter(file => file.name !== '.emptyFolderPlaceholder') // Filter out placeholder files
                    .map(async (file) => {
                        try {
                            // Get public URL for each file
                            const { data: urlData } = supabase.storage
                                .from('user-uploads')
                                .getPublicUrl(`${userToUse.id}/${file.name}`)

                            return {
                                name: file.name,
                                size: file.metadata?.size || 0,
                                created_at: file.created_at || new Date().toISOString(),
                                url: urlData.publicUrl,
                                type: file.metadata?.mimetype || 'unknown',
                                fullPath: `${userToUse.id}/${file.name}`
                            } as UploadedFile
                        } catch (err) {
                            console.error(`Error processing file ${file.name}:`, err)
                            return null
                        }
                    })
            )

            // Filter out any null entries from failed processing
            const validFiles = filesWithUrls.filter((file): file is UploadedFile => file !== null)
            console.log(`Processed ${validFiles.length} valid files`)
            setFiles(validFiles)

            // Clear errors if we successfully loaded files
            if (validFiles.length > 0) {
                setError(null)
            }

        } catch (err) {
            console.error('Failed to fetch files:', err)
            setError('Failed to load files. Please try again.')
            setFiles([])
        } finally {
            setFetchingFiles(false)
        }
    }, [user])

    // 👤 AUTHENTICATION CHECK: Verify user is signed in
    useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            setUser(user)
            setLoading(false)

            if (user) {
                console.log('User found, checking bucket and fetching files for:', user.email)
                // Check bucket exists, but don't block file fetching
                await checkBucketExists()
                // Always try to fetch files - the function will handle bucket errors gracefully
                await fetchUserFiles(user)
            } else {
                console.log('No user found')
            }
        }
        getUser()
    }, [checkBucketExists, fetchUserFiles])

    // 📤 HANDLE FILE UPLOAD: Upload file and refresh list
    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (!file || !user) return

        setUploading(true)
        setError(null)
        setSuccess(null)

        try {
            // Create unique filename
            const fileExt = file.name.split('.').pop()
            const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`
            const filePath = `${user.id}/${fileName}`

            // Upload file
            const { error: uploadError } = await supabase.storage
                .from('user-uploads')
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: false
                })

            if (uploadError) {
                setError(`Upload failed: ${uploadError.message}`)
            } else {
                setSuccess(`✅ File "${file.name}" uploaded successfully!`)
                // Refresh file list immediately after upload
                await fetchUserFiles()
            }
        } catch (err) {
            console.error('Upload error:', err)
            setError('Upload failed')
        } finally {
            setUploading(false)
            // Reset file input
            event.target.value = ''
        }
    }

    // 🗑️ DELETE FILE: Remove file and refresh list
    const deleteFile = async (fileName: string) => {
        if (!user) return

        try {
            const { error } = await supabase.storage
                .from('user-uploads')
                .remove([`${user.id}/${fileName}`])

            if (error) {
                setError(`Delete failed: ${error.message}`)
            } else {
                setSuccess(`🗑️ File "${fileName}" deleted successfully!`)
                // Refresh file list immediately after deletion
                await fetchUserFiles()
            }
        } catch (err) {
            console.error('Delete error:', err)
            setError('Delete failed')
        }
    }

    // Format file size
    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return '0 Bytes'
        const k = 1024
        const sizes = ['Bytes', 'KB', 'MB', 'GB']
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    }

    if (loading) {
        return (
            <div className="max-w-4xl mx-auto">
                <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                    <div className="bg-gradient-to-r from-blue-500 to-cyan-600 px-8 py-6">
                        <h2 className="text-3xl font-bold text-white mb-2">📁 Storage</h2>
                        <p className="text-blue-100">Loading storage demo...</p>
                    </div>
                    <div className="p-8 flex justify-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-500 to-cyan-600 px-8 py-6">
                    <h2 className="text-3xl font-bold text-white mb-2">📁 Storage Demo</h2>
                    <p className="text-blue-100">Upload, manage, and organize your files</p>
                </div>

                <div className="p-8">
                    {/* Authentication Check */}
                    {!user && (
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 mb-6">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <svg className="h-5 w-5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <div className="ml-3">
                                    <h3 className="text-sm font-medium text-amber-800">Authentication Required</h3>
                                    <p className="text-sm text-amber-700 mt-1">
                                        Please sign in using the Authentication tab to use file storage features.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Success/Error Messages */}
                    {success && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                            <div className="flex items-center">
                                <svg className="h-5 w-5 text-green-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                <p className="text-sm font-medium text-green-800">{success}</p>
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                            <div className="flex items-center">
                                <svg className="h-5 w-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                                <p className="text-sm font-medium text-red-800">{error}</p>
                                {error.includes('bucket') && (
                                    <div className="mt-2 text-xs text-red-700">
                                        <strong>Need to create the bucket?</strong> Run this SQL in your Supabase SQL Editor:
                                        <pre className="mt-2 bg-red-100 p-2 rounded text-xs">
                                            {`-- Create the storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('user-uploads', 'user-uploads', true);

-- Set up storage policies
CREATE POLICY "Users can upload their own files" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'user-uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own files" ON storage.objects
  FOR SELECT USING (bucket_id = 'user-uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own files" ON storage.objects
  FOR DELETE USING (bucket_id = 'user-uploads' AND auth.uid()::text = (storage.foldername(name))[1]);`}
                                        </pre>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Debug Info */}
                    {user && (
                        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-6">
                            <h4 className="text-sm font-medium text-slate-800 mb-2">🔍 Debug Info</h4>
                            <div className="text-xs text-slate-600 space-y-1">
                                <p><strong>User ID:</strong> {user.id}</p>
                                <p><strong>Email:</strong> {user.email}</p>
                                <p><strong>Bucket exists:</strong> {bucketExists === null ? 'Checking...' : bucketExists ? 'Yes' : 'No'}</p>
                                <p><strong>Files loaded:</strong> {files.length}</p>
                                <p><strong>Currently fetching:</strong> {fetchingFiles ? 'Yes' : 'No'}</p>
                            </div>
                        </div>
                    )}

                    <div className="grid md:grid-cols-2 gap-8">
                        {/* File Upload */}
                        <div>
                            <div className="bg-slate-50 rounded-lg p-6">
                                <h3 className="text-xl font-bold text-slate-800 mb-4">📤 Upload Files</h3>

                                {user ? (
                                    <div className="space-y-4">
                                        <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                                            <input
                                                type="file"
                                                onChange={handleFileUpload}
                                                accept="image/*,.pdf,.doc,.docx,.txt"
                                                disabled={uploading}
                                                className="hidden"
                                                id="file-upload"
                                            />
                                            <label
                                                htmlFor="file-upload"
                                                className={`cursor-pointer ${uploading ? 'cursor-not-allowed opacity-50' : ''}`}
                                            >
                                                <div className="space-y-2">
                                                    <svg className="mx-auto h-12 w-12 text-slate-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                                                        <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                                                    </svg>
                                                    <div className="text-sm text-slate-600">
                                                        {uploading ? (
                                                            <div className="flex items-center justify-center">
                                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-2"></div>
                                                                Uploading...
                                                            </div>
                                                        ) : (
                                                            <>
                                                                <span className="font-medium text-blue-600 hover:text-blue-500">
                                                                    Click to upload
                                                                </span> or drag and drop
                                                            </>
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-slate-500">
                                                        PNG, JPG, PDF, DOC up to 10MB
                                                    </p>
                                                </div>
                                            </label>
                                        </div>

                                        <div className="text-sm text-slate-600">
                                            <p><strong>Signed in as:</strong> {user.email}</p>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-slate-500 text-center py-8">
                                        Please sign in to upload files
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Learning Guide */}
                        <div>
                            <div className="bg-blue-50 rounded-lg p-6 mb-6">
                                <h4 className="text-lg font-bold text-blue-800 mb-4">
                                    🎓 Storage Learning Guide
                                </h4>
                                <div className="space-y-3 text-sm text-blue-700">
                                    <div className="flex items-start">
                                        <span className="flex-shrink-0 w-2 h-2 bg-blue-400 rounded-full mt-2 mr-3"></span>
                                        <div>
                                            <strong>Upload:</strong> Store files in organized buckets
                                            <p className="text-xs text-blue-600 mt-1">Uses <code className="bg-blue-200 px-1 rounded">supabase.storage.from().upload()</code></p>
                                        </div>
                                    </div>
                                    <div className="flex items-start">
                                        <span className="flex-shrink-0 w-2 h-2 bg-cyan-400 rounded-full mt-2 mr-3"></span>
                                        <div>
                                            <strong>List:</strong> Retrieve file metadata and listings
                                            <p className="text-xs text-blue-600 mt-1">Uses <code className="bg-blue-200 px-1 rounded">supabase.storage.from().list()</code></p>
                                        </div>
                                    </div>
                                    <div className="flex items-start">
                                        <span className="flex-shrink-0 w-2 h-2 bg-teal-400 rounded-full mt-2 mr-3"></span>
                                        <div>
                                            <strong>Access:</strong> Generate public/private URLs
                                            <p className="text-xs text-blue-600 mt-1">Uses <code className="bg-blue-200 px-1 rounded">supabase.storage.from().getPublicUrl()</code></p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-gradient-to-r from-blue-500 to-cyan-600 rounded-lg p-6 text-white">
                                <h4 className="font-bold mb-2">🔐 Security Features</h4>
                                <ul className="text-sm space-y-1 text-blue-100">
                                    <li>• User-specific file isolation</li>
                                    <li>• Row Level Security policies</li>
                                    <li>• File type restrictions</li>
                                    <li>• Size limitations</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* File List */}
                    {user && (
                        <div className="mt-8">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-xl font-bold text-slate-800">📋 Your Files ({files.length})</h3>
                                <button
                                    onClick={() => fetchUserFiles()}
                                    disabled={fetchingFiles}
                                    className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors"
                                >
                                    {fetchingFiles ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                            <span>Loading...</span>
                                        </>
                                    ) : (
                                        <>
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                            </svg>
                                            <span>Refresh</span>
                                        </>
                                    )}
                                </button>
                            </div>

                            {files.length === 0 ? (
                                <div className="text-center py-8 text-slate-500">
                                    <svg className="mx-auto h-12 w-12 text-slate-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                    </svg>
                                    <p>No files uploaded yet. Upload your first file above! 👆</p>
                                </div>
                            ) : (
                                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {files.map((file) => (
                                        <div key={file.name} className="bg-white border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                                            <div className="flex items-start justify-between mb-3">
                                                <div className="flex items-center space-x-3">
                                                    <div className="flex-shrink-0">
                                                        {file.name.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                                                            <img
                                                                src={file.url}
                                                                alt={file.name}
                                                                className="w-10 h-10 rounded object-cover"
                                                            />
                                                        ) : (
                                                            <div className="w-10 h-10 bg-slate-100 rounded flex items-center justify-center">
                                                                <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                                </svg>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium text-slate-900 truncate">
                                                            {file.name}
                                                        </p>
                                                        <p className="text-xs text-slate-500">
                                                            {formatFileSize(file.size)}
                                                        </p>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => deleteFile(file.name)}
                                                    className="text-red-600 hover:text-red-800 p-1"
                                                    title="Delete file"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            </div>

                                            <div className="flex items-center justify-between text-xs text-slate-500">
                                                <span>{new Date(file.created_at).toLocaleDateString()}</span>
                                                {file.url && (
                                                    <a
                                                        href={file.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-blue-600 hover:text-blue-800"
                                                    >
                                                        View
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default StorageDemo
