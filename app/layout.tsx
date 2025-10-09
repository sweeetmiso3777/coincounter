import type React from "react";
import "./globals.css";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { QueryProvider } from "@/providers/query-client";
import { Toaster } from "@/components/sonner";
import { UserProvider } from "@/providers/UserProvider";
import { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";

// Separate viewport export
export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

// Clean metadata without viewport/themeColor
export const metadata: Metadata = {
  title: "Real-Time Tracker PWA",
  description: "A Capstone Project by Lory",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Real-Time Tracker PWA",
  },
  icons: {
    apple: [
      { url: "/icon-192x192.png" },
      { url: "/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    icon: [
      { url: "/favicon.ico" },
      { url: "/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta
          name="apple-mobile-web-app-title"
          content="Real-Time Tracker PWA"
        />
      </head>
      <body className="font-sans">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <QueryProvider>
            <UserProvider>
              <main>{children}</main>
              <Toaster position="top-right" />
            </UserProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
