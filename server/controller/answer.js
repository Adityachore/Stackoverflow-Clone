import mongoose from "mongoose";
import question from "../models/question.js";

export const Askanswer = async (req, res) => {
  const { id: _id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(_id)) {
    return res.status(400).json({ message: "question unavailable" });
  }
  const { noofanswer, answerbody, useranswered, userid } = req.body;
  updatenoofanswer(_id, noofanswer);

  try {
    const updatequestion = await question.findByIdAndUpdate(_id, {
      $addToSet: { answer: [{ answerbody, useranswered, userid }] },
    });
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
  updatenoofanswer(_id, noofanswer);
  try {
    const updatequestion = await question.updateOne(
      { _id },
      {
        $pull: { answer: { _id: answerid } },
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

    const upIndex = answer.upvote.findIndex((id) => id === String(userid));
    const downIndex = answer.downvote.findIndex((id) => id === String(userid));

    if (value === "upvote") {
      if (downIndex !== -1) {
        answer.downvote = answer.downvote.filter((id) => id !== String(userid));
      }
      if (upIndex === -1) {
        answer.upvote.push(userid);
      } else {
        answer.upvote = answer.upvote.filter((id) => id !== String(userid));
      }
    } else if (value === "downvote") {
      if (upIndex !== -1) {
        answer.upvote = answer.upvote.filter((id) => id !== String(userid));
      }
      if (downIndex === -1) {
        answer.downvote.push(userid);
      } else {
        answer.downvote = answer.downvote.filter((id) => id !== String(userid));
      }
    }

    await questionDoc.save();

    res.status(200).json({ data: questionDoc });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Something went wrong" });
  }
};
