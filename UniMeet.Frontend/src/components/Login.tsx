import React, { useState } from 'react';
import { loginUser } from '../services/apiService'; // Importálás az API modulból

function Login() {
    // Típusok explicit megadása a useState-nek
    const [username, setUsername] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Az 'e' esemény típusának megadása (React.FormEvent)
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);

        try {
            // Itt történik az összekötés a backenddel
            const response = await loginUser({ username, password });
            
            // Sikeres hívás (a 'response.data' típusbiztos)
            setSuccess(`Sikeres bejelentkezés: ${response.data.username} (ID: ${response.data.id})`);
            
            // TODO: Itt kellene elmenteni a felhasználói adatokat 
            // (pl. Context API-ba vagy más állapotkezelőbe)

        } catch (err: any) { // 'any' használata az axios hibakezelés egyszerűsítéséhez
            // Hibakezelés
            const errorMsg = err.response ? err.response.data : 'Kommunikációs hiba a szerverrel';
            setError(`Hiba: ${errorMsg}`);
        }
    };

    return (
        <div style={{ padding: '20px', maxWidth: '300px', border: '1px solid #ccc' }}>
            <form onSubmit={handleSubmit}>
                <h2>Bejelentkezés</h2>
                <div style={{ marginBottom: '10px' }}>
                    <label>Felhasználónév:</label><br />
                    <input 
                        type="text" 
                        value={username} 
                        onChange={(e) => setUsername(e.target.value)} 
                        required
                        style={{ width: '90%' }}
                    />
                </div>
                <div style={{ marginBottom: '10px' }}>
                    <label>Jelszó:</label><br />
                    <input 
                        type="password" 
                        value={password} 
                        onChange={(e) => setPassword(e.target.value)} 
                        required
                        style={{ width: '90%' }}
                    />
                </div>
                
                {/* Hiba- és sikerüzenetek */}
                {error && <p style={{ color: 'red', fontSize: '0.9em' }}>{error}</p>}
                {success && <p style={{ color: 'green', fontSize: '0.9em' }}>{success}</p>}

                <button type="submit">Bejelentkezés</button>
            </form>
        </div>
    );
}

export default Login;