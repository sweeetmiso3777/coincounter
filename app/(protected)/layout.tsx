"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Nav } from "@/components/nav";
import { Providers } from "@/components/real-time/Sales-Query-Provider";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [checked, setChecked] = useState(false); // just to know we finished first check
  const [proceed, setProceed] = useState(false);
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);

  const messages = [
    "🚨 STOP RIGHT THERE!",
    "⚠️ YOU ARE NOT AUTHORIZED!",
    "🔒 ACCESS DENIED!",
    "💀 CRIMINAL ALERT!",
    "🏃‍♂️ TURN BACK NOW!",
  ];

  const videoLinks = [
    "https://res.cloudinary.com/dtce1buqy/video/upload/v1758022572/Untitled_video_-_Made_with_Clipchamp_3_xmt3dq.mp4",
    "https://res.cloudinary.com/dtce1buqy/video/upload/v1758021658/videoplayback_online-video-cutter.com_lapaff.mp4",
  ];
  const randomVideo = videoLinks[Math.floor(Math.random() * videoLinks.length)];

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setChecked(true);
      if (!firebaseUser) setTimeout(() => router.push("/"), 15000);
    });
    return () => unsub();
  }, [router]);

  // ✅ If we haven't checked yet, just show children (they have their own loader)
  if (!checked) {
    return (
      <>
        <Nav />
        <main className="min-h-screen bg-background">
          <Providers>{children}</Providers>
        </main>
      </>
    );
  }

  if (!user)
    return (
      <main className="relative min-h-screen bg-black flex flex-col items-center justify-center p-6 overflow-hidden">
        {!proceed && (
          <div className="fixed inset-0 bg-red-900 bg-opacity-90 flex items-center justify-center z-50 backdrop-blur-md animate-pulse">
            <div className="bg-black border-8 border-red-600 max-w-lg w-full p-8 rounded-3xl shadow-2xl text-center space-y-6">
              <h1 className="text-3xl font-black text-red-500 uppercase animate-pulse">
                🚨 UNAUTHORIZED ACCESS 🚨
              </h1>
              <p className="text-lg text-white font-bold">
                You are trying to access a{" "}
                <span className="underline">protected page</span>!
              </p>
              <div className="flex justify-center gap-6 mt-4">
                <button
                  onClick={() => {
                    setProceed(true);
                    setTimeout(() => {
                      if (videoRef.current) {
                        videoRef.current.muted = false;
                        videoRef.current.play();
                      }
                    }, 200);
                  }}
                  className="px-6 py-3 bg-red-600 text-white font-extrabold text-lg rounded-xl shadow-lg hover:bg-red-800 transition transform hover:scale-105"
                >
                  🔥 I DARE TO PROCEED 🔥
                </button>
                <button
                  onClick={() => router.push("/")}
                  className="px-6 py-3 bg-gray-700 text-white font-extrabold text-lg rounded-xl shadow-lg hover:bg-gray-900 transition transform hover:scale-105"
                >
                  🛑 GO BACK
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="p-6 border-8 border-red-600 rounded-3xl shadow-2xl bg-black z-10 text-center animate-pulse">
          <video
            ref={videoRef}
            src={randomVideo}
            loop
            playsInline
            className={`mx-auto rounded-xl shadow-2xl transition-all duration-500 ${
              proceed ? "w-96 h-96 animate-shake" : "w-44 h-44"
            } object-cover border-4 border-red-500`}
          />
          <p className="mt-4 text-center font-extrabold text-3xl text-red-600 uppercase animate-pulse">
            🚫 UNAUTHORIZED! 🚫
          </p>
          <p className="text-center text-lg text-white font-bold">
            Redirecting you back to login...
          </p>
        </div>

        {proceed &&
          Array.from({ length: 8 }).map((_, i) => {
            const top = Math.random() * 85;
            const fontSize = 18 + Math.random() * 20;
            const message =
              messages[Math.floor(Math.random() * messages.length)];
            const duration = 4 + Math.random() * 6;
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
                className="text-red-500 font-black uppercase drop-shadow-lg"
              >
                {message}
              </div>
            );
          })}

        <style>{`
          @keyframes left-marquee {
            0% { transform: translateX(100vw); }
            100% { transform: translateX(-100%); }
          }
          @keyframes shake {
            0% { transform: translate(1px, 1px) rotate(0deg); }
            10% { transform: translate(-1px, -2px) rotate(-1deg); }
            20% { transform: translate(-3px, 0px) rotate(1deg); }
            30% { transform: translate(3px, 2px) rotate(0deg); }
            40% { transform: translate(1px, -1px) rotate(1deg); }
            50% { transform: translate(-1px, 2px) rotate(-1deg); }
            60% { transform: translate(-3px, 1px) rotate(0deg); }
            70% { transform: translate(3px, 1px) rotate(-1deg); }
            80% { transform: translate(-1px, -1px) rotate(1deg); }
            90% { transform: translate(1px, 2px) rotate(0deg); }
            100% { transform: translate(1px, -2px) rotate(-1deg); }
          }
          .animate-shake { animation: shake 0.5s infinite; }
        `}</style>
      </main>
    );

  return (
    <>
      <Nav />
      <main className="min-h-screen bg-background">
        <Providers>{children}</Providers>
      </main>
    </>
  );
}
