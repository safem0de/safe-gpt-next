import { generateText } from "ai";
import { google } from "@ai-sdk/google";

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = await generateText({
    model: google("gemini-1.5-flash-latest"),
    system: "You are a helpful assistant.",
    messages,
  });

  return Response.json({
    text: result.text,
  });
}
