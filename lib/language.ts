export type Lang = 'EN' | 'SI' | 'SINGLISH' | 'TA';

const SINGLISH_MARKERS = [
    'ekak', 'ekka', 'mokada', 'kohomada', 'hari', 'nane', 'denna', 'denne',
    'balanna', 'onn', 'oni', 'ona', 'mata', 'oya', 'mama', 'machan', 'yaluwa',
    'aduvata', 'loku', 'ganan', 'patta', 'hari hari', 'ok ok', 'honda', 'lassana',
    'puluwanda', 'puluwan', 'wena', 'thawa', 'kiyanna', 'balanna', 'denna ona',
];

const TAMIL_MARKERS = [
    'vanakkam', 'amma', 'appa', 'nanban', 'thambi', 'akka', 'annan',
    'eppadi', 'enna', 'romba', 'nalla', 'giftu', 'sollunga',
];

export function detectLanguage(text: string, current?: Lang): Lang {
    if (/[\u0D80-\u0DFF]/.test(text)) return 'SI';
    if (/[\u0B80-\u0BFF]/.test(text)) return 'TA';

    const lower = text.toLowerCase();

    const tamilScore = TAMIL_MARKERS.filter((w) => lower.includes(w)).length;
    const singlishScore = SINGLISH_MARKERS.filter((w) => lower.includes(w)).length;

    if (tamilScore >= 2 || (tamilScore >= 1 && singlishScore === 0)) return 'TA';
    if (singlishScore >= 1) return 'SINGLISH';

    // Latin script with no code-mixing markers → English (user may have switched from Singlish)
    return 'EN';
}

export function isGreetingOnly(text: string): boolean {
    const normalized = text.trim().toLowerCase().replace(/[!?.]+$/g, '').replace(/\s+/g, ' ');
    const greetingPatterns = [
        /^(hi+|hey+|hello+|howdy|yo|sup)$/,
        /^(hi+|hey+|hello+)\s+there$/,
        /^(good\s*(morning|afternoon|evening|night))$/,
        /^(ayubowan|ayubo)$/,
        /^(vanakkam|vanakam)$/,
        /^(kohomada|kohomd|mokada|mokadda)$/,
    ];
    return greetingPatterns.some((p) => p.test(normalized));
}

export function hasGreeting(text: string): boolean {
    const lower = text.toLowerCase();
    return (
        isGreetingOnly(text) ||
        /\b(hi+|hey+|hello+|ayubowan|vanakkam|kohomada)\b/.test(lower)
    );
}

export function isAffirmative(text: string): boolean {
    const lower = text.toLowerCase().trim();
    return ['yes', 'yeah', 'yep', 'sure', 'ok', 'okay', 'please', 'add', 'ona', 'hari', 'ow', 'sari', 'amm'].some(
        (w) => lower === w || lower.startsWith(`${w} `) || lower.includes(` ${w}`)
    );
}

export function isNegative(text: string): boolean {
    const lower = text.toLowerCase().trim();
    return ['no', 'nope', 'nah', 'naha', 'illai', 'not', 'no thanks', 'nope thanks'].some(
        (w) => lower === w || lower.includes(w)
    );
}

export function localizedRecipient(recipient: string, lang: Lang): string {
    const map: Record<string, Record<Lang, string>> = {
        Mom: { EN: 'Mom', SI: 'අම්මා', SINGLISH: 'Amma', TA: 'அம்மா' },
        Dad: { EN: 'Dad', SI: 'තාත්තා', SINGLISH: 'Thaththa', TA: 'அப்பா' },
    };
    return map[recipient]?.[lang] ?? recipient;
}

export function formatBudget(amount: number, lang: Lang): string {
    const formatted = `Rs. ${amount.toLocaleString()}`;
    if (lang === 'SI') return `රු. ${amount.toLocaleString()}`;
    if (lang === 'TA') return `ரூ. ${amount.toLocaleString()}`;
    return formatted;
}
