import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';
import { getKaprukaClient } from '@/lib/kapruka-mcp';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const userMessage = body.message || "";
        const history = body.history || [];

        if (!userMessage.trim()) {
            return NextResponse.json({ error: "No user message detected" }, { status: 400 });
        }

        const keys = [
            process.env.GEMINI_API_KEY,
            process.env.GEMINI_API_KEY_BACKUP_1,
            process.env.GEMINI_API_KEY_BACKUP_2,
            process.env.GEMINI_API_KEY_BACKUP_3
        ].filter(Boolean);

        // ========================================================
        // LOCAL RULE PRE-PROCESSING (SHORTHAND, URGENCY, RECIPIENT)
        // ========================================================
        let cleanedInput = userMessage.toLowerCase();

        // 🔥 FIX: Added strict string types and prefixed unused parameter with an underscore
        cleanedInput = cleanedInput.replace(/(\d+(\.\d+)?)\s*k\b/g, (_match: string, p1: string) => {
            return String(parseFloat(p1) * 1000);
        });

        cleanedInput = cleanedInput.replace(/rs\.?\s*/g, "").replace(/\/=/g, "");

        let isUrgentDelivery = /\b(ada|heta|urgent|today|tomorrow|ikmanatama|unurgent)\b/.test(cleanedInput);
        let isComboQuery = (cleanedInput.includes("cake") && (cleanedInput.includes("flower") || cleanedInput.includes("mal")));

        let extractedParams = { q: "gift", maxPrice: null as number | null };

        if (cleanedInput.includes("flower") || cleanedInput.includes("mal")) extractedParams.q = "flowers";
        else if (cleanedInput.includes("cake")) extractedParams.q = "cake";
        else if (cleanedInput.includes("chocolate")) extractedParams.q = "chocolates";
        else if (cleanedInput.includes("mug")) extractedParams.q = "mug";
        else if (cleanedInput.includes("teddy") || cleanedInput.includes("toy")) extractedParams.q = "teddy";

        const budgetMatch = cleanedInput.match(/\b(\d{4,5})\b/);
        if (budgetMatch) {
            extractedParams.maxPrice = Number(budgetMatch[1]);
        }

        // ========================================================
        // STEP 1: PARALLEL INTENT EXTRACTION (WITH API KEY ROTATION)
        // ========================================================
        let extractionSuccess = false;
        for (let i = 0; i < keys.length; i++) {
            try {
                const scanAI = new GoogleGenerativeAI(keys[i]!);
                const scanModel = scanAI.getGenerativeModel({
                    model: 'gemini-2.5-flash',
                    generationConfig: { responseMimeType: "application/json" }
                });
                const scanPrompt = `Identify the shopping search keyword and numeric budget constraint.
                User Input: "${userMessage}"
                Normalized Data: "${cleanedInput}"
                Context: ${JSON.stringify(history)}
                Return JSON only: {"q": "string", "maxPrice": number or null}`;

                const scanResult = await scanModel.generateContent(scanPrompt);
                const scanText = scanResult.response.text().trim();
                if (scanText.startsWith('{')) {
                    const parsedScan = JSON.parse(scanText);
                    if (parsedScan.q) extractedParams.q = parsedScan.q;
                    if (parsedScan.maxPrice) extractedParams.maxPrice = Number(parsedScan.maxPrice);
                    extractionSuccess = true;
                    break;
                }
            } catch (e) {
                console.log(`Extraction key ${i} exhausted, cycling parameters...`);
            }
        }

        if (extractedParams.q === "gift") {
            if (/\b(bf|boyfriend|husband|malli|ayya|him)\b/.test(cleanedInput)) {
                extractedParams.q = "chocolates";
            } else if (/\b(gf|girlfriend|wife|nangi|akka|her)\b/.test(cleanedInput)) {
                extractedParams.q = "flowers";
            } else if (/\b(amma|thaththa|parents|mom|dad)\b/.test(cleanedInput)) {
                extractedParams.q = "cake";
            }
        }

        if (isUrgentDelivery && extractedParams.q === "gift") {
            extractedParams.q = "cake";
        }

        // ========================================================
        // STEP 2: LIVE KAPRUKA MCP FETCH (CORRECT SNAKE_CASE PARAMS)
        // ========================================================
        let liveProductsRaw = "";
        try {
            const mcpClient = getKaprukaClient();

            // 🔥 FIX: Converted to exact official snake_case keys mapped out by the spec sheet
            const searchOptions: any = {
                q: extractedParams.q,
                limit: 8,
                in_stock_only: true
            };
            if (extractedParams.maxPrice) {
                searchOptions.max_price = Number(extractedParams.maxPrice);
            }

            console.log("Searching Kapruka MCP with official parameters:", searchOptions);
            const mcpResponse = await mcpClient.searchProducts(searchOptions);
            liveProductsRaw = mcpResponse ? mcpResponse.trim() : "";

            if ((liveProductsRaw.toLowerCase().includes("no products found") || !liveProductsRaw) && extractedParams.maxPrice) {
                console.log("No items found under strict budget limit. Fetching upsells...");
                searchOptions.max_price = null; // Clear official field for backup list
                const backupResponse = await mcpClient.searchProducts(searchOptions);
                liveProductsRaw = backupResponse ? backupResponse.trim() : "";
            }
        } catch (mcpError) {
            console.error("Kapruka MCP tool communication block error:", mcpError);
        }

        const dataIsEmpty = !liveProductsRaw || liveProductsRaw.toLowerCase().includes("no products found");

        // ========================================================
        // STEP 3: CONVERSATIONAL ENGINE (WITH API KEY ROTATION)
        // ========================================================
        let finalResponseText = "";
        let generationSuccess = false;
        let lastError = null;

        const SYSTEM_PROMPT = `You are Kapi, an energetic and ultra-friendly Kapruka shopping concierge agent. Your job is to parse the raw text data pool below and output a clean JSON payload for the web UI cards.

        RAW LIVE KAPRUKA INVENTORY SELECTION POOL (MARKDOWN TEXT):
        ${liveProductsRaw}

        CRITICAL BEHAVIOR BUSINESS RULES TO ENFORCE:

        RULE 1: STRICT SCRIPT LOCK (MANDATORY)
        - If the user types in SINGLISH or TANGLISH (Latin characters), you MUST reply entirely in natural, conversational SINGLISH or TANGLISH using the Latin alphabet. Never generate English error sentences.
        - If the user types in standard ENGLISH, reply entirely in standard ENGLISH.

        RULE 2: BROAD INQUIRIES OR EMPTY MATCHES
        - If the inventory pool above says "No products found", do NOT say there are no items. Prompt them with alternate category choices (Flowers, Cakes, Chocolates, Mugs) to maintain engagement.

        RULE 3: STRICT BUDGET EXCEEDED HANDLING & UPSELLING
        - If the user specified a budget and the items in the pool are more expensive, explicitly mention in your "reply" text field that they should consider increasing their budget, and populate the "products" array with those higher-priced items so they see alternatives.

        RULE 4: COMBO BOX HANDLING
        - Contextual Flag: Is combo query active? ${isComboQuery}. If true, mention in your response text that you will guide them to pick both items step-by-step.

        RULE 5: REAL KAPRUKA IMAGE RECONSTRUCTION (NO PLACEHOLDERS)
        - Inspect each item parsed from the text block. Extract the product alphanumeric ID string.
        - Dynamically construct and apply the official Kapruka website CDN link structure for both the "image" and "imageUrl" fields. Keep the product ID letters exactly as they are written in the tool pool (do NOT convert them to lowercase):
          "https://www.kapruka.com/images/productimages/large/" + id + ".jpg"

        OUTPUT FORMAT CONTROLS (STRICT JSON ONLY):
        Return ONLY a clean JSON object matching this schema exactly without any markdown wraps:
        {
          "reply": "Conversational statement following all rules above.",
          "products": [
             {
               "id": "Parsed Product ID",
               "name": "Clean Product Title String",
               "price": number price,
               "image": "https://www.kapruka.com/images/productimages/large/product_id_in_lowercase.jpg",
               "imageUrl": "https://www.kapruka.com/images/productimages/large/product_id_in_lowercase.jpg"
             }
          ],
          "quickReplies": ["Option 1", "Option 2"],
          "updatedContext": { "isUrgent": "${isUrgentDelivery}" }
        }`;

        for (let i = 0; i < keys.length; i++) {
            try {
                const genAI = new GoogleGenerativeAI(keys[i]!);
                const model = genAI.getGenerativeModel({
                    model: 'gemini-2.5-flash',
                    systemInstruction: SYSTEM_PROMPT,
                    generationConfig: { responseMimeType: "application/json" }
                });

                const responseResult = await model.generateContent(
                    `User Message: "${userMessage}". State: Empty Data? ${dataIsEmpty}. Generate JSON response payload.`
                );

                finalResponseText = responseResult.response.text().trim();
                generationSuccess = true;
                break;
            } catch (error: any) {
                lastError = error;
                console.log(`Generation key ${i} hit an error, cycling to backup key...`);
            }
        }

        if (!generationSuccess) {
            throw lastError || new Error("All model servers down.");
        }

        let cleanJsonString = finalResponseText;
        const jsonMatch = finalResponseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            cleanJsonString = jsonMatch[0];
        }

        const parsedResult = JSON.parse(cleanJsonString);

        return NextResponse.json({
            reply: parsedResult.reply,
            products: parsedResult.products || [],
            quickReplies: parsedResult.quickReplies || [],
            updatedContext: parsedResult.updatedContext || {}
        });

    } catch (error: any) {
        console.error("API Error Catch Block:", error);
        return NextResponse.json({
            reply: "Podi connection issue ekak ban. Poddak thawa parak kiyanna puluwanda?",
            products: [],
            quickReplies: ["Try again"],
            updatedContext: {}
        });
    }
}