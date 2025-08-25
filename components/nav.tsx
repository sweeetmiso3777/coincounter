import {
  NavigationMenu,
  NavigationMenuIndicator,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuViewport,
} from "@/components/ui/navigation-menu";
import {
  Search,
  User,
  Settings,
  LogOut,
  Bell,
  Contact,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";

export function Nav() {
  return (
    <div className="w-full border-b bg-white px-6 py-3 shadow-sm justify-start">
      <div className="flex items-center justify-between">
        {/* Company Logo */}
        <div className="flex items-center">
          <div className="flex items-center space-x-2">
            <div className="flex items-center">
              <Avatar className="h-9 w-9">
                <AvatarImage src="/gapuz.png" alt="Profile" />
                <AvatarFallback>JD</AvatarFallback>
              </Avatar>
            </div>
            <span className="text-md font-semibold text-gray-900">
              Gapuz Tracking System
            </span>
          </div>
        </div>

        {/* Navigation Menu - Removed Contacts and Settings */}
        <div className="flex-1 flex items-center ml-8">
          <NavigationMenu>
            <NavigationMenuList className="flex gap-6">
              <NavigationMenuItem>
                <NavigationMenuLink
                  href="/dashboard"
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-md transition-colors"
                >
                  Dashboard
                </NavigationMenuLink>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuLink
                  href="/branches"
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-md transition-colors"
                >
                  Branches
                </NavigationMenuLink>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuLink
                  href="/units"
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-md transition-colors"
                >
                  Units
                </NavigationMenuLink>
              </NavigationMenuItem>
            </NavigationMenuList>
            <NavigationMenuIndicator />
            <NavigationMenuViewport />
          </NavigationMenu>
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center space-x-4 ml-auto">
          <Button variant="ghost" size="sm" className="h-9 w-9 p-0 ">
            <Search className="h-4 w-4" />
            <span className="sr-only">Search</span>
          </Button>
          <Button variant="ghost" size="sm" className="h-9 w-9 p-0 ">
            <Bell className="h-4 w-4" />
            <span className="sr-only">Notifications</span>
          </Button>
          <div className="flex items-center">
            <Avatar className="h-9 w-9">
              <AvatarImage
                src="/placeholder.svg?height=36&width=36"
                alt="Profile"
              />
              <AvatarFallback>JD</AvatarFallback>
            </Avatar>

            {/* //dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="cursor-pointer h-9 w-9 p-0 ml-1"
                >
                  <ChevronDown className="h-4 w-4" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      sigma lord
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      skibidisigma@gmail.com
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link
                    href="/profile"
                    className="flex items-center cursor-pointer"
                  >
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </Link>
                </DropdownMenuItem>

                {/* <DropdownMenuItem asChild>
                  <Link
                    href="/notifications"
                    className="flex items-center cursor-pointer"
                  >
                    <Bell className="mr-2 h-4 w-4" />
                    <span>Notifications</span>
                  </Link>
                </DropdownMenuItem> */}

                <DropdownMenuSeparator />

                <DropdownMenuItem asChild>
                  <Link
                    href="/contacts"
                    className="flex items-center cursor-pointer"
                  >
                    <Contact className="mr-2 h-4 w-4" />
                    <span>Contacts</span>
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuItem asChild>
                  <Link
                    href="/settings"
                    className="flex items-center cursor-pointer"
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="cursor-pointer">
                  <Link href="/" className="flex items-center cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Logout</span>
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </div>
  );
}
