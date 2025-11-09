import React, { useState } from 'react';
import { loginUser } from '../services/apiService';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

function Login() {
    const [username, setUsername] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            const response = await loginUser({ username, password });
            login({ id: response.data.id, username: response.data.username });
            navigate('/feed');
        } catch (err: any) {
            const errorMsg = err.response?.data || 'Kommunikációs hiba a szerverrel';
            setError(`Hiba: ${errorMsg}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <form onSubmit={handleSubmit} className="auth-form">
                <h2>Bejelentkezés</h2>
                
                <div className="form-group">
                    <label>Felhasználónév:</label>
                    <input 
                        type="text" 
                        value={username} 
                        onChange={(e) => setUsername(e.target.value)} 
                        required
                        placeholder="felhasznalonev"
                    />
                </div>

                <div className="form-group">
                    <label>Jelszó:</label>
                    <input 
                        type="password" 
                        value={password} 
                        onChange={(e) => setPassword(e.target.value)} 
                        required
                        placeholder="jelszó"
                    />
                </div>
                
                {error && <p className="error-message">{error}</p>}

                <button type="submit" disabled={loading} className="btn-primary">
                    {loading ? 'Bejelentkezés...' : 'Bejelentkezés'}
                </button>

                <p className="auth-switch">
                    Nincs még fiókod? <a href="/register">Regisztrálj!</a>
                </p>
            </form>
        </div>
    );
}

export default Login;