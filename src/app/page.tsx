import React from "react";
import { connectMongoDB } from "@/config/database";
import ChatArea from "@/components/ChartArea";

// connectMongoDB();
export default function page() {
  return (
    <>
      <ChatArea/>
    </>
  );
}
