import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        // 1. Parse the incoming request body safely
        const body = await req.json();
        let lastMessage = "";

        // 2. Foolproof Extraction: Find the user's input text no matter what the frontend named it
        if (body.messages && Array.isArray(body.messages) && body.messages.length > 0) {
            const lastMsgObj = body.messages[body.messages.length - 1];
            lastMessage = typeof lastMsgObj === 'string' ? lastMsgObj : (lastMsgObj.content || lastMsgObj.text || "");
        } else if (body.message) {
            lastMessage = typeof body.message === 'string' ? body.message : (body.message.content || body.message.text || "");
        } else if (body.prompt) {
            lastMessage = body.prompt;
        }

        // Quick safety fallback if everything comes up empty
        if (!lastMessage) {
            return NextResponse.json({ error: "No user message detected in request body" }, { status: 400 });
        }

        // 3. Gather your 4 API keys
        const keys = [
            process.env.GEMINI_API_KEY,
            process.env.GEMINI_API_KEY_BACKUP_1,
            process.env.GEMINI_API_KEY_BACKUP_2,
            process.env.GEMINI_API_KEY_BACKUP_3
        ].filter(Boolean);

        let responseText = "";
        let success = false;
        let lastError = null;

        // 4. Key Rotation Loop
        for (let i = 0; i < keys.length; i++) {
            try {
                console.log(`Trying Gemini API Key Option #${i + 1}...`);
                const genAI = new GoogleGenerativeAI(keys[i]!);
                const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

                const result = await model.generateContent(lastMessage);
                responseText = result.response.text();

                success = true;
                break;
            } catch (error: any) {
                lastError = error;
                if (error.status === 429 || error.message?.includes('429')) {
                    console.warn(`Key #${i + 1} rate limited. Swapping to next backup...`);
                    continue;
                }
                throw error;
            }
        }

        if (!success) {
            throw lastError || new Error("All backup API keys are currently exhausted.");
        }

        // 5. Shotgun Response: Return the data under multiple formats so the frontend is guaranteed to read it!
        return NextResponse.json({
            text: responseText,
            content: responseText,
            reply: responseText,
            message: responseText
        });

    } catch (error: any) {
        console.error("Final Chat API Failure:", error);
        return NextResponse.json(
            { error: "Engine temporary cooldown. Please try again in a moment." },
            { status: 500 }
        );
    }
}