import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { createPost, getPostsByDomain, getPostDetails } from '../services/apiService';

interface PostSummary {
    id: number;
    content: string;
    authorUsername: string;
    interestedCount: number;
    commentsCount: number;
}

function Feed() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [posts, setPosts] = useState<PostSummary[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    // Új post létrehozása
    const [showCreatePost, setShowCreatePost] = useState(false);
    const [newPostContent, setNewPostContent] = useState('');
    const [commentsEnabled, setCommentsEnabled] = useState(true);
    const [interestEnabled, setInterestEnabled] = useState(true);

    useEffect(() => {
        loadPosts();
    }, [user]);

    const loadPosts = async () => {
        if (!user) return;
        
        setLoading(true);
        setError(null);

        try {
            // Kinyerjük a domain-t az email-ből
            const emailDomain = user.username; // Ha csak username-t tárolunk, akkor domain-t másképp kell meghatározni
            // Inkább tároljuk el az email-t is az AuthContext-ben, vagy használjunk egy másik endpoint-ot
            
            // Egyenlőre minden post-ot betöltünk domain alapján (módosíthatod ha van más endpoint)
            // Mivel nincs "get all posts" endpoint, egy domain-t kell megadni
            // Ehhez kellene email a user objektumban
            
            // Példa: ha van "uni.hu" domain
            const domain = "student.uni-pannon.hu"; // ⚠️ Az adatbázisban engedélyezett domain
            // Vagy: student.uni-elte.hu, student.uni-bme.hu, student.uni-bge.hu
            const postIds = await getPostsByDomain(domain);
            
            // Betöltjük az összes post részleteit
            const postDetails = await Promise.all(
                postIds.data.map(id => getPostDetails(id))
            );

            const postSummaries: PostSummary[] = postDetails.map(response => ({
                id: response.data.postId,
                content: response.data.content,
                authorUsername: response.data.authorUsername,
                interestedCount: response.data.interestedCount,
                commentsCount: response.data.commentsCount
            }));

            setPosts(postSummaries);
        } catch (err: any) {
            setError('Nem sikerült betölteni a postokat');
            console.error(err);
        } finally {
            setLoading(false);
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
                interestEnabled
            });

            setNewPostContent('');
            setShowCreatePost(false);
            loadPosts(); // Újratöltjük a post listát
        } catch (err: any) {
            alert('Nem sikerült létrehozni a postot: ' + (err.response?.data || err.message));
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="feed-container">
            <div className="feed-header">
                <h1>UniMeet Feed</h1>
                <div className="user-info">
                    <span>Bejelentkezve: <strong>{user?.username}</strong></span>
                    <button onClick={handleLogout} className="btn-secondary">Kijelentkezés</button>
                </div>
            </div>

            <div className="create-post-section">
                {!showCreatePost ? (
                    <button onClick={() => setShowCreatePost(true)} className="btn-primary">
                        + Új bejegyzés
                    </button>
                ) : (
                    <form onSubmit={handleCreatePost} className="create-post-form">
                        <textarea
                            value={newPostContent}
                            onChange={(e) => setNewPostContent(e.target.value)}
                            placeholder="Mit szeretnél megosztani?"
                            rows={4}
                            required
                        />
                        <div className="post-options">
                            <label>
                                <input 
                                    type="checkbox" 
                                    checked={commentsEnabled}
                                    onChange={(e) => setCommentsEnabled(e.target.checked)}
                                />
                                Kommentek engedélyezése
                            </label>
                            <label>
                                <input 
                                    type="checkbox" 
                                    checked={interestEnabled}
                                    onChange={(e) => setInterestEnabled(e.target.checked)}
                                />
                                Érdeklődés engedélyezése
                            </label>
                        </div>
                        <div className="form-actions">
                            <button type="submit" className="btn-primary">Közzététel</button>
                            <button 
                                type="button" 
                                onClick={() => setShowCreatePost(false)} 
                                className="btn-secondary"
                            >
                                Mégse
                            </button>
                        </div>
                    </form>
                )}
            </div>

            {loading && <p>Betöltés...</p>}
            {error && <p className="error-message">{error}</p>}

            <div className="posts-list">
                {posts.length === 0 && !loading && (
                    <p className="no-posts">Még nincsenek bejegyzések</p>
                )}
                {posts.map(post => (
                    <div 
                        key={post.id} 
                        className="post-card"
                        onClick={() => navigate(`/post/${post.id}`)}
                    >
                        <div className="post-header">
                            <strong>{post.authorUsername}</strong>
                        </div>
                        <div className="post-content">
                            <p>{post.content}</p>
                        </div>
                        <div className="post-footer">
                            <span>💬 {post.commentsCount} komment</span>
                            <span>⭐ {post.interestedCount} érdeklődő</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default Feed;
