"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { signInWithGoogle } from "../lib/firebase";
import { useUser } from "@/providers/UserProvider";
import { useRouter } from "next/navigation";
import Lightning from "@/components/Lightning";

export default function Home() {
  const { user, loading } = useUser();
  const router = useRouter();
  const [showInfo, setShowInfo] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const handleGoogleLogin = async () => {
    try {
      await signInWithGoogle();
    } catch (err) {
      console.error("Google login failed:", err);
    }
  };

  useEffect(() => {
    console.log("Login page - User state:", { user, loading });

    if (!loading && user) {
      console.log("Redirecting based on status:", user.status);

      if (user.status === "approved") {
        if (user.role === "admin" || user.role === "partner") {
          router.push("/dashboard");
        } else {
          router.push("/sorry");
        }
      } else {
        router.push("/sorry");
      }
    }
  }, [user, loading, router]);

  // Check if mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center text-gray-100 font-mono relative overflow-hidden px-4 py-8">
      {/* Lightning Background */}
      <div className="absolute inset-0 z-0">
        <Lightning
          hue={151}
          xOffset={isMobile ? 0.8 : 1.3}
          speed={0.7}
          intensity={isMobile ? 0.8 : 1.1}
          size={isMobile ? 1.2 : 1.7}
        />
      </div>

      {/* Main Container - Stack vertically on mobile */}
      <div className="relative z-10 flex flex-col md:flex-row items-center gap-6 w-full max-w-4xl">
        {/* Main Card - Added transition and conditional transform */}
        <div
          className={`relative bg-black/20 backdrop-blur-lg rounded-2xl border border-white/10 p-6 md:p-8 shadow-2xl w-full max-w-md md:min-w-[600px] md:max-w-none transition-transform duration-500 ${
            showInfo && !isMobile ? "-translate-x-23" : "translate-x-0"
          }`}
        >
          <div className="flex flex-col md:flex-row items-center gap-6">
            {/* Logo Image */}
            <div className="flex-shrink-0">
              <Image
                src="/gapuz.png"
                alt="Coin Slot Tracker"
                width={isMobile ? 80 : 120}
                height={isMobile ? 8 : 12}
                priority
                className="rounded-lg"
              />
            </div>

            {/* Vertical Separator - Hidden on mobile */}
            <div className="hidden md:block h-16 w-px bg-white/10"></div>

            {/* Horizontal Separator - Only on mobile */}
            <div className="md:hidden w-full h-px bg-white/10 my-2"></div>

            {/* Content Area */}
            <div className="flex-1 w-full">
              {/* Title & Subtitle */}
              <div className="mb-4 text-center md:text-left">
                <h1 className="text-xl md:text-2xl font-bold tracking-wider text-white mb-1">
                  COIN SLOT TRACKER
                </h1>
                <p className="text-white/80 text-xs md:text-sm">
                  Real-time sales monitoring system for multiple branches
                </p>
              </div>

              {/* Button and Arrow - Stack vertically on mobile */}
              <div className="flex flex-col md:flex-row items-center gap-4">
                <button
                  onClick={handleGoogleLogin}
                  className="w-full md:flex-1 rounded-xl bg-white/10 hover:bg-white/20 transition-all duration-300 
                           text-white font-semibold py-3 px-4 md:py-3 border border-white/20 hover:border-white/40
                           flex items-center justify-center gap-3 hover:scale-105 text-sm md:text-base"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Sign in with Google
                </button>

                {/* Hoverable Arrow - Full width on mobile */}
                <button
                  onClick={() => setShowInfo(!showInfo)}
                  onMouseEnter={() => !isMobile && setShowInfo(true)}
                  onMouseLeave={() => !isMobile && setShowInfo(false)}
                  className="w-full md:w-auto group flex items-center justify-center gap-2 text-white/60 hover:text-white transition-all duration-300 px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-sm"
                >
                  <span>How it works</span>
                  <div
                    className={`transform transition-transform duration-300 text-lg ${
                      isMobile
                        ? showInfo
                          ? "rotate-90"
                          : "rotate-0"
                        : "group-hover:translate-x-1"
                    }`}
                  >
                    {isMobile ? "↓" : "→"}
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* Desktop Info Panel - Positioned relative to main card */}
          <div
            className={`hidden md:block absolute top-1/2 left-full ml-4 w-80 bg-black/10 backdrop-blur-lg rounded-2xl border border-white/10 p-6 shadow-2xl transition-all duration-500 ${
              showInfo && !isMobile
                ? "opacity-100 translate-x-0 -translate-y-1/2 visible"
                : "opacity-0 -translate-x-4 -translate-y-1/2 invisible"
            }`}
            onMouseEnter={() => !isMobile && setShowInfo(true)}
            onMouseLeave={() => !isMobile && setShowInfo(false)}
          >
            <h3 className="text-lg font-bold text-white mb-3">
              System Overview
            </h3>

            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-cyan-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-cyan-400 text-xs">1</span>
                </div>
                <div>
                  <h4 className="font-semibold text-white">ESP32 Sensors</h4>
                  <p className="text-white/70">
                    Hardware monitors coin slots in real-time across all
                    branches
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-green-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-green-400 text-xs">2</span>
                </div>
                <div>
                  <h4 className="font-semibold text-white">Firebase Backend</h4>
                  <p className="text-white/70">
                    Secure cloud storage and real-time data synchronization
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-purple-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-purple-400 text-xs">3</span>
                </div>
                <div>
                  <h4 className="font-semibold text-white">
                    Dashboard Analytics
                  </h4>
                  <p className="text-white/70">
                    Live sales data, branch performance, and revenue tracking
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-orange-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-orange-400 text-xs">4</span>
                </div>
                <div>
                  <h4 className="font-semibold text-white">
                    Multi-branch Support
                  </h4>
                  <p className="text-white/70">
                    Manage multiple locations with role-based access control
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-white/10">
              <p className="text-xs text-white/60">
                Secure • Real-time • Scalable
              </p>
            </div>
          </div>
        </div>

        {/* Mobile Info Panel - Separate from main card */}
        <div
          className={`md:hidden w-full bg-black/10 backdrop-blur-lg rounded-2xl border border-white/10 p-6 shadow-2xl transition-all duration-500 ${
            showInfo && isMobile
              ? "opacity-100 translate-y-0 visible max-h-96 overflow-y-auto"
              : "opacity-0 -translate-y-4 invisible max-h-0 overflow-hidden"
          }`}
        >
          <h3 className="text-lg font-bold text-white mb-3">System Overview</h3>

          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-cyan-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-cyan-400 text-xs">1</span>
              </div>
              <div>
                <h4 className="font-semibold text-white">ESP32 Sensors</h4>
                <p className="text-white/70">
                  Hardware monitors coin slots in real-time across all branches
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-green-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-green-400 text-xs">2</span>
              </div>
              <div>
                <h4 className="font-semibold text-white">Firebase Backend</h4>
                <p className="text-white/70">
                  Secure cloud storage and real-time data synchronization
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-purple-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-purple-400 text-xs">3</span>
              </div>
              <div>
                <h4 className="font-semibold text-white">
                  Dashboard Analytics
                </h4>
                <p className="text-white/70">
                  Live sales data, branch performance, and revenue tracking
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-orange-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-orange-400 text-xs">4</span>
              </div>
              <div>
                <h4 className="font-semibold text-white">
                  Multi-branch Support
                </h4>
                <p className="text-white/70">
                  Manage multiple locations with role-based access control
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-white/10">
            <p className="text-xs text-white/60">
              Secure • Real-time • Scalable
            </p>
          </div>
        </div>
      </div>

      {/* Footer - Adjusted for mobile */}
      <footer className="absolute bottom-4 md:bottom-8 text-center w-full text-white/60 text-xs md:text-sm px-4">
        Powered by Next.js + Firebase + ESP32 AND LOTS OF UNNECESSARY ANIMATIONS
      </footer>
    </div>
  );
}
