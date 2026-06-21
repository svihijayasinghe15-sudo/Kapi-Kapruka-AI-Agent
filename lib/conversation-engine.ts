// lib/ai/conversation-engine.ts
import { AssistantResponse, ShoppingContext } from '@/types/chat';
import { detectLanguage, Lang } from '@/lib/language';
import { parseSearchResults, enrichSearchResults } from '@/lib/kapruka-parser';
import { KaprukaMcpClient } from '@/lib/kapruka-mcp';
import { extractProductQuery, dedupeProductsById } from '@/lib/product-search';
import { GoogleGenAI } from '@google/genai';

// Initialize the modern Gemini client
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const KAPRUKA_AIYA_SYSTEM_INSTRUCTION = `
You are "Aiya" (or "Akka"/"Thambi" depending on context)—the hyper-intelligent, incredibly enthusiastic, warm, and deeply relatable AI concierge for Kapruka, Sri Lanka's leading e-commerce platform! 🚀🔥

CRITICAL OPERATIONAL RULES:
1. ASSUME SELF-SHOPPING BY DEFAULT: Never start a conversation by asking "Who is this gift for?" or "What product are you looking for?". ❌ Most users are on Kapruka to buy everyday essentials, groceries, electronics, or fashion for themselves. Treat them like a local shopper walking into a store.🛒
2. READ THE ROOM WITH MASSIVE EMPATHY & ENERGY: If a user mentions a life event, relationship status, or problem, you must address the human situation with high enthusiasm and match their emotional vibe using lots of relevant emojis before you even mention a product! 🎉💔🥳
3. HIGH ENTHUSIASM & EMOJI USAGE: Be vibrant, expressive, and joyful. Use emojis generously to emphasize your emotions, local flavor, and recommendations (e.g., 🤩, 😱, 🙌, 🇱🇰, 🍰, 🌸).
4. SRI LANKAN FLAVOR & TRILINGUAL DYNAMICS: 
   - You flow flawlessly between English, Sinhala, Tamil, Singlish, and Tanglish. Always match the language code/structure the user uses.
   - Generously sprinkle in authentic Sri Lankan colloquialisms to sound like a close friend (e.g., "Aiyo! 😱", "Amme machan! 🥳", "Ane...", "Elakiri! 👍", "Enna da? 🤔", "Chumma", "Kohama sapa? 😎").
5. SUGGEST EXCITING QUICK REPLIES: At the very end of your response, output a single line with exactly 3 relevant, contextual short quick replies inside square brackets separated by commas, matching the language style used. Example: [Amme Ow! 🤩, Not now machan 😅, Show options 🛍️]

FEW-SHOT EXAMPLES TO LOCK IN BEHAVIOR:
<examples>
  <example>
    <user>I broke up with my girlfriend... I need to send some flowers.</user>
    <response>Aiyo, no way!! 😱💔 I am so sorry to hear that, machan... stay strong! Okay, listen—here is the ultimate game plan. Let's NOT send a random courier; that feels way too distant right now. 🙅‍♂️ Instead, I'll get a massive bouquet of Kapruka's freshest red roses delivered straight to *your* place today, and you hand-deliver them. Trust me, showing up in person lands 100x better! 🌹✨ Shall I add a handwritten note card to the order as well? Let's fix this! 💪\n[Help me choose flowers 🌹, Add a card 📝, What else can I send? 🤔]</callout></response>
  </example>
  <example>
    <user>heta mn mage gf ta propose karanwa.. can you recommend me some good gifts</user>
    <response>AMME MACHAN!!! 🤩🔥 That is absolutely massive news!!! Double congratulations in advance! 🥳🎉 We need to make sure tomorrow is absolutely perfect! 
    
    If you're doing a romantic surprise dinner, a stunning bouquet of fresh flowers is a total must-have. 🌸 But let's upgrade it—maybe one of our premium luxury chocolate hampers or a gorgeous gold-plated necklace from our jewelry catalog to celebrate the moment she says YES? 💎🍫 
    
    Tell me where the big moment is happening, and I can check if we can get a custom "Will You Marry Me?" cake delivered straight to the venue exactly on time! 🎂✨ What's the master plan?? 😎\n[Show me jewelry 💎, Custom cakes 🎂, Fresh flowers 🌸]</callout></response>
  </example>
</examples>
`;

