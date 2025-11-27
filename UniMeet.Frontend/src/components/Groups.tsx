import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    getAllGroups, 
    createGroup, 
    joinGroup, 
    leaveGroup, 
    getGroupMembers,
    kickGroupMember,
    getGroupPosts,
    deleteGroupPost,
    getJoinRequests,
    handleJoinRequest,
    type GroupSummaryDto,
    type GroupMemberDto,
    type JoinRequestDto
} from '../services/apiService';
import { useAuth } from '../context/AuthContext';
import ReportModal from './ReportModal';

interface GroupPost {
    id: number;
    content: string;
    authorUsername: string;
    dateCreated: string;
}

const Groups: React.FC = () => {
    const { user, isAdmin } = useAuth();
    const navigate = useNavigate();
    
    const [groups, setGroups] = useState<GroupSummaryDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    
    // Form state
    const [newGroupName, setNewGroupName] = useState('');
    const [newGroupDescription, setNewGroupDescription] = useState('');
    const [newGroupImageBase64, setNewGroupImageBase64] = useState<string | undefined>(undefined);
    const [newGroupIsPrivate, setNewGroupIsPrivate] = useState(false);

    // Moderation state
    const [moderatingGroup, setModeratingGroup] = useState<GroupSummaryDto | null>(null);
    const [groupMembers, setGroupMembers] = useState<GroupMemberDto[]>([]);
    const [groupPosts, setGroupPosts] = useState<GroupPost[]>([]);
    const [joinRequests, setJoinRequests] = useState<JoinRequestDto[]>([]);
    const [moderationTab, setModerationTab] = useState<'members' | 'posts' | 'requests'>('members');

    // Report modal state
    const [reportModalOpen, setReportModalOpen] = useState(false);
    const [reportGroupId, setReportGroupId] = useState<number | null>(null);

    useEffect(() => {
        if (user) loadGroups();
    }, [user]);

    const loadGroups = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const response = await getAllGroups(user.id);
            setGroups(response.data);
        } catch (error) {
            console.error("Nem sikerült betölteni a csoportokat", error);
        } finally {
            setLoading(false);
        }
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setNewGroupImageBase64(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleCreate = async () => {
        if (!user || !newGroupName.trim()) return;
        try {
            await createGroup({
                name: newGroupName,
                description: newGroupDescription || undefined,
                creatorUserId: user.id,
                isPrivate: newGroupIsPrivate,
                imageUrl: newGroupImageBase64
            });
            
            // Form reset
            setNewGroupName('');
            setNewGroupDescription('');
            setNewGroupImageBase64(undefined);
            setNewGroupIsPrivate(false);
            setShowCreate(false);
            loadGroups();
        } catch (error) {
            alert("Hiba a csoport létrehozásakor");
        }
    };

    const handleJoinToggle = async (group: GroupSummaryDto) => {
        if (!user) return;
        try {
            if (group.isMember) {
                await leaveGroup(group.id, user.id);
                loadGroups();
            } else if (group.hasPendingRequest) {
                // Ha van függő kérelem, ne csináljon semmit (vagy visszavonás)
                alert('Már van függőben lévő csatlakozási kérelmed ehhez a csoporthoz.');
            } else {
                const response = await joinGroup(group.id, user.id);
                if (response.data.isPending) {
                    alert('Csatlakozási kérelem elküldve! Várd meg a tulajdonos jóváhagyását.');
                }
                loadGroups();
            }
        } catch (error: any) {
            alert(error.response?.data || "Hiba a művelet során");
        }
    };

    // Moderálás megnyitása
    const openModeration = async (group: GroupSummaryDto) => {
        if (!user) return;
        setModeratingGroup(group);
        setModerationTab(group.isPrivate && group.pendingRequestsCount > 0 ? 'requests' : 'members');
        
        try {
            const membersRes = await getGroupMembers(group.id, user.id);
            setGroupMembers(membersRes.data);
            
            const postsRes = await getGroupPosts(group.id, user.id);
            setGroupPosts(postsRes.data);

            // Privát csoport esetén kérelmek betöltése
            if (group.isPrivate) {
                const requestsRes = await getJoinRequests(group.id, user.id);
                setJoinRequests(requestsRes.data);
            }
        } catch (error) {
            console.error("Hiba a moderálási adatok betöltésekor", error);
        }
    };

    const handleKickMember = async (memberId: number) => {
        if (!user || !moderatingGroup) return;
        if (!window.confirm('Biztosan ki szeretnéd rúgni ezt a tagot?')) return;
        
        try {
            await kickGroupMember(moderatingGroup.id, memberId, user.id);
            const membersRes = await getGroupMembers(moderatingGroup.id, user.id);
            setGroupMembers(membersRes.data);
            loadGroups();
        } catch (error) {
            alert('Hiba a tag eltávolításakor');
        }
    };

    const handleDeleteGroupPost = async (postId: number) => {
        if (!user || !moderatingGroup) return;
        if (!window.confirm('Biztosan törölni szeretnéd ezt a posztot?')) return;
        
        try {
            await deleteGroupPost(moderatingGroup.id, postId, user.id);
            const postsRes = await getGroupPosts(moderatingGroup.id, user.id);
            setGroupPosts(postsRes.data);
        } catch (error) {
            alert('Hiba a poszt törlésekor');
        }
    };

    // Csatlakozási kérelem kezelése
    const handleJoinRequestAction = async (requestId: number, approve: boolean) => {
        if (!user || !moderatingGroup) return;
        
        try {
            await handleJoinRequest(moderatingGroup.id, requestId, user.id, approve);
            // Frissítjük a kérelmeket
            const requestsRes = await getJoinRequests(moderatingGroup.id, user.id);
            setJoinRequests(requestsRes.data);
            // Ha jóváhagytuk, frissítjük a tagokat is
            if (approve) {
                const membersRes = await getGroupMembers(moderatingGroup.id, user.id);
                setGroupMembers(membersRes.data);
            }
            loadGroups();
        } catch (error) {
            alert('Hiba a kérelem kezelésekor');
        }
    };

    return (
        <div style={{ padding: '20px', maxWidth: '900px', margin: '0 auto' }}>
            {/* Navigáció */}
            <div style={{ 
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
                <h1 style={{ margin: 0, color: '#fff' }}>👥 Csoportok</h1>
                <nav style={{ display: 'flex', gap: '10px' }}>
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
                </nav>
            </div>

            {/* Csoport létrehozás */}
            <div style={{ marginBottom: '30px' }}>
                {!showCreate ? (
                    <button 
                        onClick={() => setShowCreate(true)} 
                        style={{ 
                            width: '100%',
                            padding: '15px',
                            fontSize: '1.1em',
                            cursor: 'pointer',
                            backgroundColor: '#28a745',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px'
                        }}
                    >
                        + Új Csoport Létrehozása
                    </button>
                ) : (
                    <div style={{ 
                        padding: '20px', 
                        border: '1px solid #333', 
                        borderRadius: '8px',
                        backgroundColor: '#2a2a2a'
                    }}>
                        <h3 style={{ marginTop: 0, color: '#fff' }}>Új csoport létrehozása</h3>
                        
                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#ccc' }}>
                                Csoport neve: *
                            </label>
                            <input 
                                type="text" 
                                placeholder="pl. Programozók csoportja" 
                                value={newGroupName} 
                                onChange={e => setNewGroupName(e.target.value)}
                                style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #444', backgroundColor: '#333', color: '#fff' }}
                            />
                        </div>

                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#ccc' }}>
                                Leírás:
                            </label>
                            <textarea 
                                placeholder="Rövid leírás a csoportról..." 
                                value={newGroupDescription} 
                                onChange={e => setNewGroupDescription(e.target.value)}
                                rows={3}
                                style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #444', backgroundColor: '#333', color: '#fff' }}
                            />
                        </div>

                        <div style={{ marginBottom: '15px', color: '#ccc' }}>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                Csoport képe:
                            </label>
                            <input type="file" accept="image/*" onChange={handleImageChange} />
                            {newGroupImageBase64 && (
                                <img 
                                    src={newGroupImageBase64} 
                                    alt="Preview" 
                                    style={{ width: '80px', height: '80px', marginTop: '10px', borderRadius: '8px', objectFit: 'cover' }} 
                                />
                            )}
                        </div>

                        <div style={{ marginBottom: '15px', color: '#ccc' }}>
                            <label style={{ cursor: 'pointer' }}>
                                <input 
                                    type="checkbox" 
                                    checked={newGroupIsPrivate}
                                    onChange={e => setNewGroupIsPrivate(e.target.checked)}
                                    style={{ marginRight: '8px' }}
                                />
                                🔒 Privát csoport (csak meghívással lehet csatlakozni)
                            </label>
                        </div>

                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button 
                                onClick={handleCreate}
                                disabled={!newGroupName.trim()}
                                style={{ 
                                    padding: '10px 20px',
                                    backgroundColor: newGroupName.trim() ? '#28a745' : '#555',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: newGroupName.trim() ? 'pointer' : 'not-allowed'
                                }}
                            >
                                ✓ Létrehozás
                            </button>
                            <button 
                                onClick={() => {
                                    setShowCreate(false);
                                    setNewGroupName('');
                                    setNewGroupDescription('');
                                    setNewGroupImageBase64(undefined);
                                    setNewGroupIsPrivate(false);
                                }}
                                style={{ 
                                    padding: '10px 20px',
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
                    </div>
                )}
            </div>

            {/* Csoportok listája */}
            {loading ? (
                <p style={{ textAlign: 'center', color: '#ccc' }}>Betöltés...</p>
            ) : groups.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#888' }}>
                    Még nincsenek csoportok. Hozz létre egyet!
                </p>
            ) : (
                <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
                    gap: '20px' 
                }}>
                    {groups.map(group => (
                        <div 
                            key={group.id} 
                            style={{ 
                                border: '1px solid #333', 
                                borderRadius: '12px', 
                                padding: '20px', 
                                textAlign: 'center',
                                backgroundColor: group.isMember ? '#1e3a5f' : '#2a2a2a',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
                            }}
                        >
                            {/* Csoport kép */}
                            {group.imageUrl ? (
                                <img 
                                    src={group.imageUrl} 
                                    alt={group.name} 
                                    style={{ 
                                        width: '80px', 
                                        height: '80px', 
                                        borderRadius: '50%', 
                                        objectFit: 'cover',
                                        marginBottom: '10px'
                                    }} 
                                />
                            ) : (
                                <div style={{ 
                                    width: '80px', 
                                    height: '80px', 
                                    borderRadius: '50%', 
                                    backgroundColor: '#646cff',
                                    color: 'white',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    margin: '0 auto 10px',
                                    fontSize: '2em',
                                    fontWeight: 'bold'
                                }}>
                                    {group.name.charAt(0).toUpperCase()}
                                </div>
                            )}

                            <div style={{ fontWeight: 'bold', fontSize: '1.2em', marginBottom: '5px', color: '#fff' }}>
                                {group.name}
                                {group.isPrivate && <span style={{ marginLeft: '5px' }}>🔒</span>}
                            </div>
                            
                            {group.description && (
                                <div style={{ 
                                    color: '#aaa', 
                                    fontSize: '0.9em', 
                                    marginBottom: '10px',
                                    fontStyle: 'italic'
                                }}>
                                    {group.description}
                                </div>
                            )}
                            
                            <div style={{ color: '#888', marginBottom: '15px' }}>
                                👥 {group.membersCount} tag
                                {group.isOwner && group.pendingRequestsCount > 0 && (
                                    <span style={{ color: '#ff9800', marginLeft: '10px' }}>
                                        📨 {group.pendingRequestsCount} kérelem
                                    </span>
                                )}
                            </div>

                            {group.isMember && (
                                <div style={{ 
                                    color: '#4ade80', 
                                    fontSize: '0.9em', 
                                    marginBottom: '10px' 
                                }}>
                                    ✓ Tag vagy
                                </div>
                            )}

                            {group.hasPendingRequest && !group.isMember && (
                                <div style={{ 
                                    color: '#ff9800', 
                                    fontSize: '0.9em', 
                                    marginBottom: '10px' 
                                }}>
                                    ⏳ Kérelem elküldve
                                </div>
                            )}

                            <button 
                                onClick={() => handleJoinToggle(group)}
                                disabled={group.hasPendingRequest && !group.isMember}
                                style={{ 
                                    backgroundColor: group.isMember 
                                        ? '#dc3545' 
                                        : group.hasPendingRequest 
                                            ? '#666' 
                                            : group.isPrivate 
                                                ? '#ff9800' 
                                                : '#28a745',
                                    color: 'white',
                                    border: 'none',
                                    padding: '10px 20px',
                                    borderRadius: '6px',
                                    cursor: group.hasPendingRequest && !group.isMember ? 'not-allowed' : 'pointer',
                                    width: '100%',
                                    fontWeight: 'bold',
                                    marginBottom: '10px'
                                }}
                            >
                                {group.isMember 
                                    ? '🚪 Kilépés' 
                                    : group.hasPendingRequest 
                                        ? '⏳ Várakozás...' 
                                        : group.isPrivate 
                                            ? '🔐 Csatlakozási kérelem' 
                                            : '➕ Csatlakozás'}
                            </button>

                            {/* Moderálás gomb tulajdonosoknak */}
                            {group.isOwner && (
                                <button 
                                    onClick={() => openModeration(group)}
                                    style={{ 
                                        backgroundColor: group.pendingRequestsCount > 0 ? '#ff4757' : '#ff9800',
                                        color: 'white',
                                        border: 'none',
                                        padding: '10px 20px',
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                        width: '100%',
                                        fontWeight: 'bold',
                                        marginBottom: '10px'
                                    }}
                                >
                                    ⚙️ Moderálás {group.pendingRequestsCount > 0 && `(${group.pendingRequestsCount})`}
                                </button>
                            )}

                            {/* Report gomb (nem saját csoport) */}
                            {!group.isOwner && (
                                <button 
                                    onClick={() => {
                                        setReportGroupId(group.id);
                                        setReportModalOpen(true);
                                    }}
                                    style={{ 
                                        backgroundColor: 'transparent',
                                        color: '#ff6b6b',
                                        border: '1px solid #ff6b6b',
                                        padding: '8px 16px',
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                        width: '100%',
                                        fontSize: '0.9em'
                                    }}
                                >
                                    🚨 Jelentés
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Moderálási modal */}
            {moderatingGroup && (
                <div style={{
                    position: 'fixed',
                    top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.7)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000
                }}>
                    <div style={{
                        backgroundColor: '#2a2a2a',
                        borderRadius: '12px',
                        padding: '20px',
                        width: '90%',
                        maxWidth: '600px',
                        maxHeight: '80vh',
                        overflow: 'auto',
                        border: '1px solid #333'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h2 style={{ margin: 0, color: '#fff' }}>⚙️ {moderatingGroup.name} - Moderálás</h2>
                            <button 
                                onClick={() => setModeratingGroup(null)}
                                style={{ background: 'none', border: 'none', color: '#fff', fontSize: '1.5em', cursor: 'pointer' }}
                            >
                                ✕
                            </button>
                        </div>

                        {/* Tab váltó */}
                        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                            <button 
                                onClick={() => setModerationTab('members')}
                                style={{ 
                                    flex: 1,
                                    padding: '10px',
                                    backgroundColor: moderationTab === 'members' ? '#646cff' : '#444',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer'
                                }}
                            >
                                👥 Tagok ({groupMembers.length})
                            </button>
                            <button 
                                onClick={() => setModerationTab('posts')}
                                style={{ 
                                    flex: 1,
                                    padding: '10px',
                                    backgroundColor: moderationTab === 'posts' ? '#646cff' : '#444',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer'
                                }}
                            >
                                📝 Posztok ({groupPosts.length})
                            </button>
                            {moderatingGroup.isPrivate && (
                                <button 
                                    onClick={() => setModerationTab('requests')}
                                    style={{ 
                                        flex: 1,
                                        padding: '10px',
                                        backgroundColor: moderationTab === 'requests' ? '#646cff' : joinRequests.length > 0 ? '#ff4757' : '#444',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '4px',
                                        cursor: 'pointer'
                                    }}
                                >
                                    📨 Kérelmek ({joinRequests.length})
                                </button>
                            )}
                        </div>

                        {/* Tagok lista */}
                        {moderationTab === 'members' && (
                            <div>
                                {groupMembers.length === 0 ? (
                                    <p style={{ color: '#888', textAlign: 'center' }}>Nincsenek tagok</p>
                                ) : (
                                    groupMembers.map(member => (
                                        <div key={member.userId} style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            padding: '10px',
                                            borderBottom: '1px solid #444'
                                        }}>
                                            <div>
                                                <strong style={{ color: '#fff' }}>{member.username}</strong>
                                                {member.isCreator && <span style={{ color: '#ffd700', marginLeft: '10px' }}>👑 Tulajdonos</span>}
                                                <div style={{ fontSize: '0.8em', color: '#888' }}>
                                                    Csatlakozott: {new Date(member.dateJoined).toLocaleDateString('hu-HU')}
                                                </div>
                                            </div>
                                            {!member.isCreator && (
                                                <button 
                                                    onClick={() => handleKickMember(member.userId)}
                                                    style={{
                                                        backgroundColor: '#dc3545',
                                                        color: 'white',
                                                        border: 'none',
                                                        padding: '5px 10px',
                                                        borderRadius: '4px',
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    🚪 Kirúgás
                                                </button>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        )}

                        {/* Posztok lista */}
                        {moderationTab === 'posts' && (
                            <div>
                                {groupPosts.length === 0 ? (
                                    <p style={{ color: '#888', textAlign: 'center' }}>Nincsenek posztok</p>
                                ) : (
                                    groupPosts.map(post => (
                                        <div key={post.id} style={{
                                            padding: '10px',
                                            borderBottom: '1px solid #444',
                                            marginBottom: '10px'
                                        }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                <div style={{ flex: 1 }}>
                                                    <strong style={{ color: '#646cff' }}>{post.authorUsername}</strong>
                                                    <span style={{ color: '#888', marginLeft: '10px', fontSize: '0.8em' }}>
                                                        {new Date(post.dateCreated).toLocaleString('hu-HU')}
                                                    </span>
                                                    <p style={{ color: '#ddd', margin: '5px 0' }}>
                                                        {post.content.length > 100 ? post.content.substring(0, 100) + '...' : post.content}
                                                    </p>
                                                </div>
                                                <button 
                                                    onClick={() => handleDeleteGroupPost(post.id)}
                                                    style={{
                                                        backgroundColor: '#dc3545',
                                                        color: 'white',
                                                        border: 'none',
                                                        padding: '5px 10px',
                                                        borderRadius: '4px',
                                                        cursor: 'pointer',
                                                        marginLeft: '10px'
                                                    }}
                                                >
                                                    🗑️ Törlés
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}

                        {/* Csatlakozási kérelmek lista */}
                        {moderationTab === 'requests' && (
                            <div>
                                {joinRequests.length === 0 ? (
                                    <p style={{ color: '#888', textAlign: 'center' }}>Nincsenek függőben lévő kérelmek</p>
                                ) : (
                                    joinRequests.map(request => (
                                        <div key={request.id} style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            padding: '15px',
                                            borderBottom: '1px solid #444',
                                            backgroundColor: '#333',
                                            borderRadius: '8px',
                                            marginBottom: '10px'
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                {request.profileImageUrl ? (
                                                    <img 
                                                        src={request.profileImageUrl} 
                                                        alt={request.username}
                                                        style={{ width: '45px', height: '45px', borderRadius: '50%', objectFit: 'cover' }}
                                                    />
                                                ) : (
                                                    <div style={{
                                                        width: '45px', height: '45px', borderRadius: '50%',
                                                        backgroundColor: '#646cff', color: 'white',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        fontWeight: 'bold', fontSize: '1.2em'
                                                    }}>
                                                        {request.username.charAt(0).toUpperCase()}
                                                    </div>
                                                )}
                                                <div>
                                                    <strong style={{ color: '#fff' }}>{request.username}</strong>
                                                    <div style={{ fontSize: '0.8em', color: '#888' }}>
                                                        Kérelem: {new Date(request.dateRequested).toLocaleDateString('hu-HU')}
                                                    </div>
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <button 
                                                    onClick={() => handleJoinRequestAction(request.id, true)}
                                                    style={{
                                                        backgroundColor: '#28a745',
                                                        color: 'white',
                                                        border: 'none',
                                                        padding: '8px 16px',
                                                        borderRadius: '4px',
                                                        cursor: 'pointer',
                                                        fontWeight: 'bold'
                                                    }}
                                                >
                                                    ✓ Elfogad
                                                </button>
                                                <button 
                                                    onClick={() => handleJoinRequestAction(request.id, false)}
                                                    style={{
                                                        backgroundColor: '#dc3545',
                                                        color: 'white',
                                                        border: 'none',
                                                        padding: '8px 16px',
                                                        borderRadius: '4px',
                                                        cursor: 'pointer',
                                                        fontWeight: 'bold'
                                                    }}
                                                >
                                                    ✕ Elutasít
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Report Modal */}
            {reportModalOpen && reportGroupId && user && (
                <ReportModal
                    isOpen={reportModalOpen}
                    onClose={() => {
                        setReportModalOpen(false);
                        setReportGroupId(null);
                    }}
                    targetType="Group"
                    targetId={reportGroupId}
                    userId={user.id}
                />
            )}
        </div>
    );
};

export default Groups;