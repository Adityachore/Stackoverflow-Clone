import axiosInstance from "./axiosinstance";

const requireUserId = (userId, actionLabel) => {
	if (!userId) {
		throw new Error(`User ID is required to ${actionLabel}.`);
	}
};

// Social
export const createPost = (data) => axiosInstance.post("/social/post", data);
export const getFeed = () => axiosInstance.get("/social/feed");
export const likePost = (id, data) => axiosInstance.patch(`/social/post/${id}/like`, data);
export const commentPost = (id, data) => axiosInstance.patch(`/social/post/${id}/comment`, data);
export const sharePost = (id) => axiosInstance.patch(`/social/post/${id}/share`);
export const uploadMedia = (data) => axiosInstance.post("/social/upload", data);

// Auth & Features
export const forgotPassword = (data) => axiosInstance.post("/user/forgot-password", data);
export const transferPoints = (id, data) => axiosInstance.post(`/user/transfer-points/${id}`, data);
export const initiateLanguageChange = (userId, language) => {
	requireUserId(userId, "initiate language change");
	return axiosInstance.post(`/user/language/initiate/${userId}`, { language });
};

export const confirmLanguageChange = (userId, language, otp) => {
	requireUserId(userId, "confirm language change");
	return axiosInstance.post(`/user/language/confirm/${userId}`, { language, otp });
};
export const getLoginHistory = (id) => axiosInstance.get(`/user/login-history/${id}`);

// Friends API (using new Friendship model routes)
export const addFriend = (id) => axiosInstance.post(`/api/friends/request/${id}`);
export const removeFriend = (id) => axiosInstance.delete(`/api/friends/remove/${id}`);
export const addFriendByCode = (friendCode) => axiosInstance.post(`/user/friend/add-code`, { friendCode });
export const getFriendCount = () => axiosInstance.get(`/user/friend/count`);
export const getFriendRequests = () => axiosInstance.get(`/api/friends/requests/pending`);
export const getSentFriendRequests = () => axiosInstance.get(`/api/friends/requests/sent`);
export const acceptFriendRequest = (id) => axiosInstance.put(`/api/friends/accept/${id}`);
export const rejectFriendRequest = (id) => axiosInstance.put(`/api/friends/reject/${id}`);
export const getFriendsList = () => axiosInstance.get(`/api/friends/list`);
export const getMutualFriends = (id) => axiosInstance.get(`/api/friends/mutual/${id}`);
export const getFriendshipStatus = (id) => axiosInstance.get(`/api/friends/status/${id}`);
export const blockUser = (id) => axiosInstance.post(`/api/friends/block/${id}`);
export const unblockUser = (id) => axiosInstance.delete(`/api/friends/unblock/${id}`);
export const getBlockedUsers = () => axiosInstance.get(`/api/friends/blocked`);

// Follow API
export const followUser = (id) => axiosInstance.post(`/api/follow/${id}`);
export const unfollowUser = (id) => axiosInstance.delete(`/api/follow/${id}`);
export const getFollowers = (id) => axiosInstance.get(`/api/follow/followers/${id}`);
export const getFollowing = (id) => axiosInstance.get(`/api/follow/following/${id}`);
export const getFollowCounts = (id) => axiosInstance.get(`/api/follow/counts/${id}`);
export const checkFollowStatus = (id) => axiosInstance.get(`/api/follow/status/${id}`);
export const getSuggestedUsers = () => axiosInstance.get(`/api/follow/suggested`);

// Subscription
export const createSubscriptionOrder = (data) => axiosInstance.post("/subscription/create-order", data);
export const subscribe = (data) => axiosInstance.post("/subscription/subscribe", data);
export const getSubscriptionStatus = () => axiosInstance.get("/subscription/status");

export const getAllUsers = () => axiosInstance.get("/social/users/all");
