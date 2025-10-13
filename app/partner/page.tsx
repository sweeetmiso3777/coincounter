// app/partner/page.tsx
"use client";

import React, { useState } from "react";
import { PartnerBranchCard } from "../../components/partner/partner-branch-card";
import { useAffiliatedBranches } from "@/hooks/use-affiliated-branches";
import Lightning from "@/components/Lightning";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LogOut, Loader2 } from "lucide-react";
import { ModeToggle } from "@/components/ui/ModeToggle";

export default function PartnerPage() {
  const { branches, isLoading, error, isAdmin, userBranchCount } =
    useAffiliatedBranches();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    try {
      setLoggingOut(true);
      await new Promise((res) => setTimeout(res, 500));
      await signOut(auth);
      router.push("/");
    } catch (err) {
      console.error(err);
      setLoggingOut(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-white/70">Loading your branches...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center text-red-400">
          <p>Failed to load branches</p>
          <p className="text-sm text-white/70 mt-2">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center p-6">
      {/* Lightning background - positioned absolutely behind everything */}
      <div className="fixed inset-0 z-0">
        <Lightning
          hue={0}
          xOffset={1.3}
          speed={0.7}
          intensity={1.1}
          size={1.7}
        />
      </div>

      {/* Content section */}
      <section className="bg-transparent backdrop-blur rounded-2xl border border-white/10 p-8 shadow-lg overflow-auto relative z-10">
        {/* Logout Button - Top Right */}
        <div className="flex justify-end mb-6">
          <ModeToggle />
          <Button
            variant="outline"
            onClick={handleLogout}
            disabled={loggingOut}
            className="flex items-center gap-2 border-white/20 text-white hover:bg-white/10 transition-all mx-2"
          >
            {loggingOut ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <LogOut className="h-4 w-4" />
            )}
            {loggingOut ? "Logging out..." : "Logout"}
          </Button>
        </div>

        <header className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-wide">Welcome, Partner</h1>
          <p className="text-sm text-white/70 mt-2">
            This is the partner area of Coin Slot Tracker. Access
            partner-specific tools and analytics here.
          </p>
          <div className="mt-4 text-lg font-semibold text-red-400">
            Your Affiliate Branches: {userBranchCount}
          </div>
        </header>

        {branches.length === 0 ? (
          <div className="text-center py-12">
            <div className="max-w-md mx-auto">
              <h3 className="text-lg font-medium text-white mb-2">
                No affiliate branches found
              </h3>
              <p className="text-white/70">
                You are not currently affiliated with any branches.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {branches.map((branch) => (
              <PartnerBranchCard key={branch.id} branch={branch} />
            ))}
          </div>
        )}
      </section>

      {/* Logging Out Overlay */}
      {loggingOut && (
        <div className="fixed inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-50">
          <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="ml-4 text-3xl font-bold text-foreground">
            Logging Out...
          </p>
        </div>
      )}
    </div>
  );
}
