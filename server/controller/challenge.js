import mongoose from "mongoose";
import Challenge from "../models/challenge.js";

export const getAllChallenges = async (req, res) => {
    try {
        const challenges = await Challenge.find().sort({ createdOn: -1 });
        res.status(200).json({ data: challenges });
    } catch (error) {
        res.status(500).json({ message: "Something went wrong" });
    }
};

export const createChallenge = async (req, res) => {
    const { title, description, difficulty, reward, daysLeft } = req.body;
    try {
        const newChallenge = await Challenge.create({
            title,
            description,
            difficulty,
            reward,
            daysLeft
        });
        res.status(200).json({ data: newChallenge });
    } catch (error) {
        res.status(500).json({ message: "Something went wrong" });
    }
};

export const joinChallenge = async (req, res) => {
    const { id } = req.params;
    const { userId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(404).send("Challenge unavailable...");
    }

    try {
        const challenge = await Challenge.findById(id);
        const index = challenge.participants.findIndex((id) => id === String(userId));

        if (index === -1) {
            challenge.participants.push(userId);
        } else {
            challenge.participants = challenge.participants.filter((id) => id !== String(userId));
        }

        await challenge.save();
        res.status(200).json({ data: challenge });
    } catch (error) {
        res.status(500).json({ message: "Something went wrong" });
    }
};
