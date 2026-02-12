import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import Mainlayout from "@/layout/Mainlayout";
import { useAuth } from "@/lib/AuthContext";
import axiosInstance from "@/lib/axiosinstance";
import { Award, Calendar, Edit, Eye, Mail, MapPin, MessageSquare, Phone, Plus, Star, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";

const index = () => {
  const { user, updateUserProfile } = useAuth();
  const router = useRouter();
  const { id } = router.query;
  const profileId = Array.isArray(id) ? id[0] : id;
  const [users, setusers] = useState<any>(null);
  const [userQuestions, setUserQuestions] = useState<any[]>([]);
  const [userAnswers, setUserAnswers] = useState<any[]>([]);
  const [loading, setloading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    about: "",
    tags: [] as string[],
    location: "",
    website: "",
    mobile: "",
  });
  const [newTag, setNewTag] = useState("");

  // --- New Handlers (Moved Up) ---
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [transferAmount, setTransferAmount] = useState("");
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);
  const [selectedLang, setSelectedLang] = useState("English");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [friendCodeInput, setFriendCodeInput] = useState("");

  useEffect(() => {
    const fetchuser = async () => {
      if (!profileId) return;
      try {
        // Fetch user data using the new endpoint
        const res = await axiosInstance.get(`/user/${profileId}`);
        const userData = res.data.data;
        setusers(userData);
        setEditForm({
          name: userData?.name || "",
          about: userData?.about || "",
          tags: userData?.tags || [],
          location: userData?.location || "",
          website: userData?.website || "",
          mobile: userData?.mobile || "",
        });
        setSelectedLang(userData?.language || "English");

        // Fetch questions to show user's activity
        const questionsRes = await axiosInstance.get("/question/getallquestion");
        const allQuestions = questionsRes.data.data || [];

        // Filter questions by this user
        const userQs = allQuestions.filter((q: any) => q.userid === profileId);
        setUserQuestions(userQs);

        // Find answers by this user
        const userAns: any[] = [];
        allQuestions.forEach((q: any) => {
          q.answer?.forEach((ans: any) => {
            if (ans.userid === profileId) {
              userAns.push({
                ...ans,
                questionTitle: q.questiontitle,
                questionId: q._id,
              });
            }
          });
        });
        setUserAnswers(userAns);
      } catch (error) {
        console.log(error);
        // Fallback to old method
        try {
          const res = await axiosInstance.get("/user/getalluser");
          const matcheduser = res.data.data.find((u: any) => u._id === profileId);
          setusers(matcheduser);
          setEditForm({
            name: matcheduser?.name || "",
            about: matcheduser?.about || "",
            tags: matcheduser?.tags || [],
            location: matcheduser?.location || "",
            website: matcheduser?.website || "",
            mobile: matcheduser?.mobile || "",
          });
          setSelectedLang(matcheduser?.language || "English");
        } catch (err) {
          console.log(err);
        }
      } finally {
        setloading(false);
      }
    };
    fetchuser();
  }, [profileId]);

  const handleTransfer = async () => {
    try {
      const { data } = await import("@/lib/api").then(mod => mod.transferPoints(user?._id, {
        recipientId: profileId,
        amount: Number(transferAmount)
      }));
      toast.success(data.message);
      setIsTransferOpen(false);
      setTransferAmount("");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Transfer failed");
    }
  };

  const handleInitiateLang = async () => {
    if (!user?._id) {
      toast.error("You need to be logged in to change language");
      return;
    }
    if (selectedLang !== 'French' && !users?.mobile) {
      toast.error("Add a phone number in your profile to change language");
      return;
    }
    try {
      const { data } = await import("@/lib/api").then(mod => mod.initiateLanguageChange(user._id, selectedLang));
      toast.success(data.message);
      setOtp("");
      setOtpSent(true);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to initiate");
    }
  };

  const handleConfirmLang = async () => {
    if (!user?._id) {
      toast.error("You need to be logged in to confirm language change");
      return;
    }
    try {
      const { data } = await import("@/lib/api").then(mod => mod.confirmLanguageChange(user._id, selectedLang, otp));
      toast.success(data.message);
      setOtpSent(false);
      setOtp("");
      setIsLanguageOpen(false);
      // Update local user state if needed
      if (users) setusers({ ...users, language: selectedLang });
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to confirm");
    }
  };

  const handleCopyCode = async () => {
    if (!users?.friendCode) {
      toast.error("No friend code yet");
      return;
    }
    try {
      await navigator.clipboard.writeText(users.friendCode);
      toast.success("Friend code copied");
    } catch (err) {
      console.log(err);
      toast.error("Copy failed");
    }
  };

  const handleAddFriendByCode = async () => {
    const code = friendCodeInput.trim().toUpperCase();
    if (!code) {
      toast.error("Enter a friend code");
      return;
    }
    if (!user?._id) {
      toast.error("Please log in to add friends");
      return;
    }
    try {
      const { data } = await import("@/lib/api").then((mod) => mod.addFriendByCode(code));
      toast.success(data.message || "Friend added successfully");
      setFriendCodeInput("");
      setusers((prev: any) => {
        if (!prev) return prev;
        const nextFriends = Array.from(new Set([...(prev.friends || []), data.friendId]));
        return { ...prev, friends: nextFriends };
      });
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Could not add friend");
    }
  };

  const handleAddTag = () => {
    const trimmedTag = newTag.trim();
    if (trimmedTag && !editForm.tags.includes(trimmedTag)) {
      setEditForm({ ...editForm, tags: [...editForm.tags, trimmedTag] });
      setNewTag("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setEditForm({
      ...editForm,
      tags: editForm.tags.filter((tag: any) => tag !== tagToRemove),
    });
  };

  const handleSaveProfile = async () => {
    if (!currentUserId) {
      toast.error("You need to be logged in to update your profile");
      return;
    }
    try {
      await updateUserProfile(currentUserId, editForm);
      setIsEditing(false);
    } catch (err) {
      console.log(err);
      toast.error("Update failed");
    }
  };

  const currentUserId = user?._id;
  const isOwnProfile = profileId === currentUserId;
  const reputation = users?.reputation ?? 0;
  const profileViews = users?.profileViews ?? 0;
  const questionsCount = users?.questionsCount ?? userQuestions.length;
  const answersCount = users?.answersCount ?? userAnswers.length;
  const goldBadges = users?.badges?.gold ?? 0;
  const silverBadges = users?.badges?.silver ?? 0;
  const bronzeBadges = users?.badges?.bronze ?? 0;

  if (loading) {
    return (
      <Mainlayout>
        <div className="max-w-6xl">
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </Mainlayout>
    );
  }

  if (!users) {
    return (
      <Mainlayout>
        <div className="max-w-6xl">
          <p className="text-gray-600">User not found.</p>
        </div>
      </Mainlayout>
    );
  }
  return (
    <Mainlayout>
      <div className="max-w-6xl">
        {/* User Header */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center gap-6 mb-8">
          <Avatar className="w-24 h-24 lg:w-32 lg:h-32">
            <AvatarFallback className="text-2xl lg:text-3xl">
              {users.name
                .split(" ")
                .map((n: any) => n[0])
                .join("")}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-800 dark:text-white mb-1">
                  {users.name}
                </h1>
                {/* Reputation Score */}
                <div className="flex items-center gap-2 text-lg">
                  <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                  <span className="font-bold text-gray-700 dark:text-gray-200">{reputation.toLocaleString()}</span>
                  <span className="text-gray-500 dark:text-gray-400 text-sm">reputation</span>
                </div>
              </div>

              {isOwnProfile && (
                <Dialog open={isEditing} onOpenChange={setIsEditing}>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="flex items-center gap-2 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <Edit className="w-4 h-4" />
                      Edit Profile
                    </Button>
                  </DialogTrigger>
                  {/* Edit Profile Dialog Content - Existing code... */}
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
                    <DialogHeader>
                      <DialogTitle className="text-gray-900 dark:text-white">Edit Profile</DialogTitle>
                    </DialogHeader>
                    {/* ... (Existing form content preserved implicitly by not replacing it, but wait, I cannot easily preserve existing content inside DialogContent without reading it all or targeting carefully. I will target the Closing Tag of DialogTrigger and append my new Dialogs after it? No, duplicate Dialogs.
                    
                    Better approach: Add the new Buttons and Dialogs separately.
                    */}
                    <div className="space-y-6 py-4">
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
                        {/* Name Input */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="name" className="text-gray-700">Display Name</Label>
                            <Input id="name" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} placeholder="Your display name" className="bg-white text-gray-900 border-gray-300" />
                          </div>
                          <div>
                            <Label htmlFor="mobile" className="text-gray-700">Phone Number</Label>
                            <Input id="mobile" type="tel" value={editForm.mobile} onChange={(e) => setEditForm({ ...editForm, mobile: e.target.value })} placeholder="+1 (555) 123-4567" className="bg-white text-gray-900 border-gray-300" />
                          </div>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-900">About</h3>
                        <Textarea id="about" value={editForm.about} onChange={(e) => setEditForm({ ...editForm, about: e.target.value })} placeholder="Tell us about yourself..." className="min-h-32 bg-white text-gray-900 border-gray-300" />
                      </div>
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-900">Skills & Technologies</h3>
                        <div className="flex gap-2">
                          <Input value={newTag} onChange={(e) => setNewTag(e.target.value)} placeholder="Add skill" onKeyPress={(e) => e.key === "Enter" && handleAddTag()} className="bg-white text-gray-900 border-gray-300" />
                          <Button onClick={handleAddTag} variant="outline" size="sm"><Plus className="w-4 h-4" /></Button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {editForm.tags.map(tag => (
                            <Badge key={tag} variant="secondary" className="bg-orange-100 text-orange-800 flex items-center gap-1">
                              {tag} <button aria-label="Remove tag" onClick={() => handleRemoveTag(tag)} className="ml-1 hover:text-red-600"><X className="w-3 h-3" /></button>
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div className="flex justify-end gap-3 pt-4 border-t">
                        <Button variant="outline" onClick={() => setIsEditing(false)} className="bg-white text-gray-800 border-gray-300 hover:bg-gray-50">Cancel</Button>
                        <Button onClick={handleSaveProfile} className="bg-blue-600 text-white hover:bg-blue-700">Save Changes</Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              )}

              {/* Language Switcher (Own Profile) */}
              {isOwnProfile && (
                <Dialog open={isLanguageOpen} onOpenChange={setIsLanguageOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="ml-2 bg-white text-gray-800 border-gray-300 hover:bg-gray-50">Language</Button>
                  </DialogTrigger>
                  <DialogContent className="bg-white text-gray-900">
                    <DialogHeader><DialogTitle>Change Language</DialogTitle></DialogHeader>
                    <div className="space-y-4 py-4">
                      {!otpSent ? (
                        <>
                          <Label>Select Language</Label>
                          <select aria-label="Select language" className="w-full border border-gray-300 p-2 rounded bg-white text-gray-900" value={selectedLang} onChange={(e) => setSelectedLang(e.target.value)}>
                            <option value="English">English</option>
                            <option value="French">French</option>
                            <option value="Spanish">Spanish</option>
                            <option value="Hindi">Hindi</option>
                            <option value="Portuguese">Portuguese</option>
                            <option value="Chinese">Chinese</option>
                          </select>
                          <Button onClick={handleInitiateLang} className="w-full bg-blue-600 text-white hover:bg-blue-700">Next</Button>
                        </>
                      ) : (
                        <>
                          <Label>Enter OTP ({selectedLang === 'French' ? 'Email' : 'Mobile'})</Label>
                          <Input value={otp} onChange={(e) => setOtp(e.target.value)} placeholder={selectedLang === 'French' ? 'Enter Email OTP' : 'Enter SMS OTP'} />
                          <p className="text-xs text-gray-500">
                            {selectedLang === 'French' ? 'Check your email for the OTP.' : 'Check your mobile SMS for the OTP.'}
                          </p>
                          <Button onClick={handleConfirmLang} className="w-full bg-green-600 text-white hover:bg-green-700">Verify & Change</Button>
                        </>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>
              )}

              {/* Transfer Points (Other Profile) */}
              {!isOwnProfile && (
                <Dialog open={isTransferOpen} onOpenChange={setIsTransferOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-green-600 hover:bg-green-700 text-white ml-2">Transfer Points</Button>
                  </DialogTrigger>
                  <DialogContent className="bg-white">
                    <DialogHeader><DialogTitle>Transfer Points to {users.name}</DialogTitle></DialogHeader>
                    <div className="space-y-4 py-4">
                      <Label>Amount</Label>
                      <Input type="number" value={transferAmount} onChange={(e) => setTransferAmount(e.target.value)} placeholder="Enter points (min 10 required to send)" />
                      <Button onClick={handleTransfer} className="w-full bg-blue-600 text-white">Transfer</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}

            </div>
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-4">
              <div className="flex items-center">
                <Calendar className="w-4 h-4 mr-1" />
                Member since{" "}
                {new Date(users.joinDate).toLocaleDateString()}
              </div>
              {users.location && (
                <div className="flex items-center">
                  <MapPin className="w-4 h-4 mr-1" />
                  {users.location}
                </div>
              )}
              {isOwnProfile && users.email && (
                <div className="flex items-center">
                  <Mail className="w-4 h-4 mr-1" />
                  {users.email}
                </div>
              )}
              {isOwnProfile && users.mobile && (
                <div className="flex items-center">
                  <Phone className="w-4 h-4 mr-1" />
                  {users.mobile}
                </div>
              )}
              <div className="flex items-center">
                <Eye className="w-4 h-4 mr-1" />
                {profileViews} profile views
              </div>
            </div>
            <div className="flex flex-wrap items-center space-x-6 text-sm">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                <span className="font-semibold">{goldBadges}</span>
                <span className="text-gray-600 ml-1">gold badges</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-gray-400 rounded-full mr-2"></div>
                <span className="font-semibold">{silverBadges}</span>
                <span className="text-gray-600 ml-1">silver badges</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-amber-600 rounded-full mr-2"></div>
                <span className="font-semibold">{bronzeBadges}</span>
                <span className="text-gray-600 ml-1">bronze badges</span>
              </div>
            </div>
          </div>
        </div>
        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-gray-800 dark:text-white">{reputation.toLocaleString()}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Reputation</div>
            </CardContent>
          </Card>
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-gray-800 dark:text-white">{questionsCount}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Questions</div>
            </CardContent>
          </Card>
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-gray-800 dark:text-white">{answersCount}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Answers</div>
            </CardContent>
          </Card>
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-gray-800 dark:text-white">{goldBadges + silverBadges + bronzeBadges}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Badges</div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{users.points || 0}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Points</div>
            </CardContent>
          </Card>
        </div>

        {/* Login History (Own Profile) */}
        {isOwnProfile && users.loginHistory && users.loginHistory.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Login History</h2>
            <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow border dark:border-gray-700">
              {/* Tabs */}
              <div className="flex border-b">
                <button className="px-4 py-3 text-sm font-medium text-blue-600 border-b-2 border-blue-600 bg-blue-50">
                  Recent Logins
                </button>
                <button className="px-4 py-3 text-sm font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-50">
                  Desktop ({users.loginHistory.filter((h: any) => h.device === 'desktop' || !h.device).length})
                </button>
                <button className="px-4 py-3 text-sm font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-50">
                  Mobile ({users.loginHistory.filter((h: any) => h.device === 'mobile' || h.device === 'tablet').length})
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="p-3 text-left font-semibold text-gray-600">Device</th>
                      <th className="p-3 text-left font-semibold text-gray-600">Browser</th>
                      <th className="p-3 text-left font-semibold text-gray-600">OS</th>
                      <th className="p-3 text-left font-semibold text-gray-600">IP Address</th>
                      <th className="p-3 text-left font-semibold text-gray-600">Date & Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.loginHistory.slice(-10).reverse().map((h: any, i: number) => (
                      <tr key={i} className="border-b hover:bg-gray-50">
                        <td className="p-3">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${h.device === 'mobile' ? 'bg-purple-100 text-purple-800' :
                              h.device === 'tablet' ? 'bg-orange-100 text-orange-800' :
                                'bg-blue-100 text-blue-800'
                            }`}>
                            {h.device === 'mobile' ? '📱 Mobile' : h.device === 'tablet' ? '📱 Tablet' : '💻 Desktop'}
                          </span>
                        </td>
                        <td className="p-3">{h.browser || 'Unknown'}</td>
                        <td className="p-3">{h.os || 'Unknown'}</td>
                        <td className="p-3 font-mono text-xs">{h.ip}</td>
                        <td className="p-3 text-gray-600">{new Date(h.loginAt).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="p-3 bg-gray-50 border-t text-xs text-gray-500">
                <p>🔒 <strong>Security Info:</strong> Chrome requires OTP • Mobile login: 10AM-1PM IST only • Edge/IE: Direct login</p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>About</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose max-w-none">
                  <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                    {users.about || "No bio yet."}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Recent Questions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Recent Questions
                </CardTitle>
              </CardHeader>
              <CardContent>
                {userQuestions.length === 0 ? (
                  <p className="text-gray-500 text-sm">No questions yet.</p>
                ) : (
                  <div className="space-y-3">
                    {userQuestions.slice(0, 5).map((q: any) => (
                      <Link
                        key={q._id}
                        href={`/questions/${q._id}`}
                        className="block p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex justify-between items-start gap-2">
                          <span className="text-blue-600 hover:text-blue-800 font-medium line-clamp-1">
                            {q.questiontitle}
                          </span>
                          <div className="flex items-center gap-2 text-xs text-gray-500 whitespace-nowrap">
                            <span>{(q.upvote?.length || 0) - (q.downvote?.length || 0)} votes</span>
                            <span>{q.noofanswer || 0} answers</span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Answers */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Recent Answers
                </CardTitle>
              </CardHeader>
              <CardContent>
                {userAnswers.length === 0 ? (
                  <p className="text-gray-500 text-sm">No answers yet.</p>
                ) : (
                  <div className="space-y-3">
                    {userAnswers.slice(0, 5).map((ans: any, index: number) => (
                      <Link
                        key={ans._id || index}
                        href={`/questions/${ans.questionId}`}
                        className="block p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex justify-between items-start gap-2">
                          <span className="text-blue-600 hover:text-blue-800 font-medium line-clamp-1">
                            {ans.questionTitle}
                          </span>
                          <div className="flex items-center gap-2 text-xs text-gray-500 whitespace-nowrap">
                            <span>{(ans.upvote?.length || 0) - (ans.downvote?.length || 0)} votes</span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Friends</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {isOwnProfile && (
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">Your Friend Code</p>
                    <div className="flex gap-2">
                      <Input readOnly value={users?.friendCode || "Generating..."} className="bg-gray-50" />
                      <Button type="button" onClick={handleCopyCode} variant="outline" className="bg-white text-gray-800 border-gray-300 hover:bg-gray-50">Copy</Button>
                    </div>
                  </div>
                )}
                <div className="space-y-2">
                  <Label className="text-sm">Add by code</Label>
                  <div className="flex gap-2">
                    <Input
                      value={friendCodeInput}
                      onChange={(e) => setFriendCodeInput(e.target.value)}
                      placeholder="ALICE2024"
                    />
                    <Button type="button" onClick={handleAddFriendByCode} className="bg-blue-600 text-white hover:bg-blue-700">Add</Button>
                  </div>
                  <p className="text-xs text-gray-500">Instant connection, no approvals.</p>
                  {users?.friends && (
                    <p className="text-xs text-gray-600">Friends: {users.friends.length}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Tags</CardTitle>
              </CardHeader>
              <CardContent>
                {!users.tags || users.tags.length === 0 ? (
                  <p className="text-gray-500 text-sm">No tags yet.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {users.tags.map((tag: string) => (
                      <Link key={tag} href={`/tags/${tag}`}>
                        <Badge
                          variant="secondary"
                          className="bg-blue-100 text-blue-800 hover:bg-blue-200 cursor-pointer"
                        >
                          {tag}
                        </Badge>
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Badges Earned */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="w-5 h-5" />
                  Badges
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!users.badgesList || users.badgesList.length === 0 ? (
                  <p className="text-gray-500 text-sm">No badges earned yet.</p>
                ) : (
                  <div className="space-y-2">
                    {users.badgesList.map((badge: any, index: number) => (
                      <div
                        key={badge.name + index}
                        className="flex items-center gap-2 p-2 bg-gray-50 rounded"
                      >
                        <div
                          className={`w-3 h-3 rounded-full ${badge.type === 'gold' ? 'bg-yellow-500' :
                            badge.type === 'silver' ? 'bg-gray-400' : 'bg-amber-600'
                            }`}
                        />
                        <span className="text-sm font-medium">{badge.name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Mainlayout >
  );
};

export default index;
