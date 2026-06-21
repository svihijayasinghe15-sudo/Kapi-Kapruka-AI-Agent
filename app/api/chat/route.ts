// app/api/chat/route.ts
import { NextResponse } from 'next/server';
import { processAssistantResponse } from '@/lib/conversation-engine';
import { KaprukaMcpClient } from '@/lib/kapruka-mcp';
import { ShoppingContext } from '@/types/chat';

// Initialize your Kapruka client securely on the server side
const kaprukaClient = new KaprukaMcpClient();

export async function POST(request: Request) {
    let context: ShoppingContext = {};

    try {
        const body = await request.json();
        const { message, history } = body;

        // Retain and track the incoming chat session context
        if (body.context) {
            context = body.context;
        }

        if (!message || !message.trim()) {
            return NextResponse.json({ error: 'Message is required' }, { status: 400 });
        }

        // Convert frontend chat tracking arrays into the explicit structure the Gemini SDK expects
        const geminiHistory = (history || []).map((msg: any) => ({
            role: msg.role === 'assistant' ? ('model' as const) : ('user' as const),
            parts: [{ text: msg.content }]
        }));

        // Execute your high-energy, trilingual conversational engine
        const aiResponse = await processAssistantResponse(
            message,
            context,
            kaprukaClient,
            geminiHistory
        );

        // 🛡️ THE BULLETPROOF GUARDRAIL
        // If the user has set a budget limit, filter the real product search results
        if (context.budget && aiResponse.products) {
            const budgetCeiling = Number(context.budget);
            if (!isNaN(budgetCeiling)) {
                // If an item from the inventory is even 1 Rupee over the budget, drop it instantly!
                aiResponse.products = aiResponse.products.filter(
                    (product: any) => product.price <= budgetCeiling
                );
            }
        }

        // Send the clean text response and filtered product cards back to page.tsx
        return NextResponse.json(aiResponse);

    } catch (error) {
        console.error("CRITICAL ROUTE ERROR:", error);
        return NextResponse.json(
            {
                reply: "Aiyo, behind the scenes podi prashnayak! 😱 Let's try that turn again, machan. 🙌",
                updatedContext: context,
                quickReplies: ['Try again 🔄', 'Reset Chat 🛒']
            },
            { status: 500 }
        );
    }
}