export async function processAssistantResponse(
    userInput: string,
    currentContext: ShoppingContext,
    kapruka: KaprukaMcpClient,
    chatHistory: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = []
): Promise<AssistantResponse> {
    try {
        const lang = detectLanguage(userInput, currentContext.languageDetected) as Lang;

        // 1. EXTRACT AND SEARCH LIVE INVENTORY FIRST
        const extractedProduct = extractProductQuery(userInput);
        let products: any[] = [];
        let budgetExceededPivot = false;

        if (extractedProduct) {
            // Fetch initial products matching the text query
            const rawResults = await kapruka.searchProducts({
                q: extractedProduct,
                maxPrice: currentContext.budget || 25000,
                limit: 5
            });
            const items = dedupeProductsById(parseSearchResults(rawResults));
            products = await enrichSearchResults(items, (id) => kapruka.getProduct(id));

            // If a budget constraint is set in the context, apply a strict validation ceiling
            if (currentContext.budget) {
                const budgetCeiling = Number(currentContext.budget);
                const filteredProducts = products.filter(p => p.price <= budgetCeiling);

                // Check if items exist but ALL of them break the budget constraint
                if (products.length > 0 && filteredProducts.length === 0) {
                    budgetExceededPivot = true;

                    // Fallback Search: Automatically fetch affordable alternative gifts under the budget
                    const fallbackResults = await kapruka.searchProducts({
                        q: "gift",
                        maxPrice: budgetCeiling,
                        limit: 5
                    });
                    const fallbackItems = dedupeProductsById(parseSearchResults(fallbackResults));
                    const enrichedFallback = await enrichSearchResults(fallbackItems, (id) => kapruka.getProduct(id));

                    // Populate the products carousel strictly with items fitting the budget
                    products = enrichedFallback.filter(p => p.price <= budgetCeiling);
                } else {
                    products = filteredProducts;
                }
            }
        }

        // 2. DYNAMICALLY ADJUST THE SYSTEM INSTRUCITON BASED ON INVENTORY TRUTH
        let activeSystemInstruction = KAPRUKA_AIYA_SYSTEM_INSTRUCTION;
        if (budgetExceededPivot && currentContext.budget) {
            activeSystemInstruction += `\n\n⚠️ LIVE INVENTORY BUDGET WARNING:
            The user wants "${extractedProduct}" under Rs. ${currentContext.budget}, but NO items in that specific category fall under that price. 
            You MUST explicitly address this problem at the beginning of your text response using this exact type of Singlish phrasing:
            "${extractedProduct} nam your budget range ekaට aduwen naa, machan... 😓 But don't worry, I can suggest some other awesome options for you completely under your budget! 🙌"
            Then, enthusiastically pivot and guide them towards the alternative affordable products loaded into the carousel instead (like custom mugs, hampers, or tea packs).`;
        }

        // 3. GENERATE TEXT RESPONSE WITH COMPLETE CONTEXT AWARENESS
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [...chatHistory, { role: 'user', parts: [{ text: userInput }] }],
            config: {
                systemInstruction: activeSystemInstruction,
                temperature: 0.8,
            },
        });

        let fullText = response.text || "Aiyo, template error! 😱 Try typing that again machan! 🙌";

        // 4. PARSE OUT CHAT QUICK REPLIES
        let quickReplies: string[] = ['Browse Items 🛍️', 'Groceries 🛒', 'Offers 🔥'];
        const quickReplyMatch = fullText.match(/\[(.*?)\]/);
        if (quickReplyMatch?.[1]) {
            quickReplies = quickReplyMatch[1].split(',').map(s => s.trim());
            fullText = fullText.replace(/\[.*?\]/, '').trim();
        }

        return {
            reply: fullText,
            updatedContext: {
                ...currentContext,
                languageDetected: lang,
                productQuery: extractedProduct || currentContext.productQuery,
                stage: products.length > 0 ? 'results' : 'collecting'
            },
            products,
            quickReplies
        };

    } catch (error) {
        console.error("Gemini Engine Error:", error);
        return {
            reply: "Aiyo, network side podi prashnayak! 😱 Give me a second to refresh, machan! 🙏",
            updatedContext: currentContext,
            quickReplies: ['Try again']
        };
    }
}

// Placeholder function to satisfy client-side store re-exports
export function extractEntities(text: string) {
    return {};
}