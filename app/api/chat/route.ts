import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const { messages } = await req.json();
        const lastMessage = messages[messages.length - 1].content;

        // Gather all 4 available keys (1 Primary + 3 Free Backups)
        const keys = [
            process.env.GEMINI_API_KEY,
            process.env.GEMINI_API_KEY_BACKUP_1,
            process.env.GEMINI_API_KEY_BACKUP_2,
            process.env.GEMINI_API_KEY_BACKUP_3
        ].filter(Boolean); // Cleanly removes any keys that aren't set yet

        let responseText = "";
        let success = false;
        let lastError = null;

        // Loop through the keys until one successfully answers
        for (let i = 0; i < keys.length; i++) {
            try {
                console.log(`Trying Gemini API Key Option #${i + 1}...`);

                const genAI = new GoogleGenerativeAI(keys[i]!);
                const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

                const result = await model.generateContent(lastMessage);
                responseText = result.response.text();

                success = true;
                break; // Success! Break out of the loop early
            } catch (error: any) {
                lastError = error;
                // If it's a rate limit error (429), log a warning and let the loop try the next key
                if (error.status === 429 || error.message?.includes('429')) {
                    console.warn(`Key #${i + 1} rate limited. Swapping to next backup...`);
                    continue;
                }
                throw error; // Pass along any real coding or syntax syntax errors immediately
            }
        }

        if (!success) {
            throw lastError || new Error("All backup API keys are currently exhausted.");
        }

        return NextResponse.json({ text: responseText });

    } catch (error: any) {
        console.error("Final Chat API Failure:", error);
        return NextResponse.json(
            { error: "Engine temporary cooldown. Please try again in a moment." },
            { status: 500 }
        );
    }
}