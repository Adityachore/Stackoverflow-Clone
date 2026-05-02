import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Mainlayout from "@/layout/Mainlayout";
import { useAuth } from "@/lib/AuthContext";
import { getAllUsers, addFriend, removeFriend, getFriendRequests, acceptFriendRequest, rejectFriendRequest, getFriendsList, getSuggestedUsers } from "@/lib/api";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Link from "next/link";
import {
    Users, UserPlus, UserMinus, UserCheck, Search, Filter,
    MessageCircle, MoreHorizontal, Heart, Sparkles, Clock,
    CheckCircle, XCircle, Bell, ChevronRight, Grid, List,
    SortAsc, Globe, MapPin, Briefcase, LogIn
} from "lucide-react";

type TabType = 'all' | 'friends' | 'requests' | 'suggestions';

const FriendsPage = () => {
    const { user, initialLoading } = useAuth();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<TabType>('friends');
    const [allUsers, setAllUsers] = useState<any[]>([]);
    const [friends, setFriends] = useState<any[]>([]);
    const [friendRequests, setFriendRequests] = useState<any[]>([]);
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    // Fetch all data
    const fetchData = async () => {
        setLoading(true);
        let friendsList: any[] = [];
        let pendingRequestIds: string[] = [];
        
        try {
            // Fetch real friends list from Friendship model
            try {
                const { data } = await getFriendsList();
                friendsList = data || [];
                setFriends(friendsList);
            } catch (err: any) {
                if (err.response?.status === 401) {
                    router.push('/auth');
                    return;
                }
                console.error("Failed to fetch friends list:", err);
                setFriends([]);
            }

            // Fetch pending friend requests
            try {
                const { data: requests } = await getFriendRequests();
                // The requests contain 'requester' field with user data
                const formattedRequests = (requests || []).map((r: any) => ({
                    ...r.requester,
                    requestId: r._id,
                    requesterId: r.requester._id
                }));
                setFriendRequests(formattedRequests);
                pendingRequestIds = formattedRequests.map((r: any) => r._id);
            } catch (err: any) {
                if (err.response?.status === 401) {
                    router.push('/auth');
                    return;
                }
                console.error("Failed to fetch friend requests:", err);
                setFriendRequests([]);
            }

            // Fetch all users for suggestions
            const { data: users } = await getAllUsers();
            setAllUsers(users || []);

            // Filter suggestions: not the current user, not already friends, not pending requests
            const friendIds = friendsList.map((f: any) => f._id);
            const userSuggestions = (users || []).filter((u: any) => 
                u._id !== user?._id && 
                !friendIds.includes(u._id) &&
                !pendingRequestIds.includes(u._id)
            );
            setSuggestions(userSuggestions);

        } catch (err: any) {
            if (err.response?.status === 401) {
                router.push('/auth');
                return;
            }
            console.error(err);
            toast.error("Failed to load data");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Check if user has a valid token before fetching
        const hasValidToken = user?.token || (typeof window !== 'undefined' && localStorage.getItem('user'));
        
        if (!initialLoading && user && hasValidToken) {
            fetchData();
        } else if (!initialLoading && !user) {
            setLoading(false);
        }
    }, [user, initialLoading]);

    const handleAddFriend = async (friendId: string) => {
        try {
            await addFriend(friendId);
            toast.success("Friend request sent!");
            setSuggestions(prev => prev.filter(p => p._id !== friendId));
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Failed to send request");
        }
    };

    const handleRemoveFriend = async (friendId: string) => {
        try {
            await removeFriend(friendId);
            toast.success("Friend removed");
            fetchData();
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Failed to remove friend");
        }
    };

    const handleAcceptRequest = async (requesterId: string) => {
        try {
            await acceptFriendRequest(requesterId);
            toast.success("Friend request accepted!");
            fetchData();
        } catch (err: any) {
            toast.error("Failed to accept request");
        }
    };

    const handleRejectRequest = async (requesterId: string) => {
        try {
            await rejectFriendRequest(requesterId);
            toast.success("Request declined");
            fetchData();
        } catch (err: any) {
            toast.error("Failed to decline request");
        }
    };

    // Filter based on search
    const filteredFriends = friends.filter(f => 
        f.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredSuggestions = suggestions.filter(s => 
        s.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredAll = allUsers.filter(u => 
        u._id !== user?._id &&
        (u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const tabs = [
        { id: 'all', label: 'All Users', icon: Users, count: allUsers.length - 1 },
        { id: 'friends', label: 'My Friends', icon: Heart, count: friends.length },
        { id: 'requests', label: 'Requests', icon: Bell, count: friendRequests.length },
        { id: 'suggestions', label: 'Suggestions', icon: UserPlus, count: suggestions.length },
    ];

    const UserCard = ({ userItem, isFriend, showActions = true }: { userItem: any, isFriend: boolean, showActions?: boolean }) => (
        <div className={`bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-all duration-300 group ${viewMode === 'list' ? 'flex items-center p-4' : ''}`}>
            {viewMode === 'grid' ? (
                <>
                    {/* Cover Image */}
                    <div className="h-20 bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 relative">
                        <div className="absolute -bottom-8 left-4">
                            <Avatar className="w-16 h-16 ring-4 ring-white dark:ring-gray-800">
                                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xl font-bold">
                                    {userItem.name?.[0]?.toUpperCase() || 'U'}
                                </AvatarFallback>
                            </Avatar>
                        </div>
                        {isFriend && (
                            <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                                <UserCheck className="w-3 h-3" />
                                Friend
                            </div>
                        )}
                    </div>
                    
                    {/* Content */}
                    <div className="pt-10 pb-4 px-4">
                        <Link href={`/users/${userItem._id}`}>
                            <h3 className="font-bold text-gray-900 dark:text-white hover:text-purple-600 dark:hover:text-purple-400 transition-colors">
                                {userItem.name}
                            </h3>
                        </Link>
                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{userItem.email}</p>
                        
                        {userItem.about && (
                            <p className="text-sm text-gray-600 dark:text-gray-300 mt-2 line-clamp-2">{userItem.about}</p>
                        )}
                        
                        <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
                            {userItem.location && (
                                <span className="flex items-center gap-1">
                                    <MapPin className="w-3 h-3" />
                                    {userItem.location}
                                </span>
                            )}
                            <span className="flex items-center gap-1">
                                <Users className="w-3 h-3" />
                                {userItem.friends?.length || 0} friends
                            </span>
                        </div>

                        {showActions && (
                            <div className="flex gap-2 mt-4">
                                {isFriend ? (
                                    <>
                                        <Link
                                            href={`/chat?user=${userItem._id}`}
                                            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg text-sm font-medium transition-colors"
                                        >
                                            <MessageCircle className="w-4 h-4" />
                                            Message
                                        </Link>
                                        <button
                                            onClick={() => handleRemoveFriend(userItem._id)}
                                            className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                            title="Remove friend"
                                        >
                                            <UserMinus className="w-5 h-5" />
                                        </button>
                                    </>
                                ) : (
                                    <button
                                        onClick={() => handleAddFriend(userItem._id)}
                                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-lg text-sm font-medium transition-all hover:shadow-md"
                                    >
                                        <UserPlus className="w-4 h-4" />
                                        Add Friend
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </>
            ) : (
                <>
                    {/* List View */}
                    <Avatar className="w-14 h-14 mr-4">
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-bold">
                            {userItem.name?.[0]?.toUpperCase() || 'U'}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                            <Link href={`/users/${userItem._id}`}>
                                <h3 className="font-semibold text-gray-900 dark:text-white hover:text-purple-600 dark:hover:text-purple-400 transition-colors">
                                    {userItem.name}
                                </h3>
                            </Link>
                            {isFriend && (
                                <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 text-xs rounded-full">
                                    Friend
                                </span>
                            )}
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{userItem.about || userItem.email}</p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                            <span className="flex items-center gap-1">
                                <Users className="w-3 h-3" />
                                {userItem.friends?.length || 0} friends
                            </span>
                        </div>
                    </div>
                    {showActions && (
                        <div className="flex items-center gap-2 ml-4">
                            {isFriend ? (
                                <>
                                    <Link
                                        href={`/chat?user=${userItem._id}`}
                                        className="p-2 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors"
                                    >
                                        <MessageCircle className="w-5 h-5" />
                                    </Link>
                                    <button
                                        onClick={() => handleRemoveFriend(userItem._id)}
                                        aria-label="Remove friend"
                                        className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                    >
                                        <UserMinus className="w-5 h-5" />
                                    </button>
                                </>
                            ) : (
                                <button
                                    onClick={() => handleAddFriend(userItem._id)}
                                    className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg text-sm font-medium hover:shadow-md transition-all"
                                >
                                    <UserPlus className="w-4 h-4 inline mr-1" />
                                    Add
                                </button>
                            )}
                        </div>
                    )}
                </>
            )}
        </div>
    );

    const RequestCard = ({ request }: { request: any }) => (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-all">
            <div className="flex items-center gap-4">
                <Avatar className="w-14 h-14">
                    <AvatarFallback className="bg-gradient-to-br from-orange-400 to-red-500 text-white font-bold">
                        {request.name?.[0]?.toUpperCase() || 'U'}
                    </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white">{request.name}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Sent you a friend request
                    </p>
                </div>
            </div>
            <div className="flex gap-2 mt-4">
                <button
                    onClick={() => handleAcceptRequest(request.requesterId || request._id)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium transition-colors"
                >
                    <CheckCircle className="w-4 h-4" />
                    Accept
                </button>
                <button
                    onClick={() => handleRejectRequest(request.requesterId || request._id)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg text-sm font-medium transition-colors"
                >
                    <XCircle className="w-4 h-4" />
                    Decline
                </button>
            </div>
        </div>
    );

    // Show login prompt if not authenticated
    if (!initialLoading && !user) {
        return (
            <Mainlayout>
                <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
                    <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center">
                        <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Users className="w-10 h-10 text-white" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                            Connect with Friends
                        </h2>
                        <p className="text-gray-500 dark:text-gray-400 mb-6">
                            Please sign in to view and manage your friends, send requests, and discover new connections.
                        </p>
                        <button
                            onClick={() => router.push('/auth')}
                            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-xl font-medium transition-all hover:shadow-lg"
                        >
                            <LogIn className="w-5 h-5" />
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
                <div className="max-w-7xl mx-auto p-4 lg:p-6">
                    {/* Header */}
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                                <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl">
                                    <Users className="w-7 h-7 text-white" />
                                </div>
                                Friends
                            </h1>
                            <p className="text-gray-500 dark:text-gray-400 mt-1">Manage your connections and discover new people</p>
                        </div>
                        
                        <div className="flex items-center gap-3 w-full lg:w-auto">
                            {/* Search */}
                            <div className="relative flex-1 lg:w-80">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search people..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 dark:text-white"
                                />
                            </div>
                            
                            {/* View Toggle */}
                            <div className="flex bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-1">
                                <button
                                    onClick={() => setViewMode('grid')}
                                    aria-label="Grid view"
                                    className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-purple-500 text-white' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                                >
                                    <Grid className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={() => setViewMode('list')}
                                    aria-label="List view"
                                    className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-purple-500 text-white' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                                >
                                    <List className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Subscription Banner */}
                    <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl p-6 mb-6 text-white flex flex-col md:flex-row items-center justify-between shadow-lg">
                        <div>
                            <h3 className="text-xl font-bold mb-1 flex items-center gap-2">
                                <Sparkles className="w-5 h-5 text-yellow-300" /> 
                                Upgrade to Premium
                            </h3>
                            <p className="text-purple-100 text-sm">
                                Unlock unlimited friend connections, unlimited daily posts, and exclusive developer badges!
                            </p>
                        </div>
                        <button
                            onClick={() => router.push('/subscription')}
                            className="mt-4 md:mt-0 px-6 py-2.5 bg-white text-purple-600 hover:bg-gray-50 font-semibold rounded-lg shadow transition-colors whitespace-nowrap"
                        >
                            View Plans
                        </button>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                        {[
                            { label: 'Total Friends', value: friends.length, icon: Heart, color: 'from-pink-500 to-red-500' },
                            { label: 'Pending Requests', value: friendRequests.length, icon: Bell, color: 'from-yellow-500 to-orange-500' },
                            { label: 'Suggestions', value: suggestions.length, icon: Sparkles, color: 'from-purple-500 to-blue-500' },
                            { label: 'All Users', value: allUsers.length - 1, icon: Globe, color: 'from-green-500 to-teal-500' },
                        ].map((stat, i) => (
                            <div key={i} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-all">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">{stat.label}</p>
                                        <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stat.value}</p>
                                    </div>
                                    <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.color}`}>
                                        <stat.icon className="w-6 h-6 text-white" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Tabs */}
                    <div className="flex flex-wrap gap-2 mb-6 bg-white dark:bg-gray-800 p-2 rounded-xl border border-gray-200 dark:border-gray-700">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as TabType)}
                                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                                    activeTab === tab.id
                                        ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md'
                                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                                }`}
                            >
                                <tab.icon className="w-4 h-4" />
                                {tab.label}
                                <span className={`px-2 py-0.5 rounded-full text-xs ${
                                    activeTab === tab.id
                                        ? 'bg-white/20 text-white'
                                        : 'bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300'
                                }`}>
                                    {tab.count}
                                </span>
                            </button>
                        ))}
                    </div>

                    {/* Content */}
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <div className="relative">
                                <div className="w-16 h-16 border-4 border-purple-200 dark:border-purple-800 rounded-full animate-spin border-t-purple-500"></div>
                                <Users className="w-6 h-6 text-purple-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                            </div>
                            <p className="text-gray-500 dark:text-gray-400 mt-4">Loading...</p>
                        </div>
                    ) : (
                        <>
                            {/* All Users Tab */}
                            {activeTab === 'all' && (
                                <div className={`grid gap-4 ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1'}`}>
                                    {filteredAll.length === 0 ? (
                                        <div className="col-span-full text-center py-16 bg-white dark:bg-gray-800 rounded-xl border border-dashed border-gray-300 dark:border-gray-600">
                                            <Search className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No users found</h3>
                                            <p className="text-gray-500 dark:text-gray-400">Try adjusting your search query</p>
                                        </div>
                                    ) : (
                                        filteredAll.map(userItem => (
                                            <UserCard 
                                                key={userItem._id} 
                                                userItem={userItem} 
                                                isFriend={friends.some(f => f._id === userItem._id)}
                                            />
                                        ))
                                    )}
                                </div>
                            )}

                            {/* Friends Tab */}
                            {activeTab === 'friends' && (
                                <div className={`grid gap-4 ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1'}`}>
                                    {filteredFriends.length === 0 ? (
                                        <div className="col-span-full text-center py-16 bg-white dark:bg-gray-800 rounded-xl border border-dashed border-gray-300 dark:border-gray-600">
                                            <Heart className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No friends yet</h3>
                                            <p className="text-gray-500 dark:text-gray-400 mb-4">Start connecting with developers!</p>
                                            <button 
                                                onClick={() => setActiveTab('suggestions')}
                                                className="px-6 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full font-medium hover:shadow-lg transition-all"
                                            >
                                                Find Friends
                                            </button>
                                        </div>
                                    ) : (
                                        filteredFriends.map(friend => (
                                            <UserCard key={friend._id} userItem={friend} isFriend={true} />
                                        ))
                                    )}
                                </div>
                            )}

                            {/* Requests Tab */}
                            {activeTab === 'requests' && (
                                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                                    {friendRequests.length === 0 ? (
                                        <div className="col-span-full text-center py-16 bg-white dark:bg-gray-800 rounded-xl border border-dashed border-gray-300 dark:border-gray-600">
                                            <Bell className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No pending requests</h3>
                                            <p className="text-gray-500 dark:text-gray-400">You're all caught up!</p>
                                        </div>
                                    ) : (
                                        friendRequests.map(request => (
                                            <RequestCard key={request._id} request={request} />
                                        ))
                                    )}
                                </div>
                            )}

                            {/* Suggestions Tab */}
                            {activeTab === 'suggestions' && (
                                <div className={`grid gap-4 ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1'}`}>
                                    {filteredSuggestions.length === 0 ? (
                                        <div className="col-span-full text-center py-16 bg-white dark:bg-gray-800 rounded-xl border border-dashed border-gray-300 dark:border-gray-600">
                                            <UserCheck className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">All caught up!</h3>
                                            <p className="text-gray-500 dark:text-gray-400">No new suggestions at the moment</p>
                                        </div>
                                    ) : (
                                        filteredSuggestions.map(suggestion => (
                                            <UserCard key={suggestion._id} userItem={suggestion} isFriend={false} />
                                        ))
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </Mainlayout>
    );
};

export default FriendsPage;
