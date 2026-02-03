import React, { useEffect, useState } from "react";
import Mainlayout from "@/layout/Mainlayout";
import { useAuth } from "@/lib/AuthContext";
import { createPost, getFeed, likePost, commentPost, sharePost, getAllUsers, followUser, addFriend } from "@/lib/api";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useRouter } from "next/router";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Heart, MessageCircle, Share2, MoreHorizontal, Send, Bookmark, Users, UserPlus } from "lucide-react";

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

const PostItem = ({ post, currentUser, handleLike, handleComment, handleShare }: any) => {
    const [showHeart, setShowHeart] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const [isBookmarked, setIsBookmarked] = useState(false);

    const onDoubleTap = () => {
        setShowHeart(true);
        handleLike(post._id);
        setTimeout(() => setShowHeart(false), 800);
    };

    const isLiked = post.likes?.some((id: string) => id === currentUser?._id);

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6 overflow-hidden">
            {/* Post Header */}
            <div className="flex items-center justify-between p-3">
                <div className="flex items-center space-x-3">
                    <Avatar className="w-8 h-8 ring-2 ring-offset-1 ring-pink-500">
                        <AvatarFallback className="bg-gradient-to-tr from-yellow-400 to-pink-600 text-white font-bold text-xs">
                            {post.name?.[0]?.toUpperCase() || "U"}
                        </AvatarFallback>
                    </Avatar>
                    <div>
                        <div className="text-sm font-semibold text-gray-900 leading-none hover:text-gray-600 cursor-pointer">{post.name}</div>
                        <div className="text-[10px] text-gray-500 mt-0.5">{getRelativeTime(post.createdAt)}</div>
                    </div>
                </div>
                <button className="text-gray-500 hover:text-gray-900">
                    <MoreHorizontal className="w-5 h-5" />
                </button>
            </div>

            {/* Post Media - Full Width with Double Tap */}
            {post.mediaUrl && (
                <div
                    className="w-full bg-black/5 relative aspect-square sm:aspect-auto flex items-center justify-center bg-gray-100 cursor-pointer"
                    onDoubleClick={onDoubleTap}
                >
                    {showHeart && (
                        <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none animate-in zoom-in duration-300">
                            <Heart className="w-24 h-24 text-white fill-white drop-shadow-lg" />
                        </div>
                    )}
                    {post.mediaType === 'video' ? (
                        <video src={post.mediaUrl} controls className="w-full max-h-[600px] object-contain" />
                    ) : (
                        <img src={post.mediaUrl} alt="Post media" className="w-full max-h-[600px] object-contain" />
                    )}
                </div>
            )}

            {/* Action Bar */}
            <div className="p-3 pb-1">
                <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center space-x-4">
                        <button onClick={() => handleLike(post._id)} className="hover:opacity-60 transition-opacity">
                            <Heart className={`w-6 h-6 ${isLiked ? 'fill-red-500 text-red-500' : 'text-gray-900'}`} />
                        </button>
                        <button className="hover:opacity-60 transition-opacity">
                            <MessageCircle className="w-6 h-6 text-gray-900" />
                        </button>
                        <button onClick={() => handleShare(post._id)} className="hover:opacity-60 transition-opacity">
                            <Share2 className="w-6 h-6 text-gray-900" />
                        </button>
                    </div>
                    <div>
                        <button onClick={() => setIsBookmarked(!isBookmarked)} className="hover:opacity-60 transition-opacity">
                            <Bookmark className={`w-6 h-6 ${isBookmarked ? 'fill-black text-black' : 'text-gray-900'}`} />
                        </button>
                    </div>
                </div>

                {/* Likes Count */}
                <div className="font-semibold text-sm mb-1">
                    {post.likes?.length || 0} likes
                </div>

                {/* Caption with Read More */}
                {post.description && (
                    <div className="text-sm mb-2">
                        <span className="font-semibold mr-2">{post.name}</span>
                        <span className="text-gray-800">
                            {isExpanded || post.description.length < 100
                                ? post.description
                                : `${post.description.slice(0, 100)}...`
                            }
                        </span>
                        {post.description.length >= 100 && (
                            <button
                                onClick={() => setIsExpanded(!isExpanded)}
                                className="text-gray-500 text-xs ml-1 hover:text-gray-900"
                            >
                                {isExpanded ? 'less' : 'more'}
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Comments Section */}
            <div className="px-3 pb-3">
                {post.comments?.length > 0 && (
                    <div className="mb-2">
                        {post.comments.length > 2 && (
                            <button className="text-gray-500 text-sm mb-1">View all {post.comments.length} comments</button>
                        )}
                        {post.comments.slice(0, 2).map((c: any, i: number) => (
                            <div key={i} className="text-sm">
                                <span className="font-semibold mr-2">{c.user}</span>
                                <span>{c.comment}</span>
                            </div>
                        ))}
                    </div>
                )}

                <div className="text-[10px] text-gray-400 uppercase tracking-wide mb-3">
                    {getRelativeTime(post.createdAt)}
                </div>

                {/* Add Comment Input */}
                <div className="flex items-center border-t pt-3 relative">
                    <input
                        type="text"
                        placeholder="Add a comment..."
                        className="w-full text-sm focus:outline-none pr-10"
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                const target = e.currentTarget;
                                if (target.value.trim()) {
                                    handleComment(post._id, target.value);
                                    target.value = '';
                                }
                            }
                        }}
                    />
                    <button className="absolute right-0 text-blue-500 font-semibold text-sm hover:text-blue-700">Post</button>
                </div>
            </div>
        </div>
    );
};

