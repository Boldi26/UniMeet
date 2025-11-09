import axios from 'axios';

// ⚠️ FONTOS: Cserélje le a portszámot (pl. 7123) a backend portjára!
// Ezt a backend projekt 'launchSettings.json' fájljában találja.
const API_URL = 'http://localhost:5186/api'; 

const apiClient = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// === DTO Interfaces ===

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
    email?: string;
}

interface CreatePostDto {
    userId: number;
    content: string;
    commentsEnabled: boolean;
    interestEnabled: boolean;
}

interface CreateCommentDto {
    userId: number;
    content: string;
    parentCommentId?: number;
}

interface InterestDto {
    userId: number;
}

interface ChangeUsernameDto {
    username: string;
}

interface CommentResponse {
    id: number;
    content: string;
    username: string;
    replies: CommentResponse[];
}

interface PostDetailResponse {
    postId: number;
    content: string;
    authorUsername: string;
    interestedCount: number;
    commentsCount: number;
    comments: CommentResponse[];
}

interface PostResponse {
    id: number;
    userId: number;
    content: string;
    commentsEnabled: boolean;
    interestEnabled: boolean;
    dateCreated: string;
}

// === UserController API ===

export const loginUser = (loginData: LoginDto) => {
    return apiClient.post<UserResponse>('/Users/login', loginData);
};

export const registerUser = (registerData: RegisterDto) => {
    return apiClient.post<UserResponse>('/Users/register', registerData);
};

export const deleteUser = (userId: number) => {
    return apiClient.delete(`/Users/${userId}`);
};

export const changeUsername = (userId: number, data: ChangeUsernameDto) => {
    return apiClient.put<UserResponse>(`/Users/users/${userId}/username`, data);
};

// === PostsController API ===

export const createPost = (postData: CreatePostDto) => {
    return apiClient.post<PostResponse>('/Posts', postData);
};

export const getPostDetails = (postId: number) => {
    return apiClient.get<PostDetailResponse>(`/Posts/${postId}`);
};

export const getPostsByDomain = (domain: string) => {
    return apiClient.get<number[]>(`/Posts/by-domain?domain=${domain}`);
};

export const deletePost = (postId: number) => {
    return apiClient.delete(`/Posts/${postId}`);
};

export const addComment = (postId: number, commentData: CreateCommentDto) => {
    return apiClient.post(`/Posts/${postId}/comments`, commentData);
};

export const deleteComment = (commentId: number) => {
    return apiClient.delete(`/Posts/comments/${commentId}`);
};

export const addInterest = (postId: number, interestData: InterestDto) => {
    return apiClient.post(`/Posts/${postId}/interest`, interestData);
};

export const deleteInterest = (postId: number, userId: number) => {
    return apiClient.delete(`/Posts/${postId}/interest/${userId}`);
};

export default apiClient;