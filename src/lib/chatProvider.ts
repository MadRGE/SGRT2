import { getChatProvider, type ChatProvider } from './apiKeys';
import { sendChat as anthropicSendChat, type ChatMessage } from './anthropic';
import { sendChat as ollamaSendChat } from './ollama';

export type { ChatMessage } from './anthropic';

interface SendChatOptions {
  provider?: ChatProvider;
  signal?: AbortSignal;
  systemPrompt?: string;
}

export async function sendChatWithProvider(
  messages: ChatMessage[],
  onChunk?: (text: string) => void,
  options?: SendChatOptions,
): Promise<string> {
  const provider = options?.provider || getChatProvider();

  if (provider === 'ollama') {
    return ollamaSendChat(messages, onChunk, {
      systemPrompt: options?.systemPrompt,
      signal: options?.signal,
    });
  }

  // Default: Anthropic (systemPrompt is built into anthropic.ts)
  return anthropicSendChat(messages, onChunk);
}
