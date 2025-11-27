import React from 'react';
import { useNavigate } from 'react-router-dom';
import type { PostDetailResponse } from '../services/apiService';

interface PostItemProps {
    post: PostDetailResponse;
    onInterest: (postId: number) => void;
    onOpenComments?: (postId: number) => void;
    onReport?: (postId: number) => void;
}

const PostItem: React.FC<PostItemProps> = ({ post, onInterest, onOpenComments, onReport }) => {
    const navigate = useNavigate();
    
    // Dátum formázása
    const formattedDate = new Date(post.dateCreated).toLocaleString('hu-HU', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    // Profilkép vagy fallback generálása
    const renderAvatar = () => {
        if (post.authorImageUrl) {
            return (
                <img 
                    src={post.authorImageUrl} 
                    alt={post.authorUsername} 
                    style={{ ...styles.avatar, cursor: 'pointer' }}
                    onClick={() => navigate(`/profile/${post.authorUsername}`)}
                />
            );
        }
        return (
            <div 
                style={{ ...styles.avatarPlaceholder, cursor: 'pointer' }}
                onClick={() => navigate(`/profile/${post.authorUsername}`)}
            >
                {post.authorUsername.charAt(0).toUpperCase()}
            </div>
        );
    };

    return (
        <div className="post-card" style={styles.card}>
            {/* FEJLÉC */}
            <div className="post-header" style={styles.header}>
                {renderAvatar()}
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span 
                        style={{ ...styles.username, cursor: 'pointer' }}
                        onClick={() => navigate(`/profile/${post.authorUsername}`)}
                    >
                        {post.authorUsername}
                        {post.groupName && (
                            <span style={styles.groupTag}> ▶ {post.groupName}</span>
                        )}
                    </span>
                    <span style={styles.date}>{formattedDate}</span>
                </div>
            </div>

            {/* TARTALOM */}
            <div className="post-content" style={styles.content}>
                <p style={{ whiteSpace: 'pre-wrap', margin: '0 0 10px 0' }}>{post.content}</p>
                
                {post.imageUrl && (
                    <div style={styles.imageContainer}>
                        <img 
                            src={post.imageUrl} 
                            alt="Post attachment" 
                            style={styles.postImage} 
                        />
                    </div>
                )}
            </div>

            {/* INTERAKCIÓK */}
            <div className="post-actions" style={styles.actions}>
                {post.interestEnabled ? (
                    <button 
                        onClick={() => onInterest(post.postId)}
                        style={styles.actionButton}
                    >
                        👍 Based ({post.interestedCount})
                    </button>
                ) : (
                    <span style={styles.disabledAction}>
                        🚫 Based letiltva
                    </span>
                )}

                {post.commentsEnabled ? (
                    <button 
                        onClick={() => onOpenComments && onOpenComments(post.postId)}
                        style={styles.actionButton}
                    >
                        💬 Kommentek ({post.commentsCount})
                    </button>
                ) : (
                    <span style={styles.disabledAction}>
                        🔒 Kommentek tiltva
                    </span>
                )}

                {/* Report gomb */}
                {onReport && (
                    <button 
                        onClick={() => onReport(post.postId)}
                        style={{ ...styles.actionButton, marginLeft: 'auto', color: '#ff6b6b' }}
                        title="Poszt jelentése"
                    >
                        🚨 Jelentés
                    </button>
                )}
            </div>
        </div>
    );
};

// CSS Styles - Sötét téma
const styles = {
    card: {
        border: '1px solid #333',
        borderRadius: '8px',
        padding: '16px',
        marginBottom: '16px',
        backgroundColor: '#2a2a2a',
        boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
    },
    header: {
        display: 'flex',
        alignItems: 'center',
        marginBottom: '12px'
    },
    avatar: {
        width: '40px',
        height: '40px',
        borderRadius: '50%',
        marginRight: '12px',
        objectFit: 'cover' as const
    },
    avatarPlaceholder: {
        width: '40px',
        height: '40px',
        borderRadius: '50%',
        backgroundColor: '#646cff',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: '12px',
        fontWeight: 'bold'
    },
    username: {
        fontWeight: 'bold',
        fontSize: '1rem',
        color: '#646cff'
    },
    groupTag: {
        color: '#888',
        fontWeight: 'normal',
        fontSize: '0.9rem',
        marginLeft: '5px'
    },
    date: {
        fontSize: '0.8rem',
        color: '#888'
    },
    content: {
        marginBottom: '12px',
        fontSize: '1rem',
        lineHeight: '1.5',
        color: '#ddd'
    },
    imageContainer: {
        marginTop: '10px',
        textAlign: 'center' as const,
        backgroundColor: '#1a1a1a',
        borderRadius: '8px',
        overflow: 'hidden'
    },
    postImage: {
        maxWidth: '100%',
        maxHeight: '500px',
        display: 'block',
        margin: '0 auto'
    },
    actions: {
        display: 'flex',
        gap: '20px',
        borderTop: '1px solid #444',
        paddingTop: '12px',
        marginTop: '10px'
    },
    actionButton: {
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        color: '#646cff',
        fontWeight: 600,
        display: 'flex',
        alignItems: 'center',
        gap: '5px',
        padding: '5px 10px',
        borderRadius: '4px',
        transition: 'background 0.2s'
    },
    disabledAction: {
        color: '#666',
        display: 'flex',
        alignItems: 'center',
        gap: '5px',
        padding: '5px 10px',
        fontSize: '0.9rem',
        cursor: 'not-allowed'
    }
};

export default PostItem;