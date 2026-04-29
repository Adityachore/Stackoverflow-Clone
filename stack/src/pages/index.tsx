import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import Mainlayout from "@/layout/Mainlayout";
import axiosInstance from "@/lib/axiosinstance";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState, useRef } from "react";


export default function Home() {
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const searchQuery = (typeof router.query.search === 'string' ? router.query.search : "")?.toLowerCase() || "";

  // Advanced filter state
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState({
    hasAcceptedAnswer: false,
    noAnswers: false,
    hasAnswers: false,
    minVotes: 0,
    selectedTags: [] as string[],
    dateRange: 'all' as 'all' | 'today' | 'week' | 'month' | 'year'
  });
  const filterRef = useRef<HTMLDivElement>(null);

  // Close filter panel when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setShowFilterPanel(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Get unique tags from questions
  const allTags = [...new Set(questions.flatMap((q: any) => q.questiontags || []))];

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

  const filteredQuestions = questions
    .filter((q: any) => {
      // Search filter
      const matchesSearch =
        !searchQuery ||
        q.questiontitle?.toLowerCase().includes(searchQuery) ||
        q.questionbody?.toLowerCase().includes(searchQuery) ||
        q.questiontags?.some((tag: string) =>
          tag.toLowerCase().includes(searchQuery)
        );

      // Tab filter
      if (filter === "unanswered") {
        if (q.noofanswer !== 0) return false;
      }

      // Advanced filters
      if (advancedFilters.hasAcceptedAnswer && !q.acceptedAnswerId) {
        return false;
      }

      if (advancedFilters.noAnswers && q.noofanswer > 0) {
        return false;
      }

      if (advancedFilters.hasAnswers && q.noofanswer === 0) {
        return false;
      }

      const votes = (q.upvote?.length || 0) - (q.downvote?.length || 0);
      if (advancedFilters.minVotes > 0 && votes < advancedFilters.minVotes) {
        return false;
      }

      if (advancedFilters.selectedTags.length > 0) {
        const hasMatchingTag = q.questiontags?.some((tag: string) =>
          advancedFilters.selectedTags.includes(tag)
        );
        if (!hasMatchingTag) return false;
      }

      // Date range filter
      if (advancedFilters.dateRange !== 'all') {
        const questionDate = new Date(q.askedon);
        const now = new Date();
        let cutoffDate = new Date();

        switch (advancedFilters.dateRange) {
          case 'today':
            cutoffDate.setHours(0, 0, 0, 0);
            break;
          case 'week':
            cutoffDate.setDate(now.getDate() - 7);
            break;
          case 'month':
            cutoffDate.setMonth(now.getMonth() - 1);
            break;
          case 'year':
            cutoffDate.setFullYear(now.getFullYear() - 1);
            break;
        }

        if (questionDate < cutoffDate) return false;
      }

      return matchesSearch;
    })
    .sort((a: any, b: any) => {
      // Sorting Logic
      if (filter === "newest" || filter === "active") {
        return new Date(b.askedon).getTime() - new Date(a.askedon).getTime();
      }
      return 0;
    });

  const clearAdvancedFilters = () => {
    setAdvancedFilters({
      hasAcceptedAnswer: false,
      noAnswers: false,
      hasAnswers: false,
      minVotes: 0,
      selectedTags: [],
      dateRange: 'all'
    });
  };

  const hasActiveFilters = advancedFilters.hasAcceptedAnswer || 
    advancedFilters.noAnswers || 
    advancedFilters.hasAnswers || 
    advancedFilters.minVotes > 0 || 
    advancedFilters.selectedTags.length > 0 || 
    advancedFilters.dateRange !== 'all';

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
            {searchQuery ? `Search Results for "${searchQuery}"` : "Top Questions"}
          </h1>
          <button
            onClick={() => router.push("/ask")}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-medium whitespace-nowrap"
          >
            Ask Question
          </button>
        </div>
        <div className="w-full">
          <div className="flex flex-col sm:flex-row items-start sm:items-center mb-4 text-sm gap-2 sm:gap-4">
            <span className="text-gray-600">
              {filteredQuestions.length} question{filteredQuestions.length !== 1 ? "s" : ""}
            </span>
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
                className="px-2 sm:px-3 py-1 text-gray-600 hover:bg-gray-100 rounded flex items-center text-xs sm:text-sm cursor-not-allowed opacity-60"
                title="Bounties not yet implemented"
              >
                Bountied
                <Badge variant="secondary" className="ml-1 text-xs">
                  0
                </Badge>
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
              <button className="px-2 sm:px-3 py-1 text-gray-600 hover:bg-gray-100 rounded text-xs sm:text-sm">
                More ▼
              </button>
              <div className="relative" ref={filterRef}>
                <button
                  onClick={() => setShowFilterPanel(!showFilterPanel)}
                  className={`px-2 sm:px-3 py-1 border text-gray-600 hover:bg-gray-50 rounded ml-auto text-xs sm:text-sm flex items-center gap-1 ${
                    hasActiveFilters ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-300'
                  }`}
                >
                  🔍 Filter
                  {hasActiveFilters && (
                    <span className="bg-blue-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                      !
                    </span>
                  )}
                </button>

                {/* Advanced Filter Panel */}
                {showFilterPanel && (
                  <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 p-4">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="font-medium text-gray-900 dark:text-white">Advanced Filters</h3>
                      {hasActiveFilters && (
                        <button
                          onClick={clearAdvancedFilters}
                          className="text-xs text-blue-600 hover:underline"
                        >
                          Clear all
                        </button>
                      )}
                    </div>

                    {/* Answer Status */}
                    <div className="mb-4">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                        Answer Status
                      </label>
                      <div className="space-y-2">
                        <label className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={advancedFilters.hasAcceptedAnswer}
                            onChange={(e) => setAdvancedFilters(prev => ({
                              ...prev,
                              hasAcceptedAnswer: e.target.checked
                            }))}
                            className="rounded border-gray-300"
                          />
                          Has accepted answer
                        </label>
                        <label className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={advancedFilters.noAnswers}
                            onChange={(e) => setAdvancedFilters(prev => ({
                              ...prev,
                              noAnswers: e.target.checked,
                              hasAnswers: false
                            }))}
                            className="rounded border-gray-300"
                          />
                          No answers
                        </label>
                        <label className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={advancedFilters.hasAnswers}
                            onChange={(e) => setAdvancedFilters(prev => ({
                              ...prev,
                              hasAnswers: e.target.checked,
                              noAnswers: false
                            }))}
                            className="rounded border-gray-300"
                          />
                          Has answers
                        </label>
                      </div>
                    </div>

                    {/* Minimum Votes */}
                    <div className="mb-4">
                      <label htmlFor="minVotes" className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                        Minimum Votes
                      </label>
                      <input
                        id="minVotes"
                        type="number"
                        min="0"
                        value={advancedFilters.minVotes}
                        onChange={(e) => setAdvancedFilters(prev => ({
                          ...prev,
                          minVotes: parseInt(e.target.value) || 0
                        }))}
                        placeholder="0"
                        aria-label="Minimum votes filter"
                        className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    {/* Date Range */}
                    <div className="mb-4">
                      <label htmlFor="dateRange" className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                        Posted Within
                      </label>
                      <select
                        id="dateRange"
                        value={advancedFilters.dateRange}
                        onChange={(e) => setAdvancedFilters(prev => ({
                          ...prev,
                          dateRange: e.target.value as any
                        }))}
                        aria-label="Filter by date range"
                        className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="all">All time</option>
                        <option value="today">Today</option>
                        <option value="week">Past week</option>
                        <option value="month">Past month</option>
                        <option value="year">Past year</option>
                      </select>
                    </div>

                    {/* Tags Filter */}
                    {allTags.length > 0 && (
                      <div className="mb-3">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                          Filter by Tags
                        </label>
                        <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
                          {allTags.slice(0, 15).map((tag: string) => (
                            <button
                              key={tag}
                              onClick={() => {
                                setAdvancedFilters(prev => ({
                                  ...prev,
                                  selectedTags: prev.selectedTags.includes(tag)
                                    ? prev.selectedTags.filter(t => t !== tag)
                                    : [...prev.selectedTags, tag]
                                }));
                              }}
                              className={`text-xs px-2 py-1 rounded ${
                                advancedFilters.selectedTags.includes(tag)
                                  ? 'bg-blue-500 text-white'
                                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              }`}
                            >
                              {tag}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <button
                      onClick={() => setShowFilterPanel(false)}
                      className="w-full mt-2 bg-blue-600 text-white text-sm py-2 rounded hover:bg-blue-700"
                    >
                      Apply Filters
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {filteredQuestions.length === 0 ? (
            <div className="text-center text-gray-500 mt-10 p-10 bg-gray-50 rounded-lg border border-gray-200">
              {searchQuery ? (
                <>
                  <p className="text-lg font-medium mb-2">No results found for "{searchQuery}"</p>
                  <p className="text-sm">Try different keywords or filters.</p>
                </>
              ) : (
                <p>No questions found. Be the first to ask!</p>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredQuestions.map((question: any) => (
                <div key={question._id} className="border-b border-gray-200 pb-4">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex sm:flex-col items-center sm:items-center text-sm text-gray-600 sm:w-16 lg:w-20 gap-4 sm:gap-2">
                      <div className="text-center">
                        <div className={`font-medium ${(question.upvote?.length || 0) - (question.downvote?.length || 0) > 0 ? 'text-green-600' : (question.upvote?.length || 0) - (question.downvote?.length || 0) < 0 ? 'text-red-600' : ''}`}>
                          {(question.upvote?.length || 0) - (question.downvote?.length || 0)}
                        </div>
                        <div className="text-xs">votes</div>
                      </div>
                      <div className="text-center">
                        <div
                          className={`font-medium ${question.acceptedAnswerId
                            ? "text-white bg-green-600 px-2 py-1 rounded"
                            : question.noofanswer > 0
                            ? "text-green-600 border border-green-600 px-2 py-1 rounded"
                            : ""
                            }`}
                        >
                          {question.acceptedAnswerId ? "✓ " : ""}{question.noofanswer}
                        </div>
                        <div className="text-xs">
                          {question.noofanswer === 1
                            ? "answer"
                            : "answers"}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium text-gray-500">
                          {question.views || 0}
                        </div>
                        <div className="text-xs">views</div>
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
                          {question.questiontags.map((tag: any) => (
                            <div key={tag}>
                              <Badge
                                variant="secondary"
                                className="text-xs bg-blue-100 text-blue-800 hover:bg-blue-200 cursor-pointer"
                              >
                                {tag}
                              </Badge>
                            </div>
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
