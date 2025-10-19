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
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",

          "--success-bg": "#22c55e",
          "--success-text": "#text-foreground",
          "--success-border": "#16a34a",
        } as React.CSSProperties
      }
      toastOptions={{
        style: {
          height: "42",
          minHeight: "28px",
          fontSize: "12px",
          fontWeight: "500",
          borderRadius: "6px",
          padding: "4px 8px",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
