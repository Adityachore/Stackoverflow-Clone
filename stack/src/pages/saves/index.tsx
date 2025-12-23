import { Button } from "@/components/ui/button";
import Mainlayout from "@/layout/Mainlayout";
import { Bookmark } from "lucide-react";
import Link from "next/link";
import React from "react";

const SavesPage = () => {
    return (
        <Mainlayout>
            <div className="max-w-6xl mx-auto p-4 flex flex-col items-center justify-center min-h-[60vh] text-center">
                <div className="bg-gray-100 p-6 rounded-full mb-6">
                    <Bookmark className="w-12 h-12 text-gray-400" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Saves</h1>
                <p className="text-gray-600 max-w-md mb-8">
                    You haven't saved any questions, answers, or lists yet.
                    Click the bookmark icon on any post to save it for later reference.
                </p>
                <div className="flex gap-4">
                    <Link href="/">
                        <Button variant="default" className="bg-blue-600 hover:bg-blue-700">Browse Questions</Button>
                    </Link>
                    <Link href="/challenges">
                        <Button variant="outline">Explore Challenges</Button>
                    </Link>
                </div>
            </div>
        </Mainlayout>
    );
};

export default SavesPage;
