"use client";

import type React from "react";
import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// Types
const MEMBER_IDS = [1, 2, 3, 4, 5] as const;
type MemberId = (typeof MEMBER_IDS)[number];

interface TeamMember {
  id: MemberId;
  name: string;
  role: string;
  location: string;
  age: number;
  image: string;
  badges: string[];
  quote: string;
  themeSong: {
    title: string;
    url: string;
  };
  color: {
    primary: string;
    bg: string;
    border: string;
    text: string;
  };
}

// Team data
const teamMembers: TeamMember[] = [
  {
    id: 1,
    name: "Rosalie Paculanan",
    role: "Project Manager",
    location: "Sugbongcogon, Misamis Oriental",
    age: 22,
    image: "/rosalie.jpg",
    badges: ["Writing", "Dancer"],
    quote:
      "Innovation distinguishes between a leader and a follower. Our mission is to create solutions that matter.",
    themeSong: {
      title: "Air Supply - Here I Am",
      url: "https://res.cloudinary.com/dtce1buqy/video/upload/v1763979381/rosalie_htzlq5.mp4",
    },
    color: {
      primary: "cyan",
      bg: "bg-cyan-500/20",
      border: "border-cyan-400/30",
      text: "text-cyan-400",
    },
  },
  {
    id: 2,
    name: "Johnlory Amparo",
    role: "Back-end Developer",
    location: "Tagoloan, Misamis Oriental",
    age: 22,
    image: "/lory.jpg",
    badges: ["UX Design", "Web Design"],
    quote: "Never put yourself on a pedestal.",
    themeSong: {
      title: "Thirty Seconds To Mars - The Kill",
      url: "https://res.cloudinary.com/dtce1buqy/video/upload/v1763978375/Untitled_video_-_Made_with_Clipchamp_hyzmmf.mp4",
    },
    color: {
      primary: "green",
      bg: "bg-green-500/20",
      border: "border-green-400/30",
      text: "text-green-400",
    },
  },
  {
    id: 3,
    name: "Joeven Stephen Secusana",
    role: "System Analyst",
    location: "Tagoloan, Misamis Oriental",
    age: 22,
    image: "/joeven.jpg",
    badges: ["Finance", "Business"],
    quote: "O Lord, help me to be pure, but not yet.",
    themeSong: {
      title: "Taylor Swift - Long Live",
      url: "https://res.cloudinary.com/dtce1buqy/video/upload/v1763977974/joevenmusic_mhvuop.mp4",
    },
    color: {
      primary: "purple",
      bg: "bg-purple-500/20",
      border: "border-purple-400/30",
      text: "text-purple-400",
    },
  },
  {
    id: 4,
    name: "Gabriel Suarez",
    role: "Front-end Developer",
    location: "Agusan, Cagayan De Oro",
    age: 22,
    image: "/gabriel.jpg",
    badges: ["UI Design", "Design Expertise"],
    quote: "The beginning is half of everything.",
    themeSong: {
      title: "Lord Huron - The Night We Met",
      url: "https://res.cloudinary.com/dtce1buqy/video/upload/v1763977739/gabrielmusic_ljwdxe.mp4",
    },
    color: {
      primary: "orange",
      bg: "bg-orange-500/20",
      border: "border-orange-400/30",
      text: "text-orange-400",
    },
  },
  {
    id: 5,
    name: "Jake Cuyugan",
    role: "Technical Writer",
    location: "Natumolan, Tagoloan, Misamis Oriental",
    age: 22,
    image: "/jake.jpg",
    badges: ["Communication", "Guitar", "Writing"],
    quote: "We are what we repeatedly do.",
    themeSong: {
      title: "Oasis - Don't Look Back in Anger",
      url: "https://res.cloudinary.com/dtce1buqy/video/upload/v1763976943/jakemusic_wt7ti9.mp4",
    },
    color: {
      primary: "red",
      bg: "bg-red-500/20",
      border: "border-red-400/30",
      text: "text-red-400",
    },
  },
];

