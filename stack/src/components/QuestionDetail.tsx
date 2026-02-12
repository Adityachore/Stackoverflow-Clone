import {
  Bookmark,
  Check,
  ChevronDown,
  ChevronUp,
  Clock,
  Eye,
  Flag,
  History,
  Share,
  Trash,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import Link from "next/link";
import { Badge } from "./ui/badge";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Textarea } from "./ui/textarea";
import { toast } from "react-toastify";
import { useRouter } from "next/router";
import axiosInstance from "@/lib/axiosinstance";
import { useAuth } from "@/lib/AuthContext";

// Comment Component
const CommentSection = ({
  comments,
  onAddComment,
}: {
  comments: any[];
  onAddComment: (body: string) => void;
}) => {
  const [showComments, setShowComments] = useState(comments?.length <= 5);
  const [newComment, setNewComment] = useState("");
  const [showInput, setShowInput] = useState(false);
  const { user } = useAuth();

  const handleSubmit = () => {
    if (!newComment.trim()) return;
    if (newComment.length > 600) {
      toast.error("Comment must be less than 600 characters");
      return;
    }
    onAddComment(newComment);
    setNewComment("");
    setShowInput(false);
  };

  const displayComments = showComments ? comments : comments?.slice(0, 5);

  return (
    <div className="border-t border-gray-100 mt-4 pt-4">
      {displayComments?.map((comment: any, index: number) => (
        <div
          key={comment._id || index}
          className="text-sm text-gray-700 py-2 border-b border-gray-50"
        >
          <span>{comment.body}</span>
          <span className="text-gray-500 ml-2">–</span>
          <Link
            href={`/users/${comment.userid}`}
            className="text-blue-600 hover:text-blue-800 ml-1"
          >
            {comment.username}
          </Link>
          <span className="text-gray-400 ml-2 text-xs">
            {new Date(comment.createdAt).toLocaleDateString()}
          </span>
        </div>
      ))}

      {comments?.length > 5 && !showComments && (
        <button
          onClick={() => setShowComments(true)}
          className="text-sm text-blue-600 hover:text-blue-800 mt-2"
        >
          Show {comments.length - 5} more comments
        </button>
      )}

      {showInput ? (
        <div className="mt-3">
          <Textarea
            placeholder="Add a comment (max 600 characters)..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="min-h-16 text-sm"
            maxLength={600}
          />
          <div className="flex justify-between items-center mt-2">
            <span className="text-xs text-gray-400">
              {newComment.length}/600
            </span>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowInput(false)}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSubmit}
                disabled={!newComment.trim()}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Add Comment
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <button
          onClick={() => {
            if (!user) {
              toast.info("Please login to comment");
              return;
            }
            setShowInput(true);
          }}
          className="text-sm text-gray-500 hover:text-blue-600 mt-2"
        >
          Add a comment
        </button>
      )}
    </div>
  );
};

