import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import Mainlayout from "@/layout/Mainlayout";
import { Clock, Trophy, Users } from "lucide-react";
import React from "react";

// Challenges moved to API


import { useAuth } from "@/lib/AuthContext";
import axiosInstance from "@/lib/axiosinstance";
import { toast } from "react-toastify";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

const ChallengesPage = () => {
    const { user } = useAuth();
    const router = useRouter();
    const [challenges, setChallenges] = useState<any[]>([]);

    useEffect(() => {
        const fetchChallenges = async () => {
            try {
                const res = await axiosInstance.get('/challenge/getall');
                setChallenges(res.data.data);
            } catch (error) {
                console.log(error);
            }
        }
        fetchChallenges();
    }, []);

    const handleJoin = async (id: string) => {
        if (!user) {
            toast.error("Please login to join challenges");
            router.push('/auth');
            return;
        }
        try {
            const res = await axiosInstance.patch(`/challenge/join/${id}`, { userId: user._id });
            if (res.data.data) {
                setChallenges(prev => prev.map(c => c._id === id ? res.data.data : c));
                toast.success("Updated challenge status");
            }
        } catch (error) {
            console.log(error);
            toast.error("Failed to update status");
        }
    }

    return (
        <Mainlayout>
            <div className="max-w-6xl mx-auto p-4">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <Trophy className="text-orange-500 w-8 h-8" />
                            Challenges And Events
                        </h1>
                        <p className="text-gray-600 dark:text-gray-300 mt-2">
                            Compete, learn, and earn rewards with community challenges.
                        </p>
                    </div>
                    <Button className="bg-orange-500 hover:bg-orange-600 text-white">
                        View Leaderboard
                    </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {challenges.length === 0 ? <p className="text-gray-600 dark:text-gray-400">No Active Challenges Found. check back later.</p> :
                        challenges.map((challenge) => {
                            const isJoined = challenge.participants.includes(user?._id);
                            return (
                                <Card key={challenge._id} className="flex flex-col bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                                    <CardHeader>
                                        <div className="flex justify-between items-start mb-2">
                                            <Badge
                                                variant={
                                                    challenge.difficulty === "Hard"
                                                        ? "destructive"
                                                        : challenge.difficulty === "Medium"
                                                            ? "default"
                                                            : "secondary"
                                                }
                                            >
                                                {challenge.difficulty}
                                            </Badge>
                                            <span className="text-xs font-semibold text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/30 px-2 py-1 rounded">
                                                {challenge.reward}
                                            </span>
                                        </div>
                                        <CardTitle className="text-xl mb-1 text-gray-900 dark:text-white">{challenge.title}</CardTitle>
                                        <CardDescription className="line-clamp-2 dark:text-gray-400">
                                            {challenge.description}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="flex-grow">
                                        <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-4">
                                            <div className="flex items-center gap-1">
                                                <Users className="w-4 h-4" />
                                                <span>{challenge.participants.length} joined</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Clock className="w-4 h-4" />
                                                <span>{challenge.daysLeft} days left</span>
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                                                <span>Progress</span>
                                                <span>{challenge.progress}%</span>
                                            </div>
                                            <Progress value={challenge.progress} className="h-2" />
                                        </div>
                                    </CardContent>
                                    <CardFooter>
                                        <Button
                                            className={`w-full ${isJoined ? "bg-green-600 text-white hover:bg-green-700" : "bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600"}`}
                                            variant={isJoined ? "default" : "outline"}
                                            onClick={() => handleJoin(challenge._id)}
                                        >
                                            {isJoined ? "Joined" : "Join Challenge"}
                                        </Button>
                                    </CardFooter>
                                </Card>
                            )
                        })}
                </div>

                <div className="mt-12 bg-gray-50 dark:bg-gray-800 rounded-lg p-8 text-center border border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Want to host a challenge?</h2>
                    <p className="text-gray-600 dark:text-gray-300 mb-6 max-w-2xl mx-auto">Create a custom challenge for your team or the entire community. Set rules, rewards, and duration.</p>
                    <Button variant="secondary" className="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600" onClick={() => toast.info("Coming Soon!")}>Create Challenge</Button>
                </div>
            </div>
        </Mainlayout>
    );
};

export default ChallengesPage;
