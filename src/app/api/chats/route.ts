// app/api/chats/route.ts
import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';

const uri = process.env.MONGODB_URI as string;

const MessageSchema = new mongoose.Schema({
    role: String,
    content: Array,
});

const ChatSchema = new mongoose.Schema({
    userId: String,
    messages: [MessageSchema],
    createdAt: { type: Date, default: Date.now },
});

const Chat = mongoose.models.Chat || mongoose.model('Chat', ChatSchema);

async function connectDB() {
    if (mongoose.connection.readyState === 1) return; // already connected
    if (mongoose.connection.readyState === 2) return; // connecting
    await mongoose.connect(uri);
}

export async function POST(req: NextRequest) {
    try {
        await connectDB();
        const { userId, messages } = await req.json();
        const chat = await Chat.create({ userId, messages });
        return NextResponse.json({ success: true, chat });
    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
