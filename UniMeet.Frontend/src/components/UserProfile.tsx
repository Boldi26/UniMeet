import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getProfile, updateProfile, deleteProfile, type UserProfileResponse } from '../services/apiService';
import { useAuth } from '../context/AuthContext';

const UserProfile: React.FC = () => {
    const { username } = useParams<{ username?: string }>();
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    
    const [profile, setProfile] = useState<UserProfileResponse | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    // Form state
    const [faculty, setFaculty] = useState('');
    const [major, setMajor] = useState('');
    const [bio, setBio] = useState('');
    const [imageBase64, setImageBase64] = useState<string | undefined>(undefined);

    useEffect(() => {
        loadProfile();
    }, [user, username]);

    const loadProfile = async () => {
        if (!user) return;
        
        setLoading(true);
        setError(null);
        
        try {
            // Ha van username param, más profilját nézzük, különben a sajátunkat
            let targetUserId = user.id;
            
            if (username && username !== user.username) {
                // Más felhasználó profiljának lekérése username alapján
                const res = await getProfile(0, user.id, username);
                setProfile(res.data);
                setFaculty(res.data.faculty || '');
                setMajor(res.data.major || '');
                setBio(res.data.bio || '');
            } else {
                // Saját profil lekérése
                const res = await getProfile(user.id, user.id);
                setProfile(res.data);
                setFaculty(res.data.faculty || '');
                setMajor(res.data.major || '');
                setBio(res.data.bio || '');
            }
        } catch (err: any) {
            setError('Nem sikerült betölteni a profilt.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

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

    const handleSave = async () => {
        if (!user || !profile?.isOwnProfile) return;
        try {
            await updateProfile(user.id, {
                faculty,
                major,
                bio,
                profileImageUrl: imageBase64
            });
            setIsEditing(false);
            setImageBase64(undefined);
            loadProfile();
        } catch (err) {
            alert("Hiba a mentés során");
        }
    };

    const handleDeleteAccount = async () => {
        if (!user) return;
        
        const confirmed = window.confirm(
            '⚠️ FIGYELEM!\n\n' +
            'Biztosan törölni szeretnéd a fiókodat?\n\n' +
            'Ez a művelet NEM visszavonható!\n' +
            'Minden posztod, kommented és adatod véglegesen törlődik.'
        );
        
        if (!confirmed) return;
        
        const doubleCheck = window.confirm(
            'Utolsó megerősítés:\n\nTényleg törölni szeretnéd a fiókodat?'
        );
        
        if (!doubleCheck) return;
        
        try {
            await deleteProfile(user.id);
            alert('Fiókod sikeresen törölve lett. Viszlát!');
            logout();
            navigate('/login');
        } catch (err: any) {
            alert('Hiba történt a fiók törlése közben: ' + (err.response?.data?.message || err.message));
        }
    };

    if (loading) return <div style={{ padding: '20px', textAlign: 'center', color: '#ccc' }}>Betöltés...</div>;
    if (error) return <div style={{ padding: '20px', textAlign: 'center', color: '#ff6b6b' }}>{error}</div>;
    if (!profile) return <div style={{ padding: '20px', textAlign: 'center', color: '#ccc' }}>Profil nem található</div>;

    const isOwnProfile = profile.isOwnProfile;

    return (
        <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
            {/* Vissza gomb */}
            <button 
                onClick={() => navigate('/feed')} 
                style={{ 
                    marginBottom: '20px', 
                    padding: '8px 16px', 
                    cursor: 'pointer',
                    backgroundColor: '#444',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '4px'
                }}
            >
                ← Vissza
            </button>

            <div style={{ 
                border: '1px solid #333', 
                borderRadius: '8px', 
                padding: '20px',
                backgroundColor: '#2a2a2a',
                boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
            }}>
                {/* Profil fejléc */}
                <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                    {profile.profileImageUrl ? (
                        <img 
                            src={profile.profileImageUrl} 
                            alt="Profile" 
                            style={{ 
                                width: '120px', 
                                height: '120px', 
                                borderRadius: '50%', 
                                objectFit: 'cover',
                                border: '3px solid #646cff'
                            }} 
                        />
                    ) : (
                        <div style={{ 
                            width: '120px', 
                            height: '120px', 
                            borderRadius: '50%', 
                            background: '#646cff', 
                            margin: '0 auto',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontSize: '3em',
                            fontWeight: 'bold'
                        }}>
                            {profile.username.charAt(0).toUpperCase()}
                        </div>
                    )}
                    <h2 style={{ marginTop: '15px', marginBottom: '5px', color: '#fff' }}>{profile.username}</h2>
                    <p style={{ color: '#aaa', margin: 0 }}>{profile.email}</p>
                    {profile.dateCreated && (
                        <p style={{ color: '#888', fontSize: '0.85em', marginTop: '5px' }}>
                            Csatlakozott: {new Date(profile.dateCreated).toLocaleDateString('hu-HU')}
                        </p>
                    )}
                </div>

                {/* Profil szerkesztés */}
                {isEditing && isOwnProfile ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#ccc' }}>
                                Profilkép feltöltés:
                            </label>
                            <input type="file" accept="image/*" onChange={handleImageChange} />
                            {imageBase64 && (
                                <div style={{ marginTop: '10px' }}>
                                    <img src={imageBase64} alt="Preview" style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover' }} />
                                </div>
                            )}
                        </div>
                        
                        <div>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#ccc' }}>Kar:</label>
                            <input 
                                placeholder="pl. Informatikai Kar" 
                                value={faculty} 
                                onChange={e => setFaculty(e.target.value)}
                                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #444', backgroundColor: '#333', color: '#fff' }}
                            />
                        </div>
                        
                        <div>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#ccc' }}>Szak:</label>
                            <input 
                                placeholder="pl. Programtervező informatikus" 
                                value={major} 
                                onChange={e => setMajor(e.target.value)}
                                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #444', backgroundColor: '#333', color: '#fff' }}
                            />
                        </div>
                        
                        <div>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#ccc' }}>Bemutatkozás:</label>
                            <textarea 
                                placeholder="Írj magadról néhány szót..." 
                                value={bio} 
                                onChange={e => setBio(e.target.value)} 
                                rows={4}
                                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #444', backgroundColor: '#333', color: '#fff' }}
                            />
                        </div>
                        
                        <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                            <button 
                                onClick={handleSave} 
                                style={{ 
                                    flex: 1, 
                                    backgroundColor: '#28a745', 
                                    color: 'white', 
                                    border: 'none', 
                                    padding: '10px', 
                                    borderRadius: '4px',
                                    cursor: 'pointer'
                                }}
                            >
                                💾 Mentés
                            </button>
                            <button 
                                onClick={() => { setIsEditing(false); setImageBase64(undefined); }}
                                style={{ 
                                    flex: 1, 
                                    backgroundColor: '#444', 
                                    color: 'white', 
                                    border: 'none', 
                                    padding: '10px', 
                                    borderRadius: '4px',
                                    cursor: 'pointer'
                                }}
                            >
                                Mégse
                            </button>
                        </div>
                    </div>
                ) : (
                    <div>
                        {/* Profil adatok megjelenítése */}
                        <div style={{ 
                            backgroundColor: '#333', 
                            padding: '15px', 
                            borderRadius: '8px',
                            marginBottom: '20px',
                            border: '1px solid #444'
                        }}>
                            <p style={{ margin: '10px 0', color: '#ccc' }}>
                                <strong>🏛️ Kar:</strong> {profile.faculty || <span style={{ color: '#888' }}>Nincs megadva</span>}
                            </p>
                            <p style={{ margin: '10px 0', color: '#ccc' }}>
                                <strong>📚 Szak:</strong> {profile.major || <span style={{ color: '#888' }}>Nincs megadva</span>}
                            </p>
                            <p style={{ margin: '10px 0', color: '#ccc' }}>
                                <strong>📝 Bio:</strong> {profile.bio || <span style={{ color: '#888' }}>Nincs bemutatkozás</span>}
                            </p>
                            <p style={{ margin: '10px 0', color: '#ccc' }}>
                                <strong>📊 Posztok:</strong> {profile.postsCount}
                            </p>
                        </div>
                        
                        {/* Gombok - csak saját profilnál */}
                        {isOwnProfile && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                <button 
                                    onClick={() => setIsEditing(true)} 
                                    style={{ 
                                        width: '100%', 
                                        padding: '12px',
                                        backgroundColor: '#646cff',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        fontSize: '1em'
                                    }}
                                >
                                    ✏️ Profil Szerkesztése
                                </button>
                                
                                <button 
                                    onClick={handleDeleteAccount} 
                                    style={{ 
                                        width: '100%', 
                                        padding: '12px',
                                        backgroundColor: '#dc3545',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        fontSize: '1em',
                                        marginTop: '20px'
                                    }}
                                >
                                    🗑️ Fiók Törlése
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default UserProfile;