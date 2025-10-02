"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ModeToggle } from "./ui/ModeToggle";
import { CircleFabMenu } from "./CircleFabMenu";
import { Button } from "@/components/ui/button";
import { Search, Bell, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

export function Nav() {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => setIsMobile(window.innerWidth < 1024);
    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  const handleLogout = async () => {
    try {
      setLoggingOut(true);
      await new Promise((res) => setTimeout(res, 500));
      await signOut(auth);
      router.push("/");
    } catch (err) {
      console.error(err);
      setLoggingOut(false);
    }
  };

  return (
    <div className="w-full border-b border-border bg-background px-4 lg:px-6 py-3 shadow-sm sticky top-0 z-50">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Avatar className="h-8 w-8 lg:h-9 lg:w-9">
            <AvatarImage src="/gapuz.png" alt="Profile" />
            <AvatarFallback className="bg-muted text-muted-foreground">
              JD
            </AvatarFallback>
          </Avatar>
          <span className="text-md font-semibold font-mono text-foreground hidden sm:block">
            Coin Tracking System
          </span>
          <span className="text-md font-semibold text-foreground sm:hidden">
            GTS
          </span>
        </div>

        {/* Desktop Nav */}
        {!isMobile && (
          <div className="flex-1 hidden lg:flex items-center ml-8 space-x-4">
            <Link
              href="/dashboard"
              className="px-4 py-2 text-sm font-medium font-mono text-muted-foreground hover:text-foreground hover:bg-accent rounded-md"
            >
              Dashboard
            </Link>

            {/* Branches link with dropdown */}
            <DropdownMenu>
              <div className="flex items-center space-x-1">
                {/* Main Branches link */}
                <Link
                  href="/branches"
                  className="px-4 py-2 text-sm font-medium font-mono text-muted-foreground hover:text-foreground hover:bg-accent rounded-md"
                >
                  Branches
                </Link>

                {/* Dropdown trigger */}
                <DropdownMenuTrigger asChild>
                  <button className="px-2 py-2 rounded-md hover:bg-accent">
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  </button>
                </DropdownMenuTrigger>
              </div>

              {/* Dropdown content */}
              <DropdownMenuContent align="start" className="w-40">
                <DropdownMenuItem asChild>
                  <Link href="/branches">Branches</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/harvest">Harvest</Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Link
              href="/units"
              className="px-4 py-2 text-sm font-medium font-mono text-muted-foreground hover:text-foreground hover:bg-accent rounded-md"
            >
              Units
            </Link>
            <Link
              href="/real-time"
              className="px-4 py-2 text-sm font-medium font-mono text-muted-foreground hover:text-foreground hover:bg-accent rounded-md"
            >
              Real-Time
            </Link>

            <div className="ml-auto flex items-center space-x-2">
              <Button variant="ghost" size="icon">
                <Search className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon">
                <Bell className="h-4 w-4" />
              </Button>
              <ModeToggle />

              {/* Avatar + Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center space-x-1 px-2 py-1 rounded-md hover:bg-accent focus:outline-none">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src="/gapuz.png" alt="Profile" />
                      <AvatarFallback>JD</AvatarFallback>
                    </Avatar>
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  </button>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="end" className="w-40">
                  <DropdownMenuItem asChild>
                    <Link href="/contacts">Contacts</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/settings">Settings</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="text-red-500 focus:text-red-500"
                  >
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        )}

        {/* Mobile */}
        {isMobile && <CircleFabMenu handleLogout={handleLogout} />}
      </div>

      {/* Logging Out Overlay */}
      {loggingOut && (
        <div className="fixed inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-50">
          <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="ml-4 text-3xl font-bold text-foreground">
            Logging Out...
          </p>
        </div>
      )}
    </div>
  );
}
