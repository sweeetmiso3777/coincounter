"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Nav } from "@/components/nav";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();
  const messages = [
    "Stop right there, criminal scum! Nobody breaks the law on my watch!✋ I'm confiscating your stolen goods. Now pay your fine or it's off to jail.! ✋✋✋",
    "It's all over, lawbreaker! Your spree is at an end. I'll take any stolen goods you have. The next move is yours -- Pay your fine, or I haul you away! 🚫",
    "nigga you aint aUtHeNtIcAtEd! 🔑",
    "Stop, criminal! I've heard of you. Your criminal exploits are well-known. Pay the fine or serve your sentence. Your stolen goods are forfeit.✋",
    "nigga you aint aUtHeNtIcAtEd🏃‍♂️",
  ];

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);

      if (!firebaseUser) {
        // redirect after 3 seconds
        setTimeout(() => router.push("/"), 10000);
      }
    });

    return () => unsubscribe();
  }, [router]);

  if (loading) {
    return (
      <main className="flex items-center justify-center min-h-screen">
        <p>Loading...</p>
      </main>
    );
  }

  // show fun unauthorized card if no user
  if (!user)
    return (
      <main className="relative min-h-screen bg-gray-100 overflow-hidden flex flex-col items-center justify-center gap-6">
        {/* Fun Unauthorized Box */}
        <div className="p-4 border rounded-lg shadow-lg bg-white z-10 items-center justify-center">
          <img
            src="https://i1.sndcdn.com/artworks-000247522581-u36dm8-t500x500.jpg"
            alt="Unauthorized"
            className="w-32 h-32 object-contain mx-auto"
          />
          <p className="mt-2 text-center font-bold text-red-600">
            Nigga you aint aUtHeNtIcAtEd!🏃‍♂️
          </p>
          <p className="text-center text-sm text-gray-500">
            Redirecting you back to login...
          </p>
        </div>

        {/* Marquee chaos */}
        {Array.from({ length: 6 }).map((_, i) => {
          const top = Math.random() * 80; // random vertical position
          const fontSize = 14 + Math.random() * 16; // 14px–30px
          const direction = Math.random() > 0.5 ? "left" : "right";
          const message = messages[Math.floor(Math.random() * messages.length)];
          const duration = 5 + Math.random() * 5; // 5–10s

          return (
            <div
              key={i}
              style={{
                position: "absolute",
                top: `${top}vh`,
                fontSize: `${fontSize}px`,
                whiteSpace: "nowrap",
                animation: `left-marquee ${duration}s linear infinite`,
              }}
            >
              {message}
            </div>
          );
        })}

        {/* Marquee animations */}
        <style>
          {`
            @keyframes left-marquee {
              0% { transform: translateX(100vw); }
              100% { transform: translateX(-100%); }
            }
            
          `}
        </style>
      </main>
    );

  return (
    <>
      <Nav />
      <main className="min-h-screen bg-background">{children}</main>
    </>
  );
}
