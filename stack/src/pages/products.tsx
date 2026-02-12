import Mainlayout from "@/layout/Mainlayout";
import React from "react";
import { ShoppingBag, Zap, Shield, Rocket } from "lucide-react";

const ProductsPage = () => {
    const products = [
        {
            title: "CodeQuest Enterprise",
            description: "Manage your private knowledge base with top-tier security and AI integrations.",
            icon: <Shield className="w-10 h-10 text-blue-600" />,
        },
        {
            title: "Developer Talent",
            description: "Find the best technical talent with our curated developer network.",
            icon: <Zap className="w-10 h-10 text-orange-500" />,
        },
        {
            title: "Ad Solutions",
            description: "Reach millions of developers right where they solve their daily challenges.",
            icon: <ShoppingBag className="w-10 h-10 text-green-600" />,
        },
        {
            title: "CodeQuest Labs",
            description: "Get early access to experimental features like AI-pair programming and real-time multiplayer debugging.",
            icon: <Rocket className="w-10 h-10 text-purple-600" />,
        },
    ];

    return (
        <Mainlayout>
            <div className="max-w-6xl mx-auto p-6">
                <header className="text-center mb-16">
                    <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white mb-4">Our Products</h1>
                    <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                        Tools designed to help developers and companies build the future together.
                    </p>
                </header>

                <div className="grid md:grid-cols-2 gap-8">
                    {products.map((p, i) => (
                        <div key={i} className="p-8 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition card-hover block">
                            <div className="mb-4">{p.icon}</div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{p.title}</h3>
                            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">{p.description}</p>
                            <button className="mt-4 text-sm font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300">Learn more →</button>
                        </div>
                    ))}
                </div>
            </div>
        </Mainlayout>
    );
};

export default ProductsPage;
