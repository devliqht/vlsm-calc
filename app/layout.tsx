import type React from "react";
import "@/app/globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import type { Metadata } from "next";
import { Figtree } from "next/font/google";

const figtree = Figtree({
  subsets: ["latin"],
  variable: "--font-figtree",
});

export const metadata: Metadata = {
  title: "Networking Calculator - A matlabs project",
  description:
    "Calculate variable length subnet masks based on host requirements, subnetting and wildcard masks. Generate network addresses, broadcast addresses, and more.",
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/icon.png", type: "image/png", sizes: "512x512" },
    ],
    apple: [{ url: "/apple-icon.png", type: "image/png", sizes: "512x512" }],
  },
  openGraph: {
    title: "Networking Calculator - A matlabs project",
    description:
      "Calculate variable length subnet masks based on host requirements, subnetting and wildcard masks. Generate network addresses, broadcast addresses, and more.",
    images: ["/logo.png"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={figtree.className}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}

import "./globals.css";
