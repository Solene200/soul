export interface ChatMessage {
  id: number;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at: string;
  phase?: string;
  isResolution?: boolean;
  isCrisis?: boolean;
}

export interface ConversationMeta {
  conversation_id: number | null;
  phase: 'emotional' | 'rational' | 'solution';
  round_count: number;
  is_privacy: boolean;
  is_complex: boolean;
}

export interface ActiveConversationResponse {
  conversation_id: number | null;
  phase?: ConversationMeta['phase'] | null;
  round_count: number;
  is_privacy?: boolean;
  is_complex?: boolean;
  status?: string;
  messages?: ChatMessage[];
}

type ChatMetadataEvent = ConversationMeta & {
  type: 'metadata';
};

type ChatContentEvent = {
  type: 'chunk' | 'crisis' | 'error';
  content: string;
};

type ChatEndEvent = {
  type: 'end';
};

export type ChatStreamEvent = ChatMetadataEvent | ChatContentEvent | ChatEndEvent;

export const DEFAULT_CONVERSATION_META: ConversationMeta = {
  conversation_id: null,
  phase: 'emotional',
  round_count: 0,
  is_privacy: false,
  is_complex: false,
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isChatStreamEvent(value: unknown): value is ChatStreamEvent {
  if (!isRecord(value) || typeof value.type !== 'string') {
    return false;
  }

  switch (value.type) {
    case 'metadata':
      return typeof value.conversation_id === 'number'
        && typeof value.phase === 'string'
        && typeof value.round_count === 'number'
        && typeof value.is_privacy === 'boolean'
        && typeof value.is_complex === 'boolean';
    case 'chunk':
    case 'crisis':
    case 'error':
      return typeof value.content === 'string';
    case 'end':
      return true;
    default:
      return false;
  }
}

export function createChatStreamParser(onEvent: (event: ChatStreamEvent) => void) {
  let buffer = '';

  const flushEventBlock = (rawEvent: string) => {
    const payload = rawEvent
      .split('\n')
      .filter((line) => line.startsWith('data:'))
      .map((line) => line.slice(5).trimStart())
      .join('\n')
      .trim();

    if (!payload) {
      return;
    }

    try {
      const parsed = JSON.parse(payload) as unknown;

      if (isChatStreamEvent(parsed)) {
        onEvent(parsed);
      }
    } catch {
      // Ignore incomplete or malformed payloads.
    }
  };

  return {
    push(chunk: string) {
      buffer += chunk;
      const eventBlocks = buffer.split('\n\n');
      buffer = eventBlocks.pop() ?? '';

      eventBlocks.forEach(flushEventBlock);
    },
    flush() {
      if (buffer.trim()) {
        flushEventBlock(buffer);
      }

      buffer = '';
    },
  };
}
