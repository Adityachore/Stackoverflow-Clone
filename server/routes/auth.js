import express from "express";
import {
  getallusers,
  getuserbyid,
  Login,
  Signup,
  updateprofile,
  toggleBookmark,
  getBookmarks,
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

export default router;