const SocialFeed = () => {
    const { user } = useAuth();
    const [posts, setPosts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [description, setDescription] = useState("");
    const [mediaUrl, setMediaUrl] = useState("");
    const [mediaType, setMediaType] = useState("image"); // or video
    const [isPosting, setIsPosting] = useState(false);
    const [potentialFriends, setPotentialFriends] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState<'feed' | 'create' | 'friends'>('feed');
    const router = useRouter();

    // Fetch feed on mount
    const fetchFeed = async () => {
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
        if (activeTab === 'friends') {
            const fetchUsers = async () => {
                try {
                    const { data } = await getAllUsers();
                    // Filter out current user and existing friends (basic filter)
                    const filtered = data.filter((u: any) => u._id !== user?._id && !user?.friends?.includes(u._id));
                    setPotentialFriends(filtered);
                } catch (err) {
                    console.error(err);
                }
            };
            fetchUsers();
        }
    }, [activeTab, user]);

    useEffect(() => {
        fetchFeed();
    }, []);

    const handleAddFriend = async (friendId: string) => {
        try {
            await addFriend(friendId, {}); // Use addFriend API
            toast.success("Friend request sent!");
            // Remove from list
            setPotentialFriends(prev => prev.filter(p => p._id !== friendId));
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Failed to add friend");
        }
    }

    const handlePost = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsPosting(true);
        try {
            await createPost({ description, mediaUrl, mediaType });
            toast.success("Post created successfully!");
            setDescription("");
            setMediaUrl("");
            fetchFeed(); // Refresh
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Failed to create post. Check your friend limits.");
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



    return (
        <Mainlayout>
            <div className="max-w-3xl mx-auto p-4">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold">Social Feed</h1>
                    <div className="flex space-x-2 bg-gray-100 p-1 rounded-lg">
                        <button
                            onClick={() => setActiveTab('feed')}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'feed'
                                ? "bg-white text-blue-600 shadow"
                                : "text-gray-500 hover:text-gray-700"
                                }`}
                        >
                            Feed
                        </button>
                        <button
                            onClick={() => setActiveTab('create')}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'create'
                                ? "bg-white text-blue-600 shadow"
                                : "text-gray-500 hover:text-gray-700"
                                }`}
                        >
                            Create Post
                        </button>
                        <button
                            onClick={() => setActiveTab('friends')}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'friends'
                                ? "bg-white text-blue-600 shadow"
                                : "text-gray-500 hover:text-gray-700"
                                }`}
                        >
                            Find Friends
                        </button>
                    </div>
                </div>

                {/* Create Post View */}
                {activeTab === 'create' && (
                    <div className="bg-white p-6 rounded shadow border animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <h2 className="text-xl font-semibold mb-4 text-gray-800">Create a New Post</h2>
                        <div className="bg-blue-50 text-blue-800 p-3 rounded mb-4 text-sm">
                            <span className="font-bold">Info:</span> Your posting limit depends on your friend count.
                            <ul className="list-disc list-inside mt-1 ml-2">
                                <li>0 Friends: Cannot post</li>
                                <li>1 Friend: 1 post/day</li>
                                <li>2-9 Friends: 2 posts/day</li>
                                <li>10+ Friends: Unlimited</li>
                            </ul>
                        </div>
                        <form onSubmit={handlePost}>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Description <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    className="w-full border p-3 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none min-h-[120px]"
                                    placeholder="What's on your mind today?"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Media URL (Optional)
                                </label>
                                <input
                                    type="url"
                                    className="w-full border p-3 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    placeholder="https://example.com/image.jpg"
                                    value={mediaUrl}
                                    onChange={(e) => setMediaUrl(e.target.value)}
                                />
                                <div className="flex gap-2 mt-2">
                                    <button type="button" onClick={() => { setMediaUrl('https://images.unsplash.com/photo-1498050108023-c5249f4df085'); setMediaType('image'); }} className="text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded">Sample Img 1</button>
                                    <button type="button" onClick={() => { setMediaUrl('https://images.unsplash.com/photo-1555066931-4365d14bab8c'); setMediaType('image'); }} className="text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded">Sample Img 2</button>
                                </div>
                                <p className="text-xs text-gray-500 mt-1">Direct link to an image or video.</p>
                            </div>

                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Media Type
                                </label>
                                <select
                                    className="w-full border p-3 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                                    value={mediaType}
                                    onChange={(e) => setMediaType(e.target.value)}
                                >
                                    <option value="image">Image</option>
                                    <option value="video">Video</option>
                                </select>
                            </div>

                            <div className="flex justify-end gap-3 border-t pt-4">
                                <button type="button" onClick={() => setActiveTab('feed')} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isPosting}
                                    className={`bg-blue-600 text-white px-6 py-2 rounded font-medium hover:bg-blue-700 transition-colors ${isPosting ? 'opacity-70 cursor-not-allowed' : ''}`}
                                >
                                    {isPosting ? "Posting..." : "Share Post"}
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Find Friends Tab */}
                {activeTab === 'friends' && (
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <h2 className="text-xl font-semibold mb-4 text-gray-800">Connect with Developers</h2>
                        {potentialFriends.length === 0 ? (
                            <p className="text-center text-gray-500 py-10">No new users to connect with.</p>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {potentialFriends.map(friend => (
                                    <div key={friend._id} className="bg-white p-4 rounded-lg shadow-sm border flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <Avatar className="w-10 h-10">
                                                <AvatarFallback>{friend.name?.[0]}</AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <div className="font-semibold text-gray-900">{friend.name}</div>
                                                <div className="text-xs text-gray-500 line-clamp-1">{friend.about || "Developer"}</div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleAddFriend(friend._id)}
                                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                                            title="Add Friend"
                                        >
                                            <UserPlus className="w-5 h-5" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Feed View */}
                {activeTab === 'feed' && (
                    loading ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500 mb-4"></div>
                            <p className="text-gray-500">Loading your feed...</p>
                        </div>
                    ) : (
                        <div className="space-y-6 animate-in fade-in duration-500">
                            {posts.length === 0 ? (
                                <div className="text-center py-10 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                                    <p className="text-gray-500 mb-4">No posts yet. Be the first to share something!</p>
                                    <button onClick={() => setActiveTab('create')} className="text-blue-600 font-medium hover:underline">Create a Post</button>
                                </div>
                            ) : (
                                posts.map((post) => (
                                    <PostItem
                                        key={post._id}
                                        post={post}
                                        currentUser={user}
                                        handleLike={handleLike}
                                        handleComment={handleComment}
                                        handleShare={handleShare}
                                    />
                                ))
                            )}
                        </div>
                    )
                )}
            </div>
        </Mainlayout>
    );
};

const SocialFeedWrapper = () => <SocialFeed />;
export default SocialFeedWrapper;
