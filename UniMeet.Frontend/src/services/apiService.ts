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
    isOwner: boolean;
    hasPendingRequest: boolean;
    pendingRequestsCount: number;
}

export interface JoinRequestDto {
    id: number;
    userId: number;
    username: string;
    profileImageUrl?: string;
    dateRequested: string;
}

export interface CreateGroupDto {
    name: string;
    description?: string;
    imageUrl?: string;
    creatorUserId: number;
    isPrivate: boolean;
}

// --- Report DTO-k ---
export interface CreateReportDto {
    reporterUserId: number;
    postId?: number;
    commentId?: number;
    groupId?: number;
    userId?: number;
    type: number;
    reason: string;
}

export interface ReportType {
    value: number;
    name: string;
    displayName: string;
}

export interface ReportResponseDto {
    id: number;
    reporterUsername: string;
    reportedPostId?: number;
    reportedPostContent?: string;
    reportedPostAuthor?: string;
    reportedCommentId?: number;
    reportedCommentContent?: string;
    reportedCommentAuthor?: string;
    reportedGroupId?: number;
    reportedGroupName?: string;
    reportedUserId?: number;
    reportedUsername?: string;
    type: string;
    reason: string;
    status: string;
    adminNote?: string;
    dateCreated: string;
    dateResolved?: string;
}

export interface AdminStatsDto {
    totalUsers: number;
    bannedUsers: number;
    totalPosts: number;
    totalGroups: number;
    pendingReports: number;
    totalReports: number;
}

export interface AdminUserDto {
    id: number;
    username: string;
    email: string;
    isAdmin: boolean;
    isBanned: boolean;
    banReason?: string;
    bannedUntil?: string;
    dateCreated: string;
    postsCount: number;
    commentsCount: number;
    reportsCount: number;
}

export interface GroupMemberDto {
    id: number;
    userId: number;
    username: string;
    profileImageUrl?: string;
    role: string;
    dateJoined: string;
    isCreator: boolean;
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

// --- Report (Jelentések) ---
export const createReport = (data: CreateReportDto) => apiClient.post('/Report', data);
export const getReportTypes = () => apiClient.get<ReportType[]>('/Report/types');

// --- Admin ---
export const initAdmin = () => apiClient.post('/Users/init-admin');
export const getAdminStats = (adminId: number) => apiClient.get<AdminStatsDto>(`/Admin/stats?adminId=${adminId}`);
export const getAdminReports = (adminId: number, status?: string) => {
    const url = status ? `/Admin/reports?adminId=${adminId}&status=${status}` : `/Admin/reports?adminId=${adminId}`;
    return apiClient.get<ReportResponseDto[]>(url);
};
export const handleReport = (reportId: number, adminId: number, data: any) => 
    apiClient.put(`/Admin/reports/${reportId}?adminId=${adminId}`, data);
export const getAdminUsers = (adminId: number) => apiClient.get<AdminUserDto[]>(`/Admin/users?adminId=${adminId}`);
export const banUser = (userId: number, adminId: number, data: { reason: string; days?: number }) =>
    apiClient.post(`/Admin/users/${userId}/ban?adminId=${adminId}`, data);
export const unbanUser = (userId: number, adminId: number) =>
    apiClient.delete(`/Admin/users/${userId}/ban?adminId=${adminId}`);
export const adminDeleteUser = (userId: number, adminId: number) =>
    apiClient.delete(`/Admin/users/${userId}?adminId=${adminId}`);
export const adminDeletePost = (postId: number, adminId: number) =>
    apiClient.delete(`/Admin/posts/${postId}?adminId=${adminId}`);
export const adminDeleteComment = (commentId: number, adminId: number) =>
    apiClient.delete(`/Admin/comments/${commentId}?adminId=${adminId}`);
export const adminDeleteGroup = (groupId: number, adminId: number) =>
    apiClient.delete(`/Admin/groups/${groupId}?adminId=${adminId}`);

// --- Csoport Moderálás (tulajdonos jogok) ---
export const getGroupMembers = (groupId: number, moderatorId: number) =>
    apiClient.get<GroupMemberDto[]>(`/Groups/${groupId}/members?moderatorId=${moderatorId}`);
export const kickGroupMember = (groupId: number, userId: number, moderatorId: number) =>
    apiClient.delete(`/Groups/${groupId}/members/${userId}?moderatorId=${moderatorId}`);
export const getGroupPosts = (groupId: number, moderatorId: number) =>
    apiClient.get(`/Groups/${groupId}/posts?moderatorId=${moderatorId}`);
export const deleteGroupPost = (groupId: number, postId: number, moderatorId: number) =>
    apiClient.delete(`/Groups/${groupId}/posts/${postId}?moderatorId=${moderatorId}`);
export const deleteGroupComment = (groupId: number, commentId: number, moderatorId: number) =>
    apiClient.delete(`/Groups/${groupId}/comments/${commentId}?moderatorId=${moderatorId}`);

// --- Csatlakozási kérelmek (privát csoportok) ---
export const getJoinRequests = (groupId: number, ownerId: number) =>
    apiClient.get<JoinRequestDto[]>(`/Groups/${groupId}/join-requests?ownerId=${ownerId}`);
export const handleJoinRequest = (groupId: number, requestId: number, ownerId: number, approve: boolean) =>
    apiClient.put(`/Groups/${groupId}/join-requests/${requestId}?ownerId=${ownerId}`, { approve });
export const cancelJoinRequest = (groupId: number, requestId: number, userId: number) =>
    apiClient.delete(`/Groups/${groupId}/join-requests/${requestId}?userId=${userId}`);

export default apiClient;