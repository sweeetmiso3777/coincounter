"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { signInWithGoogle } from "../lib/firebase";
import { useUser } from "@/providers/UserProvider";
import { useRouter } from "next/navigation";
import { AboutUs } from "@/components/about-us";
import Link from "next/link";
import Antigravity from "@/components/Antigravity";

export default function Home() {
  const { user, loading } = useUser();
  const router = useRouter();
  const [activeSection, setActiveSection] = useState("home");

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
      setActiveSection(sectionId);
    }
  };

  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: "-50% 0px -50% 0px",
      threshold: 0,
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id);
        }
      });
    }, observerOptions);

    const homeSection = document.getElementById("home");
    const aboutSection = document.getElementById("about");

    if (homeSection) observer.observe(homeSection);
    if (aboutSection) observer.observe(aboutSection);

    return () => {
      if (homeSection) observer.unobserve(homeSection);
      if (aboutSection) observer.unobserve(aboutSection);
    };
  }, []);

  useEffect(() => {
    if (!loading && user) {
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

  return (
    // Main container - hides scrollbar but allows scrolling
    <div className="h-screen w-screen bg-white overflow-hidden">
      <div className="absolute inset-0 z-0">
        <Antigravity
          count={300}
          magnetRadius={6}
          ringRadius={7}
          waveSpeed={0.4}
          waveAmplitude={1}
          particleSize={1.5}
          lerpSpeed={0.05}
          color="#86b074"
          autoAnimate
          particleVariance={1}
          rotationSpeed={0}
          depthFactor={1}
          pulseSpeed={3}
          particleShape="capsule"
          fieldStrength={10}
        />
      </div>
      {/* Scrollable content container - hidden scrollbar */}
      <div className="h-full w-full overflow-y-auto scrollbar-hidden">
        <div className="min-h-screen bg-white">
          {/* Navigation */}
          <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-sm border-b border-gray-100">
            <div className="container mx-auto px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 flex items-center justify-center overflow-hidden">
                  <Image
                    src="/gapuzlogo.png"
                    alt="Coinsynchro"
                    width={48}
                    height={48}
                    className="object-contain w-full h-full"
                    priority
                  />
                </div>
                <span className="text-black text-sm font-medium tracking-tight">
                  Coinsynchro
                </span>
              </div>

              <div className="flex items-center gap-6">
                <button
                  onClick={() => scrollToSection("home")}
                  className={`text-xs transition-colors ${
                    activeSection === "home"
                      ? "text-black"
                      : "text-gray-500 hover:text-black"
                  }`}
                >
                  [Home]
                </button>
                <button
                  onClick={() => scrollToSection("about")}
                  className={`text-xs transition-colors ${
                    activeSection === "about"
                      ? "text-black"
                      : "text-gray-500 hover:text-black"
                  }`}
                >
                  [About]
                </button>
              </div>
            </div>
          </nav>

          {/* Home Section */}
          <section
            id="home"
            className="min-h-screen pt-20 flex items-center justify-center px-4 overflow-hidden bg-transparent"
          >
            <div className="w-full max-w-5xl mx-auto">
              <div className="grid md:grid-cols-3 gap-8 items-center">
                {/* Left Column - Login */}
                <div className="md:col-span-1 space-y-8">
                  <div className="text-center bg-white/40 backdrop-blur-[2px] p-8 ">
                    {/* Logo - removed border, made bigger */}
                    <div className="mb-8">
                      <div className="w-32 h-32 mx-auto mb-4 overflow-hidden">
                        <Image
                          src="/gapuzlogo.png"
                          alt="Coinsynchro"
                          width={128}
                          height={128}
                          className="object-contain w-full h-full"
                          priority
                        />
                      </div>
                    </div>

                    <h1 className="text-xl font-bold text-black mb-2">
                      [ Welcome Back ]
                    </h1>
                    <p className="text-gray-600 text-sm mb-6">
                      Sign in to access your dashboard
                    </p>

                    <button
                      onClick={handleGoogleLogin}
                      className="w-full bg-black hover:bg-gray-800 transition-colors
              text-white text-sm font-medium py-3 px-4 rounded-lg
              flex items-center justify-center gap-3 border-2 border-black
              hover:scale-[1.02] active:scale-[0.98] transition-transform"
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

                    <div className="flex items-center justify-center gap-4 mt-6">
                      <span className="text-xs text-gray-500">[ Secure ]</span>
                      <span className="text-gray-300">•</span>
                      <span className="text-xs text-gray-500">[ Fast ]</span>
                      <span className="text-gray-300">•</span>
                      <span className="text-xs text-gray-500">[ Private ]</span>
                    </div>
                  </div>
                </div>

                {/* Divider */}
                <div className="hidden md:flex justify-center">
                  <div className="h-64 w-px bg-gradient-to-b from-transparent via-gray-300 to-transparent"></div>
                </div>

                {/* Right Column - Info */}
                <div className="md:col-span-1 space-y-8">
                  <div className="bg-white/40 backdrop-blur-[2px] p-8 ">
                    <h2 className="text-2xl font-bold text-black mb-3">
                      [ Coin Slot Tracker ]
                    </h2>
                    <p className="text-sm text-gray-600 mb-6">
                      A comprehensive real-time sales monitoring system designed
                      for multiple branches.
                    </p>

                    <div className="space-y-4">
                      <div className="flex items-start gap-4">
                        <div className="w-6 h-6 rounded-full bg-black flex items-center justify-center flex-shrink-0">
                          <span className="text-white text-xs font-bold">
                            1
                          </span>
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-black mb-1">
                            [ ESP32 Sensors ]
                          </h3>
                          <p className="text-xs text-gray-600">
                            Hardware monitors coin slots in real-time across all
                            branches
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-4">
                        <div className="w-6 h-6 rounded-full bg-black flex items-center justify-center flex-shrink-0">
                          <span className="text-white text-xs font-bold">
                            2
                          </span>
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-black mb-1">
                            [ Firebase Backend ]
                          </h3>
                          <p className="text-xs text-gray-600">
                            Secure cloud storage and real-time data
                            synchronization
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-4">
                        <div className="w-6 h-6 rounded-full bg-black flex items-center justify-center flex-shrink-0">
                          <span className="text-white text-xs font-bold">
                            3
                          </span>
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-black mb-1">
                            [ Dashboard Analytics ]
                          </h3>
                          <p className="text-xs text-gray-600">
                            Live sales data, branch performance, and revenue
                            tracking
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-4">
                        <div className="w-6 h-6 rounded-full bg-black flex items-center justify-center flex-shrink-0">
                          <span className="text-white text-xs font-bold">
                            4
                          </span>
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-black mb-1">
                            [ Multi-branch Support ]
                          </h3>
                          <p className="text-xs text-gray-600">
                            Manage multiple locations with role-based access
                            control
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="pt-6 border-t border-gray-200">
                      <div className="flex items-center justify-center gap-6">
                        <div className="text-center">
                          <p className="text-sm font-bold text-black">
                            Real-time
                          </p>
                          <p className="text-xs text-gray-500">Data Sync</p>
                        </div>
                        <span className="text-gray-300">|</span>
                        <div className="text-center">
                          <p className="text-sm font-bold text-black">Secure</p>
                          <p className="text-xs text-gray-500">Cloud Storage</p>
                        </div>
                        <span className="text-gray-300">|</span>
                        <div className="text-center">
                          <p className="text-sm font-bold text-black">
                            Scalable
                          </p>
                          <p className="text-xs text-gray-500">Architecture</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Scroll indicator */}
              <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
                <button
                  onClick={() => scrollToSection("about")}
                  className="flex flex-col items-center gap-2 group"
                >
                  <span className="text-xs text-gray-500 group-hover:text-black transition-colors">
                    [ About Us ]
                  </span>
                  <div className="w-px h-8 bg-gray-300 group-hover:bg-black transition-colors"></div>
                </button>
              </div>
            </div>
          </section>

          {/* About Section */}
          <section id="about" className="min-h-screen bg-gray-50 py-20">
            <div className="container mx-auto px-4">
              <div className="max-w-4xl mx-auto">
                <AboutUs />
              </div>
            </div>
          </section>

          {/* Footer */}
          <footer className="bg-black text-white py-8">
            <div className="container mx-auto px-4">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded bg-white flex items-center justify-center">
                    <span className="text-black text-xs font-bold">[C]</span>
                  </div>
                  <span className="text-sm">Coinsynchro © 2024</span>
                </div>
                <div className="flex items-center gap-6">
                  <span className="text-xs text-gray-400">[ Privacy ]</span>
                  <span className="text-xs text-gray-400">[ Terms ]</span>
                  <span className="text-xs text-gray-400">[ Contact ]</span>
                </div>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}
