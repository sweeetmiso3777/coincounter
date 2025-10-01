"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/providers/UserProvider"; // adjust path if needed

export default function ImSorryPage() {
  const { user, loading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      if (user.status === "approved") {
        if (user.role === "admin" || user.role === "partner") {
          router.push("/dashboard");
        } else {
          router.push("/sorry"); // optional: redirect somewhere else
        }
      }
    }
  }, [user, loading, router]);

  if (loading) return null; // or a spinner

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white px-8">
      <main className="flex flex-col items-center justify-center max-w-3xl text-center">
        <h1 className="text-5xl font-extrabold mb-6">Restricted</h1>
        <p className="text-lg text-gray-300 mb-4">
          Sorry, your account cannot access this section.
        </p>
        <div className="text-gray-400 mb-6 text-left space-y-1 text-base">
          <p>- You are a new user</p>
          <p>- Your account is not registered in the whitelist</p>
          <p>- Your account has been blocked</p>
        </div>
        <p className="text-gray-500 mb-6">
          Contact <span className="underline">amparo.johnlory8@gmail.com</span>{" "}
          for approval.
        </p>
        <button
          onClick={() => router.push("/")}
          className="px-6 py-3 bg-white text-black rounded font-medium hover:bg-gray-200 transition-colors"
        >
          Go Back to Login
        </button>
      </main>
      <footer className="mt-12 text-gray-600 text-sm">
        Learn →{" "}
        <a
          href="https://nextjs.org"
          target="_blank"
          className="underline hover:text-white"
        >
          Next.js
        </a>
      </footer>
    </div>
  );
}
