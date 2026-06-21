/** Strip conversational filler so Kapruka gets a clean search term. */
export function normalizeProductQuery(query: string): string {
    let q = query.trim();
    q = q.replace(
        /^(?:see if there are|check if there are|are there any|find|search for|look for|show me|get me)\s+/i,
        ''
    );
    q = q.replace(/\s+(?:on sale|for sale|available|in stock)(?:\s+.*)?$/i, '');
    q = q.replace(/^(?:some|any|a few)\s+/i, '');
    return q.trim() || query.trim();
}

/** Detect a Kapruka search query from free-text user input. */
export function extractProductQuery(input: string): string | null {
    const normalized = input.normalize('NFC');
    const lower = normalized.toLowerCase();

    const catalog: Array<{ query: string; patterns: RegExp[] }> = [
        { query: 'shoes', patterns: [/\bshoes?\b/i, /\bsneakers?\b/i, /\bsandals?\b/i, /\bslippers?\b/i, /\bfootwear\b/i] },
        { query: 'birthday cake', patterns: [/\bcakes?\b/i, /කේක්/] },
        { query: 'perfume', patterns: [/\bperfumes?\b/i, /\bfragrances?\b/i, /\bcolognes?\b/i, /\bskincare\b/i] },
        { query: 'scented candle', patterns: [/\bcandles?\b/i] },
        { query: 'ceylon tea', patterns: [/\bteas?\b/i, /\btea bags?\b/i] },
        { query: 'chocolate gift', patterns: [/\bchocolates?\b/i] },
        { query: 'flower bouquet', patterns: [/\bflowers?\b/i, /\bbouquet/i] },
        { query: 'fruit basket', patterns: [/\bfruits?\b/i, /\bfruit basket/i] },
        { query: 'gift hamper', patterns: [/\bhamper/i, /\bhampers?\b/i] },
        { query: 'spa gift', patterns: [/\bspa\b/i, /\bwellness\b/i] },
        { query: 'cosmetics', patterns: [/\bcosmetics?\b/i, /\bmakeup\b/i, /\bbeauty\b/i] },
        { query: 'electronics', patterns: [/\belectronics?\b/i, /\bheadphones?\b/i, /\bphone\b/i] },
        { query: 'watch', patterns: [/\bwatches?\b/i] },
        { query: 'jewellery', patterns: [/\bjewell?ery\b/i, /\bnecklace\b/i, /\bring\b/i] },
        { query: 'coffee', patterns: [/\bcoffees?\b/i] },
        { query: 'wine', patterns: [/\bwines?\b/i] },
        { query: 'toy gift', patterns: [/\btoys?\b/i] },
        { query: 'book', patterns: [/\bbooks?\b/i] },
        { query: 'mug gift', patterns: [/\bmugs?\b/i] },
    ];

    for (const { query, patterns } of catalog) {
        if (patterns.some((p) => p.test(normalized) || p.test(lower))) {
            return query;
        }
    }

    const needMatch = lower.match(/\b(?:mata\s+)?([a-z][a-z\s-]{2,24})\s+(?:oni|ona|one)\b/i);
    if (needMatch?.[1] && !/^(gift|it|that|this|one|more|budget)$/i.test(needMatch[1].trim())) {
        return normalizeProductQuery(needMatch[1].trim());
    }

    const thereAreMatch = lower.match(
        /\b(?:there\s+are|any)\s+([a-z][a-z\s-]{2,24}?)(?:\s+on\s+sale|\s+available|\s+in\s+stock)?\b/i
    );
    if (thereAreMatch?.[1]) {
        return normalizeProductQuery(thereAreMatch[1].trim());
    }

    // "show me perfumes", "want a cake too", "also candles", "see if there are shoes"
    const phraseMatch = lower.match(
        /\b(?:show|find|search|look(?:ing)?|want|need|buy|get|add|see)(?:\s+me)?(?:\s+(?:if|for))?(?:\s+there\s+are)?(?:\s+a|\s+some|\s+to)?\s+([a-z][a-z\s-]{2,30})/i
    );
    if (phraseMatch?.[1]) {
        const term = phraseMatch[1]
            .trim()
            .replace(/\s+(too|also|as well|please|on sale)$/i, '');
        if (term.length >= 3 && !/^(gift|it|that|this|one|more|are)$/i.test(term)) {
            return normalizeProductQuery(term);
        }
    }

    return null;
}

export function isAddonSearchRequest(input: string, hasPriorResults: boolean): boolean {
    if (!hasPriorResults) return false;
    const lower = input.toLowerCase();
    if (extractProductQuery(input)) return true;
    return /\b(also|additionally|another|more|too|as well|thawa|wena|plus|something else)\b/i.test(lower);
}

export function dedupeProductsById<T extends { id: string }>(items: T[]): T[] {
    const seen = new Set<string>();
    return items.filter((item) => {
        const key = item.id.trim().toUpperCase();
        if (!key || seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}
