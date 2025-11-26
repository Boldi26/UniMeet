import axios from 'axios';

// ⚠️ FONTOS: Cserélje le a portszámot a backend 'launchSettings.json' HTTPS portjára (pl. 7048)!
const API_URL = 'https://localhost:7048/api'; 

const apiClient = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Token automatikus csatolása minden kéréshez, ha be van jelentkezve
apiClient.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// ============================================
// Típusdefiníciók (Interfaces)
// ============================================

// --- Komment & Érdeklődés DTO-k (Ezek hiányoztak) ---
export interface CreateCommentDto {
    userId: number;
    content: string;
    parentCommentId?: number;
}

export interface InterestDto {
    userId: number;
}

// --- Poszt DTO-k ---
export interface PostDetailResponse {
    postId: number;
    content: string;
    authorUsername: string;
    authorImageUrl?: string;
    dateCreated: string;
    interestedCount: number;
    commentsCount: number;
    commentsEnabled: boolean;
    interestEnabled: boolean;
    imageUrl?: string;
    groupName?: string;
    comments: any[]; // Részletesebb típus is létrehozható
}

export interface CreatePostDto {
    userId: number;
    content: string;
    commentsEnabled: boolean;
    interestEnabled: boolean;
    imageUrl?: string; // Base64
    groupId?: number;
}

// --- Profil DTO-k ---
export interface UserProfileResponse {
    id: number;
    username: string;
    email: string;
    profileImageUrl?: string;
    faculty?: string;
    major?: string;
    bio?: string;
    postsCount: number;
    isOwnProfile: boolean;
    dateCreated?: string;
}

export interface UpdateProfileDto {
    profileImageUrl?: string;
    faculty?: string;
    major?: string;
    bio?: string;
}

// --- Csoport DTO-k ---
export interface GroupSummaryDto {
    id: number;
    name: string;
    description?: string;
    imageUrl?: string;
    membersCount: number;
    isMember: boolean;
    isPrivate: boolean;
    creatorUserId: number;
}

export interface CreateGroupDto {
    name: string;
    description?: string;
    imageUrl?: string;
    creatorUserId: number;
    isPrivate: boolean;
}

// ============================================
// API Hívások (Exportok)
// ============================================

// --- Auth ---
export const loginUser = (data: any) => apiClient.post('/Users/login', data);
export const registerUser = (data: any) => apiClient.post('/Users/register', data);

// --- Posztok (Alap) ---
export const createPost = (data: CreatePostDto) => apiClient.post('/Post', data);
export const getFeed = (userId: number) => apiClient.get<PostDetailResponse[]>(`/Post/feed?userId=${userId}`);
export const getPostsByDomain = (domain: string) => apiClient.get<number[]>(`/Post/by-domain?domain=${domain}`); // Kompatibilitás

// --- Poszt Részletek & Interakciók (Ezek hiányoztak a hibák alapján) ---
export const getPostDetails = (postId: number) => apiClient.get<PostDetailResponse>(`/Post/${postId}`);

export const deletePost = (postId: number) => apiClient.delete(`/Post/${postId}`);

export const addComment = (postId: number, commentData: CreateCommentDto) => {
    return apiClient.post(`/Post/${postId}/comments`, commentData);
};

export const deleteComment = (commentId: number) => {
    // Feltételezve, hogy a backend így kezeli a komment törlést
    return apiClient.delete(`/Post/comments/${commentId}`);
};

export const addInterest = (postId: number, interestData: InterestDto) => {
    return apiClient.post(`/Post/${postId}/interest`, interestData);
};

export const deleteInterest = (postId: number, userId: number) => {
    return apiClient.delete(`/Post/${postId}/interest/${userId}`);
};

// --- Csoportok ---
export const getAllGroups = (userId: number) => apiClient.get<GroupSummaryDto[]>(`/Groups?userId=${userId}`);
export const createGroup = (data: CreateGroupDto) => apiClient.post('/Groups', data);
export const joinGroup = (groupId: number, userId: number) => apiClient.post(`/Groups/${groupId}/join`, userId); // Int body-ként
export const leaveGroup = (groupId: number, userId: number) => apiClient.delete(`/Groups/${groupId}/leave?userId=${userId}`);

// --- Profil ---
export const getProfile = (userId: number, currentUserId: number, username?: string) => {
    if (username) {
        return apiClient.get<UserProfileResponse>(`/Profile/by-username/${username}?currentUserId=${currentUserId}`);
    }
    return apiClient.get<UserProfileResponse>(`/Profile/${userId}?currentUserId=${currentUserId}`);
};
export const updateProfile = (userId: number, data: UpdateProfileDto) => apiClient.put(`/Profile/${userId}`, data);
export const deleteProfile = (userId: number) => apiClient.delete(`/Profile/${userId}`);

export default apiClient;