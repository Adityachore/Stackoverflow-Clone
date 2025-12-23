import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Mainlayout from "@/layout/Mainlayout";
import { useAuth } from "@/lib/AuthContext";
import { Eye, Check, Search } from "lucide-react";
import React, { useState } from "react";
import { toast } from "react-toastify";

const tags = [
    { name: "javascript", count: 2529141, desc: "For questions regarding programming in ECMAScript (JavaScript/JS) and its various implementations (excluding ActionScript)." },
    { name: "python", count: 2192230, desc: "Python is a multi-paradigm, dynamically typed, multipurpose programming language. It is designed to be quick to learn, understand, and use, and enforces a clean and uniform syntax." },
    { name: "java", count: 1917201, desc: "Java is a high-level object-oriented programming language. Use this tag when you're having problems using or running Java code." },
    { name: "c#", count: 1614833, desc: "C# (pronounced 'see sharp') is a high level, statically typed, multi-paradigm programming language developed by Microsoft." },
    { name: "php", count: 1464380, desc: "PHP is a widely used, open source, general-purpose scripting language. It was originally designed for web development to produce dynamic web pages." },
    { name: "android", count: 1412557, desc: "Android is Google's mobile operating system, used for programming or developing digital devices (Smartphones, Tablets, Automobiles, TVs, Wear, Glass, IoT)." },
    { name: "html", count: 1187422, desc: "HTML (HyperText Markup Language) is the markup language for creating web pages and other information to be displayed in a web browser." },
    { name: "jquery", count: 1037625, desc: "jQuery is a JavaScript library. Consider also adding the individual feature tags for your question." },
    { name: "c++", count: 806721, desc: "C++ is a general-purpose programming language. Initially, it was designed as an extension to C and has a similar syntax, but it is now a completely different language." },
    { name: "css", count: 804245, desc: "CSS (Cascading Style Sheets) is a representation style sheet language used for describing the look and formatting of HTML, XML documents and SVG elements including colors, layout, fonts, and animations." },
];

const TagsPage = () => {
    const { user, updateUserProfile } = useAuth();
    const [searchQuery, setSearchQuery] = useState("");
    const [sortBy, setSortBy] = useState("popular");

    const handleWatch = (tagName: string) => {
        if (!user) {
            toast.error("Please login to watch tags");
            return;
        }
        const currentTags = user.tags || [];
        let newTags;
        if (currentTags.includes(tagName)) {
            newTags = currentTags.filter((t: any) => t !== tagName);
        } else {
            newTags = [...currentTags, tagName];
        }
        // We need to pass other user fields to updateProfile if the backend expects them?
        // The controller code: const { name, about, tags } = req.body.editForm;
        // It updates using $set. If we only pass tags, name/about might be undefined?
        // Check controller: { $set: { name: name, about: about, tags: tags } }
        // Yes! If we pass undefined name, it might set name to null! 
        // We MUST pass name and about.

        updateUserProfile(user._id, {
            name: user.name,
            about: user.about,
            tags: newTags
        });
    };

    const filteredTags = tags
        .filter(t => t.name.toLowerCase().includes(searchQuery.toLowerCase()))
        .sort((a, b) => {
            if (sortBy === "name") return a.name.localeCompare(b.name);
            if (sortBy === "popular") return b.count - a.count;
            // new - just default/random for now
            return 0;
        });

    return (
        <Mainlayout>
            <div className="max-w-6xl mx-auto p-4">
                <div className="mb-8">
                    <h1 className="text-2xl lg:text-3xl font-bold mb-4">Tags</h1>
                    <p className="text-gray-600 max-w-3xl mb-4">
                        A tag is a keyword or label that categorizes your question with other, similar questions. Using
                        the right tags makes it easier for others to find and answer your question.
                    </p>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div className="relative w-full max-w-xs">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                            <Input
                                type="search"
                                placeholder="Filter by tag name"
                                className="pl-8 bg-white"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant={sortBy === "popular" ? "default" : "outline"}
                                onClick={() => setSortBy("popular")}
                                className={sortBy !== "popular" ? "bg-gray-100" : ""}
                            >
                                Popular
                            </Button>
                            <Button
                                variant={sortBy === "name" ? "default" : "ghost"}
                                onClick={() => setSortBy("name")}
                            >
                                Name
                            </Button>
                            <Button
                                variant={sortBy === "new" ? "default" : "ghost"}
                                onClick={() => setSortBy("new")}
                            >
                                New
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {filteredTags.map((tag) => {
                        const isWatching = user?.tags?.includes(tag.name);
                        return (
                            <div key={tag.name} className="bg-white border rounded-lg p-4 flex flex-col gap-3 hover:shadow-sm transition-shadow">
                                <div className="flex justify-between items-start">
                                    <Badge variant="secondary" className="bg-blue-100 text-blue-800 hover:bg-blue-200 cursor-pointer text-sm px-2 py-1 rounded-md">
                                        {tag.name}
                                    </Badge>
                                    <button
                                        onClick={() => handleWatch(tag.name)}
                                        className={`p-1 rounded-full transition-colors ${isWatching ? "bg-orange-100 text-orange-600" : "text-gray-400 hover:bg-gray-100"}`}
                                        title={isWatching ? "Unwatch tag" : "Watch tag"}
                                    >
                                        {isWatching ? <Check className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                                <p className="text-xs text-gray-600 line-clamp-4 flex-grow">
                                    {tag.desc}
                                </p>
                                <div className="text-xs text-gray-400 mt-2">
                                    {tag.count.toLocaleString("en-US")} questions
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </Mainlayout>
    );
};

export default TagsPage;
