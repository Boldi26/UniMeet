import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    getAdminStats,
    getAdminReports,
    getAdminUsers,
    handleReport,
    banUser,
    unbanUser,
    adminDeleteUser,
    type AdminStatsDto,
    type ReportResponseDto,
    type AdminUserDto
} from '../services/apiService';

const AdminPanel: React.FC = () => {
    const { user, isAdmin } = useAuth();
    const navigate = useNavigate();

    const [activeTab, setActiveTab] = useState<'stats' | 'reports' | 'users'>('stats');
    const [stats, setStats] = useState<AdminStatsDto | null>(null);
    const [reports, setReports] = useState<ReportResponseDto[]>([]);
    const [users, setUsers] = useState<AdminUserDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [reportFilter, setReportFilter] = useState<string>('Pending');

    useEffect(() => {
        if (!user || !isAdmin) {
            navigate('/feed');
            return;
        }
        loadData();
    }, [user, isAdmin, activeTab, reportFilter]);

    const loadData = async () => {
        if (!user) return;
        setLoading(true);

        try {
            if (activeTab === 'stats') {
                const res = await getAdminStats(user.id);
                setStats(res.data);
            } else if (activeTab === 'reports') {
                const res = await getAdminReports(user.id, reportFilter || undefined);
                setReports(res.data);
            } else if (activeTab === 'users') {
                const res = await getAdminUsers(user.id);
                setUsers(res.data);
            }
        } catch (err) {
            console.error('Hiba az adatok betöltésekor:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleReportAction = async (reportId: number, action: 'dismiss' | 'delete' | 'ban') => {
        if (!user) return;

        try {
            const data = {
                newStatus: action === 'dismiss' ? 3 : 2, // Dismissed = 3, ActionTaken = 2
                adminNote: action === 'dismiss' ? 'Elutasítva' : 'Intézkedés történt',
                deleteContent: action === 'delete' || action === 'ban',
                banUser: action === 'ban',
                banReason: action === 'ban' ? 'Közösségi irányelvek megsértése' : undefined,
                banDays: null
            };

            await handleReport(reportId, user.id, data);
            loadData();
        } catch (err: any) {
            alert('Hiba: ' + (err.response?.data || err.message));
        }
    };

    const handleBanUser = async (userId: number) => {
        if (!user) return;
        const reason = prompt('Ban indoka:');
        if (!reason) return;
        const daysStr = prompt('Hány napra? (üres = végtelen)');
        const days = daysStr ? parseInt(daysStr) : undefined;

        try {
            await banUser(userId, user.id, { reason, days });
            loadData();
        } catch (err: any) {
            alert('Hiba: ' + (err.response?.data || err.message));
        }
    };

    const handleUnbanUser = async (userId: number) => {
        if (!user) return;
        if (!confirm('Biztosan feloldod a ban-t?')) return;

        try {
            await unbanUser(userId, user.id);
            loadData();
        } catch (err: any) {
            alert('Hiba: ' + (err.response?.data || err.message));
        }
    };

    const handleDeleteUser = async (userId: number, username: string) => {
        if (!user) return;
        if (!confirm(`Biztosan VÉGLEGESEN törlöd ${username} fiókját?`)) return;

        try {
            await adminDeleteUser(userId, user.id);
            loadData();
        } catch (err: any) {
            alert('Hiba: ' + (err.response?.data || err.message));
        }
    };

    const styles = {
        container: {
            padding: '20px',
            maxWidth: '1200px',
            margin: '0 auto'
        },
        header: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px',
            padding: '15px',
            backgroundColor: '#2a2a2a',
            borderRadius: '8px',
            border: '1px solid #333'
        },
        title: {
            color: '#ff6b6b',
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
        },
        tabs: {
            display: 'flex',
            gap: '10px',
            marginBottom: '20px'
        },
        tab: (active: boolean) => ({
            padding: '10px 20px',
            backgroundColor: active ? '#646cff' : '#333',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
        }),
        statsGrid: {
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
            gap: '15px',
            marginBottom: '20px'
        },
        statCard: {
            backgroundColor: '#2a2a2a',
            padding: '20px',
            borderRadius: '8px',
            textAlign: 'center' as const,
            border: '1px solid #333'
        },
        statNumber: {
            fontSize: '2em',
            fontWeight: 'bold',
            color: '#646cff'
        },
        statLabel: {
            color: '#888',
            marginTop: '5px'
        },
        table: {
            width: '100%',
            borderCollapse: 'collapse' as const,
            backgroundColor: '#2a2a2a',
            borderRadius: '8px',
            overflow: 'hidden'
        },
        th: {
            padding: '12px',
            backgroundColor: '#333',
            color: '#fff',
            textAlign: 'left' as const,
            borderBottom: '1px solid #444'
        },
        td: {
            padding: '12px',
            borderBottom: '1px solid #333',
            color: '#ccc'
        },
        actionBtn: (color: string) => ({
            padding: '5px 10px',
            backgroundColor: color,
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            marginRight: '5px',
            fontSize: '0.85em'
        }),
        filter: {
            marginBottom: '15px',
            display: 'flex',
            gap: '10px',
            alignItems: 'center'
        },
        select: {
            padding: '8px',
            backgroundColor: '#333',
            color: '#fff',
            border: '1px solid #444',
            borderRadius: '4px'
        },
        badge: (type: string) => ({
            display: 'inline-block',
            padding: '3px 8px',
            borderRadius: '4px',
            fontSize: '0.8em',
            backgroundColor: type === 'Pending' ? '#f59e0b' : 
                            type === 'ActionTaken' ? '#10b981' :
                            type === 'Dismissed' ? '#6b7280' : '#3b82f6',
            color: '#fff'
        })
    };

    if (!isAdmin) {
        return <div style={{ padding: '20px', color: '#ff6b6b' }}>⛔ Nincs jogosultságod!</div>;
    }

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <h1 style={styles.title}>🛡️ Admin Panel</h1>
                <button onClick={() => navigate('/feed')} style={styles.actionBtn('#444')}>
                    ← Vissza
                </button>
            </div>

            <div style={styles.tabs}>
                <button style={styles.tab(activeTab === 'stats')} onClick={() => setActiveTab('stats')}>
                    📊 Statisztikák
                </button>
                <button style={styles.tab(activeTab === 'reports')} onClick={() => setActiveTab('reports')}>
                    🚨 Jelentések
                </button>
                <button style={styles.tab(activeTab === 'users')} onClick={() => setActiveTab('users')}>
                    👥 Felhasználók
                </button>
            </div>

            {loading ? (
                <p style={{ color: '#ccc' }}>Betöltés...</p>
            ) : (
                <>
                    {/* Statisztikák tab */}
                    {activeTab === 'stats' && stats && (
                        <div style={styles.statsGrid}>
                            <div style={styles.statCard}>
                                <div style={styles.statNumber}>{stats.totalUsers}</div>
                                <div style={styles.statLabel}>Összes Felhasználó</div>
                            </div>
                            <div style={styles.statCard}>
                                <div style={{ ...styles.statNumber, color: '#ff6b6b' }}>{stats.bannedUsers}</div>
                                <div style={styles.statLabel}>Bannolt</div>
                            </div>
                            <div style={styles.statCard}>
                                <div style={styles.statNumber}>{stats.totalPosts}</div>
                                <div style={styles.statLabel}>Összes Poszt</div>
                            </div>
                            <div style={styles.statCard}>
                                <div style={styles.statNumber}>{stats.totalGroups}</div>
                                <div style={styles.statLabel}>Csoportok</div>
                            </div>
                            <div style={styles.statCard}>
                                <div style={{ ...styles.statNumber, color: '#f59e0b' }}>{stats.pendingReports}</div>
                                <div style={styles.statLabel}>Függő Jelentések</div>
                            </div>
                            <div style={styles.statCard}>
                                <div style={styles.statNumber}>{stats.totalReports}</div>
                                <div style={styles.statLabel}>Összes Jelentés</div>
                            </div>
                        </div>
                    )}

                    {/* Jelentések tab */}
                    {activeTab === 'reports' && (
                        <>
                            <div style={styles.filter}>
                                <label style={{ color: '#ccc' }}>Szűrés:</label>
                                <select 
                                    value={reportFilter} 
                                    onChange={e => setReportFilter(e.target.value)}
                                    style={styles.select}
                                >
                                    <option value="">Összes</option>
                                    <option value="Pending">Függőben</option>
                                    <option value="ActionTaken">Kezelt</option>
                                    <option value="Dismissed">Elutasított</option>
                                </select>
                            </div>

                            {reports.length === 0 ? (
                                <p style={{ color: '#888' }}>Nincs jelentés.</p>
                            ) : (
                                <table style={styles.table}>
                                    <thead>
                                        <tr>
                                            <th style={styles.th}>Jelentő</th>
                                            <th style={styles.th}>Típus</th>
                                            <th style={styles.th}>Tartalom</th>
                                            <th style={styles.th}>Indok</th>
                                            <th style={styles.th}>Státusz</th>
                                            <th style={styles.th}>Műveletek</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {reports.map(report => (
                                            <tr key={report.id}>
                                                <td style={styles.td}>{report.reporterUsername}</td>
                                                <td style={styles.td}>{report.type}</td>
                                                <td style={styles.td}>
                                                    {report.reportedPostContent && (
                                                        <div>📝 Poszt: {report.reportedPostContent.slice(0, 50)}...</div>
                                                    )}
                                                    {report.reportedCommentContent && (
                                                        <div>💬 Komment: {report.reportedCommentContent.slice(0, 50)}...</div>
                                                    )}
                                                    {report.reportedGroupName && (
                                                        <div>👥 Csoport: {report.reportedGroupName}</div>
                                                    )}
                                                    {report.reportedUsername && (
                                                        <div>👤 User: {report.reportedUsername}</div>
                                                    )}
                                                </td>
                                                <td style={styles.td}>{report.reason}</td>
                                                <td style={styles.td}>
                                                    <span style={styles.badge(report.status)}>{report.status}</span>
                                                </td>
                                                <td style={styles.td}>
                                                    {report.status === 'Pending' && (
                                                        <>
                                                            <button 
                                                                onClick={() => handleReportAction(report.id, 'dismiss')}
                                                                style={styles.actionBtn('#6b7280')}
                                                            >
                                                                Elutasít
                                                            </button>
                                                            <button 
                                                                onClick={() => handleReportAction(report.id, 'delete')}
                                                                style={styles.actionBtn('#ef4444')}
                                                            >
                                                                Törlés
                                                            </button>
                                                            <button 
                                                                onClick={() => handleReportAction(report.id, 'ban')}
                                                                style={styles.actionBtn('#dc2626')}
                                                            >
                                                                Ban+Törlés
                                                            </button>
                                                        </>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </>
                    )}

                    {/* Felhasználók tab */}
                    {activeTab === 'users' && (
                        <table style={styles.table}>
                            <thead>
                                <tr>
                                    <th style={styles.th}>Username</th>
                                    <th style={styles.th}>Email</th>
                                    <th style={styles.th}>Posztok</th>
                                    <th style={styles.th}>Jelentések</th>
                                    <th style={styles.th}>Státusz</th>
                                    <th style={styles.th}>Műveletek</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map(u => (
                                    <tr key={u.id}>
                                        <td style={styles.td}>
                                            {u.username}
                                            {u.isAdmin && <span style={{ color: '#ff6b6b', marginLeft: '5px' }}>👑</span>}
                                        </td>
                                        <td style={styles.td}>{u.email}</td>
                                        <td style={styles.td}>{u.postsCount}</td>
                                        <td style={styles.td}>{u.reportsCount}</td>
                                        <td style={styles.td}>
                                            {u.isBanned ? (
                                                <span style={{ color: '#ff6b6b' }}>
                                                    🚫 Bannolt
                                                    {u.bannedUntil && ` (${new Date(u.bannedUntil).toLocaleDateString('hu-HU')}-ig)`}
                                                </span>
                                            ) : (
                                                <span style={{ color: '#10b981' }}>✓ Aktív</span>
                                            )}
                                        </td>
                                        <td style={styles.td}>
                                            {!u.isAdmin && (
                                                <>
                                                    {u.isBanned ? (
                                                        <button 
                                                            onClick={() => handleUnbanUser(u.id)}
                                                            style={styles.actionBtn('#10b981')}
                                                        >
                                                            Unban
                                                        </button>
                                                    ) : (
                                                        <button 
                                                            onClick={() => handleBanUser(u.id)}
                                                            style={styles.actionBtn('#f59e0b')}
                                                        >
                                                            Ban
                                                        </button>
                                                    )}
                                                    <button 
                                                        onClick={() => handleDeleteUser(u.id, u.username)}
                                                        style={styles.actionBtn('#dc2626')}
                                                    >
                                                        Törlés
                                                    </button>
                                                </>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </>
            )}
        </div>
    );
};

export default AdminPanel;
