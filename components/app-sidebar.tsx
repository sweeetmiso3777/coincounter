"use client";

import {
  LayoutDashboard,
  House,
  Calendar,
  Home,
  Inbox,
  Search,
  Settings,
  Computer,
  BookUser,
  LogOut,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";

// Menu items.
const items = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Branches",
    url: "/branches",
    icon: Home,
  },
  {
    title: "Units",
    url: "/units",
    icon: Computer,
  },
  {
    title: "Contacts",
    url: "/contacts",
    icon: BookUser,
  },
  {
    title: "Settings",
    url: "/settings",
    icon: Settings,
  },
];

export function AppSidebar() {
  return (
    <Sidebar className=" bg-white shadow-lg ">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="pt-10  mb-10 mt-5 text-xl font-semibold text-gray-600">
            Gapuz Coin Slot Tracking System
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-5 px-5 pt-40 text-gray-800 text-sm font-semibold">
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <a href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}

              <SidebarSeparator className="my-4" />
              <SidebarMenuItem>
                <SidebarMenuButton className="text-red-600 hover:text-red-700 hover:bg-red-50 cursor-pointer">
                  <LogOut />
                  <span>Logout</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