// Audio player hook with fade in/out
function useAudioPlayer() {
  const [audioStates, setAudioStates] = useState<
    Record<MemberId, { isPlaying: boolean }>
  >({
    1: { isPlaying: false },
    2: { isPlaying: false },
    3: { isPlaying: false },
    4: { isPlaying: false },
    5: { isPlaying: false },
  });

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

  const fadeIntervals: Record<MemberId, NodeJS.Timeout | null> = {
    1: null,
    2: null,
    3: null,
    4: null,
    5: null,
  };

  const fadeIn = (memberId: MemberId, duration: number = 1000) => {
    const audio = audioRefs[memberId].current;
    if (!audio) return;

    audio.volume = 0;
    const steps = 50;
    const stepDuration = duration / steps;
    const volumeStep = 1 / steps;
    let currentStep = 0;

    fadeIntervals[memberId] = setInterval(() => {
      currentStep++;
      audio.volume = Math.min(currentStep * volumeStep, 1);
      if (currentStep >= steps) {
        if (fadeIntervals[memberId]) {
          clearInterval(fadeIntervals[memberId]!);
          fadeIntervals[memberId] = null;
        }
      }
    }, stepDuration);
  };

  const fadeOut = (
    memberId: MemberId,
    duration: number = 1000,
    callback?: () => void,
  ) => {
    const audio = audioRefs[memberId].current;
    if (!audio) return;

    const steps = 50;
    const stepDuration = duration / steps;
    const volumeStep = audio.volume / steps;
    let currentStep = 0;

    fadeIntervals[memberId] = setInterval(() => {
      currentStep++;
      audio.volume = Math.max(audio.volume - volumeStep, 0);
      if (currentStep >= steps) {
        if (fadeIntervals[memberId]) {
          clearInterval(fadeIntervals[memberId]!);
          fadeIntervals[memberId] = null;
        }
        if (callback) callback();
      }
    }, stepDuration);
  };

  const togglePlay = (memberId: MemberId) => {
    const audio = audioRefs[memberId].current;
    if (!audio) return;

    if (audioStates[memberId].isPlaying) {
      // Fade out and pause
      fadeOut(memberId, 1000, () => {
        audio.pause();
        audio.currentTime = 0;
        setAudioStates((prev) => ({
          ...prev,
          [memberId]: { ...prev[memberId], isPlaying: false },
        }));
      });
    } else {
      // Stop all other audios with fade out
      MEMBER_IDS.forEach((id) => {
        if (id !== memberId && audioStates[id].isPlaying) {
          const otherAudio = audioRefs[id].current;
          if (otherAudio) {
            fadeOut(id, 1000, () => {
              otherAudio.pause();
              otherAudio.currentTime = 0;
              setAudioStates((prev) => ({
                ...prev,
                [id]: { ...prev[id], isPlaying: false },
              }));
            });
          }
        }
      });

      audio.currentTime = 0;
      audio.play().catch((err) => console.error("Audio play error:", err));
      setAudioStates((prev) => ({
        ...prev,
        [memberId]: { ...prev[memberId], isPlaying: true },
      }));
      fadeIn(memberId, 1000);

      // Auto-stop with fade out after 30 seconds
      setTimeout(() => {
        if (audioStates[memberId].isPlaying) {
          fadeOut(memberId, 1000, () => {
            audio.pause();
            audio.currentTime = 0;
            setAudioStates((prev) => ({
              ...prev,
              [memberId]: { ...prev[memberId], isPlaying: false },
            }));
          });
        }
      }, 30000);
    }
  };

  // Cleanup intervals on unmount
  useEffect(() => {
    return () => {
      MEMBER_IDS.forEach((id) => {
        if (fadeIntervals[id]) {
          clearInterval(fadeIntervals[id]!);
        }
      });
    };
  }, []);

  return { audioStates, audioRefs, togglePlay };
}

// Project Abstract Section
function ProjectAbstract() {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm mb-8">
      <h3 className="text-xl font-bold text-gray-900 mb-4">Project Overview</h3>
      <p className="text-gray-700 mb-4">
        Our capstone project addresses revenue tracking challenges in Pisonet
        businesses by developing an{" "}
        <strong>Automated Coin Slot Sales Tracking System</strong>. The system
        uses ESP32 microcontrollers and cloud technology to provide real-time
        sales monitoring, prevent fraud, and ensure financial transparency.
      </p>
      <div className="text-sm text-gray-600 border-t pt-4 mt-4">
        <p className="font-semibold">Tech Stack:</p>
        <p>ESP32, Firebase, Next.js, Tailwind CSS, C++</p>
      </div>
    </div>
  );
}

