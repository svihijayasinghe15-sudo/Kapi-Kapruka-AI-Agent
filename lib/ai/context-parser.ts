import { ParsedShoppingContext } from '@/types/ai';
import { ChatHistoryMessage } from '@/types/ai';
import { ShoppingContext } from '@/types/chat';
import { callGeminiJson } from '@/lib/ai/gemini-client';
import { CONTEXT_EXTRACTION_PROMPT, buildContextBlock } from '@/lib/ai/prompts';
import { extractRecipientFallback } from '@/lib/recipient-extract';
import { detectLanguage } from '@/lib/language';
import { detectNoOccasion, GENERAL_GIFT_OCCASION } from '@/lib/occasion';
import { extractProductQuery } from '@/lib/product-search';

const EXTRACTION_SCHEMA = {
    type: 'OBJECT',
    properties: {
        intent: { type: 'STRING', nullable: true },
        recipient: { type: 'STRING', nullable: true },
        budget: { type: 'NUMBER', nullable: true },
        occasion: { type: 'STRING', nullable: true },
        language: { type: 'STRING', nullable: true },
        deliveryUrgency: { type: 'STRING', nullable: true },
        deliveryCity: { type: 'STRING', nullable: true },
        productQuery: { type: 'STRING', nullable: true },
    },
    required: ['intent', 'recipient', 'budget', 'occasion', 'language'],
};

function historyToContents(
    history: ChatHistoryMessage[],
    message: string,
    contextBlock: string
): Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> {
    const contents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];
    for (const entry of history.slice(-12)) {
        contents.push({
            role: entry.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: entry.content }],
        });
    }
    contents.push({
        role: 'user',
        parts: [{ text: `${contextBlock}\n\nLatest user message: ${message}` }],
    });
    return contents;
}

function normalizeExtraction(raw: Record<string, unknown>): ParsedShoppingContext {
    const urgency = raw.deliveryUrgency;
    let deliveryUrgency: 'EXPRESS' | 'STANDARD' | null = null;
    if (typeof urgency === 'string') {
        const u = urgency.toUpperCase();
        if (u.includes('EXPRESS')) deliveryUrgency = 'EXPRESS';
        else if (u.includes('STANDARD')) deliveryUrgency = 'STANDARD';
    }

    return {
        intent: typeof raw.intent === 'string' ? raw.intent : null,
        recipient: typeof raw.recipient === 'string' ? raw.recipient.trim() || null : null,
        budget: typeof raw.budget === 'number' && raw.budget > 0 ? raw.budget : null,
        occasion: typeof raw.occasion === 'string' ? raw.occasion.trim() || null : null,
        language: typeof raw.language === 'string' ? raw.language : null,
        deliveryUrgency,
        deliveryCity: typeof raw.deliveryCity === 'string' ? raw.deliveryCity : null,
        productQuery: typeof raw.productQuery === 'string' ? raw.productQuery : null,
    };
}

/** Rule-based fallback when Gemini is unavailable — no fixed recipient list. */
export function extractShoppingContextFallback(
    message: string,
    currentContext: ShoppingContext
): ParsedShoppingContext {
    const normalized = message.normalize('NFC');
    const textLower = normalized.toLowerCase();

    let budget: number | null = null;
    const budgetMatch = textLower.replace(/,/g, '').match(/(?:rs\.?|lkr|රු|ரூ)?\s*(\d{3,7})(?:\/-)?\b/i);
    if (budgetMatch?.[1]) budget = parseInt(budgetMatch[1], 10);

    let occasion: string | null = null;
    if (detectNoOccasion(normalized)) occasion = GENERAL_GIFT_OCCASION;

    let deliveryUrgency: 'EXPRESS' | 'STANDARD' | null = null;
    if (/\b(today|express|urgent)\b/i.test(textLower)) deliveryUrgency = 'EXPRESS';
    else if (/\b(standard|2-3 days)\b/i.test(textLower)) deliveryUrgency = 'STANDARD';

    const lang = detectLanguage(normalized, currentContext.languageDetected);
    const languageMap: Record<string, string> = {
        EN: 'english',
        SI: 'sinhala',
        SINGLISH: 'singlish',
        TA: 'tamil',
    };

    return {
        intent: extractProductQuery(normalized) ? 'browse' : null,
        recipient: extractRecipientFallback(normalized) ?? null,
        budget,
        occasion,
        language: languageMap[lang] ?? 'english',
        deliveryUrgency,
        deliveryCity: null,
        productQuery: extractProductQuery(normalized),
    };
}

/** Primary parser — Gemini extracts full shopping context from natural language. */
export async function extractShoppingContext(
    message: string,
    history: ChatHistoryMessage[],
    currentContext: ShoppingContext
): Promise<ParsedShoppingContext> {
    const contextBlock = buildContextBlock(currentContext as Record<string, unknown>);
    const contents = historyToContents(history, message, contextBlock);

    try {
        const raw = await callGeminiJson({
            systemInstruction: CONTEXT_EXTRACTION_PROMPT,
            contents,
            temperature: 0.1,
            responseSchema: EXTRACTION_SCHEMA,
        });
        return normalizeExtraction(raw);
    } catch (err) {
        console.error('[context-parser] Gemini extraction failed, using fallback:', err);
        return extractShoppingContextFallback(message, currentContext);
    }
}
