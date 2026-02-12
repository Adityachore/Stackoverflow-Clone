import { Button } from "@/components/ui/button";
import Mainlayout from "@/layout/Mainlayout";
import { MessageSquare } from "lucide-react";
import React from "react";

const ChatPage = () => {
    return (
        <Mainlayout>
            <div className="max-w-6xl mx-auto p-4 flex flex-col items-center justify-center min-h-[60vh] text-center">
                <div className="bg-orange-100 dark:bg-orange-900/30 p-6 rounded-full mb-6">
                    <MessageSquare className="w-12 h-12 text-orange-500" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Developer Chat</h1>
                <p className="text-gray-600 dark:text-gray-300 max-w-md mb-8">
                    Connect with other developers in real-time. Discuss code, share ideas, and solve problems together.
                </p>
                <div className="p-4 bg-gray-50 dark:bg-gray-800 border dark:border-gray-700 rounded-lg w-full max-w-lg mb-6">
                    <p className="text-sm text-gray-500 dark:text-gray-400 italic">Chat rooms are currently under maintenance for upgrades.</p>
                </div>
                <Button disabled>Join Room</Button>
            </div>
        </Mainlayout>
    );
};

export default ChatPage;
