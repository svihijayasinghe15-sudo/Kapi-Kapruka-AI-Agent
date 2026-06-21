import { ShoppingContext } from '@/types/chat';

/** Structured shopping fields extracted from natural language (Gemini or fallback). */
export interface ParsedShoppingContext {
    intent: string | null;
    recipient: string | null;
    budget: number | null;
    occasion: string | null;
    language: string | null;
    deliveryUrgency: 'EXPRESS' | 'STANDARD' | null;
    deliveryCity: string | null;
    productQuery: string | null;
}

export type ChatRole = 'user' | 'assistant';

export interface ChatHistoryMessage {
    role: ChatRole;
    content: string;
}

export interface ChatRequestBody {
    message: string;
    context?: ShoppingContext;
    history?: ChatHistoryMessage[];
    stream?: boolean;
}

export interface GeminiStructuredReply {
    reply: string;
    quickReplies: string[];
    context: Partial<ShoppingContext>;
    shouldSearchProducts: boolean;
    searchQuery?: string;
}

export interface ChatServiceResult {
    reply: string;
    updatedContext: ShoppingContext;
    products?: import('@/types/chat').Product[];
    quickReplies?: string[];
    source: 'gemini' | 'rules';
}
