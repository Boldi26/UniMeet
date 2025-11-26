import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllGroups, createGroup, joinGroup, leaveGroup, type GroupSummaryDto } from '../services/apiService';
import { useAuth } from '../context/AuthContext';

const Groups: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    
    const [groups, setGroups] = useState<GroupSummaryDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    
    // Form state
    const [newGroupName, setNewGroupName] = useState('');
    const [newGroupDescription, setNewGroupDescription] = useState('');
    const [newGroupImageBase64, setNewGroupImageBase64] = useState<string | undefined>(undefined);
    const [newGroupIsPrivate, setNewGroupIsPrivate] = useState(false);

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
            } else {
                await joinGroup(group.id, user.id);
            }
            loadGroups();
        } catch (error) {
            console.error("Hiba a művelet során", error);
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

                            <button 
                                onClick={() => handleJoinToggle(group)}
                                style={{ 
                                    backgroundColor: group.isMember ? '#dc3545' : '#28a745',
                                    color: 'white',
                                    border: 'none',
                                    padding: '10px 20px',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    width: '100%',
                                    fontWeight: 'bold'
                                }}
                            >
                                {group.isMember ? '🚪 Kilépés' : '➕ Csatlakozás'}
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Groups;