// lib/ai/chat-service.ts
import { AssistantResponse, ShoppingContext } from '@/types/chat';
import { ChatHistoryMessage, ChatServiceResult } from '@/types/ai';
import { processAssistantResponse } from '@/lib/conversation-engine';
import { getKaprukaClient } from '@/lib/kapruka-mcp';

/**
 * Main chat handler matching your existing architecture interface.
 * Delegates the conversational flow and live product searching completely to
 * our updated, high-energy trilingual Gemini engine.
 */
export async function handleChatMessage(options: {
    message: string;
    context: ShoppingContext;
    history: ChatHistoryMessage[];
}): Promise<ChatServiceResult> {
    const { message, context, history } = options;

    try {
        const kapruka = getKaprukaClient();

        // Map frontend chat history tracking formats to what the Gemini SDK expects
        // Frontend uses: 'assistant' | 'user' -> Gemini expects: 'model' | 'user'
        const geminiHistory = (history || []).map((msg) => ({
            role: msg.role === 'assistant' ? ('model' as const) : ('user' as const),
            parts: [{ text: msg.content }]
        }));

        // Execute our high-energy, trilingual conversational engine
        const result = await processAssistantResponse(
            message,
            context || {},
            kapruka,
            geminiHistory
        );

        // Return a clean structure matching your ChatServiceResult type definitions
        return {
            reply: result.reply,
            updatedContext: result.updatedContext,
            products: result.products,
            quickReplies: result.quickReplies,
            source: 'gemini'
        };

    } catch (error) {
        console.error('[chat-service] Gemini processing failure:', error);

        // Graceful fallback response so the UI never locks or breaks for the user
        return {
            reply: "Aiyo, system side podi prashnayak! 😱 Mind trying that message again, machan? 🙌",
            updatedContext: context,
            quickReplies: ['Try again 🔄', 'Main Menu 🛒'],
            source: 'rules'
        };
    }
}