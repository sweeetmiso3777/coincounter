"use client";

import { useEffect } from "react";
import Image from "next/image";
import { signInWithGoogle } from "../lib/firebase";
import { useUser } from "@/providers/UserProvider";
import { useRouter } from "next/navigation";

export default function Home() {
  const { user, loading } = useUser();
  const router = useRouter();

  const handleGoogleLogin = async () => {
    try {
      await signInWithGoogle();
      // Redirect will be handled by useEffect
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

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 via-black to-gray-800 text-gray-100 font-mono relative overflow-hidden">
      {/* Background Blur Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-cyan-500/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl"></div>
      </div>

      {/* Content Container - Completely Transparent */}
      <div className="flex flex-col items-center gap-8 relative z-10">
        {/* Image - No Container */}
        <Image
          src="/gapuz.png"
          alt="Coin Slot Tracker"
          width={320}
          height={32}
          priority
          className="rounded-lg"
        />

        {/* Text Container with Glass Effect */}
        <div
          className="flex flex-col items-center gap-4 p-8 rounded-3xl
          bg-white/5 backdrop-blur-md border border-white/10 shadow-2xl
          shadow-black/20"
        >
          <h1
            className="text-2xl font-bold font-mono tracking-wider uppercase text-white
            drop-shadow-lg text-center"
          >
            COIN SLOT TRACKER
          </h1>

          <p
            className="text-white/80 text-sm text-center leading-relaxed max-w-md
            drop-shadow"
          >
            Real-time sales tracking for your branches, powered by ESP32 +
            Firebase.
          </p>
        </div>

        {/* Button with Glass Effect */}
        <button
          onClick={handleGoogleLogin}
          className="mt-4 w-full max-w-xs rounded-full bg-white/10 backdrop-blur-lg 
            text-white font-bold py-4 hover:bg-white/20 transition-all duration-300 
            tracking-wide border border-white/20 shadow-2xl hover:shadow-cyan-500/20
            hover:scale-105 transform hover:border-white/40"
        >
          Sign in with Google
        </button>
      </div>

      <footer
        className="mt-12 text-gray-400 text-xs relative z-10
        backdrop-blur-sm bg-black/20 px-4 py-2 rounded-full"
      >
        Made with Next.js + Firebase
      </footer>
    </div>
  );
}
