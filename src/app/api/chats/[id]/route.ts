// api/chats/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { Chat } from "@/models/chat-model";
import { connectDB } from "@/utils/db";
import { requireAuth } from "@/utils/auth-helper";

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    // ✅ Require authentication
    const userIdOrError = await requireAuth();
    if (userIdOrError instanceof NextResponse) {
        return userIdOrError; // Return 401 error
    }
    const userId = userIdOrError;

    try {
        await connectDB();

        const chat = await Chat.findById(id);

        if (!chat) {
            return NextResponse.json(
                { success: false, error: "Chat not found", code: "NOT_FOUND" },
                { status: 404 }
            );
        }

        // ✅ Check ownership - prevent accessing other users' chats
        if (chat.userId !== userId) {
            console.warn(`🚨 SECURITY: User ${userId} attempted to access chat ${id} owned by ${chat.userId}`);
            return NextResponse.json(
                {
                    success: false,
                    error: "Access denied - You don't have permission to view this chat",
                    code: "FORBIDDEN",
                },
                { status: 403 }
            );
        }

        return NextResponse.json({ success: true, chat });
    } catch (err: any) {
        console.error(`Error in GET /api/chats/${id}:`, err);
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    // ✅ Require authentication
    const userIdOrError = await requireAuth();
    if (userIdOrError instanceof NextResponse) {
        return userIdOrError; // Return 401 error
    }
    const userId = userIdOrError;

    try {
        await connectDB();

        const chat = await Chat.findById(id);

        if (!chat) {
            return NextResponse.json(
                { success: false, error: "Chat not found", code: "NOT_FOUND" },
                { status: 404 }
            );
        }

        // ✅ Check ownership - prevent deleting other users' chats
        if (chat.userId !== userId) {
            console.warn(`🚨 SECURITY: User ${userId} attempted to delete chat ${id} owned by ${chat.userId}`);
            return NextResponse.json(
                {
                    success: false,
                    error: "Access denied - You don't have permission to delete this chat",
                    code: "FORBIDDEN",
                },
                { status: 403 }
            );
        }

        await Chat.findByIdAndDelete(id);
        return NextResponse.json({ success: true });
    } catch (err: any) {
        console.error(`Error in DELETE /api/chats/${id}:`, err);
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
