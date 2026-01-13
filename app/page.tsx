"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { signInWithGoogle } from "../lib/firebase";
import { useUser } from "@/providers/UserProvider";
import { useRouter } from "next/navigation";
import { AboutUs } from "@/components/about-us";
import Aurora from "@/components/Aurora";

const floatingDivBackground =
  "https://images.pexels.com/photos/34864774/pexels-photo-34864774.jpeg";

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
    <div className="min-h-screen bg-black backdrop-blur overflow-y-auto snap-y snap-mandatory overflow-hidden overflow-x-hidden">
      <section
        id="home"
        className="min-h-screen snap-start flex items-center justify-center p-6 md:p-12 "
      >
        <div className="fixed inset-0 z-0">
          <Aurora
            colorStops={["#1A1A1A", "#1A1A1A", "#D4AF37"]}
            blend={0.1}
            amplitude={0.3}
            speed={0.1}
          />
        </div>
        {/* Floating container with background image */}
        <div className="relative w-full max-w-6xl rounded-2xl overflow-hidden shadow-2xl">
          {/* Content wrapper */}
          <div className="relative z-10 bg-neutral-900/10  ">
            <nav className="flex items-center justify-between px-6 py-4  border-neutral-700/50">
              <div className="flex items-center gap-2">
                <Image
                  src="/gapuzlogo.png"
                  alt="Coinsynchro"
                  width={28}
                  height={28}
                  className="rounded"
                />
                <span className="text-amber-300/70 text-xs font-medium">
                  Coinsynchro
                </span>
              </div>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => scrollToSection("home")}
                  className={`transition-colors text-xs ${
                    activeSection === "home"
                      ? "text-amber-300/70"
                      : "text-neutral-400 hover:text-amber-200/70"
                  }`}
                >
                  Home
                </button>
                <button
                  onClick={() => scrollToSection("about")}
                  className={`transition-colors text-xs ${
                    activeSection === "about"
                      ? "text-amber-300/70"
                      : "text-neutral-400 hover:text-amber-200/70"
                  }`}
                >
                  About Us
                </button>
              </div>
            </nav>

            <div className="flex flex-col md:flex-row">
              {/* Left Side - Login (30%) */}
              <div className="w-full md:w-[30%] flex items-center justify-center px-6 py-12 md:py-16 md:border-r border-b md:border-b-0 border-neutral-700/50">
                <div className="text-center max-w-xs">
                  <div className="flex justify-center mb-5">
                    <Image
                      src="/gapuzlogo.png"
                      alt="Coin Slot Tracker"
                      width={80}
                      height={80}
                      priority
                      className="rounded"
                    />
                  </div>

                  <h2 className="text-xs font-medium text-white mb-1">
                    Welcome Back
                  </h2>
                  <p className="text-neutral-400 text-[11px] mb-6">
                    Sign in to access your dashboard
                  </p>

                  <button
                    onClick={handleGoogleLogin}
                    className="w-full bg-amber-400/80 hover:bg-amber-300/80 transition-colors
                   text-neutral-900 text-xs font-medium py-2.5 px-4 rounded
                   flex items-center justify-center gap-2"
                  >
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
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

                  <p className="text-neutral-500 text-[10px] mt-5">
                    By signing in, you agree to our Terms of Service
                  </p>

                  <div className="flex items-center justify-center gap-3 mt-6 text-neutral-400 text-[10px]">
                    <span>Secure</span>
                    <span className="text-neutral-600">·</span>
                    <span>Fast</span>
                    <span className="text-neutral-600">·</span>
                    <span>Private</span>
                  </div>
                </div>
              </div>

              {/* Right Side - How it Works (70%) */}
              <div className="w-full md:w-[70%] flex items-center justify-center px-8 md:px-12 py-12 md:py-16">
                <div className="text-center max-w-lg">
                  <p className="text-amber-300/60 text-xs tracking-widest uppercase mb-3">
                    Real-time Monitoring
                  </p>

                  <h1 className="text-lg md:text-xl font-semibold text-white mb-2">
                    Coin Slot Tracker
                  </h1>
                  <p className="text-amber-300/50 text-xs mb-5">
                    System Overview
                  </p>

                  <p className="text-neutral-300 text-xs leading-relaxed mb-8">
                    A comprehensive real-time sales monitoring system designed
                    for multiple branches.
                  </p>

                  <div className="space-y-3 mb-8 text-left">
                    <div className="flex items-start gap-3">
                      <span className="text-amber-400/50 text-xs">01</span>
                      <div>
                        <p className="text-white text-xs font-medium">
                          ESP32 Sensors
                        </p>
                        <p className="text-neutral-400 text-[11px]">
                          Hardware monitors coin slots in real-time across all
                          branches
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <span className="text-amber-400/50 text-xs">02</span>
                      <div>
                        <p className="text-white text-xs font-medium">
                          Firebase Backend
                        </p>
                        <p className="text-neutral-400 text-[11px]">
                          Secure cloud storage and real-time data
                          synchronization
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <span className="text-amber-400/50 text-xs">03</span>
                      <div>
                        <p className="text-white text-xs font-medium">
                          Dashboard Analytics
                        </p>
                        <p className="text-neutral-400 text-[11px]">
                          Live sales data, branch performance, and revenue
                          tracking
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <span className="text-amber-400/50 text-xs">04</span>
                      <div>
                        <p className="text-white text-xs font-medium">
                          Multi-branch Support
                        </p>
                        <p className="text-neutral-400 text-[11px]">
                          Manage multiple locations with role-based access
                          control
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-center gap-5 text-center pt-5 border-t border-neutral-600/30">
                    <div>
                      <p className="text-white text-xs font-medium">
                        Real-time
                      </p>
                      <p className="text-neutral-400 text-[10px]">Data Sync</p>
                    </div>
                    <span className="text-neutral-600">·</span>
                    <div>
                      <p className="text-white text-xs font-medium">Secure</p>
                      <p className="text-neutral-400 text-[10px]">
                        Cloud Storage
                      </p>
                    </div>
                    <span className="text-neutral-600">·</span>
                    <div>
                      <p className="text-white text-xs font-medium">Scalable</p>
                      <p className="text-neutral-400 text-[10px]">
                        Architecture
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="about" className="min-h-screen snap-start">
        <AboutUs />
      </section>
    </div>
  );
}
