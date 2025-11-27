import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { createPost, getFeed, getAllGroups, addInterest, deleteInterest, type GroupSummaryDto } from '../services/apiService';
import type { PostDetailResponse } from '../services/apiService';
import PostItem from './PostItem';
import ReportModal from './ReportModal';

function Feed() {
    const { user, logout, isAdmin } = useAuth();
    const navigate = useNavigate();
    
    // State-ek
    const [posts, setPosts] = useState<PostDetailResponse[]>([]);
    const [userGroups, setUserGroups] = useState<GroupSummaryDto[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    // Report modal state
    const [reportModalOpen, setReportModalOpen] = useState(false);
    const [reportTarget, setReportTarget] = useState<{ type: 'Post' | 'Comment' | 'Group' | 'User'; id: number } | null>(null);
    
    // Új post form state
    const [showCreatePost, setShowCreatePost] = useState(false);
    const [newPostContent, setNewPostContent] = useState('');
    const [commentsEnabled, setCommentsEnabled] = useState(true);
    const [interestEnabled, setInterestEnabled] = useState(true);
    const [imageBase64, setImageBase64] = useState<string | undefined>(undefined);
    const [selectedGroupId, setSelectedGroupId] = useState<number | undefined>(undefined);

    useEffect(() => {
        if (user) {
            loadPosts();
            loadUserGroups();
        }
    }, [user]);

    const loadPosts = async () => {
        if (!user) return;
        
        setLoading(true);
        setError(null);

        try {
            const response = await getFeed(user.id);
            setPosts(response.data);
        } catch (err: any) {
            setError('Nem sikerült betölteni a hírfolyamot.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const loadUserGroups = async () => {
        if (!user) return;
        try {
            const response = await getAllGroups(user.id);
            // Csak azok a csoportok kellenek, amiknek tagja
            setUserGroups(response.data.filter(g => g.isMember));
        } catch (err) {
            console.error('Nem sikerült betölteni a csoportokat:', err);
        }
    };

    // Kép kiválasztása és konvertálása Base64-re
    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImageBase64(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleCreatePost = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !newPostContent.trim()) return;

        try {
            await createPost({
                userId: user.id,
                content: newPostContent,
                commentsEnabled,
                interestEnabled,
                imageUrl: imageBase64,
                groupId: selectedGroupId
            });

            // Form reset
            setNewPostContent('');
            setImageBase64(undefined);
            setSelectedGroupId(undefined);
            setShowCreatePost(false);
            loadPosts();
        } catch (err: any) {
            alert('Hiba történt: ' + (err.response?.data || err.message));
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    // Érdeklődés kezelése
    const handleInterest = async (postId: number) => {
        if (!user) return;
        
        try {
            // TODO: Ellenőrizni kéne, hogy már érdeklődik-e
            await addInterest(postId, { userId: user.id });
            loadPosts();
        } catch (err: any) {
            // Ha már érdeklődik, próbáljuk meg törölni
            try {
                await deleteInterest(postId, user.id);
                loadPosts();
            } catch {
                console.error('Érdeklődés művelet sikertelen:', err);
            }
        }
    };

    return (
        <div className="feed-container" style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
            {/* FEJLÉC NAVIGÁCIÓVAL */}
            <div className="feed-header" style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                marginBottom: '20px',
                padding: '15px',
                backgroundColor: '#2a2a2a',
                borderRadius: '8px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                border: '1px solid #333'
            }}>
                <h1 style={{ margin: 0, color: '#fff' }}>UniMeet</h1>
                <nav style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <button 
                        onClick={() => navigate('/feed')} 
                        style={{ 
                            padding: '8px 16px', 
                            cursor: 'pointer',
                            backgroundColor: '#646cff',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px'
                        }}
                    >
                        🏠 Feed
                    </button>
                    <button 
                        onClick={() => navigate('/groups')} 
                        style={{ 
                            padding: '8px 16px', 
                            cursor: 'pointer',
                            backgroundColor: '#444',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px'
                        }}
                    >
                        👥 Csoportok
                    </button>
                    <button 
                        onClick={() => navigate('/profile')} 
                        style={{ 
                            padding: '8px 16px', 
                            cursor: 'pointer',
                            backgroundColor: '#28a745',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px'
                        }}
                    >
                        👤 Profil
                    </button>
                    {isAdmin && (
                        <button 
                            onClick={() => navigate('/admin')} 
                            style={{ 
                                padding: '8px 16px', 
                                cursor: 'pointer',
                                backgroundColor: '#ff4757',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px'
                            }}
                        >
                            🛡️ Admin
                        </button>
                    )}
                    <span style={{ marginLeft: '10px', color: '#ccc' }}>
                        Szia, <strong style={{ color: '#646cff' }}>{user?.username}</strong>!
                    </span>
                    <button 
                        onClick={handleLogout} 
                        style={{ 
                            padding: '8px 16px', 
                            cursor: 'pointer',
                            backgroundColor: '#dc3545',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px'
                        }}
                    >
                        Kijelentkezés
                    </button>
                </nav>
            </div>

            {/* --- ÚJ POSZT LÉTREHOZÁSA --- */}
            <div className="create-post-section" style={{ marginBottom: '30px' }}>
                {!showCreatePost ? (
                    <button 
                        onClick={() => setShowCreatePost(true)} 
                        style={{ 
                            width: '100%', 
                            padding: '15px', 
                            fontSize: '1.1em', 
                            cursor: 'pointer', 
                            backgroundColor: '#646cff', 
                            color: 'white', 
                            border: 'none', 
                            borderRadius: '8px' 
                        }}
                    >
                        + Mit szeretnél megosztani?
                    </button>
                ) : (
                    <form onSubmit={handleCreatePost} style={{ 
                        border: '1px solid #333', 
                        padding: '20px', 
                        borderRadius: '8px', 
                        backgroundColor: '#2a2a2a' 
                    }}>
                        <textarea
                            value={newPostContent}
                            onChange={(e) => setNewPostContent(e.target.value)}
                            placeholder="Írd ide a bejegyzésed..."
                            rows={4}
                            style={{ 
                                width: '100%', 
                                padding: '10px', 
                                marginBottom: '10px', 
                                borderRadius: '4px', 
                                border: '1px solid #444',
                                backgroundColor: '#333',
                                color: '#fff'
                            }}
                            required
                        />
                        
                        {/* Képfeltöltés Input */}
                        <div style={{ marginBottom: '10px', color: '#ccc' }}>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                📷 Kép csatolása:
                            </label>
                            <input type="file" accept="image/*" onChange={handleImageChange} />
                            {imageBase64 && (
                                <div style={{ marginTop: '10px' }}>
                                    <img 
                                        src={imageBase64} 
                                        alt="Preview" 
                                        style={{ maxWidth: '200px', maxHeight: '150px', borderRadius: '4px' }} 
                                    />
                                    <button 
                                        type="button" 
                                        onClick={() => setImageBase64(undefined)}
                                        style={{ marginLeft: '10px', cursor: 'pointer', backgroundColor: '#444', color: '#fff', border: 'none', padding: '5px 10px', borderRadius: '4px' }}
                                    >
                                        ✕ Eltávolítás
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Csoport választó */}
                        {userGroups.length > 0 && (
                            <div style={{ marginBottom: '10px', color: '#ccc' }}>
                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                    👥 Posztolás helye:
                                </label>
                                <select 
                                    value={selectedGroupId || ''} 
                                    onChange={(e) => setSelectedGroupId(e.target.value ? parseInt(e.target.value) : undefined)}
                                    style={{ padding: '8px', borderRadius: '4px', border: '1px solid #444', width: '100%', backgroundColor: '#333', color: '#fff' }}
                                >
                                    <option value="">🌐 Publikus (mindenki látja)</option>
                                    {userGroups.map(group => (
                                        <option key={group.id} value={group.id}>
                                            👥 {group.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <div className="post-options" style={{ marginBottom: '15px', display: 'flex', gap: '15px', color: '#ccc' }}>
                            <label style={{ cursor: 'pointer' }}>
                                <input 
                                    type="checkbox" 
                                    checked={commentsEnabled}
                                    onChange={(e) => setCommentsEnabled(e.target.checked)}
                                    style={{ marginRight: '5px' }}
                                />
                                💬 Kommentek engedélyezése
                            </label>
                            <label style={{ cursor: 'pointer' }}>
                                <input 
                                    type="checkbox" 
                                    checked={interestEnabled}
                                    onChange={(e) => setInterestEnabled(e.target.checked)}
                                    style={{ marginRight: '5px' }}
                                />
                                👍 Érdeklődés (Based) engedélyezése
                            </label>
                        </div>

                        <div className="form-actions" style={{ display: 'flex', gap: '10px' }}>
                            <button 
                                type="submit" 
                                style={{ 
                                    padding: '10px 25px', 
                                    backgroundColor: '#28a745', 
                                    color: 'white', 
                                    border: 'none', 
                                    borderRadius: '4px', 
                                    cursor: 'pointer',
                                    fontWeight: 'bold'
                                }}
                            >
                                📤 Közzététel
                            </button>
                            <button 
                                type="button" 
                                onClick={() => { 
                                    setShowCreatePost(false); 
                                    setNewPostContent(''); 
                                    setImageBase64(undefined); 
                                    setSelectedGroupId(undefined);
                                }} 
                                style={{ 
                                    padding: '10px 25px', 
                                    backgroundColor: '#444', 
                                    color: 'white', 
                                    border: 'none', 
                                    borderRadius: '4px', 
                                    cursor: 'pointer' 
                                }}
                            >
                                Mégse
                            </button>
                        </div>
                    </form>
                )}
            </div>

            {/* --- POSZTOK LISTÁZÁSA --- */}
            {loading && <p style={{ textAlign: 'center', color: '#ccc' }}>Betöltés...</p>}
            {error && <p style={{ color: '#ff6b6b', textAlign: 'center' }}>{error}</p>}

            <div className="posts-list">
                {posts.length === 0 && !loading && (
                    <p style={{ textAlign: 'center', color: '#888' }}>
                        Még nincsenek bejegyzések. Csatlakozz csoportokhoz vagy írj valamit!
                    </p>
                )}
                
                {posts.map(post => (
                    <PostItem 
                        key={post.postId} 
                        post={post} 
                        onInterest={handleInterest}
                        onOpenComments={(id) => navigate(`/post/${id}`)}
                        onReport={(postId) => {
                            setReportTarget({ type: 'Post', id: postId });
                            setReportModalOpen(true);
                        }}
                    />
                ))}
            </div>

            {/* Report Modal */}
            {reportModalOpen && reportTarget && user && (
                <ReportModal
                    isOpen={reportModalOpen}
                    onClose={() => {
                        setReportModalOpen(false);
                        setReportTarget(null);
                    }}
                    targetType={reportTarget.type}
                    targetId={reportTarget.id}
                    userId={user.id}
                />
            )}
        </div>
    );
}

export default Feed;