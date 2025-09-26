import { generateText } from "ai";
import { google } from "@ai-sdk/google";

const AI_MODEL = process.env.AI_MODEL

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = await generateText({
    model: google(AI_MODEL as string),
    system: "You are a helpful assistant.",
    messages,
  });

  return Response.json({
    text: result.text,
  });
}
