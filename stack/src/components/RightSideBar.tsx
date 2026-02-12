import React from "react";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
const RightSideBar = () => {
  return (
    <aside className="w-72 lg:w-80 p-4 lg:p-6 bg-gray-50 dark:bg-gray-800 min-h-screen transition-colors">
      <div className="space-y-4 lg:space-y-6">
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded p-3 lg:p-4">
          <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-3 text-sm lg:text-base">
            The Overflow Blog
          </h3>
          <ul className="space-y-2 text-xs lg:text-sm">
            <li className="flex items-start">
              <span className="text-gray-400 mr-2">✏️</span>
              <span className="text-gray-700 dark:text-gray-300">A new era of Stack Overflow</span>
            </li>
            <li className="flex items-start">
              <span className="text-gray-400 mr-2">✏️</span>
              <span className="text-gray-700 dark:text-gray-300">
                How your favorite movie is changing language learning technology
              </span>
            </li>
          </ul>
        </div>

        <div className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded p-3 lg:p-4">
          <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-3 text-sm lg:text-base">
            Featured on Meta
          </h3>
          <ul className="space-y-2 text-xs lg:text-sm">
            <li className="flex items-start">
              <span className="text-blue-500 mr-2">💬</span>
              <span className="text-gray-700 dark:text-gray-300">
                Results of the June 2025 Community Asks Sprint
              </span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-500 mr-2">💬</span>
              <span className="text-gray-700 dark:text-gray-300">
                Will you help build our new visual identity?
              </span>
            </li>
            <li className="flex items-start">
              <span className="text-gray-400 mr-2">📋</span>
              <span className="text-gray-700 dark:text-gray-300">
                Policy: Generative AI (e.g., ChatGPT) is banned
              </span>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-3 text-sm lg:text-base">
            Custom Filters
          </h3>
          <Button
            variant="outline"
            size="sm"
            className="bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 border-blue-600 dark:border-blue-500 hover:bg-blue-50 dark:hover:bg-gray-600 text-xs lg:text-sm"
          >
            Create a custom filter
          </Button>
        </div>

        <div>
          <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-3 text-sm lg:text-base">
            Watched Tags
          </h3>
          <div className="flex items-center justify-center py-6 lg:py-8">
            <div className="text-center">
              <Eye className="w-10 h-10 lg:w-12 lg:h-12 text-gray-300 dark:text-gray-500 mx-auto mb-2" />
              <p className="text-xs lg:text-sm text-gray-500 dark:text-gray-400 mb-3">
                Watch tags to curate your list of questions.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 border-blue-600 dark:border-blue-500 hover:bg-blue-50 dark:hover:bg-gray-600 text-xs lg:text-sm"
              >
                👁️ Watch a tag
              </Button>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default RightSideBar;
