// src/models/Chat.ts

import mongoose from 'mongoose';

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
}, { collection: 'chats' });

export const Chat = mongoose.models.Chat || mongoose.model('Chat', ChatSchema);