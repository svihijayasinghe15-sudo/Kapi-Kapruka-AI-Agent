/**
 * Generic recipient fallback — NO fixed relationship list.
 * Uses natural-language patterns only when Gemini is unavailable.
 */
export function extractRecipientFallback(input: string): string | undefined {
    const normalized = input.normalize('NFC');
    const lower = normalized.toLowerCase();

    const patterns: RegExp[] = [
        /\bgift\s+for\s+(?:my\s+)?(.+?)(?:\s+under|\s+budget|\s+around|\s+within|$)/i,
        /\bpresent\s+for\s+(?:my\s+)?(.+?)(?:\s+under|\s+budget|$)/i,
        /\bfor\s+(?:my\s+)?([a-zA-Z\u0D80-\u0DFF\u0B80-\u0BFF][\w\s'-]{1,48}?)(?:\s+under|\s+budget|\s+on\s+|\s+for\s+(?:her|his|their)\s+birthday|$)/i,
        /\b(?:buy|get)\s+(?:a\s+)?gift\s+for\s+(?:my\s+)?(.+?)(?:\s+under|$)/i,
    ];

    for (const pattern of patterns) {
        const match = normalized.match(pattern) ?? lower.match(pattern);
        if (match?.[1]) {
            const candidate = match[1]
                .trim()
                .replace(/[.,!?]+$/, '')
                .replace(/\s+/g, ' ');
            if (candidate.length >= 2 && candidate.length <= 50) {
                return candidate;
            }
        }
    }

    return extractStandaloneRecipient(normalized);
}

/** Short direct answers when user replies to "who is the gift for?" — no fixed list. */
function extractStandaloneRecipient(input: string): string | undefined {
    const trimmed = input.normalize('NFC').trim().replace(/[.,!?]+$/, '');
    if (!trimmed || trimmed.length > 50) return undefined;

    const lower = trimmed.toLowerCase();
    if (/^\d/.test(trimmed)) return undefined;
    if (
        /\b(rs\.?|lkr|budget|birthday|anniversary|wedding|express|standard|delivery|today|yes|no|ok|okay|hi|hello|hey|thanks)\b/i.test(
            lower
        )
    ) {
        return undefined;
    }

    if (trimmed.split(/\s+/).length > 6) return undefined;

    const myMatch = trimmed.match(/^(?:my|our)\s+(.+)$/i);
    if (myMatch?.[1]) return myMatch[1].trim();

    if (/[\u0D80-\u0DFF]/.test(trimmed)) {
        const stem = trimmed.replace(/ටා?$/, '').trim();
        if (stem.length >= 2) return stem;
    }

    return trimmed;
}

/** @deprecated Use extractRecipientFallback — no fixed list validation */
export function extractRecipient(input: string): string | undefined {
    return extractRecipientFallback(input);
}
