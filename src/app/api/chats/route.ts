// app/api/chats/route.ts

import { NextRequest, NextResponse } from "next/server";
import { Chat } from "@/models/chat-model";
import { connectDB } from "@/utils/db";


export async function POST(req: NextRequest) {
    try {
        await connectDB();
        const { _id, userId, title, messages } = await req.json();

        // todo : ให้ฝั่ง backend support PATCH หรือแยก insert/update เป็นคนละ endpoint
        let chat;

        if (_id) {
            // อัปเดตข้อความและเวลา
            chat = await Chat.findByIdAndUpdate(
                _id,
                {
                    $set: {
                        messages,
                        updatedAt: new Date(),
                    }
                },
                { new: true } // return doc ที่อัปเดตล่าสุด
            );
        } else {
            // สร้างใหม่
            const createdate_text = new Date().toLocaleString("th-TH", { dateStyle: "long", timeStyle: "short" });
            chat = await Chat.create({
                userId,
                messages,
                title: title ?? (messages?.[0]?.content?.[0]?.text ?? `สวัสดี ${createdate_text}`),
                createdAt: new Date(),
                updatedAt: new Date(),
            });
        }

        return NextResponse.json({ success: true, chat });
    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}

export async function GET(req: NextRequest) {
    try {
        await connectDB();
        const { searchParams } = new URL(req.url);
        const userId = searchParams.get('userId');
        let chats;

        if (userId) {
            chats = await Chat.find({ userId }).sort({ updatedAt: -1 });
            console.log("DEBUG chats for userId", userId, ":", chats);
        } else {
            chats = await Chat.find().sort({ updatedAt: -1 });
        }

        return NextResponse.json({ success: true, chats });
    } catch (err: any) {
        console.error("GET /api/chats error:", err);
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}