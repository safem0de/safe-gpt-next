import React from "react";
import { connectMongoDB } from "@/config/database";
import ChatArea from "@/components/ChatArea";

// connectMongoDB();
export default function page() {
  return (
    <>
      <ChatArea/>
    </>
  );
}
