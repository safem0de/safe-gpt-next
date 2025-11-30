// app/api/chats/route.ts

import { NextRequest, NextResponse } from "next/server";
import { Chat } from "@/models/chat-model";
import { connectDB } from "@/utils/db";
import { requireAuth } from "@/utils/auth-helper";


export async function POST(req: NextRequest) {
    // ✅ Require authentication
    const userIdOrError = await requireAuth();
    if (userIdOrError instanceof NextResponse) {
        return userIdOrError; // Return 401 error
    }
    const authenticatedUserId = userIdOrError;

    try {
        await connectDB();
        const { _id, userId, title, messages } = await req.json();

        // todo : ให้ฝั่ง backend support PATCH หรือแยก insert/update เป็นคนละ endpoint
        let chat;

        if (_id) {
            // อัปเดตข้อความและเวลา
            // ✅ Check ownership before update
            const existingChat = await Chat.findById(_id);

            if (!existingChat) {
                return NextResponse.json(
                    { success: false, error: "Chat not found", code: "NOT_FOUND" },
                    { status: 404 }
                );
            }

            if (existingChat.userId !== authenticatedUserId) {
                console.warn(`🚨 SECURITY: User ${authenticatedUserId} attempted to update chat ${_id} owned by ${existingChat.userId}`);
                return NextResponse.json(
                    {
                        success: false,
                        error: "Access denied - You don't have permission to update this chat",
                        code: "FORBIDDEN",
                    },
                    { status: 403 }
                );
            }

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
            // ✅ Ensure userId from request matches authenticated user
            if (userId !== authenticatedUserId) {
                console.warn(`🚨 SECURITY: User ${authenticatedUserId} attempted to create chat for ${userId}`);
                return NextResponse.json(
                    {
                        success: false,
                        error: "Access denied - Cannot create chat for another user",
                        code: "FORBIDDEN",
                    },
                    { status: 403 }
                );
            }

            const createdate_text = new Date().toLocaleString("th-TH", { dateStyle: "long", timeStyle: "short" });
            chat = await Chat.create({
                userId: authenticatedUserId, // Use authenticated userId
                messages,
                title: title ?? (messages?.[0]?.content?.[0]?.text ?? `สวัสดี ${createdate_text}`),
                createdAt: new Date(),
                updatedAt: new Date(),
            });
        }

        return NextResponse.json({ success: true, chat });
    } catch (err: any) {
        console.error("Error in POST /api/chats:", err);
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}

export async function GET(req: NextRequest) {
    // ✅ Require authentication
    const userIdOrError = await requireAuth();
    if (userIdOrError instanceof NextResponse) {
        return userIdOrError; // Return 401 error
    }
    const authenticatedUserId = userIdOrError;

    try {
        await connectDB();
        const { searchParams } = new URL(req.url);
        const requestedUserId = searchParams.get('userId');

        // ✅ Check ownership - only allow users to fetch their own chats
        if (requestedUserId && requestedUserId !== authenticatedUserId) {
            console.warn(`🚨 SECURITY: User ${authenticatedUserId} attempted to fetch chats for ${requestedUserId}`);
            return NextResponse.json(
                {
                    success: false,
                    error: "Access denied - You can only view your own chats",
                    code: "FORBIDDEN",
                },
                { status: 403 }
            );
        }

        // ✅ Always filter by authenticated user ID
        const chats = await Chat.find({ userId: authenticatedUserId }).sort({ updatedAt: -1 });
        console.log("DEBUG chats for userId", authenticatedUserId, ":", chats);

        return NextResponse.json({ success: true, chats });
    } catch (err: any) {
        console.error("GET /api/chats error:", err);
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}