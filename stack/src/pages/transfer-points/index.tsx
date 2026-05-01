import React, { useState, useEffect } from 'react';
import Mainlayout from '@/layout/Mainlayout';
import { useAuth } from '@/lib/AuthContext';
import { transferPoints, getAllUsers } from '@/lib/api';
import { useRouter } from 'next/router';
import { toast } from 'react-toastify';
import {
    Send, Search, User, TrendingUp, Award, AlertCircle, CheckCircle,
    Zap, Users, ArrowRight, Lock
} from 'lucide-react';
import Link from 'next/link';

/**
 * Task 4: Points Transfer Page
 * Features:
 * - Search for recipient profile
 * - Enter number of points to transfer
 * - Minimum 10+ points required to transfer
 * - Users with ≤ 10 points cannot transfer
 * - Visual feedback and validation
 */

export default function TransferPointsPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState('');
    const [users, setUsers] = useState<any[]>([]);
    const [filteredUsers, setFilteredUsers] = useState<any[]>([]);
    const [selectedRecipient, setSelectedRecipient] = useState<any>(null);
    const [pointsToTransfer, setPointsToTransfer] = useState('');
    const [loading, setLoading] = useState(false);
    const [searching, setSearching] = useState(false);
    const [transferring, setTransferring] = useState(false);
    const [showConfirmation, setShowConfirmation] = useState(false);

    // Check authentication
    useEffect(() => {
        if (!user) {
            router.push('/auth');
        }
    }, [user, router]);

    // Fetch all users on mount
    useEffect(() => {
        const fetchUsers = async () => {
            try {
                setLoading(true);
                const { data } = await getAllUsers();
                setUsers(data || []);
            } catch (err) {
                console.error('Failed to fetch users:', err);
                toast.error('Failed to load users');
            } finally {
                setLoading(false);
            }
        };
        
        if (user) {
            fetchUsers();
        }
    }, [user]);

    // Filter users based on search query
    useEffect(() => {
        if (!searchQuery.trim()) {
            setFilteredUsers([]);
            return;
        }

        setSearching(true);
        const query = searchQuery.toLowerCase();
        const filtered = users.filter(u => 
            u._id !== user?._id && // Exclude self
            (u.name?.toLowerCase().includes(query) ||
             u.email?.toLowerCase().includes(query))
        );
        setFilteredUsers(filtered);
        setSearching(false);
    }, [searchQuery, users, user]);

    // Validate points input
    const validateTransfer = () => {
        if (!selectedRecipient) {
            toast.error('Please select a recipient');
            return false;
        }

        const points = parseInt(pointsToTransfer);
        
        if (!pointsToTransfer || isNaN(points)) {
            toast.error('Please enter a valid number of points');
            return false;
        }

        if (points <= 0) {
            toast.error('Points must be greater than 0');
            return false;
        }

        if (!user || user.points <= 10) {
            toast.error('You need more than 10 points to transfer');
            return false;
        }

        if (points > user.points) {
            toast.error(`You only have ${user.points} points`);
            return false;
        }

        if (points > user.points - 10) {
            toast.error(`You must keep at least 10 points. Maximum transferable: ${user.points - 10}`);
            return false;
        }

        return true;
    };

    // Handle transfer
    const handleTransfer = async () => {
        if (!validateTransfer()) return;

        setTransferring(true);
        try {
            await transferPoints(selectedRecipient._id, {
                points: parseInt(pointsToTransfer)
            });

            toast.success(`Successfully transferred ${pointsToTransfer} points to ${selectedRecipient.name}!`);
            
            // Reset form
            setSelectedRecipient(null);
            setPointsToTransfer('');
            setSearchQuery('');
            setShowConfirmation(false);
            setFilteredUsers([]);

            // Refresh user data
            setTimeout(() => {
                window.location.reload();
            }, 2000);
        } catch (err: any) {
            const errorMsg = err.response?.data?.message || 'Failed to transfer points';
            toast.error(errorMsg);
        } finally {
            setTransferring(false);
        }
    };

    if (!user) {
        return (
            <Mainlayout>
                <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
                    <div className="text-center">
                        <div className="inline-flex h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-blue-500"></div>
                        <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
                    </div>
                </div>
            </Mainlayout>
        );
    }

    const canTransfer = user.points > 10;
    const maxTransferable = Math.max(0, user.points - 10);
    const pointsToTransferNum = parseInt(pointsToTransfer) || 0;
    const isValidAmount = pointsToTransferNum > 0 && pointsToTransferNum <= maxTransferable;

    return (
        <Mainlayout>
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-gray-900 p-4 lg:p-8">
                <div className="max-w-4xl mx-auto">
                    {/* Header */}
                    <div className="mb-8">
                        <Link href="/users" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4">
                            <ArrowRight className="w-4 h-4 rotate-180" />
                            Back to Profile
                        </Link>
                        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-3">
                            <Zap className="w-8 h-8 text-yellow-500" />
                            Transfer Points
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400">Share your reputation with fellow developers</p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Main Transfer Card */}
                        <div className="lg:col-span-2">
                            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 border border-gray-200 dark:border-gray-700">
                                {/* Your Points Status */}
                                <div className="mb-8 p-6 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-xl border border-purple-200 dark:border-purple-800">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Your Available Points</p>
                                            <p className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                                <TrendingUp className="w-6 h-6 text-purple-500" />
                                                {user.points}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Max Transferable</p>
                                            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                                {maxTransferable}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Status Alert */}
                                {!canTransfer && (
                                    <div className="mb-6 p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg flex items-start gap-3">
                                        <AlertCircle className="w-5 h-5 text-orange-500 mt-0.5 flex-shrink-0" />
                                        <div>
                                            <p className="font-semibold text-orange-900 dark:text-orange-200">Cannot Transfer Yet</p>
                                            <p className="text-sm text-orange-800 dark:text-orange-300 mt-1">
                                                You need more than 10 points to transfer. Keep earning! 
                                                ({user.points}/11 points)
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {canTransfer && (
                                    <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-start gap-3">
                                        <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                                        <div>
                                            <p className="font-semibold text-green-900 dark:text-green-200">Ready to Transfer</p>
                                            <p className="text-sm text-green-800 dark:text-green-300 mt-1">
                                                You can transfer up to {maxTransferable} points
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {/* Search for Recipient */}
                                <div className="mb-6">
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                                        Search for Recipient
                                    </label>
                                    <div className="relative">
                                        <Search className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                                        <input
                                            type="text"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            placeholder="Search by name or email..."
                                            disabled={!canTransfer}
                                            className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:cursor-not-allowed"
                                        />
                                    </div>

                                    {/* Search Results */}
                                    {searchQuery && (
                                        <div className="mt-4 max-h-64 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                                            {searching ? (
                                                <div className="p-4 text-center text-gray-500">Searching...</div>
                                            ) : filteredUsers.length === 0 ? (
                                                <div className="p-4 text-center text-gray-500">No users found</div>
                                            ) : (
                                                filteredUsers.map(u => (
                                                    <button
                                                        key={u._id}
                                                        onClick={() => {
                                                            setSelectedRecipient(u);
                                                            setSearchQuery('');
                                                            setFilteredUsers([]);
                                                        }}
                                                        className="w-full p-4 border-b border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600 text-left transition-colors last:border-b-0"
                                                    >
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                                                                    {u.name?.[0]?.toUpperCase() || 'U'}
                                                                </div>
                                                                <div>
                                                                    <p className="font-medium text-gray-900 dark:text-white">{u.name}</p>
                                                                    <p className="text-sm text-gray-500 dark:text-gray-400">{u.email}</p>
                                                                </div>
                                                            </div>
                                                            <Award className="w-4 h-4 text-yellow-500" />
                                                        </div>
                                                    </button>
                                                ))
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Selected Recipient */}
                                {selectedRecipient && (
                                    <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                                                    {selectedRecipient.name?.[0]?.toUpperCase() || 'U'}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-gray-900 dark:text-white">{selectedRecipient.name}</p>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400">Recipient selected</p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => setSelectedRecipient(null)}
                                                className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                                            >
                                                Change
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Points Amount */}
                                {selectedRecipient && (
                                    <div className="mb-6">
                                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                                            Points to Transfer
                                        </label>
                                        <input
                                            type="number"
                                            min="1"
                                            max={maxTransferable}
                                            value={pointsToTransfer}
                                            onChange={(e) => setPointsToTransfer(e.target.value)}
                                            placeholder="Enter number of points"
                                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                                        />
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                            Available: {maxTransferable} | Min: 1 | Max: {maxTransferable}
                                        </p>
                                    </div>
                                )}

                                {/* Transfer Button */}
                                {selectedRecipient && (
                                    <button
                                        onClick={() => setShowConfirmation(true)}
                                        disabled={!isValidAmount || transferring}
                                        className={`w-full py-3 px-4 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all ${
                                            isValidAmount && !transferring
                                                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:shadow-lg active:scale-95'
                                                : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                                        }`}
                                    >
                                        {transferring ? (
                                            <>
                                                <div className="w-4 h-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                                                Transferring...
                                            </>
                                        ) : (
                                            <>
                                                <Send className="w-5 h-5" />
                                                Transfer Points
                                            </>
                                        )}
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Sidebar Info */}
                        <div className="space-y-6">
                            {/* Requirements Card */}
                            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
                                <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                    <AlertCircle className="w-5 h-5 text-blue-500" />
                                    Requirements
                                </h3>
                                <div className="space-y-3 text-sm">
                                    <div className="flex items-start gap-3">
                                        <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                                            user.points > 10 
                                                ? 'bg-green-100 dark:bg-green-900/30' 
                                                : 'bg-gray-100 dark:bg-gray-700'
                                        }`}>
                                            {user.points > 10 ? (
                                                <CheckCircle className="w-4 h-4 text-green-600" />
                                            ) : (
                                                <Lock className="w-4 h-4 text-gray-400" />
                                            )}
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900 dark:text-white">Minimum 10+ Points</p>
                                            <p className="text-gray-500 dark:text-gray-400">You need &gt; 10 points to transfer</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 bg-blue-100 dark:bg-blue-900/30">
                                            <CheckCircle className="w-4 h-4 text-blue-600" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900 dark:text-white">Select a Recipient</p>
                                            <p className="text-gray-500 dark:text-gray-400">Find another user to send points to</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 bg-purple-100 dark:bg-purple-900/30">
                                            <CheckCircle className="w-4 h-4 text-purple-600" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900 dark:text-white">Enter Amount</p>
                                            <p className="text-gray-500 dark:text-gray-400">Transfer 1 to {maxTransferable} points</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* How to Earn Points */}
                            <div className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-2xl shadow-lg p-6 border border-yellow-200 dark:border-yellow-800">
                                <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                    <TrendingUp className="w-5 h-5 text-yellow-500" />
                                    Earn Points
                                </h3>
                                <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                                    <p>• Post an answer: <strong>5 pts</strong></p>
                                    <p>• Get 5 upvotes: <strong>+5 pts</strong></p>
                                    <p>• Answer removed: <strong>-5 pts</strong></p>
                                    <p>• Answer downvoted: <strong>-2 pts</strong></p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Confirmation Modal */}
                    {showConfirmation && selectedRecipient && (
                        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-8 animate-in">
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Confirm Transfer</h3>
                                
                                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 mb-6 space-y-3">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600 dark:text-gray-400">From:</span>
                                        <span className="font-semibold text-gray-900 dark:text-white">{user.name}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600 dark:text-gray-400">To:</span>
                                        <span className="font-semibold text-gray-900 dark:text-white">{selectedRecipient.name}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600 dark:text-gray-400">Amount:</span>
                                        <span className="font-bold text-lg text-purple-600 dark:text-purple-400">{pointsToTransfer} pts</span>
                                    </div>
                                </div>
                                
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                                    This action cannot be undone. Make sure the recipient is correct.
                                </p>
                                
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setShowConfirmation(false)}
                                        className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-700"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleTransfer}
                                        disabled={transferring}
                                        className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-medium hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {transferring ? 'Transferring...' : 'Confirm'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </Mainlayout>
    );
}