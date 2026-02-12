import express from "express";
import {
  getallusers,
  getuserbyid,
  Login,
  Signup,
  updateprofile,
  toggleBookmark,
  getBookmarks,
  forgotPassword,
  transferPoints,
  registerUser,
  sendRegistrationOtp,
  verifyRegistrationOtp,
  resendRegistrationOtp,
  requestPasswordResetOtp,
  confirmPasswordResetOtp,
  initiateLanguageChange,
  confirmLanguageChange,
  getLoginHistory,
  addFriend,
  removeFriend,
  addFriendByCode,
  getFriendCount,
  getCurrentUser,
} from "../controller/auth.js";

const router = express.Router();
import auth from "../middleware/auth.js";

router.post("/signup", Signup);
router.post("/register", registerUser);
router.post("/send-otp", sendRegistrationOtp);
router.post("/verify-otp", verifyRegistrationOtp);
router.post("/resend-otp", resendRegistrationOtp);
router.post("/password-reset/request-otp", requestPasswordResetOtp);
router.post("/password-reset/confirm", confirmPasswordResetOtp);
router.post("/login", Login);
router.get("/getalluser", getallusers);
router.get("/me", auth, getCurrentUser);
router.get("/:id", getuserbyid);
router.patch("/update/:id", auth, updateprofile);
router.patch("/bookmark/:id", auth, toggleBookmark);
router.get("/bookmarks/:id", auth, getBookmarks);
router.post("/forgot-password", forgotPassword);
router.post("/transfer-points/:id", auth, transferPoints);
router.post("/language/initiate/:id", auth, initiateLanguageChange);
router.post("/language/confirm/:id", auth, confirmLanguageChange);
router.get("/login-history/:id", auth, getLoginHistory);
router.post("/friend/add/:id", auth, addFriend);
router.post("/friend/remove/:id", auth, removeFriend);
router.post("/friend/add-code", auth, addFriendByCode);
router.get("/friend/count", auth, getFriendCount);

export default router;
