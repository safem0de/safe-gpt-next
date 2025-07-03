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
    title: String,
    messages: [MessageSchema],
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
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
        const { _id, userId, title, messages } = await req.json();

        // let title = "";
        // if (messages && messages.length > 0 && messages[0].content?.[0]?.text) {
        //     title = messages[0].content[0].text;
        // }
        // const chat = await Chat.create({ userId, title, messages });

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
                title: title ?? (messages?.[0]?.content?.[0]?.text || `สวัสดี ${createdate_text}`),
                createdAt: new Date(),
                updatedAt: new Date(),
            });
        }

        return NextResponse.json({ success: true, chat });
    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
