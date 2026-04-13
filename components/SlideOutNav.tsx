"use client";
import { useState } from "react";
import {
  LayoutDashboard,
  Building2,
  Monitor,
  Activity,
  Settings,
  LogOut,
  Menu,
  X,
  Clock,
  Bell,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ModeToggle } from "./ui/ModeToggle";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

export function CompactSlideOutNav({
  handleLogout,
}: {
  handleLogout?: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isNavVisible, setIsNavVisible] = useState(true);
  const pathname = usePathname();

  const mainNavItems = [
    {
      icon: <LayoutDashboard className="w-5 h-5" />,
      href: "/dashboard",
      label: "Dashboard",
    },
    {
      icon: <Building2 className="w-5 h-5" />,
      href: "/branches",
      label: "Branches",
    },
    { icon: <Monitor className="w-5 h-5" />, href: "/units", label: "Units" },
    {
      icon: <Activity className="w-5 h-5" />,
      href: "/real-time",
      label: "Real-Time",
    },
  ];

  const secondaryNavItems = [
    {
      icon: <Clock className="w-5 h-5" />,
      href: "/changelogs",
      label: "Changelogs",
    },
    {
      icon: <Bell className="w-5 h-5" />,
      href: "/logs",
      label: "Notifications",
    },
  ];

  if (!isNavVisible)
    return (
      <button
        onClick={() => setIsNavVisible(true)}
        className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border py-3 flex justify-center items-center gap-2 hover:bg-accent transition-colors"
      >
        <ChevronUp className="w-4 h-4 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">Show Navigation</span>
      </button>
    );

  return (
    <>
      {/* Bottom Navigation Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border md:hidden">
        <div className="flex items-center justify-around px-2 py-2">
          {mainNavItems.slice(0, 4).map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center px-3 py-1 rounded-lg transition-colors ${
                pathname === item.href
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {item.icon}
              <span className="text-[10px] mt-1">{item.label}</span>
            </Link>
          ))}

          <button
            onClick={() => setIsOpen(!isOpen)}
            className={`flex flex-col items-center justify-center px-3 py-1 rounded-lg transition-colors ${
              isOpen ? "text-primary" : "text-muted-foreground"
            }`}
          >
            {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            <span className="text-[10px] mt-1">Menu</span>
          </button>
        </div>
      </div>

      {/* Bottom Sheet Menu */}
      {isOpen && (
        <>
          <div
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
          />
          <div className="fixed bottom-14 left-0 right-0 z-50 bg-background border-t border-border rounded-t-xl shadow-lg md:hidden max-h-[70vh] overflow-y-auto">
            <div className="p-4">
              {/* User Section */}
              <div className="flex items-center gap-3 pb-4 mb-4 border-b border-border">
                <Avatar className="h-12 w-12">
                  <AvatarImage src="/gapuz.png" alt="Profile" />
                  <AvatarFallback>CS</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground">CoinSync</h3>
                  
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="p-2 rounded-lg hover:bg-accent transition-colors">
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-40">
                    <DropdownMenuItem asChild>
                      <Link href="/contacts">Contacts</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/settings">Settings</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        setIsOpen(false);
                        handleLogout?.();
                      }}
                      className="text-red-500 focus:text-red-500"
                    >
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Branches Dropdown Section */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-foreground">
                    Branches
                  </span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="p-1 rounded hover:bg-accent transition-colors">
                        <ChevronDown className="w-4 h-4 text-muted-foreground" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                      <DropdownMenuItem asChild>
                        <Link href="/branches">All Branches</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/harvest">Harvest</Link>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {/* Main Navigation Items */}
              <div className="space-y-1 mb-4">
                <p className="text-xs font-medium text-muted-foreground mb-2 px-3">
                  MAIN
                </p>
                {mainNavItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                      pathname === item.href
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent"
                    }`}
                  >
                    {item.icon}
                    <span className="font-medium text-sm">{item.label}</span>
                  </Link>
                ))}
              </div>

              {/* Secondary Navigation Items */}
              <div className="space-y-1 mb-4">
                <p className="text-xs font-medium text-muted-foreground mb-2 px-3">
                  OTHER
                </p>
                {secondaryNavItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                      pathname === item.href
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent"
                    }`}
                  >
                    {item.icon}
                    <span className="font-medium text-sm">{item.label}</span>
                  </Link>
                ))}
              </div>

              {/* Theme Toggle */}
              <div className="flex items-center justify-between px-3 py-2 rounded-lg mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 flex items-center justify-center">
                    <div className="w-4 h-4 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full" />
                  </div>
                  <span className="font-medium text-sm text-muted-foreground">
                    Theme
                  </span>
                </div>
                <ModeToggle />
              </div>

              {/* Logout Button */}
              <button
                onClick={() => {
                  setIsOpen(false);
                  handleLogout?.();
                }}
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-red-500 hover:bg-red-500/10 w-full transition-colors mt-2"
              >
                <LogOut className="w-5 h-5" />
                <span className="font-medium text-sm">Logout</span>
              </button>
            </div>
          </div>
        </>
      )}

      {/* Padding bottom to prevent content from being hidden behind the nav bar */}
      <div className="pb-16 md:pb-0" />
    </>
  );
}