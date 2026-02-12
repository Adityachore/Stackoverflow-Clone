import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import Mainlayout from "@/layout/Mainlayout";
import { Bot, Send } from "lucide-react";
import React, { useState } from "react";

const AIAssistPage = () => {
    const [messages, setMessages] = useState([
        { role: "ai", text: "Hi! I'm your Stack Overflow AI Assistant. How can I help you debug your code today?" }
    ]);
    const [input, setInput] = useState("");

    const handleSend = () => {
        if (!input.trim()) return;
        setMessages([...messages, { role: "user", text: input }]);
        setTimeout(() => {
            setMessages(prev => [...prev, { role: "ai", text: "I'm a demo bot, but in a real app I would analyze your code! Try checking the 'Tags' page for existing answers." }]);
        }, 1000);
        setInput("");
    };

    return (
        <Mainlayout>
            <div className="max-w-4xl mx-auto h-[calc(100vh-100px)] flex flex-col p-4">
                <div className="mb-4 text-center">
                    <h1 className="text-2xl font-bold flex items-center justify-center gap-2 text-gray-900 dark:text-white">
                        <Bot className="w-8 h-8 text-orange-500" />
                        AI Assist <span className="text-xs bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded-full">Labs</span>
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">Experimental feature to help you write better questions and answers.</p>
                </div>

                <Card className="flex-grow flex flex-col overflow-hidden border shadow-sm dark:border-gray-700 dark:bg-gray-800">
                    <CardContent className="flex-grow overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900">
                        {messages.map((msg, idx) => (
                            <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                                <div className={`max-w-[80%] rounded-lg px-4 py-2 text-sm ${msg.role === "user"
                                        ? "bg-blue-600 text-white rounded-br-none"
                                        : "bg-white dark:bg-gray-800 border dark:border-gray-700 text-gray-800 dark:text-gray-200 rounded-bl-none shadow-sm"
                                    }`}>
                                    {msg.text}
                                </div>
                            </div>
                        ))}
                    </CardContent>
                    <div className="p-4 bg-white dark:bg-gray-800 border-t dark:border-gray-700">
                        <form
                            onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                            className="flex gap-2"
                        >
                            <Input
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Ask me about detailed code issues..."
                                className="flex-grow"
                            />
                            <Button type="submit" size="icon" className="bg-orange-500 hover:bg-orange-600">
                                <Send className="w-4 h-4" />
                            </Button>
                        </form>
                    </div>
                </Card>
            </div>
        </Mainlayout>
    );
};

export default AIAssistPage;
