import axiosInstance from "./axiosinstance";

// Social
export const createPost = (data) => axiosInstance.post("/social/post", data);
export const getFeed = () => axiosInstance.get("/social/feed");
export const likePost = (id, data) => axiosInstance.patch(`/social/post/${id}/like`, data);
export const commentPost = (id, data) => axiosInstance.patch(`/social/post/${id}/comment`, data);
export const sharePost = (id) => axiosInstance.patch(`/social/post/${id}/share`);

// Auth & Features
export const forgotPassword = (data) => axiosInstance.post("/user/forgot-password", data);
export const transferPoints = (id, data) => axiosInstance.post(`/user/transfer-points/${id}`, data);
export const initiateLanguageChange = (language) => axiosInstance.post("/user/language/initiate", { language });
export const confirmLanguageChange = (language, otp) => axiosInstance.post("/user/language/confirm", { language, otp });
export const getLoginHistory = (id) => axiosInstance.get(`/user/login-history/${id}`);
export const addFriend = (id, data) => axiosInstance.post(`/user/friend/add/${id}`, data);
export const removeFriend = (id, data) => axiosInstance.post(`/user/friend/remove/${id}`, data);

// Subscription
export const createSubscriptionOrder = (data) => axiosInstance.post("/subscription/create-order", data);
export const subscribe = (data) => axiosInstance.post("/subscription/subscribe", data);
export const getSubscriptionStatus = () => axiosInstance.get("/subscription/status");

export const getAllUsers = () => axiosInstance.get("/social/users/all");
export const followUser = (id) => axiosInstance.post(`/user/friend/add/${id}`);
