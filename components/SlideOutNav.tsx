"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  MapPin,
  Grid,
  Activity,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ArrowLeftRight,
} from "lucide-react";
import Link from "next/link";
import { ModeToggle } from "./ui/ModeToggle";

interface CompactSlideOutNavProps {
  handleLogout?: () => void;
}

export function CompactSlideOutNav({ handleLogout }: CompactSlideOutNavProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState<"left" | "right">("right");

  const menuItems = [
    {
      icon: <LayoutDashboard className="w-5 h-5" />,
      href: "/dashboard",
      label: "Dashboard",
    },
    {
      icon: <MapPin className="w-5 h-5" />,
      href: "/branches",
      label: "Branches",
    },
    { icon: <Grid className="w-5 h-5" />, href: "/units", label: "Units" },
    {
      icon: <Activity className="w-5 h-5" />,
      href: "/real-time",
      label: "Real-Time",
    },
    {
      icon: <Settings className="w-5 h-5" />,
      href: "/settings",
      label: "Settings",
    },
  ];

  const ArrowIcon = position === "right" ? ChevronLeft : ChevronRight;

  return (
    <>
      {/* Navigation Panel */}
      <div
        className={`fixed top-0 z-50 h-full backdrop-blur-lg transition-all duration-300
    ${position === "right" ? "right-0" : "left-0"}
    ${
      isOpen
        ? "opacity-100 translate-x-0 w-56"
        : position === "right"
        ? "opacity-0 translate-x-2 w-0 overflow-hidden"
        : "opacity-0 -translate-x-2 w-0 overflow-hidden"
    }`}
      >
        <div className="bg-black/20 backdrop-blur-lg border-l border-white/10 h-full w-56 p-4 flex flex-col">
          {/* Header */}
          <h2 className="text-white/90 text-base font-semibold mb-6 text-center">
            Coin Slot Sales Tracker
          </h2>

          {/* Navigation Items - Centered vertically */}
          <nav className="flex-1 flex flex-col justify-center space-y-3">
            {menuItems.map((item, index) => (
              <motion.div
                key={index}
                initial={{ x: position === "right" ? 20 : -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: index * 0.1 }}
              >
                <Link
                  href={item.href}
                  className="flex items-center gap-3 px-3 py-3 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-all duration-200 group"
                  onClick={() => setIsOpen(false)}
                >
                  {item.icon}
                  <span className="font-medium text-sm">{item.label}</span>
                </Link>
              </motion.div>
            ))}
          </nav>

          {/* Logout Button */}
          <motion.button
            initial={{ x: position === "right" ? 20 : -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: menuItems.length * 0.1 }}
            onClick={() => {
              setIsOpen(false);
              handleLogout?.();
            }}
            className="flex items-center gap-3 px-3 py-3 rounded-xl text-red-400 hover:text-red-300 hover:bg-red-400/10 transition-all duration-200 mt-4"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium text-sm">Logout</span>
          </motion.button>

          {/* Position Toggle */}
          <button
            onClick={() => setPosition(position === "right" ? "left" : "right")}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-white/60 hover:text-white hover:bg-white/5 transition-colors mt-4 text-xs"
          >
            <span>Switch to {position === "right" ? "left" : "right"}</span>
          </button>
        </div>
      </div>

      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed top-1/2 -translate-y-1/2 z-50 flex items-center justify-center w-10 h-10 
    rounded-lg bg-black/20 backdrop-blur-lg border border-white/10 text-white shadow-lg 
    hover:bg-white/20 transition-all duration-300 ${
      position === "right" ? "right-0" : "left-0"
    }`}
      >
        <ArrowIcon className="w-4 h-4" />
      </button>

      {/* Side Switcher Button (just below arrow) */}
      <button
        onClick={() => setPosition(position === "right" ? "left" : "right")}
        className={`fixed top-[calc(50%+3rem)] z-50 flex flex-col items-center justify-center 
    w-8 h-8 rounded-md bg-black/30 backdrop-blur-lg border border-white/10 text-white/70 
    hover:text-white hover:bg-white/10 transition-all duration-200 ${
      position === "right" ? "right-0" : "left-0"
    }`}
      >
        <ArrowLeftRight className="w-4 h-4" />
      </button>

      {/* Theme Toggle (below switch button) */}
      <div
        className={`fixed top-[calc(50%+6rem)] z-50 ${
          position === "right" ? "right-0" : "left-0"
        }`}
      >
        <ModeToggle />
      </div>
    </>
  );
}
