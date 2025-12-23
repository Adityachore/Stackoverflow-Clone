import { Badge } from "@/components/ui/badge";
import Mainlayout from "@/layout/Mainlayout";
import React from "react";

const articles = [
    { id: 1, title: "Understanding React Server Components", author: "Dan Abramov", date: "Oct 24, 2024", tags: ["react", "frontend"] },
    { id: 2, title: "The Future of Web Assembly", author: "Lin Clark", date: "Nov 12, 2024", tags: ["wasm", "performance"] },
    { id: 3, title: "Mastering CSS Grid Layout", author: "Rachel Andrew", date: "Dec 01, 2024", tags: ["css", "design"] },
];

const ArticlesPage = () => {
    return (
        <Mainlayout>
            <div className="max-w-6xl mx-auto p-4">
                <h1 className="text-2xl lg:text-3xl font-bold mb-6">Technical Articles</h1>

                <div className="space-y-4">
                    {articles.map(article => (
                        <div key={article.id} className="border p-4 rounded-lg hover:shadow-sm bg-white">
                            <h2 className="text-xl font-semibold mb-2 text-blue-600 hover:underline cursor-pointer">{article.title}</h2>
                            <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
                                <span>By {article.author}</span>
                                <span>•</span>
                                <span>{article.date}</span>
                            </div>
                            <div className="flex gap-2">
                                {article.tags.map(tag => (
                                    <Badge key={tag} variant="secondary" className="bg-gray-100 text-gray-700">{tag}</Badge>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </Mainlayout>
    );
};

export default ArticlesPage;
