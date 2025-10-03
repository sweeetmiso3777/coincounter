import type React from "react";
import { JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { QueryProvider } from "@/providers/query-client";
import { Toaster } from "@/components/sonner";
import { UserProvider } from "@/providers/UserProvider";
import { Metadata } from "next";
export const metadata: Metadata = {
  title: "Your App",
  description: "Your app description",
  icons: {
    icon: "/Vercel_favicon.svg",
  },
};
const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${jetbrainsMono.variable} antialiased`}>
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
