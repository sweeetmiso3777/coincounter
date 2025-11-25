"use client";

import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

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
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const getOpacity = () => {
    switch (intensity) {
      case "low":
        return 0.3;
      case "medium":
        return 0.5;
      case "high":
        return 0.7;
      default:
        return 0.5;
    }
  };

  return (
    <div className={cn("absolute inset-0 z-0", className)}>
      {/* Black background */}
      <div className="absolute inset-0 bg-black" />

      {/* Hexagonal pattern */}
      <svg
        className="absolute inset-0 w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
        style={{
          transform: `translateY(${scrollY * 0.5}px)`,
        }}
      >
        <defs>
          {/* Radial gradient for density - more at corners, less at center */}
          <radialGradient id="densityFade" cx="50%" cy="50%" r="70%">
            <stop offset="0%" stopOpacity="0.1" />
            <stop offset="40%" stopOpacity="0.4" />
            <stop offset="70%" stopOpacity="0.8" />
            <stop offset="100%" stopOpacity="1" />
          </radialGradient>

          {/* Gold glow filter for glowing hexagons */}
          <filter id="goldGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Regular hexagon pattern */}
          <pattern
            id="hexPattern"
            width="86.6"
            height="100"
            patternUnits="userSpaceOnUse"
          >
            <polygon
              points="43.3,0 86.6,25 86.6,75 43.3,100 0,75 0,25"
              fill="none"
              stroke="rgba(234, 179, 8, 0.3)"
              strokeWidth="1"
            />
            <polygon
              points="43.3,0 86.6,25 86.6,75 43.3,100 0,75 0,25"
              transform="translate(43.3, 50)"
              fill="none"
              stroke="rgba(234, 179, 8, 0.3)"
              strokeWidth="1"
            />
            <polygon
              points="43.3,0 86.6,25 86.6,75 43.3,100 0,75 0,25"
              transform="translate(-43.3, 50)"
              fill="none"
              stroke="rgba(234, 179, 8, 0.3)"
              strokeWidth="1"
            />
          </pattern>
        </defs>

        {/* Apply hexagonal pattern with density fade */}
        <rect
          width="100%"
          height="200%"
          fill="url(#hexPattern)"
          opacity={getOpacity()}
        />
        <rect
          width="100%"
          height="200%"
          fill="url(#hexPattern)"
          opacity="1"
          mask="url(#densityMask)"
        />

        {/* Density mask - controls where hexagons are more/less visible */}
        <mask id="densityMask">
          <rect width="100%" height="200%" fill="url(#densityFade)" />
        </mask>

        {/* Glowing gold hexagons - concentrated at bottom left and top right */}
        <g filter="url(#goldGlow)">
          {/* Bottom left cluster */}
          <polygon
            points="43.3,0 86.6,25 86.6,75 43.3,100 0,75 0,25"
            transform="translate(50, 650)"
            fill="none"
            stroke="rgba(234, 179, 8, 0.9)"
            strokeWidth="2"
          />
          <polygon
            points="43.3,0 86.6,25 86.6,75 43.3,100 0,75 0,25"
            transform="translate(150, 700)"
            fill="none"
            stroke="rgba(234, 179, 8, 0.8)"
            strokeWidth="2"
          />
          <polygon
            points="43.3,0 86.6,25 86.6,75 43.3,100 0,75 0,25"
            transform="translate(100, 550)"
            fill="none"
            stroke="rgba(234, 179, 8, 0.7)"
            strokeWidth="2"
          />
          <polygon
            points="43.3,0 86.6,25 86.6,75 43.3,100 0,75 0,25"
            transform="translate(200, 600)"
            fill="none"
            stroke="rgba(234, 179, 8, 0.6)"
            strokeWidth="2"
          />
          <polygon
            points="43.3,0 86.6,25 86.6,75 43.3,100 0,75 0,25"
            transform="translate(80, 750)"
            fill="none"
            stroke="rgba(234, 179, 8, 0.85)"
            strokeWidth="2"
          />
          <polygon
            points="43.3,0 86.6,25 86.6,75 43.3,100 0,75 0,25"
            transform="translate(180, 800)"
            fill="none"
            stroke="rgba(234, 179, 8, 0.75)"
            strokeWidth="2"
          />
          <polygon
            points="43.3,0 86.6,25 86.6,75 43.3,100 0,75 0,25"
            transform="translate(250, 720)"
            fill="none"
            stroke="rgba(234, 179, 8, 0.65)"
            strokeWidth="2"
          />
          <polygon
            points="43.3,0 86.6,25 86.6,75 43.3,100 0,75 0,25"
            transform="translate(120, 820)"
            fill="none"
            stroke="rgba(234, 179, 8, 0.7)"
            strokeWidth="2"
          />

          {/* Top right cluster */}
          <polygon
            points="43.3,0 86.6,25 86.6,75 43.3,100 0,75 0,25"
            transform="translate(1100, 50)"
            fill="none"
            stroke="rgba(234, 179, 8, 0.9)"
            strokeWidth="2"
          />
          <polygon
            points="43.3,0 86.6,25 86.6,75 43.3,100 0,75 0,25"
            transform="translate(1000, 100)"
            fill="none"
            stroke="rgba(234, 179, 8, 0.8)"
            strokeWidth="2"
          />
          <polygon
            points="43.3,0 86.6,25 86.6,75 43.3,100 0,75 0,25"
            transform="translate(1150, 150)"
            fill="none"
            stroke="rgba(234, 179, 8, 0.7)"
            strokeWidth="2"
          />
          <polygon
            points="43.3,0 86.6,25 86.6,75 43.3,100 0,75 0,25"
            transform="translate(1050, 200)"
            fill="none"
            stroke="rgba(234, 179, 8, 0.75)"
            strokeWidth="2"
          />
          <polygon
            points="43.3,0 86.6,25 86.6,75 43.3,100 0,75 0,25"
            transform="translate(1200, 80)"
            fill="none"
            stroke="rgba(234, 179, 8, 0.85)"
            strokeWidth="2"
          />
          <polygon
            points="43.3,0 86.6,25 86.6,75 43.3,100 0,75 0,25"
            transform="translate(1120, 250)"
            fill="none"
            stroke="rgba(234, 179, 8, 0.65)"
            strokeWidth="2"
          />
          <polygon
            points="43.3,0 86.6,25 86.6,75 43.3,100 0,75 0,25"
            transform="translate(950, 150)"
            fill="none"
            stroke="rgba(234, 179, 8, 0.7)"
            strokeWidth="2"
          />
          <polygon
            points="43.3,0 86.6,25 86.6,75 43.3,100 0,75 0,25"
            transform="translate(1180, 180)"
            fill="none"
            stroke="rgba(234, 179, 8, 0.6)"
            strokeWidth="2"
          />

          {/* Scattered middle hexagons */}
          <polygon
            points="43.3,0 86.6,25 86.6,75 43.3,100 0,75 0,25"
            transform="translate(400, 300)"
            fill="none"
            stroke="rgba(234, 179, 8, 0.5)"
            strokeWidth="2"
          />
          <polygon
            points="43.3,0 86.6,25 86.6,75 43.3,100 0,75 0,25"
            transform="translate(700, 400)"
            fill="none"
            stroke="rgba(234, 179, 8, 0.45)"
            strokeWidth="2"
          />
          <polygon
            points="43.3,0 86.6,25 86.6,75 43.3,100 0,75 0,25"
            transform="translate(550, 500)"
            fill="none"
            stroke="rgba(234, 179, 8, 0.4)"
            strokeWidth="2"
          />
        </g>
      </svg>

      {/* Optional content */}
      {children}
    </div>
  );
}
