import { GeminiStructuredReply } from '@/types/ai';

const DEFAULT_MODEL = process.env.GEMINI_MODEL ?? 'gemini-2.0-flash';
const API_BASE = 'https://generativelanguage.googleapis.com/v1beta';

export function isGeminiConfigured(): boolean {
    return Boolean(process.env.GEMINI_API_KEY?.trim());
}

function getApiKey(): string {
    const apiKey = process.env.GEMINI_API_KEY?.trim();
    if (!apiKey) {
        throw new Error('GEMINI_API_KEY is not configured');
    }
    return apiKey;
}

type GeminiContent = { role: 'user' | 'model'; parts: Array<{ text: string }> };

const CHAT_RESPONSE_SCHEMA = {
    type: 'OBJECT',
    properties: {
        reply: { type: 'STRING' },
        quickReplies: { type: 'ARRAY', items: { type: 'STRING' } },
        context: {
            type: 'OBJECT',
            properties: {
                recipient: { type: 'STRING' },
                budget: { type: 'NUMBER' },
                occasion: { type: 'STRING' },
                deliveryUrgency: { type: 'STRING' },
                deliveryCity: { type: 'STRING' },
                productQuery: { type: 'STRING' },
                languageDetected: { type: 'STRING' },
                intent: { type: 'STRING' },
            },
        },
        shouldSearchProducts: { type: 'BOOLEAN' },
        searchQuery: { type: 'STRING' },
    },
    required: ['reply', 'quickReplies', 'context', 'shouldSearchProducts'],
};

export async function callGeminiJson(options: {
    systemInstruction: string;
    contents: GeminiContent[];
    temperature?: number;
    responseSchema: Record<string, unknown>;
}): Promise<Record<string, unknown>> {
    const apiKey = getApiKey();
    const url = `${API_BASE}/models/${DEFAULT_MODEL}:generateContent?key=${encodeURIComponent(apiKey)}`;

    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            systemInstruction: { parts: [{ text: options.systemInstruction }] },
            contents: options.contents,
            generationConfig: {
                temperature: options.temperature ?? 0.3,
                responseMimeType: 'application/json',
                responseSchema: options.responseSchema,
            },
        }),
        cache: 'no-store',
    });

    const data = await response.json();
    if (!response.ok) {
        throw new Error(data?.error?.message ?? `Gemini API error (${response.status})`);
    }

    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error('Empty response from Gemini');

    return JSON.parse(text.trim()) as Record<string, unknown>;
}

export async function generateStructuredReply(
    systemPrompt: string,
    contents: GeminiContent[]
): Promise<GeminiStructuredReply> {
    const parsed = await callGeminiJson({
        systemInstruction: systemPrompt,
        contents,
        temperature: 0.7,
        responseSchema: CHAT_RESPONSE_SCHEMA,
    });

    if (typeof parsed.reply !== 'string') {
        throw new Error('Invalid Gemini response structure');
    }

    const ctx = (parsed.context as Record<string, unknown>) ?? {};

    return {
        reply: parsed.reply,
        quickReplies: Array.isArray(parsed.quickReplies) ? (parsed.quickReplies as string[]) : [],
        context: {
            recipient: typeof ctx.recipient === 'string' ? ctx.recipient : undefined,
            budget: typeof ctx.budget === 'number' ? ctx.budget : undefined,
            occasion: typeof ctx.occasion === 'string' ? ctx.occasion : undefined,
            deliveryUrgency:
                ctx.deliveryUrgency === 'EXPRESS' || ctx.deliveryUrgency === 'STANDARD'
                    ? ctx.deliveryUrgency
                    : undefined,
            deliveryCity: typeof ctx.deliveryCity === 'string' ? ctx.deliveryCity : undefined,
            productQuery: typeof ctx.productQuery === 'string' ? ctx.productQuery : undefined,
            intent: typeof ctx.intent === 'string' ? (ctx.intent as GeminiStructuredReply['context']['intent']) : undefined,
            languageDetected:
                typeof ctx.languageDetected === 'string'
                    ? (ctx.languageDetected as GeminiStructuredReply['context']['languageDetected'])
                    : undefined,
        },
        shouldSearchProducts: Boolean(parsed.shouldSearchProducts),
        searchQuery: typeof parsed.searchQuery === 'string' ? parsed.searchQuery : undefined,
    };
}

export async function* streamTextReply(
    systemPrompt: string,
    contents: GeminiContent[]
): AsyncGenerator<string> {
    const apiKey = getApiKey();
    const url = `${API_BASE}/models/${DEFAULT_MODEL}:streamGenerateContent?key=${encodeURIComponent(apiKey)}&alt=sse`;

    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            systemInstruction: { parts: [{ text: systemPrompt }] },
            contents,
            generationConfig: { temperature: 0.7 },
        }),
        cache: 'no-store',
    });

    if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data?.error?.message ?? `Gemini stream error (${response.status})`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error('No response body');

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            const payload = line.slice(6).trim();
            if (!payload || payload === '[DONE]') continue;
            try {
                const json = JSON.parse(payload);
                const text = json?.candidates?.[0]?.content?.parts?.[0]?.text;
                if (text) yield text;
            } catch {
                // skip malformed SSE chunks
            }
        }
    }
}
