import { useAuth } from "@/lib/AuthContext";
import { Menu, Search } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import LanguageSwitcher from "./LanguageSwitcher";

// const User = {
//   _id: "1",
//   name: "Alice Johnson",
// };

const Navbar = ({ handleslidein }: any) => {
  const { user, Logout } = useAuth();
  const router = useRouter();
  const [hasMounted, setHasMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (router.isReady && router.query.search) {
      setSearchQuery(router.query.search as string);
    }
  }, [router.isReady, router.query.search]);

  useEffect(() => {
    setHasMounted(true);
  }, []);
  const handlelogout = () => {
    Logout();
    router.push("/auth");
  };
  return (
    <div className="sticky top-0 z-50 w-full min-h-[53px] bg-white border-t-[3px] border-[#ef8236] shadow-[0_1px_5px_#00000033] flex items-center justify-center">
      <div className="w-[90%] max-w-[1440px] flex items-center justify-between mx-auto py-1">
        <button
          aria-label="Toggle sidebar"
          className="sm:block md:hidden p-2 rounded hover:bg-gray-100 transition"
          onClick={handleslidein}
        >
          <Menu className="w-5 h-5 text-gray-800" />
        </button>
        <div className="flex items-center gap-2 flex-grow">
          <Link href="/" className="px-3 py-1">
            <img src="/logo.png" alt="Logo" className="h-6 w-auto" />
          </Link>

          <div className="hidden sm:flex gap-1">
            {[
              { label: "About", href: "/about" },
              { label: "Products", href: "/products" },
              { label: "For Teams", href: "/teams" },
            ].map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className={`text-sm font-medium px-4 py-2 rounded transition ${router.pathname === item.href
                  ? "bg-gray-200 text-orange-600"
                  : "text-[#454545] hover:bg-gray-200"
                  }`}
              >
                {item.label}
              </Link>
            ))}
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (searchQuery.trim()) {
                router.push(`/?search=${encodeURIComponent(searchQuery)}`);
              } else {
                router.push("/");
              }
            }}
            className="hidden lg:block flex-grow relative px-3"
          >
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full max-w-[600px] pl-9 pr-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-300"
            />
            <Search className="absolute left-4 top-2.5 h-4 w-4 text-gray-600" />
          </form>
        </div>
        <div className="flex items-center gap-2">
          <LanguageSwitcher variant="icon" />
          {!hasMounted ? null : !user ? (
            <Link
              href="/auth"
              className="text-sm font-medium text-[#454545] bg-[#e7f8fe] hover:bg-[#d3e4eb] border border-blue-500 px-4 py-1.5 rounded transition"
            >
              Log in
            </Link>
          ) : (
            <>
              <Link
                href={`/users/${user._id}`}
                className="flex items-center justify-center bg-orange-600 text-white text-sm font-semibold w-9 h-9 rounded-full"
              >
                {user.name?.charAt(0).toUpperCase()}
              </Link>

              <button
                onClick={handlelogout}
                className="text-sm font-medium text-[#454545] bg-[#e7f8fe] hover:bg-[#d3e4eb] border border-blue-500 px-4 py-1.5 rounded transition"
              >
                Log out
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Navbar;
