import axiosInstance from "./axiosinstance";

// Social
export const createPost = (data) => axiosInstance.post("/social/post", data);
export const getFeed = () => axiosInstance.get("/social/feed");
export const likePost = (id, data) => axiosInstance.patch(`/social/post/${id}/like`, data); // data might contain nothing or user specific if needed
export const commentPost = (id, data) => axiosInstance.patch(`/social/post/${id}/comment`, data);
export const sharePost = (id) => axiosInstance.patch(`/social/post/${id}/share`);

// Auth & Features
export const forgotPassword = (data) => axiosInstance.post("/user/forgot-password", data);
export const transferPoints = (id, data) => axiosInstance.post(`/user/transfer-points/${id}`, data);
export const initiateLanguageChange = (id, data) => axiosInstance.post(`/user/language/initiate/${id}`, data);
export const confirmLanguageChange = (id, data) => axiosInstance.post(`/user/language/confirm/${id}`, data);

// Subscription
export const subscribe = (data) => axiosInstance.post("/subscription/subscribe", data);
