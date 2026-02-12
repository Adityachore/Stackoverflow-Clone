import Navbar from "@/components/Navbar";
import RightSideBar from "@/components/RightSideBar";
import Sidebar from "@/components/Sidebar";
import React, { ReactNode, useEffect, useState } from "react";
interface MainlayoutProps {
  children: ReactNode;
}
const Mainlayout = ({ children }: MainlayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  useEffect(() => {
    if (window.innerWidth <= 768) {
      setSidebarOpen(false);
    }
  }, []);
  const handleslidein = () => {
    if (window.innerWidth <= 768) {
      setSidebarOpen((state) => !state);
    }
  };

  return (
    <div className="bg-[#f8f9fa] dark:bg-gray-900 text-[#3a3a3a] dark:text-gray-100 min-h-screen transition-colors duration-300">
      <Navbar handleslidein={handleslidein} />
      <div className="flex max-w-full py-1">
        <Sidebar isopen={sidebarOpen} />
        <main className="flex-1 min-w-0 p-4 lg:p-6 bg-white dark:bg-gray-900 transition-colors duration-300">{children}</main>
        <div className="hidden lg:block border-1 border-gray-200 dark:border-gray-700">
          <RightSideBar />
        </div>
      </div>
    </div>
  );
};

export default Mainlayout;
