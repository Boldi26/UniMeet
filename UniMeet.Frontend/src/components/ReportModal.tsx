import React, { useState, useEffect } from 'react';
import { createReport, getReportTypes, type ReportType } from '../services/apiService';
import { useAuth } from '../context/AuthContext';

interface ReportModalProps {
    isOpen: boolean;
    onClose: () => void;
    postId?: number;
    commentId?: number;
    groupId?: number;
    userId?: number;
    targetName?: string;
}

const ReportModal: React.FC<ReportModalProps> = ({
    isOpen,
    onClose,
    postId,
    commentId,
    groupId,
    userId,
    targetName
}) => {
    const { user } = useAuth();
    const [reportTypes, setReportTypes] = useState<ReportType[]>([]);
    const [selectedType, setSelectedType] = useState<number>(0);
    const [reason, setReason] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        if (isOpen) {
            loadReportTypes();
            setSuccess(false);
            setReason('');
            setSelectedType(0);
        }
    }, [isOpen]);

    const loadReportTypes = async () => {
        try {
            const res = await getReportTypes();
            setReportTypes(res.data);
            if (res.data.length > 0) {
                setSelectedType(res.data[0].value);
            }
        } catch (err) {
            console.error('Hiba a report típusok betöltésekor:', err);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setLoading(true);
        try {
            await createReport({
                reporterUserId: user.id,
                postId,
                commentId,
                groupId,
                userId,
                type: selectedType,
                reason
            });
            setSuccess(true);
            setTimeout(() => {
                onClose();
            }, 2000);
        } catch (err: any) {
            alert('Hiba: ' + (err.response?.data?.message || err.response?.data || err.message));
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const styles = {
        overlay: {
            position: 'fixed' as const,
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000
        },
        modal: {
            backgroundColor: '#2a2a2a',
            padding: '25px',
            borderRadius: '12px',
            width: '90%',
            maxWidth: '450px',
            border: '1px solid #333',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)'
        },
        header: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px'
        },
        title: {
            color: '#ff6b6b',
            margin: 0,
            fontSize: '1.3em'
        },
        closeBtn: {
            background: 'none',
            border: 'none',
            color: '#888',
            fontSize: '1.5em',
            cursor: 'pointer'
        },
        targetInfo: {
            backgroundColor: '#333',
            padding: '10px 15px',
            borderRadius: '6px',
            marginBottom: '15px',
            color: '#ccc',
            fontSize: '0.9em'
        },
        formGroup: {
            marginBottom: '15px'
        },
        label: {
            display: 'block',
            marginBottom: '5px',
            color: '#ccc',
            fontWeight: 'bold'
        },
        select: {
            width: '100%',
            padding: '10px',
            backgroundColor: '#333',
            color: '#fff',
            border: '1px solid #444',
            borderRadius: '6px',
            fontSize: '1em'
        },
        textarea: {
            width: '100%',
            padding: '10px',
            backgroundColor: '#333',
            color: '#fff',
            border: '1px solid #444',
            borderRadius: '6px',
            fontSize: '1em',
            resize: 'vertical' as const,
            minHeight: '80px'
        },
        submitBtn: {
            width: '100%',
            padding: '12px',
            backgroundColor: '#ff6b6b',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            fontSize: '1em',
            fontWeight: 'bold',
            cursor: 'pointer'
        },
        successMsg: {
            textAlign: 'center' as const,
            color: '#10b981',
            fontSize: '1.1em',
            padding: '20px'
        }
    };

    const getTargetType = () => {
        if (postId) return 'poszt';
        if (commentId) return 'komment';
        if (groupId) return 'csoport';
        if (userId) return 'felhasználó';
        return 'tartalom';
    };

    return (
        <div style={styles.overlay} onClick={onClose}>
            <div style={styles.modal} onClick={e => e.stopPropagation()}>
                {success ? (
                    <div style={styles.successMsg}>
                        ✅ Jelentés sikeresen elküldve!<br/>
                        <small style={{ color: '#888' }}>Köszönjük a visszajelzést.</small>
                    </div>
                ) : (
                    <>
                        <div style={styles.header}>
                            <h3 style={styles.title}>🚨 Jelentés</h3>
                            <button style={styles.closeBtn} onClick={onClose}>×</button>
                        </div>

                        <div style={styles.targetInfo}>
                            📌 Jelentett {getTargetType()}: <strong>{targetName || 'Ismeretlen'}</strong>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div style={styles.formGroup}>
                                <label style={styles.label}>Jelentés típusa:</label>
                                <select 
                                    value={selectedType}
                                    onChange={e => setSelectedType(Number(e.target.value))}
                                    style={styles.select}
                                    required
                                >
                                    {reportTypes.map(type => (
                                        <option key={type.value} value={type.value}>
                                            {type.displayName}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div style={styles.formGroup}>
                                <label style={styles.label}>Indoklás (opcionális):</label>
                                <textarea
                                    value={reason}
                                    onChange={e => setReason(e.target.value)}
                                    style={styles.textarea}
                                    placeholder="Írd le részletesebben, miért jelented ezt a tartalmat..."
                                />
                            </div>

                            <button 
                                type="submit" 
                                style={{
                                    ...styles.submitBtn,
                                    opacity: loading ? 0.7 : 1,
                                    cursor: loading ? 'not-allowed' : 'pointer'
                                }}
                                disabled={loading}
                            >
                                {loading ? 'Küldés...' : '🚨 Jelentés Küldése'}
                            </button>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
};

export default ReportModal;
