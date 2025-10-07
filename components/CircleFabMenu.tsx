"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  MapPin,
  Grid,
  Activity,
  LogOut,
  X,
  Menu,
  ArrowLeftRight,
  Settings,
} from "lucide-react";
import Link from "next/link";

interface CircleFabMenuProps {
  handleLogout?: () => void;
}

export function CircleFabMenu({ handleLogout }: CircleFabMenuProps) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<"left" | "right">("right");

  const menuItems = [
    { icon: <LayoutDashboard />, href: "/dashboard", label: "Dashboard" },
    { icon: <MapPin />, href: "/branches", label: "Branches" },
    { icon: <Grid />, href: "/units", label: "Units" },
    { icon: <Activity />, href: "/real-time", label: "Real-Time" },
    { icon: <Settings />, href: "/settings", label: "Settings" },
    { icon: <LogOut />, action: handleLogout, label: "Logout" },
  ];

  const containerClasses = `fixed bottom-6 z-50 flex flex-col ${
    position === "right" ? "items-end right-6" : "items-start left-6"
  } gap-2`;

  return (
    <div className={containerClasses}>
      {/* Handedness Toggle */}
      <button
        onClick={() => setPosition(position === "right" ? "left" : "right")}
        className="flex items-center justify-center w-8 h-8 rounded-full bg-background text-foreground shadow hover:bg-accent/20 mb-2"
        title="Switch Side"
      >
        <ArrowLeftRight className="w-4 h-4" />
      </button>

      {/* Menu Items */}
      <AnimatePresence>
        {open &&
          menuItems.map((item, index) => (
            <motion.div
              key={index}
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              transition={{
                type: "spring",
                stiffness: 500,
                damping: 30,
                delay: index * 0.05,
              }}
              className={`flex items-center ${
                position === "left" ? "flex-row-reverse" : "flex-row"
              } gap-2`}
            >
              {item.href ? (
                <Link
                  href={item.href}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full bg-background text-foreground shadow hover:bg-accent/20 text-sm ${
                    position === "left" ? "flex-row-reverse" : ""
                  }`}
                  onClick={() => setOpen(false)}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              ) : (
                <button
                  onClick={() => {
                    setOpen(false);
                    item.action?.();
                  }}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full bg-background text-foreground shadow hover:bg-accent/20 text-sm ${
                    position === "left" ? "flex-row-reverse" : ""
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              )}
            </motion.div>
          ))}
      </AnimatePresence>

      {/* FAB Toggle Button */}
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-center w-12 h-12 rounded-full bg-background text-foreground shadow hover:bg-accent/20"
      >
        {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>
    </div>
  );
}
