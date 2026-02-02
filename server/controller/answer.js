import mongoose from "mongoose";
import question from "../models/question.js";
import user from "../models/auth.js";

// Helper function to update reputation
const updateReputation = async (userid, amount) => {
  try {
    await user.findByIdAndUpdate(userid, { $inc: { reputation: amount } });
  } catch (error) {
    console.log("Error updating reputation:", error);
  }
};

// Helper function to check and award badges
const checkAndAwardBadges = async (userid) => {
  try {
    const userData = await user.findById(userid);
    if (!userData) return;

    const badges = [];
    
    // First Answer badge (bronze)
    if (userData.answersCount >= 1 && !userData.badgesList.find(b => b.name === "First Answer")) {
      badges.push({ name: "First Answer", type: "bronze" });
    }
    
    // Teacher badge - First answer with score of 1 or more (bronze)
    if (userData.answersCount >= 10 && !userData.badgesList.find(b => b.name === "Teacher")) {
      badges.push({ name: "Teacher", type: "bronze" });
    }

    if (badges.length > 0) {
      const badgeUpdates = { gold: 0, silver: 0, bronze: 0 };
      badges.forEach(b => badgeUpdates[b.type]++);
      
      await user.findByIdAndUpdate(userid, {
        $push: { badgesList: { $each: badges } },
        $inc: {
          "badges.gold": badgeUpdates.gold,
          "badges.silver": badgeUpdates.silver,
          "badges.bronze": badgeUpdates.bronze,
        },
      });
    }
  } catch (error) {
    console.log("Error checking badges:", error);
  }
};

export const Askanswer = async (req, res) => {
  const { id: _id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(_id)) {
    return res.status(400).json({ message: "question unavailable" });
  }
  const { noofanswer, answerbody, useranswered, userid } = req.body;
  
  // Validate answer body
  if (!answerbody || answerbody.trim().length < 10) {
    return res.status(400).json({ message: "Answer must be at least 10 characters" });
  }
  
  updatenoofanswer(_id, noofanswer);

  try {
    const updatequestion = await question.findByIdAndUpdate(
      _id,
      {
        $addToSet: { answer: [{ answerbody, useranswered, userid }] },
      },
      { new: true }
    );
    
    // Update user's answer count
    await user.findByIdAndUpdate(userid, {
      $inc: { answersCount: 1 },
    });
    
    // Check for badges
    await checkAndAwardBadges(userid);
    
    res.status(200).json({ data: updatequestion });
  } catch (error) {
    console.log(error);
    res.status(500).json("something went wrong..");
    return;
  }
};

const updatenoofanswer = async (_id, noofanswer) => {
  try {
    await question.findByIdAndUpdate(_id, { $set: { noofanswer: noofanswer } });
  } catch (error) {
    console.log(error);
  }
};

export const deleteanswer = async (req, res) => {
  const { id: _id } = req.params;
  const { noofanswer, answerid } = req.body;
  if (!mongoose.Types.ObjectId.isValid(_id)) {
    return res.status(400).json({ message: "question unavailable" });
  }
  if (!mongoose.Types.ObjectId.isValid(answerid)) {
    return res.status(400).json({ message: "answer unavailable" });
  }
  
  try {
    // Get the answer to find the user
    const questionDoc = await question.findById(_id);
    const answer = questionDoc.answer.id(answerid);
    
    if (answer) {
      // Decrease user's answer count
      await user.findByIdAndUpdate(answer.userid, {
        $inc: { answersCount: -1 },
      });
      
      // If this was the accepted answer, remove the reputation
      if (questionDoc.acceptedAnswerId && questionDoc.acceptedAnswerId.toString() === answerid) {
        await updateReputation(answer.userid, -15);
        await updateReputation(questionDoc.userid, -2);
        questionDoc.acceptedAnswerId = null;
      }
    }
    
    updatenoofanswer(_id, noofanswer);
    
    const updatequestion = await question.updateOne(
      { _id },
      {
        $pull: { answer: { _id: answerid } },
        $set: { acceptedAnswerId: questionDoc.acceptedAnswerId },
      }
    );
    res.status(200).json({ data: updatequestion });
  } catch (error) {
    console.log(error);
    res.status(500).json("something went wrong..");
    return;
  }
};

export const voteanswer = async (req, res) => {
  const { id: _id } = req.params;
  const { answerid, value, userid } = req.body;

  if (!mongoose.Types.ObjectId.isValid(_id)) {
    return res.status(404).send("question unavailable...");
  }
  if (!mongoose.Types.ObjectId.isValid(answerid)) {
    return res.status(404).send("answer unavailable...");
  }

  try {
    const questionDoc = await question.findById(_id);
    const answer = questionDoc.answer.id(answerid);

    if (!answer) {
      return res.status(404).send("answer not found...");
    }
    
    // Can't vote on own answer
    if (answer.userid === userid) {
      return res.status(400).json({ message: "You cannot vote on your own answer" });
    }

    const upIndex = answer.upvote.findIndex((id) => id === String(userid));
    const downIndex = answer.downvote.findIndex((id) => id === String(userid));
    
    let reputationChange = 0;

    if (value === "upvote") {
      if (downIndex !== -1) {
        answer.downvote = answer.downvote.filter((id) => id !== String(userid));
        reputationChange += 2; // Remove downvote penalty
      }
      if (upIndex === -1) {
        answer.upvote.push(userid);
        reputationChange += 10; // Answer upvote gives +10 rep
      } else {
        answer.upvote = answer.upvote.filter((id) => id !== String(userid));
        reputationChange -= 10; // Remove upvote bonus
      }
    } else if (value === "downvote") {
      if (upIndex !== -1) {
        answer.upvote = answer.upvote.filter((id) => id !== String(userid));
        reputationChange -= 10;
      }
      if (downIndex === -1) {
        answer.downvote.push(userid);
        reputationChange -= 2; // Answer downvote gives -2 rep
        // Downvoter also loses 1 rep
        await updateReputation(userid, -1);
      } else {
        answer.downvote = answer.downvote.filter((id) => id !== String(userid));
        reputationChange += 2;
        // Restore downvoter's rep
        await updateReputation(userid, 1);
      }
    }
    
    // Update answer author's reputation
    if (reputationChange !== 0) {
      await updateReputation(answer.userid, reputationChange);
      await checkAndAwardBadges(answer.userid);
    }

    await questionDoc.save();

    res.status(200).json({ data: questionDoc });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Something went wrong" });
  }
};
