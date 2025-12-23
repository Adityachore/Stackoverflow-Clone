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

const challenges = [
    {
        id: 1,
        title: "The Great Algorithm Sprint",
        description:
            "Solve 5 algorithmic problems in under 60 minutes. Test your speed and efficiency against the community.",
        participants: 1240,
        daysLeft: 2,
        difficulty: "Hard",
        reward: "500 Rep",
        progress: 0,
    },
    {
        id: 2,
        title: "React Component Cleanup",
        description:
            "Refactor a messy component into a clean, reusable one. focus on performance and readability.",
        participants: 856,
        daysLeft: 5,
        difficulty: "Medium",
        reward: "Badges",
        progress: 0,
    },
    {
        id: 3,
        title: "CSS Art Challenge",
        description:
            "Create a pure CSS illustration of a retro computer. No SVGs or images allowed!",
        participants: 2300,
        daysLeft: 12,
        difficulty: "Easy",
        reward: "Profile Frame",
        progress: 0,
    },
];

const ChallengesPage = () => {
    return (
        <Mainlayout>
            <div className="max-w-6xl mx-auto p-4">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 flex items-center gap-2">
                            <Trophy className="text-orange-500 w-8 h-8" />
                            Challenges And Events
                        </h1>
                        <p className="text-gray-600 mt-2">
                            Compete, learn, and earn rewards with community challenges.
                        </p>
                    </div>
                    <Button className="bg-orange-500 hover:bg-orange-600 text-white">
                        View Leaderboard
                    </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {challenges.map((challenge) => (
                        <Card key={challenge.id} className="flex flex-col">
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
                                    <span className="text-xs font-semibold text-orange-600 bg-orange-50 px-2 py-1 rounded">
                                        {challenge.reward}
                                    </span>
                                </div>
                                <CardTitle className="text-xl mb-1">{challenge.title}</CardTitle>
                                <CardDescription className="line-clamp-2">
                                    {challenge.description}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="flex-grow">
                                <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                                    <div className="flex items-center gap-1">
                                        <Users className="w-4 h-4" />
                                        <span>{challenge.participants} joined</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Clock className="w-4 h-4" />
                                        <span>{challenge.daysLeft} days left</span>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <div className="flex justify-between text-xs text-gray-500">
                                        <span>Progress</span>
                                        <span>{challenge.progress}%</span>
                                    </div>
                                    <Progress value={challenge.progress} className="h-2" />
                                </div>
                            </CardContent>
                            <CardFooter>
                                <Button className="w-full" variant="outline">
                                    Join Challenge
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>

                <div className="mt-12 bg-gray-50 rounded-lg p-8 text-center border border-gray-200">
                    <h2 className="text-xl font-semibold mb-2">Want to host a challenge?</h2>
                    <p className="text-gray-600 mb-6 max-w-2xl mx-auto">Create a custom challenge for your team or the entire community. Set rules, rewards, and duration.</p>
                    <Button variant="secondary">Create Challenge</Button>
                </div>
            </div>
        </Mainlayout>
    );
};

export default ChallengesPage;
