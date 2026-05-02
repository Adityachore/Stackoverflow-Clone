import dotenv from "dotenv";
dotenv.config();

// Initialize payment service AFTER dotenv.config()
import { initializePaymentService } from "./services/payment.js";
initializePaymentService();

import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import userroutes from "./routes/auth.js"
import questionroute from "./routes/question.js"
import answerroutes from "./routes/answer.js"
import challengeroutes from "./routes/challenge.js"
import socialroutes from "./routes/social.js"
import subscriptionroutes from "./routes/subscription.js"
import googleAuthRoutes from "./routes/googleAuth.js"
import friendsroutes from "./routes/friends.js"
import followroutes from "./routes/follow.js"

const app = express();

// Security: Configure CORS with dynamic origin checker
const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'https://stackoverflow-clone-e7dp.vercel.app',
  ...(process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',').map(o => o.trim()) : [])
];

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    // Allow any vercel.app preview/production URL
    if (origin.endsWith('.vercel.app')) return callback(null, true);
    // Allow any origin in the whitelist
    if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
    // Block everything else
    console.warn(`CORS blocked: ${origin}`);
    return callback(new Error(`CORS policy: origin ${origin} not allowed`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(express.json({ limit: "30mb", extended: true }));
app.use(express.urlencoded({ limit: "30mb", extended: true }));
app.use(cors(corsOptions));
app.get("/", (req, res) => {
  res.send("Stackoverflow clone is running perfect");
});
app.use('/user', userroutes)
app.use('/question', questionroute)
app.use('/answer', answerroutes)
app.use('/challenge', challengeroutes)
app.use('/social', socialroutes)
app.use('/subscription', subscriptionroutes)
app.use('/auth', googleAuthRoutes)
app.use('/api/friends', friendsroutes)
app.use('/api/follow', followroutes)
const PORT = process.env.PORT || 5000;
const databaseurl = process.env.MONGODB_URL || process.env.MONGODB_URI;

mongoose
  .connect(databaseurl)
  .then(() => {
    console.log("✅ Connected to MongoDB");
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err.message);
  });
