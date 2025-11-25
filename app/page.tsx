"use client";

import type React from "react";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { signInWithGoogle } from "../lib/firebase";
import { useUser } from "@/providers/UserProvider";
import { useRouter } from "next/navigation";
import { Background } from "@/components/Background";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const MEMBER_IDS = [1, 2, 3, 4, 5] as const;
type MemberId = (typeof MEMBER_IDS)[number];

// Music URLs for each team member (replace with your actual CDN links)
const teamMusic: Record<MemberId, string> = {
  1: "https://res.cloudinary.com/dtce1buqy/video/upload/v1763979381/rosalie_htzlq5.mp4",
  2: "https://res.cloudinary.com/dtce1buqy/video/upload/v1763978375/Untitled_video_-_Made_with_Clipchamp_hyzmmf.mp4",
  3: "https://res.cloudinary.com/dtce1buqy/video/upload/v1763977974/joevenmusic_mhvuop.mp4",
  4: "https://res.cloudinary.com/dtce1buqy/video/upload/v1763977739/gabrielmusic_ljwdxe.mp4",
  5: "https://res.cloudinary.com/dtce1buqy/video/upload/v1763976943/jakemusic_wt7ti9.mp4",
};

export default function Home() {
  const { user, loading } = useUser();
  const router = useRouter();
  const [showInfo, setShowInfo] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const [audioStates, setAudioStates] = useState<
    Record<
      MemberId,
      { isPlaying: boolean; currentTime: number; duration: number }
    >
  >({
    1: { isPlaying: false, currentTime: 0, duration: 30 },
    2: { isPlaying: false, currentTime: 0, duration: 30 },
    3: { isPlaying: false, currentTime: 0, duration: 30 },
    4: { isPlaying: false, currentTime: 0, duration: 30 },
    5: { isPlaying: false, currentTime: 0, duration: 30 },
  });

  type MemberId = 1 | 2 | 3 | 4 | 5;

  const audioRefs: Record<
    MemberId,
    React.RefObject<HTMLAudioElement | null>
  > = {
    1: useRef<HTMLAudioElement>(null),
    2: useRef<HTMLAudioElement>(null),
    3: useRef<HTMLAudioElement>(null),
    4: useRef<HTMLAudioElement>(null),
    5: useRef<HTMLAudioElement>(null),
  };
  const togglePlay = async (memberId: MemberId) => {
    const audio = audioRefs[memberId].current;
    if (!audio) return;

    try {
      if (audioStates[memberId].isPlaying) {
        // Fade out and pause
        await fadeOut(audio);
        audio.pause();
        setAudioStates((prev) => ({
          ...prev,
          [memberId]: {
            ...prev[memberId],
            isPlaying: false,
          },
        }));
      } else {
        // Stop all other audios
        MEMBER_IDS.forEach((id) => {
          const otherAudio = audioRefs[id].current;
          if (otherAudio && id !== memberId && audioStates[id].isPlaying) {
            otherAudio.pause();
            otherAudio.currentTime = 0;
            setAudioStates((prev) => ({
              ...prev,
              [id]: {
                ...prev[id],
                isPlaying: false,
                currentTime: 0,
              },
            }));
          }
        });

        // Play current audio with fade in
        audio.currentTime = 0;
        try {
          await audio.play().catch((err) => {
            console.error("Audio play error:", err);
          });
        } catch (err) {
          console.error("Audio play failed:", err);
        }
        await fadeIn(audio);
        setAudioStates((prev) => ({
          ...prev,
          [memberId]: {
            ...prev[memberId],
            isPlaying: true,
          },
        }));

        // Auto-stop after 30 seconds with fade out
        setTimeout(async () => {
          if (audioStates[memberId].isPlaying) {
            await fadeOut(audio);
            audio.pause();
            audio.currentTime = 0;
            setAudioStates((prev) => ({
              ...prev,
              [memberId]: {
                ...prev[memberId],
                isPlaying: false,
                currentTime: 0,
              },
            }));
          }
        }, 30000);
      }
    } catch (error) {
      console.error("Audio playback failed:", error);
    }
  };

  // Fade in effect
  const fadeIn = (audio: HTMLAudioElement) => {
    return new Promise<void>((resolve) => {
      audio.volume = 0;
      const fadeInInterval = setInterval(() => {
        if (audio.volume < 0.8) {
          audio.volume = Math.min(audio.volume + 0.1, 0.8);
        } else {
          clearInterval(fadeInInterval);
          resolve();
        }
      }, 100);
    });
  };

  // Fade out effect
  const fadeOut = (audio: HTMLAudioElement) => {
    return new Promise<void>((resolve) => {
      const fadeOutInterval = setInterval(() => {
        if (audio.volume > 0.1) {
          audio.volume = Math.max(audio.volume - 0.1, 0);
        } else {
          audio.volume = 0;
          clearInterval(fadeOutInterval);
          resolve();
        }
      }, 100);
    });
  };

  // Update progress bars
  useEffect(() => {
    const intervals = MEMBER_IDS.map((id) => {
      return setInterval(() => {
        const audio = audioRefs[id].current;
        if (audio && audioStates[id].isPlaying) {
          setAudioStates((prev) => ({
            ...prev,
            [id]: {
              ...prev[id],
              currentTime: audio.currentTime,
            },
          }));
        }
      }, 1000);
    });

    return () => intervals.forEach((interval) => clearInterval(interval));
  }, [audioStates]);

  const handleGoogleLogin = async () => {
    try {
      await signInWithGoogle();
    } catch (err) {
      console.error("Google login failed:", err);
    }
  };

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  useEffect(() => {
    console.log("Login page - User state:", { user, loading });

    if (!loading && user) {
      console.log("Redirecting based on status:", user.status);

      if (user.status === "approved") {
        if (user.role === "admin") {
          router.push("/dashboard");
        } else if (user.role === "partner") {
          router.push("/partner");
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

  // Format time for display
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  // Calculate progress percentage
  const getProgress = (memberId: MemberId) => {
    const state = audioStates[memberId];
    return (state.currentTime / state.duration) * 100;
  };

  return (
    <div className="h-screen overflow-y-scroll snap-y snap-mandatory scrollbar-hidden">
      {/* Fixed Navigation Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/20 backdrop-blur-lg border-b border-white/10">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          {/* Logo and Company Name - Click to scroll to top */}
          <button
            onClick={scrollToTop}
            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
          >
            <Image
              src="/gapuzlogo.png"
              alt="Coinsynchro"
              width={40}
              height={40}
              className="rounded-lg"
            />
            <span className="text-white font-bold text-lg">Coinsynchro</span>
          </button>

          {/* Navigation Links */}
          <nav className="flex items-center gap-6">
            <button
              onClick={() => scrollToSection("home")}
              className="text-white/80 hover:text-white transition-colors text-sm"
            >
              Home
            </button>
            <button
              onClick={() => scrollToSection("about")}
              className="text-white/80 hover:text-white transition-colors text-sm"
            >
              About Us
            </button>
          </nav>
        </div>
      </header>

      {/* Background - Fixed */}
      <div className="fixed inset-0 z-0">
        <Background />
      </div>

      {/* Home Section */}
      <section
        id="home"
        className="min-h-screen snap-start flex items-center justify-center text-gray-100 font-mono relative px-4 py-8"
      >
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-6 w-full max-w-4xl mt-16">
          {/* Main Card */}
          <div
            className={`relative bg-black/20 backdrop-blur-lg rounded-2xl border border-white/10 p-6 md:p-8 shadow-2xl w-full max-w-md md:min-w-[600px] md:max-w-none transition-transform duration-500 ${
              showInfo && !isMobile ? "-translate-x-23" : "translate-x-0"
            }`}
          >
            <div className="flex flex-col md:flex-row items-center gap-6">
              {/* Logo Image */}
              <div className="flex-shrink-0">
                <Image
                  src="/gapuzlogo.png"
                  alt="Coin Slot Tracker"
                  width={isMobile ? 80 : 120}
                  height={isMobile ? 80 : 120}
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
                    <h4 className="font-semibold text-white">
                      Firebase Backend
                    </h4>
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

        {/* Footer - Adjusted for mobile */}
        <footer className="absolute bottom-4 md:bottom-8 text-center w-full text-white/60 text-xs md:text-sm px-4">
          Powered by Next.js + Firebase + ESP32
        </footer>
      </section>

      {/* About Us Section */}
      <section
        id="about"
        className="min-h-screen snap-start flex flex-col items-center justify-center text-gray-100 font-mono relative px-4 py-8"
      >
        <div className="relative z-10 w-full max-w-6xl mt-16 text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
            About Us
          </h2>
          <p className="text-white/60">Meet Team Ascender</p>
        </div>

        {/* Team Member Sections Container */}
        <div className="w-full h-[calc(100vh-200px)] overflow-auto snap-y snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {/* Team Member 1 - Rosalie */}
          <section className="min-h-full snap-start flex items-center justify-center py-8">
            <div className="bg-black/20 backdrop-blur-lg rounded-2xl border border-white/10 p-8 md:p-12 shadow-2xl w-full max-w-6xl mx-4">
              <div className="flex flex-col lg:flex-row items-center gap-8">
                {/* Left Side - Profile Image, Number & Badges */}
                <div className="flex-shrink-0 text-center">
                  <Image
                    src="/rosalie.jpg"
                    alt="Rosalie"
                    width={120}
                    height={120}
                    className="rounded-lg mx-auto"
                  />
                  <div className="mt-4">
                    <span className="text-cyan-400 text-lg font-bold">
                      #001
                    </span>
                  </div>
                  {/* Badges */}
                  <div className="mt-4 flex flex-wrap justify-center gap-2">
                    <Badge
                      variant="secondary"
                      className="bg-cyan-500/20 text-cyan-400 border-cyan-400/30"
                    >
                      Writing
                    </Badge>
                    <Badge
                      variant="secondary"
                      className="bg-cyan-500/20 text-cyan-400 border-cyan-400/30"
                    >
                      Dancer
                    </Badge>
                  </div>
                </div>

                {/* Middle - Info & Music Player */}
                <div className="flex-1 text-center lg:text-left">
                  <h3 className="text-2xl md:text-3xl font-bold text-white mb-2">
                    Rosalie Paculanan
                  </h3>
                  <p className="text-cyan-400 text-lg mb-6">Project Manager</p>

                  {/* Location and Age */}
                  <div className="space-y-2 mb-6">
                    <p className="text-white/70 text-lg">
                      <span className="font-semibold text-white">
                        Location:
                      </span>{" "}
                      Sugbongcogon, Misamis Oriental
                    </p>
                    <p className="text-white/70 text-lg">
                      <span className="font-semibold text-white">Age:</span> 22
                    </p>
                  </div>

                  {/* Music Player */}
                  <div className="mb-6">
                    <p className="text-white/80 text-sm mb-3">My Theme Song:</p>
                    <div className="flex items-center gap-4">
                      <Button
                        onClick={() => togglePlay(1)}
                        size="icon"
                        variant="outline"
                        className={`w-12 h-12 ${
                          audioStates[1].isPlaying
                            ? "bg-cyan-500/40 border-cyan-300"
                            : "bg-cyan-500/20 border-cyan-400/30"
                        } hover:bg-cyan-500/30 hover:scale-105 transition-all`}
                      >
                        <svg
                          className="w-5 h-5 text-cyan-400"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          {audioStates[1].isPlaying ? (
                            <path d="M6 4h4v16H6zm8 0h4v16h-4z" />
                          ) : (
                            <path d="M8 5v14l11-7z" />
                          )}
                        </svg>
                      </Button>
                      <div className="flex-1">
                        <div className="text-white text-sm mb-1">
                          Air Supply - Here I Am
                        </div>
                        <div className="w-full bg-white/10 rounded-full h-1">
                          <div
                            className="bg-cyan-400 h-1 rounded-full transition-all duration-1000"
                            style={{ width: `${getProgress(1)}%` }}
                          ></div>
                        </div>
                      </div>
                      <div className="text-white/60 text-xs">
                        {formatTime(audioStates[1].currentTime)}
                      </div>
                    </div>
                  </div>
                  <audio ref={audioRefs[1]} preload="metadata">
                    <source src={teamMusic[1]} type="audio/mpeg" />
                  </audio>
                </div>

                {/* Right Side - Quote Only */}
                <div className="w-full lg:w-80">
                  <div className="bg-cyan-500/10 border-l-4 border-cyan-400 rounded-lg p-6">
                    <p className="text-white/80 italic text-base leading-relaxed">
                      &quot;Innovation distinguishes between a leader and a
                      follower. Our mission is to create solutions that
                      matter.&quot;
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Team Member 2 - Johnlory */}
          <section className="min-h-full snap-start flex items-center justify-center py-8">
            <div className="bg-black/20 backdrop-blur-lg rounded-2xl border border-white/10 p-8 md:p-12 shadow-2xl w-full max-w-6xl mx-4">
              <div className="flex flex-col lg:flex-row items-center gap-8">
                <div className="flex-shrink-0 text-center">
                  <Image
                    src="/lory.jpg"
                    alt="Johnlory"
                    width={120}
                    height={120}
                    className="rounded-lg mx-auto"
                  />
                  <div className="mt-4">
                    <span className="text-green-400 text-lg font-bold">
                      #002
                    </span>
                  </div>
                  {/* Badges */}
                  <div className="mt-4 flex flex-wrap justify-center gap-2">
                    <Badge
                      variant="secondary"
                      className="bg-green-500/20 text-green-400 border-green-400/30"
                    >
                      UX Design
                    </Badge>
                    <Badge
                      variant="secondary"
                      className="bg-green-500/20 text-green-400 border-green-400/30"
                    >
                      Web Design
                    </Badge>
                  </div>
                </div>

                <div className="flex-1 text-center lg:text-left">
                  <h3 className="text-2xl md:text-3xl font-bold text-white mb-2">
                    Johnlory Amparo
                  </h3>
                  <p className="text-green-400 text-lg mb-6">
                    Back-end Developer
                  </p>

                  <div className="space-y-2 mb-6">
                    <p className="text-white/70 text-lg">
                      <span className="font-semibold text-white">
                        Location:
                      </span>{" "}
                      Tagoloan, Misamis Oriental
                    </p>
                    <p className="text-white/70 text-lg">
                      <span className="font-semibold text-white">Age:</span> 22
                    </p>
                  </div>

                  {/* Music Player */}
                  <div className="mb-6">
                    <div className="flex items-center gap-4">
                      <Button
                        onClick={() => togglePlay(2)}
                        size="icon"
                        variant="outline"
                        className={`w-12 h-12 ${
                          audioStates[2].isPlaying
                            ? "bg-green-500/40 border-green-300"
                            : "bg-green-500/20 border-green-400/30"
                        } hover:bg-green-500/30 hover:scale-105 transition-all`}
                      >
                        <svg
                          className="w-5 h-5 text-green-400"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          {audioStates[2].isPlaying ? (
                            <path d="M6 4h4v16H6zm8 0h4v16h-4z" />
                          ) : (
                            <path d="M8 5v14l11-7z" />
                          )}
                        </svg>
                      </Button>
                      <div className="flex-1">
                        <div className="text-white text-sm mb-1">
                          Thirty Seconds To Mars - The Kill
                        </div>
                        <div className="w-full bg-white/10 rounded-full h-1">
                          <div
                            className="bg-green-400 h-1 rounded-full transition-all duration-1000"
                            style={{ width: `${getProgress(2)}%` }}
                          ></div>
                        </div>
                      </div>
                      <div className="text-white/60 text-xs">
                        {formatTime(audioStates[2].currentTime)}
                      </div>
                    </div>
                  </div>
                  <audio ref={audioRefs[2]} preload="metadata">
                    <source src={teamMusic[2]} type="audio/mpeg" />
                  </audio>
                </div>

                <div className="w-full lg:w-80">
                  <div className="bg-green-500/10 border-l-4 border-green-400 rounded-lg p-6">
                    <p className="text-white/80 italic text-base leading-relaxed">
                      &quot;Never put yourself on a pedestal.&quot;
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Team Member 3 - Joeven */}
          <section className="min-h-full snap-start flex items-center justify-center py-8">
            <div className="bg-black/20 backdrop-blur-lg rounded-2xl border border-white/10 p-8 md:p-12 shadow-2xl w-full max-w-6xl mx-4">
              <div className="flex flex-col lg:flex-row items-center gap-8">
                <div className="flex-shrink-0 text-center">
                  <Image
                    src="/joeven.jpg"
                    alt="Joeven"
                    width={120}
                    height={120}
                    className="rounded-lg mx-auto"
                  />
                  <div className="mt-4">
                    <span className="text-purple-400 text-lg font-bold">
                      #003
                    </span>
                  </div>
                  {/* Badges */}
                  <div className="mt-4 flex flex-wrap justify-center gap-2">
                    <Badge
                      variant="secondary"
                      className="bg-purple-500/20 text-purple-400 border-purple-400/30"
                    >
                      Finance
                    </Badge>
                    <Badge
                      variant="secondary"
                      className="bg-purple-500/20 text-purple-400 border-purple-400/30"
                    >
                      Business
                    </Badge>
                  </div>
                </div>

                <div className="flex-1 text-center lg:text-left">
                  <h3 className="text-2xl md:text-3xl font-bold text-white mb-2">
                    Joeven Stephen Secusana
                  </h3>
                  <p className="text-purple-400 text-lg mb-6">System Analyst</p>

                  <div className="space-y-2 mb-6">
                    <p className="text-white/70 text-lg">
                      <span className="font-semibold text-white">
                        Location:
                      </span>{" "}
                      Tagoloan, Misamis Oriental
                    </p>
                    <p className="text-white/70 text-lg">
                      <span className="font-semibold text-white">Age:</span> 22
                    </p>
                  </div>

                  {/* Music Player */}
                  <div className="mb-6">
                    <div className="flex items-center gap-4">
                      <Button
                        onClick={() => togglePlay(3)}
                        size="icon"
                        variant="outline"
                        className={`w-12 h-12 ${
                          audioStates[3].isPlaying
                            ? "bg-purple-500/40 border-purple-300"
                            : "bg-purple-500/20 border-purple-400/30"
                        } hover:bg-purple-500/30 hover:scale-105 transition-all`}
                      >
                        <svg
                          className="w-5 h-5 text-purple-400"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          {audioStates[3].isPlaying ? (
                            <path d="M6 4h4v16H6zm8 0h4v16h-4z" />
                          ) : (
                            <path d="M8 5v14l11-7z" />
                          )}
                        </svg>
                      </Button>
                      <div className="flex-1">
                        <div className="text-white text-sm mb-1">
                          Taylor Swift - Long Live
                        </div>
                        <div className="w-full bg-white/10 rounded-full h-1">
                          <div
                            className="bg-purple-400 h-1 rounded-full transition-all duration-1000"
                            style={{ width: `${getProgress(3)}%` }}
                          ></div>
                        </div>
                      </div>
                      <div className="text-white/60 text-xs">
                        {formatTime(audioStates[3].currentTime)}
                      </div>
                    </div>
                  </div>
                  <audio ref={audioRefs[3]} preload="metadata">
                    <source src={teamMusic[3]} type="audio/mpeg" />
                  </audio>
                </div>

                <div className="w-full lg:w-80">
                  <div className="bg-purple-500/10 border-l-4 border-purple-400 rounded-lg p-6">
                    <p className="text-white/80 italic text-base leading-relaxed">
                      &quot;O Lord, help me to be pure, but not yet.&quot;
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Team Member 4 - Gabriel */}
          <section className="min-h-full snap-start flex items-center justify-center py-8">
            <div className="bg-black/20 backdrop-blur-lg rounded-2xl border border-white/10 p-8 md:p-12 shadow-2xl w-full max-w-6xl mx-4">
              <div className="flex flex-col lg:flex-row items-center gap-8">
                <div className="flex-shrink-0 text-center">
                  <Image
                    src="/gabriel.jpg"
                    alt="Gabriel"
                    width={120}
                    height={120}
                    className="rounded-lg mx-auto"
                  />
                  <div className="mt-4">
                    <span className="text-orange-400 text-lg font-bold">
                      #004
                    </span>
                  </div>
                  {/* Badges */}
                  <div className="mt-4 flex flex-wrap justify-center gap-2">
                    <Badge
                      variant="secondary"
                      className="bg-orange-500/20 text-orange-400 border-orange-400/30"
                    >
                      UI Design
                    </Badge>
                    <Badge
                      variant="secondary"
                      className="bg-orange-500/20 text-orange-400 border-orange-400/30"
                    >
                      Design Expertise
                    </Badge>
                  </div>
                </div>

                <div className="flex-1 text-center lg:text-left">
                  <h3 className="text-2xl md:text-3xl font-bold text-white mb-2">
                    Gabriel Suarez
                  </h3>
                  <p className="text-orange-400 text-lg mb-6">
                    Front-end Developer
                  </p>

                  <div className="space-y-2 mb-6">
                    <p className="text-white/70 text-lg">
                      <span className="font-semibold text-white">
                        Location:
                      </span>{" "}
                      Agusan, Cagayan De Oro
                    </p>
                    <p className="text-white/70 text-lg">
                      <span className="font-semibold text-white">Age:</span> 22
                    </p>
                  </div>

                  {/* Music Player */}
                  <div className="mb-6">
                    <div className="flex items-center gap-4">
                      <Button
                        onClick={() => togglePlay(4)}
                        size="icon"
                        variant="outline"
                        className={`w-12 h-12 ${
                          audioStates[4].isPlaying
                            ? "bg-orange-500/40 border-orange-300"
                            : "bg-orange-500/20 border-orange-400/30"
                        } hover:bg-orange-500/30 hover:scale-105 transition-all`}
                      >
                        <svg
                          className="w-5 h-5 text-orange-400"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          {audioStates[4].isPlaying ? (
                            <path d="M6 4h4v16H6zm8 0h4v16h-4z" />
                          ) : (
                            <path d="M8 5v14l11-7z" />
                          )}
                        </svg>
                      </Button>
                      <div className="flex-1">
                        <div className="text-white text-sm mb-1">
                          Lord Huron - The Night We Met
                        </div>
                        <div className="w-full bg-white/10 rounded-full h-1">
                          <div
                            className="bg-orange-400 h-1 rounded-full transition-all duration-1000"
                            style={{ width: `${getProgress(4)}%` }}
                          ></div>
                        </div>
                      </div>
                      <div className="text-white/60 text-xs">
                        {formatTime(audioStates[4].currentTime)}
                      </div>
                    </div>
                  </div>
                  <audio ref={audioRefs[4]} preload="metadata">
                    <source src={teamMusic[4]} type="audio/mpeg" />
                  </audio>
                </div>

                <div className="w-full lg:w-80">
                  <div className="bg-orange-500/10 border-l-4 border-orange-400 rounded-lg p-6">
                    <p className="text-white/80 italic text-base leading-relaxed">
                      &quot;The beginning is half of everything.&quot;
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Team Member 5 - Jake */}
          <section className="min-h-full snap-start flex items-center justify-center py-8">
            <div className="bg-black/20 backdrop-blur-lg rounded-2xl border border-white/10 p-8 md:p-12 shadow-2xl w-full max-w-6xl mx-4">
              <div className="flex flex-col lg:flex-row items-center gap-8">
                <div className="flex-shrink-0 text-center">
                  <Image
                    src="/jake.jpg"
                    alt="Jake"
                    width={120}
                    height={120}
                    className="rounded-lg mx-auto"
                  />
                  <div className="mt-4">
                    <span className="text-red-400 text-lg font-bold">#005</span>
                  </div>
                  {/* Badges */}
                  <div className="mt-4 flex flex-wrap justify-center gap-2">
                    <Badge
                      variant="secondary"
                      className="bg-red-500/20 text-red-400 border-red-400/30"
                    >
                      Communication
                    </Badge>
                    <Badge
                      variant="secondary"
                      className="bg-red-500/20 text-red-400 border-red-400/30"
                    >
                      Guitar
                    </Badge>
                    <Badge
                      variant="secondary"
                      className="bg-red-500/20 text-red-400 border-red-400/30"
                    >
                      Writing
                    </Badge>
                  </div>
                </div>

                <div className="flex-1 text-center lg:text-left">
                  <h3 className="text-2xl md:text-3xl font-bold text-white mb-2">
                    Jake Cuyugan
                  </h3>
                  <p className="text-red-400 text-lg mb-6">Technical Writer</p>

                  <div className="space-y-2 mb-6">
                    <p className="text-white/70 text-lg">
                      <span className="font-semibold text-white">
                        Location:
                      </span>{" "}
                      Natumolan, Tagoloan, Misamis Oriental
                    </p>
                    <p className="text-white/70 text-lg">
                      <span className="font-semibold text-white">Age:</span> 27
                    </p>
                  </div>

                  {/* Music Player */}
                  <div className="mb-6">
                    <div className="flex items-center gap-4">
                      <Button
                        onClick={() => togglePlay(5)}
                        size="icon"
                        variant="outline"
                        className={`w-12 h-12 ${
                          audioStates[5].isPlaying
                            ? "bg-red-500/40 border-red-300"
                            : "bg-red-500/20 border-red-400/30"
                        } hover:bg-red-500/30 hover:scale-105 transition-all`}
                      >
                        <svg
                          className="w-5 h-5 text-red-400"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          {audioStates[5].isPlaying ? (
                            <path d="M6 4h4v16H6zm8 0h4v16h-4z" />
                          ) : (
                            <path d="M8 5v14l11-7z" />
                          )}
                        </svg>
                      </Button>
                      <div className="flex-1">
                        <div className="text-white text-sm mb-1">
                          Oasis - Don&apos;t Look Back in Anger
                        </div>
                        <div className="w-full bg-white/10 rounded-full h-1">
                          <div
                            className="bg-red-400 h-1 rounded-full transition-all duration-1000"
                            style={{ width: `${getProgress(5)}%` }}
                          ></div>
                        </div>
                      </div>
                      <div className="text-white/60 text-xs">
                        {formatTime(audioStates[5].currentTime)}
                      </div>
                    </div>
                  </div>
                  <audio ref={audioRefs[5]} preload="metadata">
                    <source src={teamMusic[5]} type="audio/mpeg" />
                  </audio>
                </div>

                <div className="w-full lg:w-80">
                  <div className="bg-red-500/10 border-l-4 border-red-400 rounded-lg p-6">
                    <p className="text-white/80 italic text-base leading-relaxed">
                      &quot;We are what we repeatedly do.&quot;
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </section>
    </div>
  );
}
