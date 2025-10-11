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
        <h1 className="text-5xl font-extrabold mb-6">Sorry!</h1>
        <p className="text-lg text-gray-300 mb-4">
          Sorry, your account cannot access this section.
        </p>
        <button
          onClick={() => router.push("/")}
          className="px-6 py-3 bg-white text-black rounded font-medium hover:bg-gray-200 transition-colors"
        >
          Go Back to Login
        </button>
      </main>
    </div>
  );
}
