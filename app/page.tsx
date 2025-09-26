"use client";
import { useEffect } from "react";
import Image from "next/image";
import { signInWithGoogle } from "../lib/firebase";
import { useUsers } from "../hooks/use-users";
import { useRouter } from "next/navigation";

export default function Home() {
  const { user, loading } = useUsers();
  const router = useRouter();

  const handleGoogleLogin = async () => {
    try {
      await signInWithGoogle();
    } catch (err) {
      console.error("Google login failed, dawg:", err);
    }
  };

  // Optional: redirect automatically if already logged in
  useEffect(() => {
    if (!loading && user?.status === "approved") {
      router.push("/dashboard");
    }
    if (!loading && user && user.status !== "approved") {
      router.push("/sorry");
    }
  }, [user, loading, router]);

  return (
    <div className="font-sans flex flex-col items-center justify-center min-h-screen p-8 bg-gray-50">
      <main className="flex flex-col gap-[32px] items-center bg-white px-12 py-16 border border-gray-200 shadow-lg rounded-xl w-full max-w-2xl">
        <Image
          className="rounded-lg"
          src="/gapuz.png"
          alt="Coin Slot Tracker logo"
          width={360}
          height={36}
          priority
        />
        <ol className="font-mono text-sm/6 text-center sm:text-center">
          <li className="mb-2 tracking-[-.01em]">
            Welcome to the Coin Slot Tracking System, dawg
          </li>
          <li className="mb-2 tracking-[-.01em]">Get started by Logging In</li>
          <li className="tracking-[-.01em]">
            View and Manage your Coin Slot Tracking System
          </li>
        </ol>

        <div className="flex gap-4 items-center flex-col sm:flex-row">
          <button
            onClick={handleGoogleLogin}
            className="cursor-pointer rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-foreground text-background gap-2 hover:bg-[#383838] dark:hover:bg-[#ccc] font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 sm:w-auto"
          >
            <Image
              className="cursor-pointer"
              src="/Google__G__logo.svg.png"
              alt="Google logo"
              width={20}
              height={20}
            />
            Log in with Google, dawg
          </button>
          <a
            className="rounded-full border border-solid border-black/[.08] dark:border-white/[.145] transition-colors flex items-center justify-center hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] hover:border-transparent font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 w-full sm:w-auto md:w-[158px]"
            href="/about"
            target="_blank"
            rel="noopener noreferrer"
          >
            About Us
          </a>
        </div>
      </main>
    </div>
  );
}
