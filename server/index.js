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

// Security: Configure CORS with whitelist
const corsOptions = {
  origin: process.env.CORS_ORIGIN 
    ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim())
    : ['http://localhost:3000', 'https://stack-clone-elevance.netlify.app', /\.vercel\.app$/],
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
