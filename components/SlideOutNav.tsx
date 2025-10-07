"use client";
import { useState } from "react";
import {
  LayoutDashboard,
  MapPin,
  Grid,
  Activity,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ModeToggle } from "./ui/ModeToggle";

export function CompactSlideOutNav({
  handleLogout,
}: {
  handleLogout?: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isNavVisible, setIsNavVisible] = useState(true);
  const pathname = usePathname();

  const items = [
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

  if (!isNavVisible)
    return (
      <button
        onClick={() => setIsNavVisible(true)}
        className="fixed bottom-3 left-1/2 -translate-x-1/2 z-50 md:hidden bg-background/95 backdrop-blur-md border border-border rounded-lg px-3 py-2 text-muted-foreground hover:text-foreground hover:bg-accent transition-all duration-200 shadow-lg"
      >
        <ChevronUp className="w-4 h-4" />
      </button>
    );

  return (
    <div className="fixed bottom-3 left-1/2 -translate-x-1/2 z-50 md:hidden">
      <div className="relative">
        <button
          onClick={() => setIsNavVisible(false)}
          className="absolute -top-6 left-1/2 -translate-x-1/2 bg-background/95 backdrop-blur-md border border-border border-b-0 rounded-t-lg px-2 py-1 text-muted-foreground hover:text-foreground hover:bg-accent transition-all duration-200"
        >
          <ChevronDown className="w-3 h-3" />
        </button>

        <div className="bg-background/95 backdrop-blur-md border border-border rounded-xl shadow-lg px-3 py-2 flex items-center justify-between gap-4">
          {items.slice(0, 3).map((item, i) => (
            <Link
              key={i}
              href={item.href}
              className={`p-2 rounded-lg transition-all duration-200 ${
                pathname === item.href
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent hover:shadow-sm"
              }`}
            >
              {item.icon}
            </Link>
          ))}

          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 rounded-lg bg-accent text-foreground hover:bg-primary hover:text-primary-foreground transition-all duration-200 shadow-sm"
          >
            {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          {items.slice(3).map((item, i) => (
            <Link
              key={i}
              href={item.href}
              className={`p-2 rounded-lg transition-all duration-200 ${
                pathname === item.href
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent hover:shadow-sm"
              }`}
            >
              {item.icon}
            </Link>
          ))}
        </div>

        {isOpen && (
          <>
            <div
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 md:hidden"
            />
            <div className="fixed bottom-20 left-3 right-3 z-50 md:hidden">
              <div className="bg-background/95 backdrop-blur-md border border-border rounded-xl shadow-xl p-4">
                <h3 className="text-foreground font-semibold text-sm mb-3 text-center">
                  Coin Slot Tracker
                </h3>
                <div className="space-y-2">
                  {items.map((item, i) => (
                    <Link
                      key={i}
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 ${
                        pathname === item.href
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground hover:bg-accent hover:shadow-sm"
                      }`}
                    >
                      {item.icon}
                      <span className="font-medium text-sm">{item.label}</span>
                    </Link>
                  ))}

                  <div className="flex items-center gap-3 px-3 py-2">
                    <div className="w-5 h-5 flex items-center justify-center">
                      <div className="w-4 h-4 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full" />
                    </div>
                    <ModeToggle />
                    <span className="font-medium text-muted-foreground text-sm flex-1">
                      Theme
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      setIsOpen(false);
                      handleLogout?.();
                    }}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg text-destructive hover:bg-destructive/10 w-full transition-all duration-200"
                  >
                    <LogOut className="w-5 h-5" />
                    <span className="font-medium text-sm">Logout</span>
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
