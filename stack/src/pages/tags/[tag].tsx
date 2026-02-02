import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import Mainlayout from "@/layout/Mainlayout";
import axiosInstance from "@/lib/axiosinstance";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

export default function TagQuestionsPage() {
    const [questions, setQuestions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const { tag } = router.query; // Get the tag from the URL

    useEffect(() => {
        const fetchquestion = async () => {
            try {
                const res = await axiosInstance.get("/question/getallquestion");
                setQuestions(res.data.data || []);
            } catch (error) {
                console.log(error);
            } finally {
                setLoading(false);
            }
        };
        fetchquestion();
    }, []);

    const [filter, setFilter] = useState("newest");

    // Filter questions by the specific tag
    const filteredQuestions = questions
        .filter((q: any) => {
            // Tag filter
            if (!tag) return false;
            const hasTag = q.questiontags?.some((t: string) =>
                t.toLowerCase() === (tag as string).toLowerCase()
            );

            if (!hasTag) return false;

            // Tab filter
            if (filter === "unanswered") {
                return q.noofanswer === 0;
            }

            return true;
        })
        .sort((a: any, b: any) => {
            // Sorting Logic
            if (filter === "newest" || filter === "active") {
                return new Date(b.askedon).getTime() - new Date(a.askedon).getTime();
            }
            return 0;
        });

    if (loading) {
        return (
            <Mainlayout>
                <div className="flex justify-center items-center py-20">
                    <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
                </div>
            </Mainlayout>
        );
    }

    return (
        <Mainlayout>
            <main className="min-w-0 p-4 lg:p-6 ">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                    <h1 className="text-xl lg:text-2xl font-semibold">
                        Questions tagged [{tag}]
                    </h1>
                    <button
                        onClick={() => router.push("/ask")}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-medium whitespace-nowrap"
                    >
                        Ask Question
                    </button>
                </div>

                <p className="text-gray-600 mb-6">
                    {filteredQuestions.length} question{filteredQuestions.length !== 1 ? "s" : ""}
                </p>

                <div className="w-full">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center mb-4 text-sm gap-2 sm:gap-4">
                        <div className="flex flex-wrap gap-1 sm:gap-2">
                            <button
                                onClick={() => setFilter("newest")}
                                className={`px-2 sm:px-3 py-1 rounded text-xs sm:text-sm ${filter === "newest"
                                    ? "bg-gray-200 text-gray-700"
                                    : "text-gray-600 hover:bg-gray-100"
                                    }`}
                            >
                                Newest
                            </button>
                            <button
                                onClick={() => setFilter("active")}
                                className={`px-2 sm:px-3 py-1 rounded text-xs sm:text-sm ${filter === "active"
                                    ? "bg-gray-200 text-gray-700"
                                    : "text-gray-600 hover:bg-gray-100"
                                    }`}
                            >
                                Active
                            </button>
                            <button
                                onClick={() => setFilter("unanswered")}
                                className={`px-2 sm:px-3 py-1 rounded text-xs sm:text-sm ${filter === "unanswered"
                                    ? "bg-gray-200 text-gray-700"
                                    : "text-gray-600 hover:bg-gray-100"
                                    }`}
                            >
                                Unanswered
                            </button>
                        </div>
                    </div>

                    {filteredQuestions.length === 0 ? (
                        <div className="text-center text-gray-500 mt-10 p-10 bg-gray-50 rounded-lg border border-gray-200">
                            <p>No questions found with this tag.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {filteredQuestions.map((question: any) => (
                                <div key={question._id} className="border-b border-gray-200 pb-4">
                                    <div className="flex flex-col sm:flex-row gap-4">
                                        <div className="flex sm:flex-col items-center sm:items-center text-sm text-gray-600 sm:w-16 lg:w-20 gap-4 sm:gap-2">
                                            <div className="text-center">
                                                <div className="font-medium">
                                                    {question.upvote.length}
                                                </div>
                                                <div className="text-xs">votes</div>
                                            </div>
                                            <div className="text-center">
                                                <div
                                                    className={`font-medium ${question.answer.length > 0
                                                        ? "text-green-600 bg-green-100 px-2 py-1 rounded"
                                                        : ""
                                                        }`}
                                                >
                                                    {question.noofanswer}
                                                </div>
                                                <div className="text-xs">
                                                    {question.noofanswer === 1
                                                        ? "answer"
                                                        : "answers"}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <Link
                                                href={`/questions/${question._id}`}
                                                className="text-blue-600 hover:text-blue-800 text-base lg:text-lg font-medium mb-2 block"
                                            >
                                                {question.questiontitle}
                                            </Link>
                                            <p className="text-gray-700 text-sm mb-3 line-clamp-2">
                                                {question.questionbody}
                                            </p>

                                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                                                <div className="flex flex-wrap gap-1">
                                                    {question.questiontags.map((t: any) => (
                                                        <Link key={t} href={`/tags/${t}`}>
                                                            <Badge
                                                                variant="secondary"
                                                                className={`text-xs cursor-pointer ${t === tag ? "bg-blue-600 text-white hover:bg-blue-700" : "bg-blue-100 text-blue-800 hover:bg-blue-200"}`}
                                                            >
                                                                {t}
                                                            </Badge>
                                                        </Link>
                                                    ))}
                                                </div>

                                                <div className="flex items-center text-xs text-gray-600 flex-shrink-0">
                                                    <Link
                                                        href={`/users/${question.userid}`}
                                                        className="flex items-center"
                                                    >
                                                        <Avatar className="w-4 h-4 mr-1">
                                                            <AvatarFallback className="text-xs">
                                                                {question.userposted?.[0] || "U"}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <span className="text-blue-600 hover:text-blue-800 mr-1">
                                                            {question.userposted}
                                                        </span>
                                                    </Link>

                                                    <span>asked {new Date(question.askedon).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </Mainlayout>
    );
}