// Academic Context Component
function AcademicContext() {
  return (
    <div className="text-center text-sm text-gray-600 italic my-8 border-t border-b border-gray-200 py-4">
      <p>
        A Capstone Project Presented to the Faculty of the College of
        Information Technology
      </p>
      <p>Tagoloan Community College, Tagoloan, Misamis Oriental</p>
      <p className="mt-2">
        In Partial Fulfilment of the Requirements for the Degree
      </p>
      <p>Bachelor of Science in Information Technology</p>
    </div>
  );
}

// Team Member Component
function TeamMember({
  member,
  audioState,
  audioRef,
  onTogglePlay,
}: {
  member: TeamMember;
  audioState: { isPlaying: boolean };
  audioRef: React.RefObject<HTMLAudioElement | null>;
  onTogglePlay: () => void;
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm mb-6 flex flex-col">
      {/* Top Row: Image + Name/Role */}
      <div className="flex items-start gap-4">
        <Image
          src={member.image || "/placeholder.svg"}
          alt={member.name}
          width={100}
          height={100}
          className="rounded-lg object-cover"
        />
        <div className="flex-1 flex flex-col justify-center">
          <h3 className="text-lg font-bold text-gray-900">{member.name}</h3>
          <p className="text-sm text-slate-600">{member.role}</p>

          {/* Location & Age under name/role */}
          <div className="text-sm text-gray-600 mt-1">
            <p>Location: {member.location}</p>
            <p>Age: {member.age}</p>
          </div>
        </div>
      </div>

      {/* Quote + Music */}
      <div className="mt-4 flex flex-col gap-3">
        {/* Quote */}
        <div className="bg-gray-50 border-l-4 border-gray-300 rounded-r-lg p-4">
          <p className="text-gray-700 italic text-sm leading-relaxed">
            &quot;{member.quote}&quot;
          </p>
        </div>

        {/* Music */}
        <div className="flex items-center gap-3">
          <Button
            onClick={onTogglePlay}
            size="sm"
            variant="outline"
            aria-label={
              audioState.isPlaying ? "Pause theme song" : "Play theme song"
            }
            className="w-8 h-8 bg-gray-100 hover:bg-gray-200 border-gray-300"
          >
            <svg
              className="w-4 h-4 text-gray-700"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              {audioState.isPlaying ? (
                <path d="M6 4h4v16H6zm8 0h4v16h-4z" />
              ) : (
                <path d="M8 5v14l11-7z" />
              )}
            </svg>
          </Button>

          <div className="text-sm text-gray-700">{member.themeSong.title}</div>

          <audio ref={audioRef} preload="metadata">
            <source src={member.themeSong.url} type="audio/mpeg" />
          </audio>
        </div>
      </div>

      {/* Footer - Expertise / Badges */}
      <div className="mt-4 flex flex-wrap gap-2">
        {member.badges.map((badge) => (
          <Badge
            key={badge}
            className="bg-gray-100 text-gray-700 border-gray-200 text-xs"
          >
            {badge}
          </Badge>
        ))}
      </div>
    </div>
  );
}

// Main About Us Component
export function AboutUs() {
  const { audioStates, audioRefs, togglePlay } = useAudioPlayer();

  return (
    <section
      id="about"
      className="min-h-screen bg-gray-50 text-gray-900 font-sans relative px-4 py-8"
    >
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            About The Project
          </h2>
          <p className="text-gray-600 text-lg">
            Automated Coin Slot Sales Tracking System Using Microcontroller
          </p>
        </div>

        {/* Academic Context */}
        <AcademicContext />

        {/* Project Abstract */}
        <ProjectAbstract />

        {/* Team Section Header */}
        <div className="text-center mb-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            Meet Team Ascender
          </h3>
          <p className="text-gray-600">The Development Team</p>
        </div>

        {/* Team Members List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {teamMembers.map((member) => (
            <TeamMember
              key={member.id}
              member={member}
              audioState={audioStates[member.id]}
              audioRef={audioRefs[member.id]}
              onTogglePlay={() => togglePlay(member.id)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

// Export types and data for external use
export { teamMembers, type TeamMember, type MemberId };
