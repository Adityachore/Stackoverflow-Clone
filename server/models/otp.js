import mongoose from "mongoose";

const otpSchema = mongoose.Schema(
  {
    email: { type: String, required: true, index: true },
    otpHash: { type: String, required: true },
    purpose: {
      type: String,
      enum: ["registration", "password-reset", "login"],
      default: "registration",
      index: true
    },
    createdAt: { type: Date, default: Date.now, index: true },
    expiresAt: { type: Date, required: true },
    attempts: { type: Number, default: 0 },
    verified: { type: Boolean, default: false }
  },
  { timestamps: false }
);

otpSchema.index({ email: 1, createdAt: -1 });
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model("otp", otpSchema);
