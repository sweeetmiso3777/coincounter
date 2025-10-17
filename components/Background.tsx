"use client";

import { cn } from "@/lib/utils";

interface BackgroundProps {
  children?: React.ReactNode;
  className?: string;
  intensity?: "low" | "medium" | "high";
}

export function Background({
  children,
  className,
  intensity = "medium",
}: BackgroundProps) {
  const getOpacity = () => {
    switch (intensity) {
      case "low":
        return "opacity-[0.08]";
      case "medium":
        return "opacity-[0.15]";
      case "high":
        return "opacity-[0.25]";
      default:
        return "opacity-[0.15]";
    }
  };

  const getGlowOpacity = () => {
    switch (intensity) {
      case "low":
        return "opacity-[0.03]";
      case "medium":
        return "opacity-[0.06]";
      case "high":
        return "opacity-[0.1]";
      default:
        return "opacity-[0.06]";
    }
  };

  return (
    <div className={cn("absolute inset-0 z-0", className)}>
      {/* Solid black background */}
      <div className="absolute inset-0 bg-black" />

      {/* Subtle glow effects */}
      <div className={cn("absolute inset-0", getGlowOpacity())}>
        <div className="absolute top-1/4 left-1/4 w-1/2 h-1/2 bg-lime-400 blur-[120px] rounded-full" />
        <div className="absolute bottom-1/4 right-1/4 w-1/3 h-1/3 bg-cyan-400 blur-[100px] rounded-full" />
      </div>

      {/* Main slanted grid - more subtle */}
      <div className={cn("absolute inset-0", getOpacity())}>
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(90deg, transparent 97%, rgba(132, 204, 22, 0.3) 100%),
              linear-gradient(180deg, transparent 97%, rgba(34, 197, 94, 0.2) 100%)
            `,
            backgroundSize: "80px 80px",
            transform: "skewX(-10deg)",
          }}
        />
      </div>

      {/* Very subtle diagonal lines */}
      <div className="absolute inset-0 opacity-[0.08]">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
              repeating-linear-gradient(
                -45deg,
                transparent,
                transparent 60px,
                rgba(34, 197, 94, 0.15) 60px,
                rgba(34, 197, 94, 0.15) 61px
              )
            `,
          }}
        />
      </div>

      {/* Optional content */}
      {children}
    </div>
  );
}
