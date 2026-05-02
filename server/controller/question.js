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
    
    // First Question badge (bronze)
    if (userData.questionsCount >= 1 && !userData.badgesList.find(b => b.name === "First Question")) {
      badges.push({ name: "First Question", type: "bronze" });
    }
    
    // Curious badge - Ask 5 questions (bronze)
    if (userData.questionsCount >= 5 && !userData.badgesList.find(b => b.name === "Curious")) {
      badges.push({ name: "Curious", type: "bronze" });
    }
    
    // Scholar badge - First accepted answer (bronze)
    if (userData.answersCount >= 1 && !userData.badgesList.find(b => b.name === "Scholar")) {
      badges.push({ name: "Scholar", type: "bronze" });
    }

    // Reputation-based badges
    if (userData.reputation >= 100 && !userData.badgesList.find(b => b.name === "Established User")) {
      badges.push({ name: "Established User", type: "bronze" });
    }
    if (userData.reputation >= 500 && !userData.badgesList.find(b => b.name === "Trusted User")) {
      badges.push({ name: "Trusted User", type: "silver" });
    }
    if (userData.reputation >= 1000 && !userData.badgesList.find(b => b.name === "Expert")) {
      badges.push({ name: "Expert", type: "gold" });
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

export const Askquestion = async (req, res) => {
  const { postquestiondata } = req.body;
  
  // Validate title length
  if (!postquestiondata.questiontitle || postquestiondata.questiontitle.length < 15) {
    return res.status(400).json({ message: "Title must be at least 15 characters" });
  }
  
  // Validate body length
  if (!postquestiondata.questionbody || postquestiondata.questionbody.length < 20) {
    return res.status(400).json({ message: "Question body must be at least 20 characters" });
  }
  
  // Validate tags
  if (!postquestiondata.questiontags || postquestiondata.questiontags.length === 0) {
    return res.status(400).json({ message: "At least one tag is required" });
  }
  if (postquestiondata.questiontags.length > 5) {
    return res.status(400).json({ message: "Maximum 5 tags allowed" });
  }
  
  const postques = new question({ ...postquestiondata });
  try {
    await postques.save();
    
    // Update user's question count
    await user.findByIdAndUpdate(postquestiondata.userid, {
      $inc: { questionsCount: 1 },
    });
    
    // Check for badges
    await checkAndAwardBadges(postquestiondata.userid);
    
    res.status(200).json({ data: postques });
  } catch (error) {
    console.log(error);
    res.status(500).json("something went wrong..");
    return;
  }
};

export const getallquestion = async (req, res) => {
  try {
    const allquestion = await question.find().sort({ askedon: -1 });
    res.status(200).json({ data: allquestion });
  } catch (error) {
    res.status(500).json("something went wrong..");
    return;
  }
};

export const getquestionbyid = async (req, res) => {
  const { id } = req.params;
  
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid question ID" });
  }
  
  try {
    // Increment view count
    const questionDoc = await question.findByIdAndUpdate(
      id,
      { $inc: { views: 1 } },
      { new: true }
    );
    
    if (!questionDoc) {
      return res.status(404).json({ message: "Question not found" });
    }
    
    res.status(200).json({ data: questionDoc });
  } catch (error) {
    res.status(500).json("something went wrong..");
    return;
  }
};

export const deletequestion = async (req, res) => {
  const { id: _id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(_id)) {
    return res.status(400).json({ message: "question unavailable" });
  }
  try {
    const questionDoc = await question.findById(_id);
    if (questionDoc) {
      // Decrease user's question count
      await user.findByIdAndUpdate(questionDoc.userid, {
        $inc: { questionsCount: -1 },
      });
    }
    
    await question.findByIdAndDelete(_id);
    res.status(200).json({ message: "question deleted" });
  } catch (error) {
    res.status(500).json("something went wrong..");
    return;
  }
};

export const votequestion = async (req, res) => {
  const { id: _id } = req.params;
  const { value, userid } = req.body;
  
  if (!mongoose.Types.ObjectId.isValid(_id)) {
    return res.status(400).json({ message: "question unavailable" });
  }
  
  try {
    const questionDoc = await question.findById(_id);
    
    // Can't vote on own question
    if (questionDoc.userid === userid) {
      return res.status(400).json({ message: "You cannot vote on your own question" });
    }
    
    const upindex = questionDoc.upvote.findIndex((id) => id === String(userid));
    const downindex = questionDoc.downvote.findIndex((id) => id === String(userid));
    
    let reputationChange = 0;
    
    if (value === "upvote") {
      if (downindex !== -1) {
        questionDoc.downvote = questionDoc.downvote.filter((id) => id !== String(userid));
        reputationChange += 2; // Remove downvote penalty
      }
      if (upindex === -1) {
        questionDoc.upvote.push(userid);
        reputationChange += 5; // Question upvote gives +5 rep
      } else {
        questionDoc.upvote = questionDoc.upvote.filter((id) => id !== String(userid));
        reputationChange -= 5; // Remove upvote bonus
      }
    } else if (value === "downvote") {
      if (upindex !== -1) {
        questionDoc.upvote = questionDoc.upvote.filter((id) => id !== String(userid));
        reputationChange -= 5;
      }
      if (downindex === -1) {
        questionDoc.downvote.push(userid);
        reputationChange -= 2; // Question downvote gives -2 rep
      } else {
        questionDoc.downvote = questionDoc.downvote.filter((id) => id !== String(userid));
        reputationChange += 2;
      }
    }
    
    // Update question author's reputation
    if (reputationChange !== 0) {
      await updateReputation(questionDoc.userid, reputationChange);
      await checkAndAwardBadges(questionDoc.userid);
    }
    
    const questionvote = await question.findByIdAndUpdate(_id, questionDoc, { new: true });
    res.status(200).json({ data: questionvote });
  } catch (error) {
    res.status(500).json("something went wrong..");
    return;
  }
};

