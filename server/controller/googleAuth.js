import axios from "axios";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import user from "../models/auth.js";

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo";

const normalizeFriendBase = (name = "USER") => {
  const cleaned = name.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  return (cleaned || "USER").slice(0, 12);
};

const generateFriendCode = async (name = "USER") => {
  const base = normalizeFriendBase(name);
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const code = `${base}${Math.floor(1000 + Math.random() * 9000)}`;
    const exists = await user.exists({ friendCode: code });
    if (!exists) return code;
  }
  return `${base}${Date.now().toString().slice(-4)}`;
};

const getGoogleConfig = () => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const callbackUrl = process.env.GOOGLE_CALLBACK_URL;
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";

  if (!clientId || !clientSecret || !callbackUrl) {
    throw new Error("Google OAuth is not configured. Missing GOOGLE_CLIENT_ID/SECRET/CALLBACK_URL.");
  }

  return { clientId, clientSecret, callbackUrl, frontendUrl };
};

export const startGoogleAuth = async (req, res) => {
  try {
    const { clientId, callbackUrl } = getGoogleConfig();
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: callbackUrl,
      response_type: "code",
      scope: "openid email profile",
      access_type: "offline",
      prompt: "consent",
    });

    return res.redirect(`${GOOGLE_AUTH_URL}?${params.toString()}`);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: error.message || "Google OAuth not configured" });
  }
};

export const handleGoogleCallback = async (req, res) => {
  const { code, error } = req.query;

  if (error) {
    return res.redirect(`/auth?error=${encodeURIComponent(String(error))}`);
  }

  if (!code) {
    return res.status(400).json({ message: "Missing authorization code" });
  }

  try {
    const { clientId, clientSecret, callbackUrl, frontendUrl } = getGoogleConfig();

    const tokenResponse = await axios.post(
      GOOGLE_TOKEN_URL,
      new URLSearchParams({
        code: String(code),
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: callbackUrl,
        grant_type: "authorization_code",
      }),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );

    const { access_token: accessToken } = tokenResponse.data || {};
    if (!accessToken) {
      return res.status(400).json({ message: "Failed to obtain Google access token" });
    }

    const userInfoResponse = await axios.get(GOOGLE_USERINFO_URL, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const { email, name } = userInfoResponse.data || {};
    if (!email) {
      return res.status(400).json({ message: "Google account has no email" });
    }

    let existingUser = await user.findOne({ email });

    if (!existingUser) {
      const randomPassword = Math.random().toString(36).slice(2) + Date.now().toString(36);
      const hashpassword = await bcrypt.hash(randomPassword, 12);
      const friendCode = await generateFriendCode(name || "USER");

      existingUser = await user.create({
        name: name || email.split("@")[0],
        email,
        password: hashpassword,
        friendCode,
      });
    }

    const token = jwt.sign(
      { email: existingUser.email, id: existingUser._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    const redirectUrl = `${frontendUrl}/auth/google-callback?token=${encodeURIComponent(token)}`;
    return res.redirect(redirectUrl);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Google OAuth failed" });
  }
};
