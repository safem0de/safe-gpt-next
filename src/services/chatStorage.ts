// services/chatService.ts
import { connectDB } from '../config/database';
import { ChatModel, IChat, IMessage } from '../models/chat-model';

export async function saveChat(userId: string, messages: IMessage[]) {
  await connectDB();
  const chat = new ChatModel({ userId, messages });
  return chat.save();
}

// สามารถเพิ่มฟังก์ชันดึงแชทได้เช่นกัน
export async function getChatsByUser(userId: string) {
  await connectDB();
  return ChatModel.find({ userId }).sort({ createdAt: -1 });
}
