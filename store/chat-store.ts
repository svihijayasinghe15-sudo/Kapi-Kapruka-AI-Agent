// Re-export conversation utilities for any client-side use.
// Main chat logic runs server-side via /api/chat with live Kapruka MCP data.
export { extractEntities } from '@/lib/conversation-engine';
