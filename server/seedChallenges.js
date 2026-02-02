import mongoose from "mongoose";
import dotenv from "dotenv";
import Challenge from "./models/challenge.js";

dotenv.config();

const challenges = [
    {
        title: "The Great Algorithm Sprint",
        description:
            "Solve 5 algorithmic problems in under 60 minutes. Test your speed and efficiency against the community.",
        difficulty: "Hard",
        reward: "500 Rep",
        daysLeft: 2,
    },
    {
        title: "React Component Cleanup",
        description:
            "Refactor a messy component into a clean, reusable one. focus on performance and readability.",
        difficulty: "Medium",
        reward: "Badges",
        daysLeft: 5,
    },
    {
        title: "CSS Art Challenge",
        description:
            "Create a pure CSS illustration of a retro computer. No SVGs or images allowed!",
        difficulty: "Easy",
        reward: "Profile Frame",
        daysLeft: 12,
    },
];

mongoose
    .connect("mongodb://localhost:27017/stackoverflow-clone", { useNewUrlParser: true, useUnifiedTopology: true })
    .then(async () => {
        console.log("Connected to MongoDB for seeding");
        await Challenge.deleteMany({}); // Optional: clear existing challenges
        await Challenge.insertMany(challenges);
        console.log("Challenges seeded successfully");
        process.exit(0);
    })
    .catch((err) => {
        console.error("Error seeding challenges:", err);
        process.exit(1);
    });