// Accept an answer
export const acceptAnswer = async (req, res) => {
  const { id: questionId } = req.params;
  const { answerId, userid } = req.body;
  
  if (!mongoose.Types.ObjectId.isValid(questionId)) {
    return res.status(400).json({ message: "Invalid question ID" });
  }
  
  try {
    const questionDoc = await question.findById(questionId);
    
    if (!questionDoc) {
      return res.status(404).json({ message: "Question not found" });
    }
    
    // Only question author can accept an answer
    if (questionDoc.userid !== userid) {
      return res.status(403).json({ message: "Only the question author can accept an answer" });
    }
    
    const answer = questionDoc.answer.id(answerId);
    if (!answer) {
      return res.status(404).json({ message: "Answer not found" });
    }
    
    // Toggle accept status
    const previousAcceptedId = questionDoc.acceptedAnswerId;
    
    if (previousAcceptedId && previousAcceptedId.toString() === answerId) {
      // Unaccept the answer
      questionDoc.acceptedAnswerId = null;
      // Remove reputation: -15 from answer author, -2 from question author
      await updateReputation(answer.userid, -15);
      await updateReputation(userid, -2);
    } else {
      // If there was a previously accepted answer, remove its reputation
      if (previousAcceptedId) {
        const prevAnswer = questionDoc.answer.id(previousAcceptedId);
        if (prevAnswer) {
          await updateReputation(prevAnswer.userid, -15);
        }
      }
      
      // Accept the new answer
      questionDoc.acceptedAnswerId = answerId;
      // Add reputation: +15 to answer author, +2 to question author
      await updateReputation(answer.userid, 15);
      await updateReputation(userid, 2);
      await checkAndAwardBadges(answer.userid);
    }
    
    await questionDoc.save();
    res.status(200).json({ data: questionDoc });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

// Add comment to question
export const addQuestionComment = async (req, res) => {
  const { id: questionId } = req.params;
  const { body, userid, username } = req.body;
  
  if (!mongoose.Types.ObjectId.isValid(questionId)) {
    return res.status(400).json({ message: "Invalid question ID" });
  }
  
  if (!body || body.length === 0) {
    return res.status(400).json({ message: "Comment body is required" });
  }
  
  if (body.length > 600) {
    return res.status(400).json({ message: "Comment must be less than 600 characters" });
  }
  
  try {
    const questionDoc = await question.findByIdAndUpdate(
      questionId,
      {
        $push: {
          comments: { body, userid, username },
        },
      },
      { new: true }
    );
    
    res.status(200).json({ data: questionDoc });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

// Add comment to answer
export const addAnswerComment = async (req, res) => {
  const { id: questionId } = req.params;
  const { answerId, body, userid, username } = req.body;
  
  if (!mongoose.Types.ObjectId.isValid(questionId)) {
    return res.status(400).json({ message: "Invalid question ID" });
  }
  
  if (!body || body.length === 0) {
    return res.status(400).json({ message: "Comment body is required" });
  }
  
  if (body.length > 600) {
    return res.status(400).json({ message: "Comment must be less than 600 characters" });
  }
  
  try {
    const questionDoc = await question.findById(questionId);
    const answer = questionDoc.answer.id(answerId);
    
    if (!answer) {
      return res.status(404).json({ message: "Answer not found" });
    }
    
    answer.comments.push({ body, userid, username });
    await questionDoc.save();
    
    res.status(200).json({ data: questionDoc });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

// AI Assist Search
export const aiSearch = async (req, res) => {
  const { query } = req.body;
  if (!query) {
    return res.status(400).json({ message: "Query is required" });
  }

  try {
    // Basic text search using regex on title and body
    // Split query into words and create regex for each
    const words = query.split(' ').filter(w => w.length > 2);
    if (words.length === 0) {
      return res.status(200).json({ results: [] });
    }

    const regexArray = words.map(word => new RegExp(word, 'i'));

    const questions = await question.find({
      $or: [
        { questiontitle: { $in: regexArray } },
        { questionbody: { $in: regexArray } },
        { questiontags: { $in: regexArray } }
      ]
    }).limit(3).lean(); // get top 3 matches

    res.status(200).json({ results: questions });
  } catch (error) {
    console.log("AI Search error:", error);
    res.status(500).json({ message: "Search failed" });
  }
};
