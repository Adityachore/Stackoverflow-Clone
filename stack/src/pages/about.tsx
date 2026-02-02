import Mainlayout from "@/layout/Mainlayout";
import React from "react";

const AboutPage = () => {
    return (
        <Mainlayout>
            <div className="max-w-4xl mx-auto p-6">
                <h1 className="text-3xl font-bold mb-6 text-gray-900 border-b pb-4">About CodeQuest</h1>
                <div className="prose prose-blue max-w-none text-gray-700 space-y-4">
                    <p className="text-lg leading-relaxed">
                        Welcome to <span className="font-semibold text-orange-600">CodeQuest</span>, your one-stop destination for developer knowledge sharing and community growth.
                    </p>
                    <p>
                        Built as a modern, high-performance community platform, CodeQuest allows developers to ask questions, share insights, and build their technical reputation. Our mission is to democratize technical knowledge and empower developers at every stage of their career.
                    </p>
                    <h2 className="text-2xl font-semibold mt-8 text-gray-800">Why CodeQuest?</h2>
                    <ul className="list-disc pl-6 space-y-2">
                        <li><span className="font-medium text-gray-900">AI Assist:</span> Experience our next-gen AI helper to get instant answers and code refactoring suggestions.</li>
                        <li><span className="font-medium text-gray-900">Rich Community:</span> Engage with experts and peers in localized and global tag communities.</li>
                        <li><span className="font-medium text-gray-900">Premium Design:</span> Enjoy a developer-centric interface designed for productivity and clarity.</li>
                    </ul>
                </div>
            </div>
        </Mainlayout>
    );
};

export default AboutPage;
