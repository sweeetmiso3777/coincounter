"use client";

import { useTheme } from "next-themes";
import { Toaster as Sonner, ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      style={
        {
          "--toast-width": "380px",
          "--toast-height": "64px",
          "--toast-border-radius": "12px", // rounded corners
          "--toast-font-size": "16px", // bigger font
          "--toast-font-weight": "600", // bold text

          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",

          "--success-bg": "#22c55e",
          "--success-text": "#fff",
          "--success-border": "#16a34a",
        } as React.CSSProperties
      }
      {...props}
    />
  );
};

export { Toaster };
