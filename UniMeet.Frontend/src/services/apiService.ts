import axios from 'axios';

// ⚠️ FONTOS: Cserélje le a portszámot (pl. 7123) a backend portjára!
// Ezt a backend projekt 'launchSettings.json' fájljában találja.
const API_URL = 'https://localhost:7048/api'; 

const apiClient = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// === UserController ===

// Definiáljuk a DTO-kat (Data Transfer Objects) a típusbiztonság érdekében

interface LoginDto {
    username: string;
    password: string;
}

interface RegisterDto {
    email: string;
    username: string;
    password: string;
}

interface UserResponse {
    id: number;
    username: string;
    email?: string; // Az email opcionális a login válaszban
}

/**
 * Felhasználó bejelentkeztetése.
 * @param loginData - { username, password }
 * @returns Promise
 */
export const loginUser = (loginData: LoginDto) => {
    // A '<UserResponse>' expliciten megmondja a TypeScriptnek, milyen választ várunk
    return apiClient.post<UserResponse>('/Users/login', loginData);
};

/**
 * Felhasználó regisztrálása.
 * @param registerData - { email, username, password }
 * @returns Promise
 */
export const registerUser = (registerData: RegisterDto) => {
    return apiClient.post<UserResponse>('/Users/register', registerData);
};


// === PostsController ===
// (Itt folytathatja a többi végponttal, ahogy halad a fejlesztéssel)


export default apiClient;