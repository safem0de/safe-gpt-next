// src/app/page.tsx
"use client"

import React from "react";
import ChatArea from "@/components/ChatArea";

import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import { LangProvider } from "@/contexts/LangContext";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function page() {
  // const { data: session, status } = useSession();
  // const router = useRouter();

  // // redirect ถ้าไม่ได้ login
  // useEffect(() => {
  //   if (status === "unauthenticated") {
  //     router.push("/login");
  //   }
  // }, [status, router]);

  // if (!session) return null;

  // // decode role (browser only)
  // let roles: string[] = [];
  // if (session.accessToken) {
  //   try {
  //     const payload = JSON.parse(atob(session.accessToken.split(".")[1]));
  //     roles = payload?.realm_access?.roles ?? [];
  //   } catch (e) {
  //     // ignore
  //     console.log(e);
  //   }
  // }

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
