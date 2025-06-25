// import { openai } from '@ai-sdk/openai';
// import { streamText } from 'ai';

// // Allow streaming responses up to 30 seconds
// export const maxDuration = 30;

// export async function POST(req: Request) {
//   const { messages } = await req.json();

//   const result = streamText({
//     model: openai('gpt-4-turbo'),
//     system: 'You are a helpful assistant.',
//     messages,
//   });

//   return result.toDataStreamResponse();
// }

import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { streamText } from 'ai';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {

    const google = createGoogleGenerativeAI({
        apiKey: process.env.GOOGLE_API_KEY!,
    });
    const { messages } = await req.json();

    const result = streamText({
        model: google('gemini-1.5-flash-latest'),
        system: 'You are a helpful assistant.',
        messages,

    });

    return result.toDataStreamResponse();
}