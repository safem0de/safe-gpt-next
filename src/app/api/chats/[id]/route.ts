import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { Chat } from "@/models/Chat";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        await mongoose.connect(process.env.MONGODB_URI as string);
        const chat = await Chat.findById(params.id);
        if (!chat) {
            return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
        }
        return NextResponse.json({ success: true, chat });
    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
