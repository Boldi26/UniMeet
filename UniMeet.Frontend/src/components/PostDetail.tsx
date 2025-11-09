import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
    getPostDetails, 
    addComment, 
    addInterest, 
    deleteInterest,
    deletePost,
    deleteComment 
} from '../services/apiService';

interface Comment {
    id: number;
    content: string;
    username: string;
    replies: Comment[];
}

interface PostDetail {
    postId: number;
    content: string;
    authorUsername: string;
    interestedCount: number;
    commentsCount: number;
    comments: Comment[];
}

function PostDetail() {
    const { postId } = useParams<{ postId: string }>();
    const { user } = useAuth();
    const navigate = useNavigate();

    const [post, setPost] = useState<PostDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    const [newComment, setNewComment] = useState('');
    const [replyTo, setReplyTo] = useState<number | null>(null);
    const [isInterested, setIsInterested] = useState(false);

    useEffect(() => {
        loadPost();
    }, [postId]);

    const loadPost = async () => {
        if (!postId) return;
        
        setLoading(true);
        setError(null);

        try {
            const response = await getPostDetails(parseInt(postId));
            setPost(response.data);
        } catch (err: any) {
            setError('Nem sikerült betölteni a bejegyzést');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleAddComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !postId || !newComment.trim()) return;

        try {
            await addComment(parseInt(postId), {
                userId: user.id,
                content: newComment,
                parentCommentId: replyTo || undefined
            });

            setNewComment('');
            setReplyTo(null);
            loadPost(); // Újratöltjük a post-ot
        } catch (err: any) {
            alert('Nem sikerült hozzáadni a kommentet: ' + (err.response?.data || err.message));
        }
    };

    const handleToggleInterest = async () => {
        if (!user || !postId) return;

        try {
            if (isInterested) {
                await deleteInterest(parseInt(postId), user.id);
                setIsInterested(false);
            } else {
                await addInterest(parseInt(postId), { userId: user.id });
                setIsInterested(true);
            }
            loadPost(); // Újratöltjük a post-ot
        } catch (err: any) {
            alert('Művelet sikertelen: ' + (err.response?.data || err.message));
        }
    };

    const handleDeletePost = async () => {
        if (!postId || !window.confirm('Biztosan törölni szeretnéd ezt a bejegyzést?')) return;

        try {
            await deletePost(parseInt(postId));
            navigate('/feed');
        } catch (err: any) {
            alert('Nem sikerült törölni a bejegyzést: ' + (err.response?.data || err.message));
        }
    };

    const handleDeleteComment = async (commentId: number) => {
        if (!window.confirm('Biztosan törölni szeretnéd ezt a kommentet?')) return;

        try {
            await deleteComment(commentId);
            loadPost();
        } catch (err: any) {
            alert('Nem sikerült törölni a kommentet: ' + (err.response?.data || err.message));
        }
    };

    const renderComments = (comments: Comment[], level: number = 0) => {
        return comments.map(comment => (
            <div key={comment.id} className="comment" style={{ marginLeft: `${level * 20}px` }}>
                <div className="comment-header">
                    <strong>{comment.username}</strong>
                    <div className="comment-actions">
                        <button 
                            onClick={() => setReplyTo(comment.id)} 
                            className="btn-link"
                        >
                            Válasz
                        </button>
                        {user?.username === comment.username && (
                            <button 
                                onClick={() => handleDeleteComment(comment.id)} 
                                className="btn-link delete"
                            >
                                Törlés
                            </button>
                        )}
                    </div>
                </div>
                <p className="comment-content">{comment.content}</p>
                {comment.replies && comment.replies.length > 0 && renderComments(comment.replies, level + 1)}
            </div>
        ));
    };

    if (loading) return <div className="container">Betöltés...</div>;
    if (error) return <div className="container error-message">{error}</div>;
    if (!post) return <div className="container">Bejegyzés nem található</div>;

    return (
        <div className="post-detail-container">
            <button onClick={() => navigate('/feed')} className="btn-secondary back-button">
                ← Vissza a feedhez
            </button>

            <div className="post-detail">
                <div className="post-header">
                    <h2>{post.authorUsername}</h2>
                    {user?.username === post.authorUsername && (
                        <button onClick={handleDeletePost} className="btn-danger">
                            Törlés
                        </button>
                    )}
                </div>

                <div className="post-content">
                    <p>{post.content}</p>
                </div>

                <div className="post-stats">
                    <button 
                        onClick={handleToggleInterest} 
                        className={`btn-interest ${isInterested ? 'active' : ''}`}
                    >
                        ⭐ {isInterested ? 'Érdekel' : 'Érdekelne'} ({post.interestedCount})
                    </button>
                    <span>💬 {post.commentsCount} komment</span>
                </div>

                <div className="comments-section">
                    <h3>Kommentek</h3>

                    <form onSubmit={handleAddComment} className="comment-form">
                        {replyTo && (
                            <div className="reply-indicator">
                                Válasz kommentre #{replyTo}
                                <button 
                                    type="button" 
                                    onClick={() => setReplyTo(null)}
                                    className="btn-link"
                                >
                                    ✕
                                </button>
                            </div>
                        )}
                        <textarea
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder="Írj egy kommentet..."
                            rows={3}
                            required
                        />
                        <button type="submit" className="btn-primary">
                            Küldés
                        </button>
                    </form>

                    <div className="comments-list">
                        {post.comments.length === 0 ? (
                            <p className="no-comments">Még nincsenek kommentek</p>
                        ) : (
                            renderComments(post.comments)
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default PostDetail;
