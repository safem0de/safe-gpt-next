// models/chat-model.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface IMessage {
  role: string;
  content: string;
  timestamp: Date;
}

export interface IChat extends Document {
  userId: string;
  messages: IMessage[];
  createdAt: Date;
}

const MessageSchema = new Schema<IMessage>({
  role: { type: String, required: true },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});

const ChatSchema = new Schema<IChat>({
  userId: { type: String, required: true },
  messages: [MessageSchema],
  createdAt: { type: Date, default: Date.now }
});

export const ChatModel = mongoose.models.Chat || mongoose.model<IChat>('Chat', ChatSchema);