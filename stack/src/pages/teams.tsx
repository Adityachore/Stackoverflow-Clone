import Mainlayout from "@/layout/Mainlayout";
import React from "react";
import { Users, Code, BookOpen } from "lucide-react";

const TeamsPage = () => {
    return (
        <Mainlayout>
            <div className="max-w-5xl mx-auto p-6">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-10 text-white mb-12 text-center shadow-lg">
                    <h1 className="text-4xl font-bold mb-4">CodeQuest for Teams</h1>
                    <p className="text-xl opacity-90 mb-0">Collaborate, share knowledge, and build faster with your engineering team.</p>
                </div>

                <div className="grid lg:grid-cols-3 gap-8 mb-16">
                    <div className="text-center p-6">
                        <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-600">
                            <Users className="w-8 h-8" />
                        </div>
                        <h3 className="text-xl font-semibold mb-2">Engage Teams</h3>
                        <p className="text-gray-600">Foster a culture of sharing by giving your developers a private space to ask and answer.</p>
                    </div>
                    <div className="text-center p-6">
                        <div className="bg-orange-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-orange-600">
                            <BookOpen className="w-8 h-8" />
                        </div>
                        <h3 className="text-xl font-semibold mb-2">Internal Wiki</h3>
                        <p className="text-gray-600">Forget outdated documentation. Use our Q&A format to capture institutional knowledge.</p>
                    </div>
                    <div className="text-center p-6">
                        <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-green-600">
                            <Code className="w-8 h-8" />
                        </div>
                        <h3 className="text-xl font-semibold mb-2">Secure & Private</h3>
                        <p className="text-gray-600">SSO, audit logs, and SOC2 compliance to keep your company's intellectual property safe.</p>
                    </div>
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-xl p-8 flex flex-col md:flex-row items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Ready to scale your engineering team?</h2>
                        <p className="text-gray-600">Join 15,000+ teams already using CodeQuest to build the future.</p>
                    </div>
                    <button className="mt-4 md:mt-0 bg-orange-600 hover:bg-orange-700 text-white px-8 py-3 rounded-lg font-bold shadow-sm transition">
                        Get Started Free
                    </button>
                </div>
            </div>
        </Mainlayout>
    );
};

export default TeamsPage;