const QuestionDetail = ({ questionId }: any) => {
  const router = useRouter();
  const [question, setquestion] = useState<any>(null);
  const [newanswer, setnewAnswer] = useState("");
  const [isSubmitting, setisSubmitting] = useState(false);
  const [loading, setloading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchQuestion = async () => {
      try {
        // Use the new endpoint that increments view count
        const res = await axiosInstance.get(`/question/${questionId}`);
        setquestion(res.data.data);
      } catch (error) {
        console.log(error);
        // Fallback to old method if endpoint doesn't exist
        try {
          const res = await axiosInstance.get("/question/getallquestion");
          const matchedquestion = res.data.data.find(
            (u: any) => u._id === questionId
          );
          setquestion(matchedquestion);
        } catch (err) {
          console.log(err);
        }
      } finally {
        setloading(false);
      }
    };
    if (questionId) {
      fetchQuestion();
    }
  }, [questionId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!question) {
    return (
      <div className="text-center text-gray-500 mt-4">No question found.</div>
    );
  }

  const handleVote = async (vote: String) => {
    if (!user) {
      toast.info("Please login to continue");
      router.push("/auth");
      return;
    }
    try {
      const res = await axiosInstance.patch(`/question/vote/${question._id}`, {
        value: vote,
        userid: user?._id,
      });
      if (res.data.data) {
        setquestion(res.data.data);
        toast.success("Vote Updated");
      }
    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.message || "Failed to Vote question");
    }
  };

  const handleAnswerVote = async (ansId: string, vote: string) => {
    if (!user) {
      toast.info("Please login to continue");
      router.push("/auth");
      return;
    }
    try {
      const res = await axiosInstance.patch(`/answer/vote/${question._id}`, {
        value: vote,
        userid: user?._id,
        answerid: ansId,
      });
      if (res.data.data) {
        setquestion(res.data.data);
        toast.success("Vote Updated");
      }
    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.message || "Failed to Vote answer");
    }
  };

  const handleAcceptAnswer = async (ansId: string) => {
    if (!user) {
      toast.info("Please login to continue");
      router.push("/auth");
      return;
    }
    try {
      const res = await axiosInstance.patch(`/question/accept/${question._id}`, {
        answerId: ansId,
        userid: user?._id,
      });
      if (res.data.data) {
        setquestion(res.data.data);
        toast.success(
          res.data.data.acceptedAnswerId?.toString() === ansId
            ? "Answer accepted!"
            : "Answer unaccepted"
        );
      }
    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.message || "Failed to accept answer");
    }
  };

  const handleBookmark = async () => {
    if (!user) {
      toast.info("Please login to bookmark");
      router.push("/auth");
      return;
    }
    try {
      await axiosInstance.patch(`/user/bookmark/${user._id}`, {
        questionId: question._id,
      });
      setquestion((prev: any) => ({ ...prev, isBookmarked: !prev.isBookmarked }));
      toast.success(question.isBookmarked ? "Bookmark removed" : "Question bookmarked");
    } catch (error) {
      console.error(error);
      toast.error("Failed to bookmark");
    }
  };

  const handleAddQuestionComment = async (body: string) => {
    if (!user) {
      toast.info("Please login to comment");
      router.push("/auth");
      return;
    }
    try {
      const res = await axiosInstance.post(`/question/comment/${question._id}`, {
        body,
        userid: user._id,
        username: user.name,
      });
      if (res.data.data) {
        setquestion(res.data.data);
        toast.success("Comment added");
      }
    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.message || "Failed to add comment");
    }
  };

  const handleAddAnswerComment = async (answerId: string, body: string) => {
    if (!user) {
      toast.info("Please login to comment");
      router.push("/auth");
      return;
    }
    try {
      const res = await axiosInstance.post(
        `/question/answercomment/${question._id}`,
        {
          answerId,
          body,
          userid: user._id,
          username: user.name,
        }
      );
      if (res.data.data) {
        setquestion(res.data.data);
        toast.success("Comment added");
      }
    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.message || "Failed to add comment");
    }
  };

  const handleSubmitanswer = async () => {
    if (!user) {
      toast.info("Please login to continue");
      router.push("/auth");
      return;
    }
    if (!newanswer.trim()) return;
    
    if (newanswer.trim().length < 10) {
      toast.error("Answer must be at least 10 characters");
      return;
    }

    setisSubmitting(true);
    try {
      const res = await axiosInstance.post(
        `/answer/postanswer/${question?._id}`,
        {
          noofanswer: question.noofanswer + 1,
          answerbody: newanswer,
          useranswered: user.name,
          userid: user._id,
        }
      );
      if (res.data.data) {
        setquestion(res.data.data);
        toast.success("Answer posted!");
        setnewAnswer("");
      }
    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.message || "Failed to post answer");
    } finally {
      setisSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!user) {
      toast.info("Please login to continue");
      router.push("/auth");
      return;
    }
    if (!window.confirm("Are you sure you want to delete this question?"))
      return;
    try {
      const res = await axiosInstance.delete(
        `/question/delete/${question._id}`
      );
      if (res.data.message) {
        toast.success(res.data.message);
        router.push("/");
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete question");
    }
  };

  const handleDeleteanswer = async (id: String) => {
    if (!user) {
      toast.info("Please login to continue");
      router.push("/auth");
      return;
    }
    if (!window.confirm("Are you sure you want to delete this answer?"))
      return;
    try {
      const res = await axiosInstance.delete(`/answer/delete/${question._id}`, {
        data: {
          noofanswer: question.noofanswer - 1,
          answerid: id,
        },
      });
      if (res.data.data) {
        const updateanswer = question.answer.filter(
          (ans: any) => ans._id !== id
        );
        setquestion((prev: any) => ({
          ...prev,
          noofanswer: updateanswer.length,
          answer: updateanswer,
          acceptedAnswerId:
            prev.acceptedAnswerId?.toString() === id
              ? null
              : prev.acceptedAnswerId,
        }));
        toast.success("Deleted successfully");
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete answer");
    }
  };

  // Format date helper
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const isQuestionAuthor = question.userid === user?._id;

  return (
    <div className="max-w-5xl">
      {/* Question Header */}
      <div className="mb-6">
        <h1 className="text-xl lg:text-2xl font-semibold mb-4 text-gray-900 dark:text-white">
          {question.questiontitle}
        </h1>

        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-4">
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            <span>Asked {formatDate(question.askedon)}</span>
          </div>
          <div className="flex items-center gap-1">
            <Eye className="w-4 h-4" />
            <span>Viewed {question.views || 0} times</span>
          </div>
        </div>
      </div>

      {/* Question Content */}
      <Card className="mb-8">
        <CardContent className="p-0">
          <div className="flex flex-col sm:flex-row">
            {/* Voting Section */}
            <div className="flex sm:flex-col items-center sm:items-center p-4 sm:p-6 border-b sm:border-b-0 sm:border-r border-gray-200">
              <Button
                variant="ghost"
                size="sm"
                className={`p-2 ${
                  question.upvote?.includes(user?._id)
                    ? "text-orange-500"
                    : "text-gray-600 hover:text-orange-500"
                }`}
                onClick={() => handleVote("upvote")}
              >
                <ChevronUp className="w-6 h-6" />
              </Button>
              <span className="text-lg font-semibold">
                {(question.upvote?.length || 0) -
                  (question.downvote?.length || 0)}
              </span>
              <Button
                variant="ghost"
                size="sm"
                className={`p-2 ${
                  question.downvote?.includes(user?._id)
                    ? "text-blue-500"
                    : "text-gray-600 hover:text-orange-500"
                }`}
                onClick={() => handleVote("downvote")}
              >
                <ChevronDown className="w-6 h-6" />
              </Button>
              <div className="flex sm:flex-col gap-2 sm:gap-4 mt-4 sm:mt-6">
                <Button
                  variant="ghost"
                  size="sm"
                  className={`p-2 ${
                    question?.isBookmarked
                      ? "text-yellow-500"
                      : "text-gray-600 hover:text-yellow-500"
                  }`}
                  onClick={handleBookmark}
                >
                  <Bookmark
                    className="w-5 h-5"
                    fill={question?.isBookmarked ? "currentColor" : "none"}
                  />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="p-2 text-gray-600 hover:text-gray-800"
                >
                  <History className="w-5 h-5" />
                </Button>
              </div>
            </div>
            <div className="flex-1 p-4 sm:p-6">
              <div className="prose dark:prose-invert max-w-none mb-6">
                <div
                  className="text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-wrap"
                  dangerouslySetInnerHTML={{
                    __html: question.questionbody
                      .replace(
                        /## (.*)/g,
                        '<h3 class="text-lg font-semibold mt-6 mb-3 text-gray-900 dark:text-white">$1</h3>'
                      )
                      .replace(
                        /```(\w+)?\n([\s\S]*?)```/g,
                        '<pre class="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg overflow-x-auto my-4"><code class="text-sm">$2</code></pre>'
                      )
                      .replace(
                        /`([^`]+)`/g,
                        '<code class="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-sm">$1</code>'
                      ),
                  }}
                />
              </div>
              <div className="flex flex-wrap gap-2 mb-6">
                {question.questiontags?.map((tag: any) => (
                  <Link key={tag} href={`/tags/${tag}`}>
                    <Badge
                      variant="secondary"
                      className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900/50 cursor-pointer"
                    >
                      {tag}
                    </Badge>
                  </Link>
                ))}
              </div>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                    onClick={() => {
                      navigator.clipboard.writeText(window.location.href);
                      toast.success("Link copied to clipboard!");
                    }}
                  >
                    <Share className="w-4 h-4 mr-1" />
                    Share
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                  >
                    <Flag className="w-4 h-4 mr-1" />
                    Flag
                  </Button>
                  {question.userid === user?._id && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleDelete}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash className="w-4 h-4 mr-1" />
                      Delete
                    </Button>
                  )}
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <span className="text-gray-600">
                    asked {formatDate(question.askedon)}
                  </span>
                  <Link
                    href={`/users/${question.userid}`}
                    className="flex items-center gap-2 hover:bg-blue-50 p-2 rounded"
                  >
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="text-sm">
                        {question.userposted?.[0] || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="text-blue-600 hover:text-blue-800 font-medium">
                        {question.userposted}
                      </div>
                    </div>
                  </Link>
                </div>
              </div>

              {/* Question Comments */}
              <CommentSection
                comments={question.comments || []}
                onAddComment={handleAddQuestionComment}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Answers Section */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-6 text-gray-900 dark:text-white">
          {question.answer?.length || 0} Answer
          {(question.answer?.length || 0) !== 1 ? "s" : ""}
        </h2>
        <div className="space-y-6">
          {(question.answer || []).map((ans: any) => {
            const isAccepted =
              question.acceptedAnswerId?.toString() === ans._id?.toString();
            return (
              <Card
                key={ans._id}
                className={isAccepted ? "border-green-500 border-2" : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"}
              >
                <CardContent className="p-0">
                  <div className="flex flex-col sm:flex-row">
                    {/* Answer Voting Section */}
                    <div className="flex sm:flex-col items-center sm:items-center p-4 sm:p-6 border-b sm:border-b-0 sm:border-r border-gray-200 dark:border-gray-700">
                      <Button
                        variant="ghost"
                        size="sm"
                        className={`p-2 ${
                          ans.upvote?.includes(user?._id)
                            ? "text-orange-500"
                            : "text-gray-600 dark:text-gray-400 hover:text-orange-500"
                        }`}
                        onClick={() => handleAnswerVote(ans._id, "upvote")}
                      >
                        <ChevronUp className="w-6 h-6" />
                      </Button>
                      <span className="text-lg font-semibold">
                        {(ans.upvote?.length || 0) -
                          (ans.downvote?.length || 0)}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className={`p-2 ${
                          ans.downvote?.includes(user?._id)
                            ? "text-blue-500"
                            : "text-gray-600 hover:text-orange-500"
                        }`}
                        onClick={() => handleAnswerVote(ans._id, "downvote")}
                      >
                        <ChevronDown className="w-6 h-6" />
                      </Button>

                      {/* Accept Answer Button - Only visible to question author */}
                      {isQuestionAuthor && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className={`p-2 mt-2 ${
                            isAccepted
                              ? "text-green-500"
                              : "text-gray-400 hover:text-green-500"
                          }`}
                          onClick={() => handleAcceptAnswer(ans._id)}
                          title={
                            isAccepted
                              ? "Click to unaccept this answer"
                              : "Accept this answer"
                          }
                        >
                          <Check
                            className="w-6 h-6"
                            strokeWidth={isAccepted ? 3 : 2}
                          />
                        </Button>
                      )}

                      {/* Show accepted checkmark for non-authors */}
                      {!isQuestionAuthor && isAccepted && (
                        <div className="p-2 mt-2 text-green-500">
                          <Check className="w-6 h-6" strokeWidth={3} />
                        </div>
                      )}
                    </div>

                    {/* Answer Content */}
                    <div className="flex-1 p-4 sm:p-6">
                      {isAccepted && (
                        <div className="mb-3 text-green-600 text-sm font-medium flex items-center gap-1">
                          <Check className="w-4 h-4" />
                          Accepted Answer
                        </div>
                      )}
                      <div className="prose dark:prose-invert max-w-none mb-6">
                        <div
                          className="text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-wrap"
                          dangerouslySetInnerHTML={{
                            __html: ans.answerbody
                              .replace(
                                /## (.*)/g,
                                '<h3 class="text-lg font-semibold mt-6 mb-3 text-gray-900 dark:text-white">$1</h3>'
                              )
                              .replace(
                                /```(\w+)?\n([\s\S]*?)```/g,
                                '<pre class="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg overflow-x-auto my-4"><code class="text-sm">$2</code></pre>'
                              )
                              .replace(
                                /`([^`]+)`/g,
                                '<code class="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-sm">$1</code>'
                              ),
                          }}
                        />
                      </div>
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                            onClick={() => {
                              navigator.clipboard.writeText(
                                `${window.location.href}#answer-${ans._id}`
                              );
                              toast.success("Link copied to clipboard!");
                            }}
                          >
                            <Share className="w-4 h-4 mr-1" />
                            Share
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-gray-600 hover:text-gray-800"
                          >
                            <Flag className="w-4 h-4 mr-1" />
                            Flag
                          </Button>
                          {ans.userid === user?._id && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteanswer(ans._id)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <Trash className="w-4 h-4 mr-1" />
                              Delete
                            </Button>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-gray-600">
                            answered {formatDate(ans.answeredon)}
                          </span>
                          <Link
                            href={`/users/${ans.userid}`}
                            className="flex items-center gap-2 hover:bg-blue-50 p-2 rounded"
                          >
                            <Avatar className="w-8 h-8">
                              <AvatarFallback className="text-sm">
                                {ans.useranswered?.[0] || "U"}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="text-blue-600 hover:text-blue-800 font-medium">
                                {ans.useranswered}
                              </div>
                            </div>
                          </Link>
                        </div>
                      </div>

                      {/* Answer Comments */}
                      <CommentSection
                        comments={ans.comments || []}
                        onAddComment={(body) =>
                          handleAddAnswerComment(ans._id, body)
                        }
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Answer Form */}
      <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
            Your Answer
          </h3>
          <Textarea
            placeholder="Write your answer here... You can use Markdown formatting. Minimum 10 characters."
            value={newanswer}
            onChange={(e) => setnewAnswer(e.target.value)}
            className="min-h-32 mb-4 resize-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-200 dark:border-gray-600"
          />
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <Button
              onClick={handleSubmitanswer}
              disabled={!newanswer.trim() || isSubmitting}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isSubmitting ? "Posting..." : "Post Your Answer"}
            </Button>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              By posting your answer, you agree to the{" "}
              <Link href="#" className="text-blue-600 dark:text-blue-400 hover:underline">
                privacy policy
              </Link>{" "}
              and{" "}
              <Link href="#" className="text-blue-600 dark:text-blue-400 hover:underline">
                terms of service
              </Link>
              .
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default QuestionDetail;
