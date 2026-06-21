/** User explicitly has no special occasion — just a thoughtful gift. */
export const GENERAL_GIFT_OCCASION = 'General Gift';

const NO_OCCASION_PATTERNS = [
    /\bno\s+special\s+occasion\b/i,
    /\bno\s+occasion\b/i,
    /\bnothing\s+special\b/i,
    /\bjust\s+(?:a\s+)?gift\b/i,
    /\bjust\s+because\b/i,
    /\bonly\s+(?:a\s+)?gift\b/i,
    /\bgeneral\s+gift\b/i,
    /\bnormal\s+gift\b/i,
    /\bdon'?t\s+have\s+(?:an?\s+)?occasion\b/i,
    /\bwithout\s+(?:an?\s+)?occasion\b/i,
    /\boccasion\s+ekak\s+ne\b/i,
    /\bwishesh\s+occasion\s+ne\b/i,
    /\boccasion\s+nam\s+ne\b/i,
    /\boccasion\s+ne\b/i,
    /\boccasion\s+නෑ\b/,
    /\boccasion\s+නැහැ\b/,
    /\boccasion\s+එකක්\s+නෑ\b/,
    /\bvisheshayak\s+ne\b/i,
    /\bசிறப்பு\s+நிகழ்வு\s+இல்லை\b/,
    /\boccasion\s+இல்லை\b/i,
    /\bjust\s+give\b/i,
    /\bsimple\s+gift\b/i,
];

export function detectNoOccasion(input: string): boolean {
    const normalized = input.normalize('NFC');
    const lower = normalized.toLowerCase();
    return NO_OCCASION_PATTERNS.some((p) => p.test(normalized) || p.test(lower));
}

export function isOccasionFilled(occasion?: string): boolean {
    return Boolean(occasion && occasion.trim().length > 0);
}
