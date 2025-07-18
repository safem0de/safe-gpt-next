// src/app/page.tsx
"use client"

import React from "react";
import ChatArea from "@/components/ChatArea";

import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import { LangProvider } from "@/contexts/LangContext";

export default function page() {
  return (
    <LangProvider>
      <Navbar />
      <div className="flex flex-row h-[calc(100vh-4rem)]">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          <ChatArea />
        </main>
      </div>
    </LangProvider>
  );
}
