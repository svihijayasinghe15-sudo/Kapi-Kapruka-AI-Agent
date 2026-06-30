const MCP_URL = 'https://mcp.kapruka.com/mcp';

interface McpSseMessage {
    jsonrpc: string;
    id?: number | string;
    result?: {
        content?: Array<{ type: string; text: string }>;
        structuredContent?: { result?: string };
        isError?: boolean;
    };
    error?: { message: string };
}

function parseSseResponse(body: string): McpSseMessage | null {
    for (const line of body.split('\n')) {
        if (line.startsWith('data: ')) {
            try {
                return JSON.parse(line.slice(6)) as McpSseMessage;
            } catch {
                continue;
            }
        }
    }
    try {
        return JSON.parse(body) as McpSseMessage;
    } catch {
        return null;
    }
}

async function mcpPost(
    payload: Record<string, unknown>,
    sessionId?: string
): Promise<{ body: string; sessionId?: string }> {
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        Accept: 'application/json, text/event-stream',
    };
    if (sessionId) {
        headers['mcp-session-id'] = sessionId;
    }

    const response = await fetch(MCP_URL, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
        cache: 'no-store',
    });

    const newSessionId =
        response.headers.get('mcp-session-id') ??
        response.headers.get('Mcp-Session-Id') ??
        sessionId;

    return { body: await response.text(), sessionId: newSessionId ?? undefined };
}

export class KaprukaMcpClient {
    private sessionId?: string;
    private initialized = false;

    async initialize(): Promise<void> {
        if (this.initialized) return;

        const init = await mcpPost({
            jsonrpc: '2.0',
            id: 1,
            method: 'initialize',
            params: {
                protocolVersion: '2024-11-05',
                capabilities: {},
                clientInfo: { name: 'kapi-shopping-agent', version: '1.0.0' },
            },
        });

        this.sessionId = init.sessionId;

        await mcpPost(
            { jsonrpc: '2.0', method: 'notifications/initialized', params: {} },
            this.sessionId
        );

        this.initialized = true;
    }

    async callTool(toolName: string, params: Record<string, unknown>): Promise<string> {
        await this.initialize();

        const { body } = await mcpPost(
            {
                jsonrpc: '2.0',
                id: Date.now(),
                method: 'tools/call',
                params: {
                    name: toolName,
                    arguments: { params },
                },
            },
            this.sessionId
        );

        const parsed = parseSseResponse(body);
        if (!parsed) {
            throw new Error('Invalid MCP response');
        }
        if (parsed.error) {
            throw new Error(parsed.error.message);
        }

        const text =
            parsed.result?.content?.[0]?.text ??
            parsed.result?.structuredContent?.result ??
            '';

        if (parsed.result?.isError) {
            throw new Error(text || 'MCP tool error');
        }

        return text;
    }

    async searchProducts(options: {
        q: string;
        category?: string;
        minPrice?: number;
        maxPrice?: number;
        limit?: number;
        inStockOnly?: boolean;
    }): Promise<string> {
        const params: Record<string, unknown> = {
            q: options.q,
            limit: options.limit ?? 6,
            currency: 'LKR',
            in_stock_only: options.inStockOnly ?? true,
        };
        if (options.category) params.category = options.category;
        if (options.minPrice != null) params.min_price = options.minPrice;
        if (options.maxPrice != null) params.max_price = options.maxPrice;

        return this.callTool('kapruka_search_products', params);
    }

    async getProduct(productId: string): Promise<string> {
        return this.callTool('kapruka_get_product', { product_id: productId, currency: 'LKR' });
    }

    async listCategories(): Promise<string> {
        return this.callTool('kapruka_list_categories', { depth: 1 });
    }

    async checkDelivery(city: string, deliveryDate: string, productId?: string): Promise<string> {
        const params: Record<string, unknown> = { city, delivery_date: deliveryDate };
        if (productId) params.product_id = productId;
        return this.callTool('kapruka_check_delivery', params);
    }

    async trackOrder(options: { order_number: string }): Promise<string> {
        return this.callTool('kapruka_track_order', { order_number: options.order_number });
    }
}

let sharedClient: KaprukaMcpClient | null = null;

export function getKaprukaClient(): KaprukaMcpClient {
    if (!sharedClient) {
        sharedClient = new KaprukaMcpClient();
    }
    return sharedClient;
}
