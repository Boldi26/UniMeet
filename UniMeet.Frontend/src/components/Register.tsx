import React, { useState } from 'react';
import { registerUser } from '../services/apiService';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

function Register() {
    const [email, setEmail] = useState<string>('');
    const [username, setUsername] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [confirmPassword, setConfirmPassword] = useState<string>('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (password !== confirmPassword) {
            setError('A jelszavak nem egyeznek!');
            return;
        }

        if (password.length < 6) {
            setError('A jelszónak legalább 6 karakter hosszúnak kell lennie!');
            return;
        }

        setLoading(true);

        try {
            const response = await registerUser({ email, username, password });
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
                <h2>Regisztráció</h2>
                
                <div className="form-group">
                    <label>Email cím:</label>
                    <input 
                        type="email" 
                        value={email} 
                        onChange={(e) => setEmail(e.target.value)} 
                        required
                        placeholder="pelda@egyetem.hu"
                    />
                </div>

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
                        placeholder="Minimum 6 karakter"
                    />
                </div>

                <div className="form-group">
                    <label>Jelszó megerősítése:</label>
                    <input 
                        type="password" 
                        value={confirmPassword} 
                        onChange={(e) => setConfirmPassword(e.target.value)} 
                        required
                        placeholder="Jelszó újra"
                    />
                </div>
                
                {error && <p className="error-message">{error}</p>}

                <button type="submit" disabled={loading} className="btn-primary">
                    {loading ? 'Regisztráció...' : 'Regisztráció'}
                </button>

                <p className="auth-switch">
                    Már van fiókod? <a href="/login">Jelentkezz be!</a>
                </p>
            </form>
        </div>
    );
}

export default Register;
