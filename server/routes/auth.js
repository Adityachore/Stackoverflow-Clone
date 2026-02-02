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
  initiateLanguageChange,
  confirmLanguageChange,
} from "../controller/auth.js";

const router = express.Router();
import auth from "../middleware/auth.js";

router.post("/signup", Signup);
router.post("/login", Login);
router.get("/getalluser", getallusers);
router.get("/:id", getuserbyid);
router.patch("/update/:id", auth, updateprofile);
router.patch("/bookmark/:id", auth, toggleBookmark);
router.get("/bookmarks/:id", auth, getBookmarks);
router.post("/forgot-password", forgotPassword);
router.post("/transfer-points/:id", auth, transferPoints);
router.post("/language/initiate/:id", auth, initiateLanguageChange);
router.post("/language/confirm/:id", auth, confirmLanguageChange);

export default router;
