'use client'

import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/context/AuthContext'
import { toast } from 'sonner'
import LoginModal from '@/components/LoginModal'

export default function CommunityContent({ isPublic = false, loginRedirectTo }) {
    const { user: currentUser, token } = useAuth()
    const isAuthed = Boolean(currentUser && token)
    const [view, setView] = useState('feed') // 'feed' or 'profile'
    const [profileId, setProfileId] = useState(null)
    const [posts, setPosts] = useState([])
    const [profileData, setProfileData] = useState(null)
    const [isCommentsOpen, setIsCommentsOpen] = useState(false)
    const [activePost, setActivePost] = useState(null)
    const [comments, setComments] = useState([])
    const [activeTab, setActiveTab] = useState('Posts')
    const [isFollowing, setIsFollowing] = useState(false)
    const [loading, setLoading] = useState(true)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [postContent, setPostContent] = useState('')
    const [selectedImage, setSelectedImage] = useState(null)
    const [imagePreview, setImagePreview] = useState(null)
    const [showLoginModal, setShowLoginModal] = useState(false)
    const fileInputRef = useRef(null)
    const API_URL = process.env.NEXT_PUBLIC_API_URL

    useEffect(() => {
        if (view === 'feed') {
            fetchPosts()
        } else if (view === 'profile' && profileId) {
            if (!isAuthed) {
                setShowLoginModal(true)
                setView('feed')
                setProfileId(null)
                return
            }
            fetchProfile(profileId)
        }
    }, [view, profileId, isAuthed])

    const requireAuth = () => {
        if (!isAuthed) {
            setShowLoginModal(true)
            return false
        }
        return true
    }

    const fetchPosts = async () => {
        try {
            setLoading(true)
            const res = await fetch(`${API_URL}/community/posts`, {
                headers: isAuthed ? { 'Authorization': `Bearer ${token}` } : undefined
            })
            const data = await res.json()
            if (data.success) {
                setPosts(data.data)
            }
        } catch (error) {
            toast.error("Failed to load posts")
        } finally {
            setLoading(false)
        }
    }

    const fetchProfile = async (id) => {
        if (!requireAuth()) return
        try {
            setLoading(true)
            const res = await fetch(`${API_URL}/profile/${id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            const data = await res.json()
            if (data.success) {
                setProfileData(data.data)
                setIsFollowing(data.data.stats.isFollowing)
            }
        } catch (error) {
            toast.error("Failed to load profile")
        } finally {
            setLoading(false)
        }
    }

    const handleImageChange = (e) => {
        const file = e.target.files[0]
        if (file) {
            if (!file.type.startsWith('image/')) {
                toast.error("Please upload an image file")
                return
            }
            setSelectedImage(file)
            setImagePreview(URL.createObjectURL(file))
        }
    }

    const handleCreatePost = async () => {
        if (!requireAuth()) return
        if (!postContent.trim() && !selectedImage) {
            toast.error("Post cannot be empty")
            return
        }

        try {
            setIsSubmitting(true)
            const formData = new FormData()
            formData.append('content', postContent)
            if (selectedImage) {
                formData.append('image', selectedImage)
            }

            const res = await fetch(`${API_URL}/community/posts`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            })

            const data = await res.json()
            if (data.success) {
                setPosts([data.data, ...posts])
                setPostContent('')
                setSelectedImage(null)
                setImagePreview(null)
                toast.success("Post created successfully!")
            }
        } catch (error) {
            toast.error("Failed to create post")
        } finally {
            setIsSubmitting(false)
        }
    }

    const toggleLike = async (postId) => {
        if (!requireAuth()) return
        try {
            const res = await fetch(`${API_URL}/community/posts/${postId}/like`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` }
            })
            const data = await res.json()
            if (data.success) {
                // Update post in feed
                setPosts(prev => prev.map(p => p._id === postId ? { ...p, likes: data.data.likes } : p))
                // Update active post if in comments
                if (activePost && activePost._id === postId) {
                    setActivePost(prev => ({ ...prev, likes: data.data.likes }))
                }
                // Update profile data if active
                if (profileData) {
                    const updateList = (list) => list.map(p => p._id === postId ? { ...p, likes: data.data.likes } : p)
                    setProfileData(prev => ({
                        ...prev,
                        posts: updateList(prev.posts),
                        likedPosts: updateList(prev.likedPosts),
                        commentedPosts: updateList(prev.commentedPosts)
                    }))
                }
            }
        } catch (error) {
            toast.error("Action failed")
        }
    }

    const handleOpenComments = async (post) => {
        if (!requireAuth()) return
        setActivePost(post)
        setIsCommentsOpen(true)
        document.body.style.overflow = 'hidden'

        try {
            const res = await fetch(`${API_URL}/community/posts/${post._id}/comments`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            const data = await res.json()
            if (data.success) {
                setComments(data.data)
            }
        } catch (error) {
            toast.error("Failed to load comments")
        }
    }

    const handleCloseComments = () => {
        setIsCommentsOpen(false)
        setActivePost(null)
        setComments([])
        document.body.style.overflow = ''
    }

    const handleAddComment = async (content) => {
        if (!content.trim()) return
        if (!requireAuth()) return

        try {
            const res = await fetch(`${API_URL}/community/posts/${activePost._id}/comments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ content })
            })
            const data = await res.json()
            if (data.success) {
                // We need the populated user info, but for speed we can just add it locally if we have current user
                const newComment = {
                    ...data.data,
                    userId: {
                        _id: currentUser._id,
                        username: currentUser.username,
                        avatar: currentUser.avatar
                    }
                }
                setComments([...comments, newComment])
                // Update comment count in feed
                setPosts(prev => prev.map(p => p._id === activePost._id ? { ...p, commentCount: (p.commentCount || 0) + 1 } : p))
            }
        } catch (error) {
            toast.error("Failed to post comment")
        }
    }

    const toggleFollow = async (userId) => {
        if (!requireAuth()) return
        if (userId === currentUser?._id) return;

        try {
            const method = isFollowing ? 'DELETE' : 'POST'
            const res = await fetch(`${API_URL}/follow/${userId}`, {
                method,
                headers: { 'Authorization': `Bearer ${token}` }
            })
            const data = await res.json()
            if (data.success) {
                setIsFollowing(!isFollowing)
                setProfileData(prev => ({
                    ...prev,
                    stats: {
                        ...prev.stats,
                        followers: prev.stats.followers + (isFollowing ? -1 : 1)
                    }
                }))
                toast.success(data.message)
            }
        } catch (error) {
            toast.error("Action failed")
        }
    }

    const getInitial = (name) => name ? name.charAt(0).toUpperCase() : '?'

    const containerClass = isPublic ? 'min-h-screen bg-white' : ''
    const navClass = isPublic
        ? 'bg-white border-b border-gray-100 sticky top-0 z-30 mb-4'
        : 'bg-white border-b border-gray-100 sticky top-0 z-30 -mx-4 md:-mx-8 md:-mt-8 mb-4 md:mb-6'

    return (
        <div className={containerClass}>
            {/* Community-specific Top Navigation (Sub-header) */}
            <nav className={navClass}>
                <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
                    <div className="flex items-center gap-3 cursor-pointer" onClick={() => { setView('feed'); setProfileId(null); }}>
                        <div className="w-8 h-8 bg-gray-900 text-white rounded-lg flex items-center justify-center font-medium tracking-tighter text-sm">
                            SM
                        </div>
                        <span className="font-medium text-base tracking-tight">Community</span>
                    </div>
                    <button onClick={() => { if (!requireAuth()) return; setView('profile'); setProfileId(currentUser?._id); }} className="w-8 h-8 rounded-full bg-gray-100 overflow-hidden hover:ring-2 hover:ring-gray-200 transition-all flex items-center justify-center">
                        {currentUser?.avatar ? (
                            <img src={currentUser.avatar} alt="My Profile" className="w-full h-full object-cover" />
                        ) : (
                            <span className="text-xs font-medium text-gray-600">{getInitial(currentUser?.username)}</span>
                        )}
                    </button>
                </div>
            </nav>

            {view === 'feed' ? (
                /* MAIN VIEW: Community Feed */
                <main className="flex-1 w-full max-w-2xl mx-auto pb-20">
                    {/* Create Post */}
                    {isAuthed ? (
                        <div className="bg-white p-4 md:rounded-2xl border-b md:border border-gray-100 mb-2 md:mb-6 shadow-sm">
                            <div className="flex gap-3">
                                <div
                                    className="w-10 h-10 rounded-full bg-gray-100 overflow-hidden flex-shrink-0 cursor-pointer flex items-center justify-center"
                                    onClick={() => { if (!requireAuth()) return; setView('profile'); setProfileId(currentUser?._id); }}
                                >
                                    {currentUser?.avatar ? (
                                        <img src={currentUser.avatar} alt="Avatar" className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-sm font-medium text-gray-600">{getInitial(currentUser?.username)}</span>
                                    )}
                                </div>
                                <div className="flex-1">
                                    <textarea
                                        className="w-full bg-transparent resize-none outline-none text-base placeholder:text-gray-400 min-h-[40px] pt-2"
                                        placeholder="Share your learning progress..."
                                        value={postContent}
                                        onChange={(e) => setPostContent(e.target.value)}
                                    ></textarea>

                                    {imagePreview && (
                                        <div className="mt-2 relative rounded-xl overflow-hidden border border-gray-100">
                                            <img src={imagePreview} alt="Preview" className="w-full h-auto max-h-60 object-cover" />
                                            <button
                                                onClick={() => { setSelectedImage(null); setImagePreview(null); }}
                                                className="absolute top-2 right-2 bg-black/50 text-white p-1 rounded-full hover:bg-black/70"
                                            >
                                                <iconify-icon icon="solar:close-circle-linear" width="20" height="20"></iconify-icon>
                                            </button>
                                        </div>
                                    )}

                                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            className="hidden"
                                            accept="image/*"
                                            onChange={handleImageChange}
                                        />
                                        <button
                                            onClick={() => fileInputRef.current.click()}
                                            className="text-gray-400 hover:text-gray-600 transition-colors flex items-center gap-1.5 px-2 py-1 rounded-md hover:bg-gray-50"
                                        >
                                            <iconify-icon icon="solar:gallery-linear" width="20" height="20" style={{ strokeWidth: 1.5 }}></iconify-icon>
                                            <span className="text-sm font-medium">Image</span>
                                        </button>
                                        <button
                                            onClick={handleCreatePost}
                                            disabled={isSubmitting || (!postContent.trim() && !selectedImage)}
                                            className="bg-gray-900 text-white px-4 py-1.5 rounded-full text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-50"
                                        >
                                            {isSubmitting ? 'Posting...' : 'Post'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white p-4 md:rounded-2xl border-b md:border border-gray-100 mb-2 md:mb-6 shadow-sm flex items-center justify-between gap-4">
                            <div>
                                <p className="text-sm font-medium text-gray-900">Join the conversation</p>
                                <p className="text-xs text-gray-500">Log in to post, like, or comment.</p>
                            </div>
                            <button
                                onClick={() => setShowLoginModal(true)}
                                className="px-4 py-2 bg-gray-900 text-white rounded-full text-sm font-medium hover:bg-gray-800 transition-colors"
                            >
                                Log in
                            </button>
                        </div>
                    )}

                    <div className="space-y-2 md:space-y-4">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-gray-100">
                                <iconify-icon icon="solar:refresh-linear" width="32" height="32" className="animate-spin text-gray-300 mb-2"></iconify-icon>
                                <p className="text-gray-500 text-sm">Loading community feed...</p>
                            </div>
                        ) : posts.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-gray-100">
                                <iconify-icon icon="solar:ghost-linear" width="32" height="32" className="text-gray-300 mb-2"></iconify-icon>
                                <p className="text-gray-500 text-sm">No posts yet. Be the first to share something!</p>
                            </div>
                        ) : posts.map((post) => (
                            <article key={post._id} className="bg-white p-4 md:rounded-2xl md:border border-y border-gray-100 shadow-sm">
                                <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => { if (!requireAuth()) return; setView('profile'); setProfileId(post.userId?._id); }}>
                                        <div className="w-10 h-10 rounded-full bg-gray-100 overflow-hidden flex items-center justify-center">
                                            {post.userId?.avatar ? (
                                                <img src={post.userId.avatar} alt={post.userId.username} className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="text-sm font-medium text-gray-600">{getInitial(post.userId?.username)}</span>
                                            )}
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-medium">{post.userId?._id === currentUser?._id ? 'You' : post.userId?.username}</h3>
                                            <p className="text-xs text-gray-500">{new Date(post.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                                        </div>
                                    </div>
                                    <button className="text-gray-400 hover:text-gray-600">
                                        <iconify-icon icon="solar:menu-dots-bold" width="20" height="20"></iconify-icon>
                                    </button>
                                </div>
                                <div className="mb-3">
                                    {post.content && (
                                        <p className="text-base text-gray-800 mb-3 leading-relaxed whitespace-pre-wrap">
                                            {post.content}
                                        </p>
                                    )}
                                    {post.image && (
                                        <div className="rounded-xl overflow-hidden border border-gray-100 bg-gray-50">
                                            <img src={post.image} alt="Post Content" className="w-full h-auto max-h-[500px] object-contain mx-auto" />
                                        </div>
                                    )}
                                </div>
                                <div className="flex items-center gap-6 pt-2">
                                    <button
                                        onClick={() => toggleLike(post._id)}
                                        className={`flex items-center gap-1.5 transition-colors group ${post.likes?.includes(currentUser?._id) ? 'text-red-500' : 'text-gray-500 hover:text-red-500'}`}
                                    >
                                        <div className={`p-1.5 rounded-full transition-colors flex items-center justify-center ${post.likes?.includes(currentUser?._id) ? 'bg-red-50' : 'group-hover:bg-red-50'}`}>
                                            <iconify-icon icon={post.likes?.includes(currentUser?._id) ? "solar:heart-bold" : "solar:heart-linear"} width="22" height="22" style={{ strokeWidth: 1.5 }}></iconify-icon>
                                        </div>
                                        <span className="text-sm font-medium">{post.likes?.length || 0}</span>
                                    </button>
                                    <button onClick={() => handleOpenComments(post)} className="flex items-center gap-1.5 text-gray-500 hover:text-blue-500 transition-colors group">
                                        <div className="p-1.5 rounded-full group-hover:bg-blue-50 transition-colors flex items-center justify-center">
                                            <iconify-icon icon="solar:chat-round-line-linear" width="22" height="22" style={{ strokeWidth: 1.5 }}></iconify-icon>
                                        </div>
                                        <span className="text-sm font-medium">{post.commentCount || 0}</span>
                                    </button>
                                </div>
                            </article>
                        ))}
                    </div>
                </main>
            ) : (
                /* VIEW 2: User Profile Screen */
                <main className="flex-1 w-full max-w-2xl mx-auto bg-white min-h-screen">
                    {loading && !profileData ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <iconify-icon icon="solar:refresh-linear" width="32" height="32" className="animate-spin text-gray-300 mb-2"></iconify-icon>
                            <p className="text-gray-500 text-sm mt-2">Loading profile...</p>
                        </div>
                    ) : profileData ? (
                        <>
                            <div className="px-4 pt-6 pb-4">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="w-20 h-20 rounded-full bg-gray-100 overflow-hidden border-2 border-white shadow-sm ring-1 ring-gray-100 flex items-center justify-center">
                                        {profileData.user.avatar ? (
                                            <img src={profileData.user.avatar} alt={profileData.user.username} className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="text-2xl font-medium text-gray-600">{getInitial(profileData.user.username)}</span>
                                        )}
                                    </div>
                                    {currentUser?._id !== profileData.user.id && (
                                        <button
                                            onClick={() => toggleFollow(profileData.user.id)}
                                            className={`px-5 py-1.5 rounded-full text-sm font-medium transition-colors border ${isFollowing ? 'bg-white text-gray-900 hover:bg-gray-50 border-gray-200' : 'bg-gray-900 text-white hover:bg-gray-800 border-gray-900'}`}
                                        >
                                            {isFollowing ? 'Following' : 'Follow'}
                                        </button>
                                    )}
                                </div>

                                <div className="mb-4">
                                    <h1 className="text-xl font-medium tracking-tight">{profileData.user.username}</h1>
                                    <p className="text-sm text-gray-500">@{profileData.user.username.toLowerCase().replace(/\s+/g, '_')}</p>
                                </div>

                                <p className="text-sm text-gray-800 mb-4 leading-relaxed">
                                    {profileData.user.bio || `Passionate about learning on StudyMaster. Goal: ${profileData.user.class || 'Academic Excellence'}`}
                                </p>

                                <div className="flex items-center gap-4 text-sm">
                                    <div className="flex items-center gap-1 cursor-pointer hover:underline decoration-gray-300 underline-offset-4">
                                        <span className="font-medium text-gray-900">{profileData.stats.followers}</span>
                                        <span className="text-gray-500">Followers</span>
                                    </div>
                                    <div className="flex items-center gap-1 cursor-pointer hover:underline decoration-gray-300 underline-offset-4">
                                        <span className="font-medium text-gray-900">{profileData.stats.following}</span>
                                        <span className="text-gray-500">Following</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex border-b border-gray-100">
                                {['Posts', 'Likes', 'Comments'].map((tab) => (
                                    <button
                                        key={tab}
                                        onClick={() => setActiveTab(tab)}
                                        className={`flex-1 py-3 text-sm font-medium transition-colors border-b-2 ${activeTab === tab ? 'text-gray-900 border-gray-900' : 'text-gray-500 border-transparent hover:text-gray-700'}`}
                                    >
                                        {tab}
                                    </button>
                                ))}
                            </div>

                            <div className="p-4 bg-gray-50 min-h-[50vh]">
                                {activeTab === 'Posts' && (
                                    <div className="space-y-4">
                                        {profileData.posts.length === 0 ? (
                                            <p className="text-center text-gray-500 py-10">No posts yet</p>
                                        ) : profileData.posts.map(post => (
                                            <article key={post._id} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                                                <div className="flex items-center justify-between mb-3">
                                                    <div className="flex items-center gap-2.5">
                                                        <div className="w-8 h-8 rounded-full bg-gray-100 overflow-hidden flex items-center justify-center">
                                                            {profileData.user.avatar ? (
                                                                <img src={profileData.user.avatar} alt="" className="w-full h-full object-cover" />
                                                            ) : (
                                                                <span className="text-xs font-medium text-gray-600">{getInitial(profileData.user.username)}</span>
                                                            )}
                                                        </div>
                                                        <div>
                                                            <h3 className="text-sm font-medium">{profileData.user.username}</h3>
                                                            <p className="text-xs text-gray-500">{new Date(post.createdAt).toLocaleDateString()}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                                <p className="text-base text-gray-800 mb-2">{post.content}</p>
                                                {post.image && (
                                                    <div className="rounded-xl overflow-hidden border border-gray-100 mb-2">
                                                        <img src={post.image} alt="" className="w-full h-auto" />
                                                    </div>
                                                )}
                                                <div className="flex items-center gap-6 pt-2">
                                                    <div onClick={() => toggleLike(post._id)} className={`flex items-center gap-1.5 cursor-pointer ${post.likes?.includes(currentUser?._id) ? 'text-red-500' : 'text-gray-500'}`}>
                                                        <iconify-icon icon={post.likes?.includes(currentUser?._id) ? "solar:heart-bold" : "solar:heart-linear"} width="20" height="20"></iconify-icon>
                                                        <span className="text-xs font-medium">{post.likes?.length || 0}</span>
                                                    </div>
                                                    <div onClick={() => handleOpenComments(post)} className="flex items-center gap-1.5 text-gray-500 cursor-pointer">
                                                        <iconify-icon icon="solar:chat-round-line-linear" width="20" height="20"></iconify-icon>
                                                        <span className="text-xs font-medium">{post.commentCount || 0}</span>
                                                    </div>
                                                </div>
                                            </article>
                                        ))}
                                    </div>
                                )}
                                {activeTab === 'Likes' && (
                                    <div className="space-y-4">
                                        {profileData.likedPosts.length === 0 ? (
                                            <p className="text-center text-gray-500 py-10">No liked posts yet</p>
                                        ) : profileData.likedPosts.map(post => (
                                            <article key={post._id} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                                                <div className="flex items-center justify-between mb-3">
                                                    <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => { if (!requireAuth()) return; setProfileId(post.userId?._id); }}>
                                                        <div className="w-8 h-8 rounded-full bg-gray-100 overflow-hidden flex items-center justify-center">
                                                            {post.userId?.avatar ? (
                                                                <img src={post.userId.avatar} alt="" className="w-full h-full object-cover" />
                                                            ) : (
                                                                <span className="text-xs font-medium text-gray-600">{getInitial(post.userId?.username)}</span>
                                                            )}
                                                        </div>
                                                        <div>
                                                            <h3 className="text-sm font-medium">{post.userId?.username}</h3>
                                                            <p className="text-xs text-gray-500">{new Date(post.createdAt).toLocaleDateString()}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                                <p className="text-base text-gray-800 mb-2">{post.content}</p>
                                                {post.image && (
                                                    <div className="rounded-xl overflow-hidden border border-gray-100 mb-2">
                                                        <img src={post.image} alt="" className="w-full h-auto" />
                                                    </div>
                                                )}
                                                <div className="flex items-center gap-6 pt-2">
                                                    <div onClick={() => toggleLike(post._id)} className="flex items-center gap-1.5 text-red-500 cursor-pointer">
                                                        <iconify-icon icon="solar:heart-bold" width="20" height="20"></iconify-icon>
                                                        <span className="text-xs font-medium">{post.likes?.length || 0}</span>
                                                    </div>
                                                </div>
                                            </article>
                                        ))}
                                    </div>
                                ) || activeTab === 'Comments' && (
                                    <div className="space-y-4">
                                        {profileData.commentedPosts.length === 0 ? (
                                            <p className="text-center text-gray-500 py-10">No commented posts yet</p>
                                        ) : profileData.commentedPosts.map(post => (
                                            <article key={post._id} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                                                <div className="flex items-center justify-between mb-3">
                                                    <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => { if (!requireAuth()) return; setProfileId(post.userId?._id); }}>
                                                        <div className="w-8 h-8 rounded-full bg-gray-100 overflow-hidden flex items-center justify-center">
                                                            {post.userId?.avatar ? (
                                                                <img src={post.userId.avatar} alt="" className="w-full h-full object-cover" />
                                                            ) : (
                                                                <span className="text-xs font-medium text-gray-600">{getInitial(post.userId?.username)}</span>
                                                            )}
                                                        </div>
                                                        <div>
                                                            <h3 className="text-sm font-medium">{post.userId?.username}</h3>
                                                            <p className="text-xs text-gray-500">{new Date(post.createdAt).toLocaleDateString()}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                                <p className="text-base text-gray-800 mb-2">{post.content}</p>
                                                <div className="flex items-center gap-6 pt-2">
                                                    <div onClick={() => handleOpenComments(post)} className="flex items-center gap-1.5 text-blue-500 cursor-pointer">
                                                        <iconify-icon icon="solar:chat-round-line-linear" width="20" height="20"></iconify-icon>
                                                        <span className="text-xs font-medium">View conversation</span>
                                                    </div>
                                                </div>
                                            </article>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-20">
                            <iconify-icon icon="solar:user-block-linear" width="48" height="48" className="text-gray-300 mb-4"></iconify-icon>
                            <h3 className="text-lg font-medium text-gray-900">Profile Not Found</h3>
                            <p className="text-gray-500 text-sm mt-1 max-w-xs text-center">
                                The profile you're looking for might have been moved or deleted.
                            </p>
                            <button
                                onClick={() => setView('feed')}
                                className="mt-6 px-4 py-2 bg-gray-900 text-white rounded-full text-sm font-medium hover:bg-gray-800 transition-colors"
                            >
                                Back to Feed
                            </button>
                        </div>
                    )}
                </main>
            )}

            {/* Overlay / Comment Modal & Bottom Sheet */}
            {isCommentsOpen && (
                <div
                    className="fixed inset-0 z-50 flex flex-col justify-end md:justify-center items-center bg-black/30 backdrop-blur-sm transition-opacity duration-300"
                    onClick={handleCloseComments}
                >
                    <div
                        id="comment-panel"
                        className="w-full bg-white rounded-t-3xl shadow-[0_-8px_40px_rgba(0,0,0,0.12)] max-h-[80vh] h-[75vh] md:h-[600px] md:max-w-[500px] md:rounded-2xl flex flex-col transform transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]"
                        onClick={(e) => e.stopPropagation()}
                        style={{ transform: 'translateY(0)' }}
                    >
                        {/* Header */}
                        <div className="flex-shrink-0 pt-3 pb-3 px-4 border-b border-gray-100 relative bg-white md:rounded-t-2xl rounded-t-3xl">
                            <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-3 md:hidden"></div>
                            <h3 className="text-base font-medium text-center">Comments</h3>
                            <button
                                onClick={handleCloseComments}
                                className="absolute right-3 top-3 md:top-4 text-gray-400 hover:text-gray-900 transition-colors bg-gray-50 hover:bg-gray-100 rounded-full p-1.5 flex items-center justify-center"
                            >
                                <iconify-icon icon="solar:close-circle-linear" width="22" height="22" style={{ strokeWidth: 1.5 }}></iconify-icon>
                            </button>
                        </div>

                        {/* Comment List Area */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-5 no-scrollbar bg-white">
                            {comments.length === 0 ? (
                                <p className="text-center text-gray-500 py-10">No comments yet. Start the conversation!</p>
                            ) : comments.map((comment) => (
                                <div key={comment._id} className="flex gap-3">
                                    <div className="w-8 h-8 rounded-full bg-gray-100 overflow-hidden flex-shrink-0 flex items-center justify-center">
                                        {comment.userId?.avatar ? (
                                            <img src={comment.userId.avatar} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="text-[10px] font-medium text-gray-600">{getInitial(comment.userId?.username)}</span>
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-sm font-medium">{comment.userId?._id === currentUser?._id ? 'You' : comment.userId?.username}</span>
                                            {comment.userId?._id === activePost?.userId?._id && (
                                                <span className="bg-gray-100 text-gray-600 text-[10px] px-1.5 py-0.5 rounded font-medium">Author</span>
                                            )}
                                            <span className="text-xs text-gray-400">{new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                        <p className="text-sm text-gray-800 mt-0.5 whitespace-pre-wrap">{comment.content}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Sticky Input Box */}
                        <div className="flex-shrink-0 p-3 md:p-4 border-t border-gray-100 bg-white md:rounded-b-2xl">
                            <form
                                className="flex items-end gap-2 bg-gray-50 rounded-2xl p-2 border border-gray-100 focus-within:border-gray-300 focus-within:bg-white transition-colors"
                                onSubmit={(e) => {
                                    e.preventDefault()
                                    const text = e.target.comment.value
                                    if (text.trim()) {
                                        handleAddComment(text)
                                        e.target.comment.value = ''
                                    }
                                }}
                            >
                                <div className="w-8 h-8 rounded-full bg-gray-100 overflow-hidden mb-0.5 flex-shrink-0 flex items-center justify-center">
                                    {currentUser?.avatar ? (
                                        <img src={currentUser.avatar} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-[10px] font-medium text-gray-600">{getInitial(currentUser?.username)}</span>
                                    )}
                                </div>
                                <textarea
                                    name="comment"
                                    className="flex-1 bg-transparent resize-none outline-none text-sm placeholder:text-gray-400 max-h-24 min-h-[36px] py-2 px-1"
                                    placeholder="Add a comment..."
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault()
                                            e.currentTarget.form.requestSubmit()
                                        }
                                    }}
                                ></textarea>
                                <button type="submit" className="w-8 h-8 bg-black text-white rounded-full flex items-center justify-center flex-shrink-0 hover:bg-gray-800 transition-colors mb-0.5">
                                    <iconify-icon icon="solar:arrow-up-linear" width="20" height="20"></iconify-icon>
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            <LoginModal open={showLoginModal} onClose={() => setShowLoginModal(false)} redirectTo={loginRedirectTo} />
        </div>
    )
}
