import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import { LangProvider } from "@/contexts/LangContext";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import { SITE } from "@/constants/site";


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: SITE.title,
  description: SITE.description,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <LangProvider>
        <Navbar />
        <div className="flex flex-row h-[calc(100vh-4rem)]">
          <Sidebar />
          <main className="flex-1 overflow-y-auto">{children}</main>
        </div>
        </LangProvider>
      </body>
    </html>
  );
}
