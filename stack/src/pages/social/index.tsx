import React, { useEffect, useState, useRef } from "react";
import Mainlayout from "@/layout/Mainlayout";
import { useAuth } from "@/lib/AuthContext";
import { createPost, getFeed, likePost, commentPost, sharePost, getAllUsers, addFriend, getFriendsList } from "@/lib/api";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useRouter } from "next/router";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { 
    Heart, MessageCircle, Share2, MoreHorizontal, Send, Bookmark, Users, UserPlus,
    Sparkles, TrendingUp, Zap, Camera, Video, Image as ImageIcon, Smile, X, 
    ChevronLeft, ChevronRight, Plus, Globe, Lock, UserCheck, Clock, Upload, Check
} from "lucide-react";
import Link from "next/link";

// Helper for relative time
const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return date.toLocaleDateString();
};

// Stories Component
const StoriesSection = ({ users, currentUser }: { users: any[], currentUser: any }) => {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(true);

    const checkScroll = () => {
        if (scrollRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
            setCanScrollLeft(scrollLeft > 0);
            setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
        }
    };

    const scroll = (direction: 'left' | 'right') => {
        if (scrollRef.current) {
            const scrollAmount = 200;
            scrollRef.current.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth'
            });
        }
    };

    return (
        <div className="relative mb-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 transition-colors">
                <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="w-5 h-5 text-purple-500" />
                    <h3 className="font-semibold text-gray-900 dark:text-white">Stories</h3>
                </div>
                <div className="relative">
                    {canScrollLeft && (
                        <button
                            onClick={() => scroll('left')}
                            aria-label="Scroll stories left"
                            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white dark:bg-gray-700 shadow-lg rounded-full p-1.5 hover:scale-110 transition-transform"
                        >
                            <ChevronLeft className="w-4 h-4 text-gray-700 dark:text-gray-200" />
                        </button>
                    )}
                    <div
                        ref={scrollRef}
                        onScroll={checkScroll}
                        className="flex gap-4 overflow-x-auto scrollbar-hide pb-2"
                    >
                        {/* Add Story */}
                        <div className="flex flex-col items-center gap-1 cursor-pointer group">
                            <div className="relative">
                                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                                    <Plus className="w-6 h-6 text-gray-500 dark:text-gray-300" />
                                </div>
                                <div className="absolute -bottom-1 -right-1 bg-blue-500 rounded-full p-1">
                                    <Plus className="w-3 h-3 text-white" />
                                </div>
                            </div>
                            <span className="text-xs text-gray-600 dark:text-gray-400">Add Story</span>
                        </div>
                        {/* User Stories */}
                        {users.slice(0, 8).map((user, i) => (
                            <div key={user._id || i} className="flex flex-col items-center gap-1 cursor-pointer group">
                                <div className="p-0.5 rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 group-hover:scale-105 transition-transform">
                                    <div className="p-0.5 bg-white dark:bg-gray-800 rounded-full">
                                        <Avatar className="w-14 h-14">
                                            <AvatarFallback className="bg-gradient-to-br from-blue-400 to-purple-500 text-white font-bold">
                                                {user.name?.[0]?.toUpperCase() || "U"}
                                            </AvatarFallback>
                                        </Avatar>
                                    </div>
                                </div>
                                <span className="text-xs text-gray-600 dark:text-gray-400 truncate w-16 text-center">{user.name?.split(' ')[0] || 'User'}</span>
                            </div>
                        ))}
                    </div>
                    {canScrollRight && (
                        <button
                            onClick={() => scroll('right')}
                            aria-label="Scroll stories right"
                            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white dark:bg-gray-700 shadow-lg rounded-full p-1.5 hover:scale-110 transition-transform"
                        >
                            <ChevronRight className="w-4 h-4 text-gray-700 dark:text-gray-200" />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

// Quick Stats Card
const QuickStats = ({ user, postsCount }: { user: any, postsCount: number }) => (
    <div className="bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 rounded-xl p-5 text-white mb-6 shadow-lg">
        <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
                <Avatar className="w-12 h-12 ring-2 ring-white/30">
                    <AvatarFallback className="bg-white/20 text-white font-bold">
                        {user?.name?.[0]?.toUpperCase() || "U"}
                    </AvatarFallback>
                </Avatar>
                <div>
                    <h3 className="font-bold">{user?.name || 'Welcome!'}</h3>
                    <p className="text-sm text-white/80">Your social dashboard</p>
                </div>
            </div>
            <Zap className="w-8 h-8 text-yellow-300" />
        </div>
        <div className="grid grid-cols-3 gap-4 text-center">
            <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
                <div className="text-2xl font-bold">{user?.friends?.length || 0}</div>
                <div className="text-xs text-white/80">Friends</div>
            </div>
            <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
                <div className="text-2xl font-bold">{postsCount}</div>
                <div className="text-xs text-white/80">Posts</div>
            </div>
            <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
                <div className="text-2xl font-bold">{user?.followers?.length || 0}</div>
                <div className="text-xs text-white/80">Followers</div>
            </div>
        </div>
    </div>
);

// Trending Topics
const TrendingTopics = () => {
    const topics = [
        { tag: '#React', posts: '12.5k' },
        { tag: '#TypeScript', posts: '8.2k' },
        { tag: '#NextJS', posts: '6.1k' },
        { tag: '#WebDev', posts: '15.3k' },
    ];

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-6 transition-colors">
            <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-5 h-5 text-green-500" />
                <h3 className="font-semibold text-gray-900 dark:text-white">Trending</h3>
            </div>
            <div className="flex flex-wrap gap-2">
                {topics.map(topic => (
                    <span
                        key={topic.tag}
                        className="px-3 py-1.5 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/30 dark:to-purple-900/30 text-blue-600 dark:text-blue-400 rounded-full text-sm font-medium cursor-pointer hover:from-blue-100 hover:to-purple-100 dark:hover:from-blue-900/50 dark:hover:to-purple-900/50 transition-colors"
                    >
                        {topic.tag} <span className="text-xs text-gray-500 dark:text-gray-400">{topic.posts}</span>
                    </span>
                ))}
            </div>
        </div>
    );
};

const PostItem = ({ post, currentUser, handleLike, handleComment, handleShare }: any) => {
    const [showHeart, setShowHeart] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const [isBookmarked, setIsBookmarked] = useState(false);
    const [showComments, setShowComments] = useState(false);
    const [commentText, setCommentText] = useState("");
    const [isAnimating, setIsAnimating] = useState(false);

    const onDoubleTap = () => {
        setShowHeart(true);
        setIsAnimating(true);
        handleLike(post._id);
        setTimeout(() => setShowHeart(false), 800);
        setTimeout(() => setIsAnimating(false), 300);
    };

    const isLiked = post.likes?.some((id: string) => id === currentUser?._id);

    const handleSubmitComment = () => {
        if (commentText.trim()) {
            handleComment(post._id, commentText);
            setCommentText('');
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 mb-6 overflow-hidden hover:shadow-md transition-all duration-300">
            {/* Post Header */}
            <div className="flex items-center justify-between p-4">
                <div className="flex items-center space-x-3">
                    <div className="relative">
                        <div className="p-0.5 rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600">
                            <Avatar className="w-10 h-10 ring-2 ring-white dark:ring-gray-800">
                                <AvatarFallback className="bg-gradient-to-br from-blue-400 to-purple-500 text-white font-bold text-sm">
                                    {post.name?.[0]?.toUpperCase() || "U"}
                                </AvatarFallback>
                            </Avatar>
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-gray-800"></div>
                    </div>
                    <div>
                        <div className="text-sm font-semibold text-gray-900 dark:text-white leading-none hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer transition-colors">{post.name}</div>
                        <div className="flex items-center gap-1 mt-1">
                            <Clock className="w-3 h-3 text-gray-400" />
                            <span className="text-xs text-gray-500 dark:text-gray-400">{getRelativeTime(post.createdAt)}</span>
                            <span className="text-gray-300 dark:text-gray-600">•</span>
                            <Globe className="w-3 h-3 text-gray-400" />
                        </div>
                    </div>
                </div>
                <button aria-label="More options" className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition-colors">
                    <MoreHorizontal className="w-5 h-5" />
                </button>
            </div>

            {/* Post Content */}
            {post.description && (
                <div className="px-4 pb-3">
                    <p className="text-gray-800 dark:text-gray-200 leading-relaxed">
                        {isExpanded || post.description.length < 150
                            ? post.description
                            : `${post.description.slice(0, 150)}...`
                        }
                    </p>
                    {post.description.length >= 150 && (
                        <button
                            onClick={() => setIsExpanded(!isExpanded)}
                            className="text-blue-500 hover:text-blue-600 text-sm font-medium mt-1"
                        >
                            {isExpanded ? 'Show less' : 'Read more'}
                        </button>
                    )}
                </div>
            )}

            {/* Post Media - Full Width with Double Tap */}
            {post.mediaUrl && (
                <div
                    className="relative w-full bg-gray-100 dark:bg-gray-900 cursor-pointer overflow-hidden"
                    onDoubleClick={onDoubleTap}
                >
                    {showHeart && (
                        <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                            <Heart className={`w-24 h-24 text-white fill-red-500 drop-shadow-2xl ${isAnimating ? 'animate-ping' : 'animate-bounce'}`} />
                        </div>
                    )}
                    {post.mediaType === 'video' ? (
                        <video src={post.mediaUrl} controls className="w-full max-h-[500px] object-contain" />
                    ) : (
                        <img src={post.mediaUrl} alt="Post media" className="w-full max-h-[500px] object-cover hover:scale-[1.02] transition-transform duration-300" />
                    )}
                </div>
            )}

            {/* Engagement Stats */}
            <div className="px-4 py-2 flex items-center justify-between border-b border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-1">
                    <div className="flex -space-x-1">
                        <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center">
                            <Heart className="w-3 h-3 text-white fill-white" />
                        </div>
                        <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                            <span className="text-[10px] text-white">👍</span>
                        </div>
                    </div>
                    <span className="text-sm text-gray-500 dark:text-gray-400 ml-1">
                        {post.likes?.length || 0} {post.likes?.length === 1 ? 'like' : 'likes'}
                    </span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                    <button onClick={() => setShowComments(!showComments)} className="hover:text-blue-500 transition-colors">
                        {post.comments?.length || 0} comments
                    </button>
                    <span>{post.sharedCount || 0} shares</span>
                </div>
            </div>

            {/* Action Bar */}
            <div className="px-2 py-1">
                <div className="flex justify-around items-center">
                    <button 
                        onClick={() => handleLike(post._id)} 
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-lg transition-all duration-200 flex-1 justify-center ${
                            isLiked 
                                ? 'text-red-500 bg-red-50 dark:bg-red-900/20' 
                                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                    >
                        <Heart className={`w-5 h-5 ${isLiked ? 'fill-red-500' : ''} ${isAnimating ? 'scale-125' : ''} transition-transform`} />
                        <span className="font-medium text-sm">Like</span>
                    </button>
                    <button 
                        onClick={() => setShowComments(!showComments)}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex-1 justify-center"
                    >
                        <MessageCircle className="w-5 h-5" />
                        <span className="font-medium text-sm">Comment</span>
                    </button>
                    <button 
                        onClick={() => handleShare(post._id)} 
                        className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex-1 justify-center"
                    >
                        <Share2 className="w-5 h-5" />
                        <span className="font-medium text-sm">Share</span>
                    </button>
                    <button 
                        onClick={() => setIsBookmarked(!isBookmarked)} 
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-lg transition-colors flex-1 justify-center ${
                            isBookmarked 
                                ? 'text-yellow-500 bg-yellow-50 dark:bg-yellow-900/20' 
                                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                    >
                        <Bookmark className={`w-5 h-5 ${isBookmarked ? 'fill-yellow-500' : ''}`} />
                        <span className="font-medium text-sm">Save</span>
                    </button>
                </div>
            </div>

            {/* Comments Section */}
            {showComments && (
                <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 animate-in slide-in-from-top-2 duration-200">
                    {post.comments?.length > 0 && (
                        <div className="mb-3 space-y-3 max-h-48 overflow-y-auto">
                            {post.comments.map((c: any, i: number) => (
                                <div key={i} className="flex items-start gap-2">
                                    <Avatar className="w-8 h-8">
                                        <AvatarFallback className="bg-gradient-to-br from-green-400 to-blue-500 text-white text-xs">
                                            {c.user?.[0]?.toUpperCase() || 'U'}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="bg-white dark:bg-gray-700 rounded-2xl px-3 py-2 flex-1">
                                        <span className="font-semibold text-sm text-gray-900 dark:text-white">{c.user}</span>
                                        <p className="text-sm text-gray-700 dark:text-gray-200">{c.comment}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Add Comment Input */}
                    <div className="flex items-center gap-2">
                        <Avatar className="w-8 h-8">
                            <AvatarFallback className="bg-gradient-to-br from-purple-400 to-pink-500 text-white text-xs">
                                {currentUser?.name?.[0]?.toUpperCase() || 'U'}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 relative">
                            <input
                                type="text"
                                placeholder="Write a comment..."
                                value={commentText}
                                onChange={(e) => setCommentText(e.target.value)}
                                className="w-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-full px-4 py-2 pr-20 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleSubmitComment();
                                }}
                            />
                            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                                <button aria-label="Add emoji" className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-full">
                                    <Smile className="w-4 h-4 text-gray-400" />
                                </button>
                                <button 
                                    onClick={handleSubmitComment}
                                    aria-label="Send comment"
                                    className="p-1.5 bg-blue-500 hover:bg-blue-600 rounded-full transition-colors"
                                >
                                    <Send className="w-3.5 h-3.5 text-white" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const SocialFeed = () => {
    const { user, initialLoading } = useAuth();
    const [posts, setPosts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [description, setDescription] = useState("");
    const [mediaUrl, setMediaUrl] = useState("");
    const [mediaType, setMediaType] = useState("image"); // or video
    const [isPosting, setIsPosting] = useState(false);
    const [potentialFriends, setPotentialFriends] = useState<any[]>([]);
    const [currentFriends, setCurrentFriends] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState<'feed' | 'create' | 'friends'>('feed');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const router = useRouter();
    
    // Task 1: Posting limit tracking
    const [friendCount, setFriendCount] = useState(0);
    const [postsToday, setPostsToday] = useState(0);
    const [postingLimit, setPostingLimit] = useState(0);
    const [canPost, setCanPost] = useState(false);

    // Fetch feed on mount
    const fetchFeed = async () => {
        if (!user) {
            setLoading(false);
            return;
        }
        try {
            const { data } = await getFeed();
            setPosts(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };


    useEffect(() => {
        if (activeTab === 'friends' && user) {
            const fetchUsersAndFriends = async () => {
                try {
                    // Fetch current friends from Friendship model
                    let friendIds: string[] = [];
                    try {
                        const { data: friendsList } = await getFriendsList();
                        setCurrentFriends(friendsList || []);
                        friendIds = (friendsList || []).map((f: any) => f._id);
                    } catch (err) {
                        console.error("Failed to fetch friends list:", err);
                    }

                    // Fetch all users and filter suggestions
                    const { data } = await getAllUsers();
                    const filtered = data.filter((u: any) => 
                        u._id !== user?._id && !friendIds.includes(u._id)
                    );
                    setPotentialFriends(filtered);
                } catch (err) {
                    console.error(err);
                }
            };
            fetchUsersAndFriends();
        }
    }, [activeTab, user]);

    useEffect(() => {
        if (user) {
            fetchFeed();
        } else if (!initialLoading) {
            setLoading(false);
        }
    }, [user, initialLoading]);

    // Task 1: Calculate posting limit based on friend count
    useEffect(() => {
        if (user && currentFriends) {
            const count = currentFriends.length;
            setFriendCount(count);
            
            let limit = 0;
            if (count === 0) limit = 0;
            else if (count === 1) limit = 1;
            else if (count >= 2 && count < 10) limit = 2;
            else if (count >= 10) limit = Infinity;
            
            setPostingLimit(limit);
            setCanPost(limit > 0);
        }
    }, [currentFriends, user]);

    const handleAddFriend = async (friendId: string) => {
        try {
            await addFriend(friendId);
            toast.success("Friend request sent!");
            // Remove from list
            setPotentialFriends(prev => prev.filter(p => p._id !== friendId));
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Failed to add friend");
        }
    }

    // Handle local file selection
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        const validImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        const validVideoTypes = ['video/mp4', 'video/webm', 'video/ogg'];
        
        if (validImageTypes.includes(file.type)) {
            setMediaType('image');
        } else if (validVideoTypes.includes(file.type)) {
            setMediaType('video');
        } else {
            toast.error('Please select a valid image or video file');
            return;
        }

        // Check file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
            toast.error('File size must be less than 10MB');
            return;
        }

        setSelectedFile(file);
        
        // Create preview URL
        const previewUrl = URL.createObjectURL(file);
        setMediaUrl(previewUrl);
    };

    // Convert file to base64
    const fileToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = error => reject(error);
        });
    };

    // Clear selected file
    const clearMedia = () => {
        setMediaUrl('');
        setSelectedFile(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handlePost = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsPosting(true);
        try {
            let finalMediaUrl = mediaUrl;
            
            // If a local file is selected, convert to base64 and use it
            if (selectedFile) {
                setUploadProgress(30);
                const base64Data = await fileToBase64(selectedFile);
                setUploadProgress(60);
                // For now, we'll send the base64 directly
                // In production, you'd upload to a server/cloud storage
                finalMediaUrl = base64Data;
                setUploadProgress(100);
            }
            
            await createPost({ description, mediaUrl: finalMediaUrl, mediaType });
            toast.success("Post created successfully!");
            setDescription("");
            clearMedia();
            setUploadProgress(0);
            fetchFeed(); // Refresh
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Failed to create post. Check your friend limits.");
            setUploadProgress(0);
        } finally {
            setIsPosting(false);
        }
    };

    const handleLike = async (id: string) => {
        try {
            await likePost(id, {});
            // Optimistic update or refresh
            fetchFeed();
        } catch (err) {
            toast.error("Error liking post");
        }
    };

    const handleComment = async (id: string, commentBody: string) => {
        try {
            await commentPost(id, { commentBody });
            fetchFeed();
            toast.success("Comment added");
        } catch (err) {
            toast.error("Error commenting");
        }
    };

    const handleShare = async (id: string) => {
        try {
            await sharePost(id);
            fetchFeed();
            toast.success("Post shared!");
        } catch (err) {
            toast.error("Error sharing post");
        }
    };

    // Show login prompt for unauthenticated users
    if (!initialLoading && !user) {
        return (
            <Mainlayout>
                <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
                    <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center">
                        <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Sparkles className="w-10 h-10 text-white" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                            Join the Social Hub
                        </h2>
                        <p className="text-gray-500 dark:text-gray-400 mb-6">
                            Sign in to share posts, connect with developers, and view your personalized feed.
                        </p>
                        <button
                            onClick={() => router.push('/auth')}
                            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-xl font-medium transition-all hover:shadow-lg"
                        >
                            <Users className="w-5 h-5" />
                            Sign In to Continue
                        </button>
                        <p className="text-sm text-gray-400 dark:text-gray-500 mt-4">
                            Don't have an account?{' '}
                            <Link href="/signup" className="text-purple-500 hover:text-purple-600 font-medium">
                                Sign up
                            </Link>
                        </p>
                    </div>
                </div>
            </Mainlayout>
        );
    }

    return (
        <Mainlayout>
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
                <div className="max-w-6xl mx-auto p-4 lg:p-6">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <Sparkles className="w-8 h-8 text-purple-500" />
                                Social Hub
                            </h1>
                            <p className="text-gray-500 dark:text-gray-400 mt-1">Connect, share, and grow with developers</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="flex bg-white dark:bg-gray-800 p-1 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                                <button
                                    onClick={() => setActiveTab('feed')}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${activeTab === 'feed'
                                        ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md"
                                        : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                                        }`}
                                >
                                    Feed
                                </button>
                                <button
                                    onClick={() => setActiveTab('create')}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${activeTab === 'create'
                                        ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md"
                                        : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                                        }`}
                                >
                                    Create
                                </button>
                                <button
                                    onClick={() => setActiveTab('friends')}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${activeTab === 'friends'
                                        ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md"
                                        : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                                        }`}
                                >
                                    Find Friends
                                </button>
                            </div>
                            <Link href="/friends" className="p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm">
                                <Users className="w-5 h-5 text-purple-500" />
                            </Link>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Left Sidebar */}
                        <div className="hidden lg:block space-y-6">
                            <QuickStats user={user} postsCount={posts.length} />
                            <TrendingTopics />
                            
                            {/* Quick Actions */}
                            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
                                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Quick Actions</h3>
                                <div className="space-y-2">
                                    <button 
                                        onClick={() => setActiveTab('create')}
                                        className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
                                    >
                                        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                                            <Camera className="w-5 h-5 text-blue-500" />
                                        </div>
                                        <div>
                                            <div className="font-medium text-gray-900 dark:text-white text-sm">New Post</div>
                                            <div className="text-xs text-gray-500">Share what's on your mind</div>
                                        </div>
                                    </button>
                                    <button 
                                        onClick={() => setActiveTab('friends')}
                                        className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
                                    >
                                        <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                                            <UserPlus className="w-5 h-5 text-green-500" />
                                        </div>
                                        <div>
                                            <div className="font-medium text-gray-900 dark:text-white text-sm">Find Friends</div>
                                            <div className="text-xs text-gray-500">Connect with developers</div>
                                        </div>
                                    </button>
                                    <Link 
                                        href="/friends"
                                        className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
                                    >
                                        <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                                            <Users className="w-5 h-5 text-purple-500" />
                                        </div>
                                        <div>
                                            <div className="font-medium text-gray-900 dark:text-white text-sm">My Friends</div>
                                            <div className="text-xs text-gray-500">View your connections</div>
                                        </div>
                                    </Link>
                                </div>
                            </div>
                        </div>

                        {/* Main Content */}
                        <div className="lg:col-span-2">
                            {activeTab === 'feed' && (
                                <>
                                    {/* Stories Section */}
                                    <StoriesSection users={potentialFriends} currentUser={user} />

                                    {/* Create Post Quick Box */}
                                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-6">
                                        <div className="flex items-center gap-3">
                                            <Avatar className="w-10 h-10">
                                                <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white font-bold">
                                                    {user?.name?.[0]?.toUpperCase() || 'U'}
                                                </AvatarFallback>
                                            </Avatar>
                                            <button
                                                onClick={() => setActiveTab('create')}
                                                className="flex-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full px-4 py-2.5 text-left text-gray-500 dark:text-gray-400 transition-colors"
                                            >
                                                What's on your mind, {user?.name?.split(' ')[0] || 'there'}?
                                            </button>
                                        </div>
                                        <div className="flex items-center justify-around mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                                            <button onClick={() => setActiveTab('create')} className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                                                <Video className="w-5 h-5 text-red-500" />
                                                <span className="text-sm text-gray-600 dark:text-gray-300 font-medium">Video</span>
                                            </button>
                                            <button onClick={() => setActiveTab('create')} className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                                                <ImageIcon className="w-5 h-5 text-green-500" />
                                                <span className="text-sm text-gray-600 dark:text-gray-300 font-medium">Photo</span>
                                            </button>
                                            <button onClick={() => setActiveTab('create')} className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                                                <Smile className="w-5 h-5 text-yellow-500" />
                                                <span className="text-sm text-gray-600 dark:text-gray-300 font-medium">Feeling</span>
                                            </button>
                                        </div>
                                    </div>

                                    {/* Posts Feed */}
                                    {loading ? (
                                        <div className="flex flex-col items-center justify-center py-20">
                                            <div className="relative">
                                                <div className="w-16 h-16 border-4 border-purple-200 dark:border-purple-800 rounded-full animate-spin border-t-purple-500"></div>
                                                <Sparkles className="w-6 h-6 text-purple-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                                            </div>
                                            <p className="text-gray-500 dark:text-gray-400 mt-4">Loading your feed...</p>
                                        </div>
                                    ) : posts.length === 0 ? (
                                        <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl border border-dashed border-gray-300 dark:border-gray-600">
                                            <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-full mx-auto mb-4 flex items-center justify-center">
                                                <Camera className="w-10 h-10 text-gray-400" />
                                            </div>
                                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No posts yet</h3>
                                            <p className="text-gray-500 dark:text-gray-400 mb-4">Be the first to share something amazing!</p>
                                            <button 
                                                onClick={() => setActiveTab('create')} 
                                                className="px-6 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full font-medium hover:shadow-lg transition-all duration-200"
                                            >
                                                Create your first post
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="space-y-6 animate-in fade-in duration-500">
                                            {posts.map((post) => (
                                                <PostItem
                                                    key={post._id}
                                                    post={post}
                                                    currentUser={user}
                                                    handleLike={handleLike}
                                                    handleComment={handleComment}
                                                    handleShare={handleShare}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </>
                            )}

                            {/* Create Post View */}
                            {activeTab === 'create' && (
                                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                    <div className="flex items-center justify-between mb-6">
                                        <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                            <Camera className="w-6 h-6 text-purple-500" />
                                            Create Post
                                        </h2>
                                        <button onClick={() => setActiveTab('feed')} aria-label="Close create post" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
                                            <X className="w-5 h-5 text-gray-500" />
                                        </button>
                                    </div>
                                    
                                    {/* Task 1: Enhanced Posting Status Card */}
                                    <div className={`border rounded-xl p-4 mb-6 ${
                                        canPost 
                                            ? 'bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800' 
                                            : 'bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 border-orange-200 dark:border-orange-800'
                                    }`}>
                                        <div className="flex items-start gap-3">
                                            {canPost ? (
                                                <Check className="w-5 h-5 text-green-500 mt-0.5" />
                                            ) : (
                                                <UserPlus className="w-5 h-5 text-orange-500 mt-0.5" />
                                            )}
                                            <div className="flex-1">
                                                <h4 className={`font-semibold mb-2 ${
                                                    canPost 
                                                        ? 'text-green-800 dark:text-green-300' 
                                                        : 'text-orange-800 dark:text-orange-300'
                                                }`}>
                                                    Your Posting Status
                                                </h4>
                                                <div className={`text-sm space-y-1 ${
                                                    canPost 
                                                        ? 'text-green-700 dark:text-green-400' 
                                                        : 'text-orange-700 dark:text-orange-400'
                                                }`}>
                                                    <p><strong>Friends:</strong> {friendCount}</p>
                                                    <p><strong>Daily Limit:</strong> {postingLimit === Infinity ? 'Unlimited 🎉' : postingLimit === 0 ? 'No posts allowed' : `${postingLimit} post${postingLimit > 1 ? 's' : ''}`}</p>
                                                    {!canPost && (
                                                        <p className="text-xs mt-2 flex items-center gap-1">
                                                            <span>👉</span> Add a friend to start posting!
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mb-6">
                                        <div className="flex items-start gap-3">
                                            <Zap className="w-5 h-5 text-blue-500 mt-0.5" />
                                            <div>
                                                <h4 className="font-semibold text-blue-800 dark:text-blue-300">Posting Guide</h4>
                                                <ul className="text-sm text-blue-700 dark:text-blue-400 mt-1 space-y-1">
                                                    <li>• 0 Friends: Cannot post</li>
                                                    <li>• 1 Friend: 1 post/day</li>
                                                    <li>• 2-9 Friends: 2 posts/day</li>
                                                    <li>• 10+ Friends: Unlimited</li>
                                                </ul>
                                            </div>
                                        </div>
                                    </div>

                                    <form onSubmit={handlePost}>
                                        <div className="flex items-center gap-3 mb-4">
                                            <Avatar className="w-12 h-12">
                                                <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white font-bold">
                                                    {user?.name?.[0]?.toUpperCase() || 'U'}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <div className="font-semibold text-gray-900 dark:text-white">{user?.name || 'User'}</div>
                                                <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                                                    <Globe className="w-3 h-3" />
                                                    Public
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mb-4">
                                            <textarea
                                                className="w-full bg-transparent border-0 focus:ring-0 text-lg placeholder-gray-400 dark:placeholder-gray-500 resize-none min-h-[120px] text-gray-900 dark:text-white focus:outline-none"
                                                placeholder="What's on your mind?"
                                                value={description}
                                                onChange={(e) => setDescription(e.target.value)}
                                                required
                                            />
                                        </div>

                                        {mediaUrl && (
                                            <div className="relative mb-4 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-700">
                                                {mediaType === 'video' ? (
                                                    <video src={mediaUrl} controls className="w-full max-h-64 object-cover" />
                                                ) : (
                                                    <img src={mediaUrl} alt="Preview" className="w-full max-h-64 object-cover" />
                                                )}
                                                <button 
                                                    type="button"
                                                    onClick={clearMedia}
                                                    aria-label="Remove media"
                                                    className="absolute top-2 right-2 p-1.5 bg-black/50 hover:bg-black/70 rounded-full transition-colors"
                                                >
                                                    <X className="w-4 h-4 text-white" />
                                                </button>
                                                {selectedFile && (
                                                    <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/50 rounded-lg text-white text-xs">
                                                        {selectedFile.name}
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {uploadProgress > 0 && uploadProgress < 100 && (
                                            <div className="mb-4">
                                                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-1">
                                                    <Upload className="w-4 h-4" />
                                                    Uploading... {uploadProgress}%
                                                </div>
                                                <progress 
                                                    value={uploadProgress} 
                                                    max={100}
                                                    className="w-full h-2 rounded-full overflow-hidden [&::-webkit-progress-bar]:bg-gray-200 dark:[&::-webkit-progress-bar]:bg-gray-700 [&::-webkit-progress-value]:bg-gradient-to-r [&::-webkit-progress-value]:from-purple-500 [&::-webkit-progress-value]:to-pink-500 [&::-webkit-progress-value]:rounded-full [&::-moz-progress-bar]:bg-gradient-to-r [&::-moz-progress-bar]:from-purple-500 [&::-moz-progress-bar]:to-pink-500"
                                                    aria-label="Upload progress"
                                                />
                                            </div>
                                        )}

                                        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 mb-4">
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                                                Add Photo or Video
                                            </label>
                                            
                                            {/* Hidden file input */}
                                            <input
                                                type="file"
                                                ref={fileInputRef}
                                                onChange={handleFileSelect}
                                                accept="image/jpeg,image/png,image/gif,image/webp,video/mp4,video/webm,video/ogg"
                                                className="hidden"
                                                aria-label="Upload photo or video"
                                                title="Upload photo or video"
                                            />
                                            
                                            {/* Instagram-style upload area */}
                                            <div 
                                                onClick={() => fileInputRef.current?.click()}
                                                className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 text-center cursor-pointer hover:border-purple-500 dark:hover:border-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/10 transition-all duration-200"
                                            >
                                                <div className="flex flex-col items-center gap-3">
                                                    <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 rounded-full flex items-center justify-center">
                                                        <Camera className="w-8 h-8 text-purple-500" />
                                                    </div>
                                                    <div>
                                                        <p className="text-gray-700 dark:text-gray-300 font-medium">
                                                            Click to upload
                                                        </p>
                                                        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                                                            or drag and drop
                                                        </p>
                                                    </div>
                                                    <p className="text-xs text-gray-400 dark:text-gray-500">
                                                        PNG, JPG, GIF, WEBP, MP4 up to 10MB
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Quick action buttons */}
                                            <div className="flex flex-wrap gap-2 mt-4">
                                                <button 
                                                    type="button" 
                                                    onClick={() => fileInputRef.current?.click()}
                                                    className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-600 border border-gray-200 dark:border-gray-500 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-500 transition-colors"
                                                >
                                                    <ImageIcon className="w-4 h-4 text-green-500" />
                                                    Photo
                                                </button>
                                                <button 
                                                    type="button" 
                                                    onClick={() => fileInputRef.current?.click()}
                                                    className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-600 border border-gray-200 dark:border-gray-500 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-500 transition-colors"
                                                >
                                                    <Video className="w-4 h-4 text-red-500" />
                                                    Video
                                                </button>
                                                <button 
                                                    type="button" 
                                                    onClick={() => fileInputRef.current?.click()}
                                                    className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-600 border border-gray-200 dark:border-gray-500 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-500 transition-colors"
                                                >
                                                    <Smile className="w-4 h-4 text-yellow-500" />
                                                    GIF
                                                </button>
                                            </div>
                                        </div>

                                        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
                                            <button 
                                                type="button" 
                                                onClick={() => setActiveTab('feed')} 
                                                className="px-5 py-2.5 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg font-medium transition-colors"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                type="submit"
                                                disabled={isPosting || !description.trim()}
                                                className={`px-6 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-medium hover:shadow-lg transition-all duration-200 ${(isPosting || !description.trim()) ? 'opacity-50 cursor-not-allowed' : ''}`}
                                            >
                                                {isPosting ? (
                                                    <span className="flex items-center gap-2">
                                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                                        Posting...
                                                    </span>
                                                ) : 'Share Post'}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            )}

                            {/* Find Friends Tab */}
                            {activeTab === 'friends' && (
                                <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
                                        <div className="flex items-center justify-between mb-4">
                                            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                                <UserPlus className="w-6 h-6 text-green-500" />
                                                Discover People
                                            </h2>
                                            <Link href="/friends" className="text-sm text-purple-500 hover:text-purple-600 font-medium">
                                                View All Friends →
                                            </Link>
                                        </div>
                                        <p className="text-gray-500 dark:text-gray-400 text-sm">Connect with developers and expand your network!</p>
                                    </div>

                                    {potentialFriends.length === 0 ? (
                                        <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl border border-dashed border-gray-300 dark:border-gray-600">
                                            <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-full mx-auto mb-4 flex items-center justify-center">
                                                <UserCheck className="w-10 h-10 text-gray-400" />
                                            </div>
                                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">All caught up!</h3>
                                            <p className="text-gray-500 dark:text-gray-400">No new users to connect with at the moment.</p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            {potentialFriends.map(friend => (
                                                <div key={friend._id} className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-200 group">
                                                    <div className="flex items-center gap-4">
                                                        <div className="relative">
                                                            <Avatar className="w-14 h-14 ring-2 ring-offset-2 ring-purple-200 dark:ring-purple-800 dark:ring-offset-gray-800">
                                                                <AvatarFallback className="bg-gradient-to-br from-purple-400 to-pink-500 text-white font-bold text-lg">
                                                                    {friend.name?.[0]?.toUpperCase()}
                                                                </AvatarFallback>
                                                            </Avatar>
                                                            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white dark:border-gray-800 flex items-center justify-center">
                                                                <div className="w-2 h-2 bg-white rounded-full"></div>
                                                            </div>
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="font-semibold text-gray-900 dark:text-white truncate">{friend.name}</div>
                                                            <div className="text-sm text-gray-500 dark:text-gray-400 truncate">{friend.about || "Developer"}</div>
                                                            <div className="text-xs text-gray-400 dark:text-gray-500 mt-1 flex items-center gap-1">
                                                                <Users className="w-3 h-3" />
                                                                {friend.friends?.length || 0} friends
                                                            </div>
                                                        </div>
                                                        <button
                                                            onClick={() => handleAddFriend(friend._id)}
                                                            className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-medium text-sm hover:shadow-lg transition-all duration-200 group-hover:scale-105"
                                                        >
                                                            <UserPlus className="w-4 h-4 inline mr-1" />
                                                            Add
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </Mainlayout>
    );
};

const SocialFeedWrapper = () => <SocialFeed />;
export default SocialFeedWrapper;
