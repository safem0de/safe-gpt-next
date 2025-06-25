import React from "react";
import { connectMongoDB } from "@/config/database";
import ChatArea from "@/components/ChartArea2";

connectMongoDB();
export default function page() {
  return (
    <>
      <ChatArea/>
    </>
  );
}
