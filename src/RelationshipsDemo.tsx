import { useState, useEffect } from 'react'
import { supabase } from './lib/supabaseClient'
import type { User } from '@supabase/supabase-js'

// TypeScript interfaces for our data structures
interface Category {
    id: number
    name: string
    color: string
    created_at: string
}

interface Post {
    id: number
    title: string
    content: string
    category_id: number
    user_id: string
    created_at: string
    // Relations
    category?: Category
    post_tags?: { tag: Tag }[]
}

interface Tag {
    id: number
    name: string
    color: string
}

interface PostTag {
    post_id: number
    tag_id: number
}

function RelationshipsDemo() {
    const [user, setUser] = useState<User | null>(null)
    const [posts, setPosts] = useState<Post[]>([])
    const [categories, setCategories] = useState<Category[]>([])
    const [tags, setTags] = useState<Tag[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // Form states
    const [newPostTitle, setNewPostTitle] = useState('')
    const [newPostContent, setNewPostContent] = useState('')
    const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null)
    const [selectedTagIds, setSelectedTagIds] = useState<number[]>([])

    // Check for user and load data
    useEffect(() => {
        checkUser()
        loadData()
    }, [])

    const checkUser = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        setUser(user)
        if (!user) {
            setError('Please sign in to use the Relationships demo')
        }
    }

    const loadData = async () => {
        try {
            setLoading(true)

            // Check if all required tables exist before proceeding
            const tableChecks = await Promise.all([
                supabase.from('categories').select('id').limit(1),
                supabase.from('posts').select('id').limit(1),
                supabase.from('tags').select('id').limit(1),
                supabase.from('post_tags').select('post_id').limit(1)
            ])

            // If any table check fails, show error message
            const hasTableError = tableChecks.some(check => check.error)
            if (hasTableError) {
                setError('Tables not created yet. Please run the SQL below to create the required tables.')
                setPosts([])
                setCategories([])
                setTags([])
                return
            }

            // All tables exist, now load data with relationships
            const { data: postsData, error: postsError } = await supabase
                .from('posts')
                .select(`
                    *,
                    category:categories(*),
                    post_tags(
                        tag:tags(*)
                    )
                `)
                .order('created_at', { ascending: false })

            // Load categories
            const { data: categoriesData, error: categoriesError } = await supabase
                .from('categories')
                .select('*')
                .order('name')

            // Load tags
            const { data: tagsData, error: tagsError } = await supabase
                .from('tags')
                .select('*')
                .order('name')

            if (postsError || categoriesError || tagsError) {
                const errorMsg = postsError?.message || categoriesError?.message || tagsError?.message
                setError(`Error loading data: ${errorMsg}`)
            } else {
                setPosts(postsData || [])
                setCategories(categoriesData || [])
                setTags(tagsData || [])
                setError(null)
            }
        } catch (err) {
            setError('Tables not created yet. Please run the SQL below to create the required tables.')
            console.error('Load error:', err)
        } finally {
            setLoading(false)
        }
    }

    const createPost = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!user || !newPostTitle.trim() || !newPostContent.trim() || !selectedCategoryId) return

        try {
            // Insert the post
            const { data: postData, error: postError } = await supabase
                .from('posts')
                .insert([{
                    title: newPostTitle.trim(),
                    content: newPostContent.trim(),
                    category_id: selectedCategoryId,
                    user_id: user.id
                }])
                .select()
                .single()

            if (postError) {
                setError(`Error creating post: ${postError.message}`)
                return
            }

            // Insert post-tag relationships if tags are selected
            if (selectedTagIds.length > 0) {
                const postTagInserts = selectedTagIds.map(tagId => ({
                    post_id: postData.id,
                    tag_id: tagId
                }))

                const { error: tagError } = await supabase
                    .from('post_tags')
                    .insert(postTagInserts)

                if (tagError) {
                    console.error('Error adding tags:', tagError)
                }
            }

            // Reset form
            setNewPostTitle('')
            setNewPostContent('')
            setSelectedCategoryId(null)
            setSelectedTagIds([])

            // Reload data to see the new post
            loadData()
        } catch (err) {
            setError('Failed to create post')
            console.error('Create error:', err)
        }
    }

    const toggleTag = (tagId: number) => {
        if (selectedTagIds.includes(tagId)) {
            setSelectedTagIds(selectedTagIds.filter(id => id !== tagId))
        } else {
            setSelectedTagIds([...selectedTagIds, tagId])
        }
    }

    if (loading) {
        return (
            <div className="max-w-6xl mx-auto">
                <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                    <div className="bg-gradient-to-r from-purple-500 to-pink-600 px-8 py-6">
                        <h2 className="text-3xl font-bold text-white mb-2">🔗 Database Relationships</h2>
                        <p className="text-purple-100">Loading relationship data...</p>
                    </div>
                    <div className="p-8 flex justify-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="max-w-6xl mx-auto">
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-purple-500 to-pink-600 px-8 py-6">
                    <h2 className="text-3xl font-bold text-white mb-2">🔗 Database Relationships Demo</h2>
                    <p className="text-purple-100">Learn One-to-Many, Many-to-Many relationships with JOINs</p>
                </div>

                <div className="p-8">
                    {/* Error Display */}
                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
                            <div className="flex items-center">
                                <svg className="h-5 w-5 text-red-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                                <div>
                                    <p className="text-red-800 font-medium">{error}</p>
                                    {error.includes('table') && (
                                        <div className="mt-4 text-sm text-red-700">
                                            <p className="font-semibold mb-2">Create these tables in your Supabase SQL Editor:</p>
                                            <pre className="bg-red-100 p-3 rounded text-xs overflow-x-auto">
                                                {`-- Categories table (One-to-Many with posts)
CREATE TABLE categories (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  color TEXT DEFAULT '#3B82F6',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Posts table (belongs to category and user)
CREATE TABLE posts (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category_id BIGINT REFERENCES categories(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tags table (Many-to-Many with posts)
CREATE TABLE tags (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  color TEXT DEFAULT '#10B981'
);

-- Junction table for Many-to-Many relationship
CREATE TABLE post_tags (
  post_id BIGINT REFERENCES posts(id) ON DELETE CASCADE,
  tag_id BIGINT REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, tag_id)
);

-- Insert sample data
INSERT INTO categories (name, color) VALUES 
  ('Technology', '#3B82F6'),
  ('Design', '#8B5CF6'),
  ('Business', '#F59E0B');

INSERT INTO tags (name, color) VALUES 
  ('React', '#61DAFB'),
  ('Supabase', '#3ECF8E'),
  ('TypeScript', '#3178C6'),
  ('Database', '#336791');

-- Enable RLS
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_tags ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can read categories" ON categories FOR SELECT USING (true);
CREATE POLICY "Anyone can read tags" ON tags FOR SELECT USING (true);
CREATE POLICY "Anyone can read posts" ON posts FOR SELECT USING (true);
CREATE POLICY "Users can create posts" ON posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Anyone can read post_tags" ON post_tags FOR SELECT USING (true);
CREATE POLICY "Users can manage post_tags" ON post_tags FOR ALL USING (
  EXISTS (SELECT 1 FROM posts WHERE posts.id = post_id AND posts.user_id = auth.uid())
);`}
                                            </pre>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Not authenticated message */}
                    {!user && !loading && (
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 mb-6 text-center">
                            <p className="text-amber-800">🔒 Please sign in using the Auth Demo tab to create posts</p>
                        </div>
                    )}

                    {/* Create Post Form */}
                    {user && (
                        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-6 mb-8">
                            <h3 className="text-xl font-bold text-purple-800 mb-4">✍️ Create New Post</h3>
                            <form onSubmit={createPost} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-purple-700 mb-2">Post Title</label>
                                    <input
                                        type="text"
                                        value={newPostTitle}
                                        onChange={(e) => setNewPostTitle(e.target.value)}
                                        required
                                        className="w-full px-4 py-2 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                        placeholder="Enter your post title..."
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-purple-700 mb-2">Content</label>
                                    <textarea
                                        value={newPostContent}
                                        onChange={(e) => setNewPostContent(e.target.value)}
                                        required
                                        rows={3}
                                        className="w-full px-4 py-2 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                        placeholder="Write your post content..."
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-purple-700 mb-2">Category (One-to-Many)</label>
                                    <select
                                        value={selectedCategoryId || ''}
                                        onChange={(e) => setSelectedCategoryId(Number(e.target.value) || null)}
                                        required
                                        className="w-full px-4 py-2 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    >
                                        <option value="">Select a category...</option>
                                        {categories.map((category) => (
                                            <option key={category.id} value={category.id}>
                                                {category.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-purple-700 mb-2">Tags (Many-to-Many)</label>
                                    <div className="flex flex-wrap gap-2">
                                        {tags.map((tag) => (
                                            <button
                                                key={tag.id}
                                                type="button"
                                                onClick={() => toggleTag(tag.id)}
                                                className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${selectedTagIds.includes(tag.id)
                                                    ? 'bg-purple-600 text-white'
                                                    : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                                                    }`}
                                                style={{ backgroundColor: selectedTagIds.includes(tag.id) ? tag.color : undefined }}
                                            >
                                                {tag.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    className="w-full bg-gradient-to-r from-purple-500 to-pink-600 text-white py-3 px-6 rounded-lg font-medium hover:from-purple-600 hover:to-pink-700 transition-all"
                                >
                                    🚀 Create Post
                                </button>
                            </form>
                        </div>
                    )}

                    {/* Posts Display */}
                    <div className="space-y-6">
                        <h3 className="text-2xl font-bold text-slate-800">📰 Posts with Relationships</h3>

                        {posts.length === 0 ? (
                            <div className="text-center py-12 bg-slate-50 rounded-lg">
                                <p className="text-slate-600">No posts yet. Create your first post above! 👆</p>
                            </div>
                        ) : (
                            posts.map((post) => (
                                <div key={post.id} className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
                                    <div className="flex items-start justify-between mb-4">
                                        <div>
                                            <h4 className="text-xl font-bold text-slate-800 mb-2">{post.title}</h4>
                                            <p className="text-slate-600 mb-3">{post.content}</p>
                                        </div>
                                        {post.category && (
                                            <span
                                                className="px-3 py-1 rounded-full text-sm font-medium text-white"
                                                style={{ backgroundColor: post.category.color }}
                                            >
                                                {post.category.name}
                                            </span>
                                        )}
                                    </div>

                                    <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                                        <div className="flex items-center space-x-4">
                                            <span className="text-sm text-slate-500">
                                                👤 {user?.email || 'Unknown'}
                                            </span>
                                            <span className="text-sm text-slate-500">
                                                📅 {new Date(post.created_at).toLocaleDateString()}
                                            </span>
                                        </div>

                                        {post.post_tags && post.post_tags.length > 0 && (
                                            <div className="flex flex-wrap gap-1">
                                                {post.post_tags.map((postTag, index) => (
                                                    <span
                                                        key={index}
                                                        className="px-2 py-1 rounded text-xs font-medium text-white"
                                                        style={{ backgroundColor: postTag.tag.color }}
                                                    >
                                                        {postTag.tag.name}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Learning Section */}
                    <div className="mt-8 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-6">
                        <h4 className="text-xl font-bold text-indigo-800 mb-4">🎓 Database Relationships Learning</h4>
                        <div className="grid md:grid-cols-2 gap-6 text-sm">
                            <div>
                                <h5 className="font-bold text-indigo-700 mb-2">🔗 One-to-Many Relationships</h5>
                                <ul className="space-y-1 text-indigo-600">
                                    <li>• One Category → Many Posts</li>
                                    <li>• One User → Many Posts</li>
                                    <li>• Uses foreign keys (category_id, user_id)</li>
                                    <li>• JOIN queries: <code className="bg-indigo-200 px-1 rounded">categories(*)</code></li>
                                </ul>
                            </div>
                            <div>
                                <h5 className="font-bold text-purple-700 mb-2">🔗 Many-to-Many Relationships</h5>
                                <ul className="space-y-1 text-purple-600">
                                    <li>• Many Posts ↔ Many Tags</li>
                                    <li>• Uses junction table (post_tags)</li>
                                    <li>• Composite primary key (post_id, tag_id)</li>
                                    <li>• Nested JOIN: <code className="bg-purple-200 px-1 rounded">post_tags(tag:tags(*))</code></li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default RelationshipsDemo
