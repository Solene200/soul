'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { StatusBanner } from '@/components/StatusBanner';
import { apiFetch, apiRequest } from '@/lib/api';
import { hasAccessToken } from '@/lib/auth';
import {
  createChatStreamParser,
  DEFAULT_CONVERSATION_META,
  type ActiveConversationResponse,
  type ChatMessage as Message,
  type ConversationMeta,
} from '@/lib/chat';
import { useRequireAuth } from '@/hooks/useRequireAuth';

interface ChatNotice {
  title?: string;
  message: string;
  tone: 'info' | 'success' | 'warning' | 'error';
}

export default function ChatPage() {
  const router = useRouter();
  useRequireAuth();

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [notice, setNotice] = useState<ChatNotice | null>(null);
  const [showClearDialog, setShowClearDialog] = useState(false);
  const [conversationMeta, setConversationMeta] =
    useState<ConversationMeta>(DEFAULT_CONVERSATION_META);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const activeRequestControllerRef = useRef<AbortController | null>(null);
  const clearTimeoutRef = useRef<number | null>(null);
  const abortReasonRef = useRef<'idle' | 'cancel' | 'clear'>('idle');

  useEffect(() => {
    if (!hasAccessToken()) {
      return;
    }

    let cancelled = false;

    const restoreConversation = async () => {
      try {
        const data = await apiRequest<ActiveConversationResponse>('/api/chat/active');

        if (cancelled || !data) {
          return;
        }

        setConversationMeta({
          ...DEFAULT_CONVERSATION_META,
          conversation_id: data.conversation_id,
          phase: data.phase ?? DEFAULT_CONVERSATION_META.phase,
          round_count: data.round_count,
          is_privacy: data.is_privacy ?? false,
          is_complex: data.is_complex ?? false,
        });
        setMessages(data.messages ?? []);
      } catch (error) {
        console.error('恢复会话失败:', error);
      }
    };

    void restoreConversation();

    return () => {
      cancelled = true;
      activeRequestControllerRef.current?.abort();

      if (clearTimeoutRef.current) {
        window.clearTimeout(clearTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const resetConversationState = () => {
    setMessages([]);
    setConversationMeta(DEFAULT_CONVERSATION_META);
  };

  const cancelCurrentResponse = () => {
    abortReasonRef.current = 'cancel';
    activeRequestControllerRef.current?.abort();
  };

  const sendMessage = async () => {
    if (!input.trim() || loading || isClearing) {
      return;
    }

    setNotice(null);

    const userMessage = input.trim();
    const userMessageId = Date.now();
    const assistantMessageId = userMessageId + 1;

    setInput('');
    setLoading(true);
    setMessages((prev) => [
      ...prev,
      {
        id: userMessageId,
        role: 'user',
        content: userMessage,
        created_at: new Date().toISOString(),
      },
    ]);

    const controller = new AbortController();
    activeRequestControllerRef.current = controller;

    try {
      const response = await apiFetch('/api/chat/send', {
        method: 'POST',
        json: {
          message: userMessage,
          conversation_id: conversationMeta.conversation_id,
        },
        signal: controller.signal,
      });

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('未收到流式响应');
      }

      const decoder = new TextDecoder();
      let aiResponse = '';
      let streamEnded = false;

      const parser = createChatStreamParser((event) => {
        switch (event.type) {
          case 'metadata':
            setConversationMeta({
              conversation_id: event.conversation_id,
              phase: event.phase,
              round_count: event.round_count,
              is_privacy: event.is_privacy,
              is_complex: event.is_complex,
            });
            setMessages((prev) => {
              if (prev.some((message) => message.id === assistantMessageId)) {
                return prev;
              }

              return [
                ...prev,
                {
                  id: assistantMessageId,
                  role: 'assistant',
                  content: '',
                  created_at: new Date().toISOString(),
                  phase: event.phase,
                },
              ];
            });
            break;
          case 'chunk':
            aiResponse += event.content;
            setMessages((prev) =>
              prev.map((message) =>
                message.id === assistantMessageId
                  ? { ...message, content: aiResponse }
                  : message
              )
            );
            break;
          case 'crisis':
            setMessages((prev) => [
              ...prev,
              {
                id: Date.now(),
                role: 'system',
                content: event.content,
                created_at: new Date().toISOString(),
                isCrisis: true,
              },
            ]);
            break;
          case 'error':
            throw new Error(event.content);
          case 'end':
            streamEnded = true;
            break;
        }
      });

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          break;
        }

        parser.push(decoder.decode(value, { stream: true }));

        if (streamEnded) {
          break;
        }
      }

      parser.push(decoder.decode());
      parser.flush();
    } catch (error: unknown) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        if (abortReasonRef.current === 'cancel') {
          setMessages((prev) => [
            ...prev,
            {
              id: Date.now(),
              role: 'system',
              content: '本次回答已停止，你可以继续追问或重新发送。',
              created_at: new Date().toISOString(),
            },
          ]);
        }
      } else {
        const message = error instanceof Error ? error.message : '未知错误';
        setNotice({
          title: '发送失败',
          message,
          tone: 'error',
        });
        setMessages((prev) =>
          prev.filter(
            (messageItem) =>
              messageItem.id !== userMessageId && messageItem.id !== assistantMessageId
          )
        );
      }
    } finally {
      abortReasonRef.current = 'idle';
      activeRequestControllerRef.current = null;
      setLoading(false);
    }
  };

  const confirmClearChat = async () => {
    setShowClearDialog(false);
    setNotice(null);
    setIsClearing(true);
    abortReasonRef.current = 'clear';
    activeRequestControllerRef.current?.abort();

    try {
      const data = await apiRequest<{ success: boolean; message: string }>(
        '/api/chat/clear',
        {
          method: 'DELETE',
        }
      );

      if (data?.success && data.message) {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now(),
            role: 'assistant',
            content: data.message,
            created_at: new Date().toISOString(),
            isResolution: true,
          },
        ]);

        clearTimeoutRef.current = window.setTimeout(() => {
          resetConversationState();
          setIsClearing(false);
          clearTimeoutRef.current = null;
        }, 3000);
      } else {
        resetConversationState();
        setIsClearing(false);
      }
    } catch (error) {
      console.error('清空失败:', error);
      setNotice({
        title: '清空失败',
        message: '当前对话暂时无法清空，请稍后重试。',
        tone: 'error',
      });
      setIsClearing(false);
    }
  };

  return (
    <div className="flex h-screen flex-col bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50">
      <nav className="bg-white/80 px-6 py-4 shadow-sm backdrop-blur-md">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/dashboard')}
              className="text-gray-600 transition-colors hover:text-gray-800"
            >
              ← 返回
            </button>
            <div className="flex items-center gap-2">
              <span className="text-2xl">🤖</span>
              <span className="bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-xl font-bold text-transparent">
                智能对话
              </span>
            </div>
          </div>
          <button
            onClick={() => setShowClearDialog(true)}
            disabled={isClearing || messages.length === 0}
            className="px-4 py-2 text-sm text-gray-600 transition-colors hover:text-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            清空对话
          </button>
        </div>
      </nav>

      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="mx-auto max-w-4xl space-y-4">
          {notice ? (
            <StatusBanner
              title={notice.title}
              message={notice.message}
              tone={notice.tone}
              onClose={() => setNotice(null)}
            />
          ) : null}

          {messages.length === 0 && (
            <div className="py-20 text-center">
              <div className="mb-4 text-6xl">💭</div>
              <p className="text-lg text-gray-600">我是心灵奇旅，你的 24 小时心理陪伴助手</p>
              <p className="mt-2 text-sm text-gray-400">
                无论你遇到什么困扰，我都会倾听并陪你一起面对
              </p>
            </div>
          )}

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'system' && msg.isCrisis ? (
                <div className="w-full max-w-[90%] rounded-2xl border-2 border-red-300 bg-red-50 px-6 py-4">
                  <div className="flex items-start gap-3">
                    <span className="text-3xl">🆘</span>
                    <div className="flex-1">
                      <div className="mb-2 font-bold text-red-800">检测到危机信号</div>
                      <div className="whitespace-pre-wrap text-red-700">{msg.content}</div>
                    </div>
                  </div>
                </div>
              ) : msg.isResolution ? (
                <div className="w-full max-w-[90%] rounded-2xl border-2 border-green-300 bg-gradient-to-r from-green-50 to-blue-50 px-6 py-4">
                  <div className="flex items-start gap-3">
                    <span className="text-3xl">✨</span>
                    <div className="flex-1">
                      <div className="mb-2 font-bold text-green-800">问题已解决</div>
                      <div className="whitespace-pre-wrap text-green-700">{msg.content}</div>
                      <div className="mt-2 text-sm text-green-600">
                        对话将在 3 秒后自动清空...
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div
                  className={`max-w-[70%] rounded-2xl px-6 py-4 ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white'
                      : 'bg-white text-gray-800 shadow-md'
                  }`}
                >
                  {msg.role === 'user' ? (
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  ) : msg.content ? (
                    <div className="prose prose-sm max-w-none prose-headings:mb-2 prose-headings:mt-3 prose-li:my-1 prose-ol:my-2 prose-p:my-2 prose-pre:border prose-pre:border-gray-300 prose-pre:bg-gray-100 prose-ul:my-2 prose-code:rounded prose-code:bg-gray-100 prose-code:px-1 prose-code:py-0.5">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {msg.content}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <span className="text-gray-400">思考中...</span>
                  )}
                </div>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="border-t border-gray-200 bg-white px-4 py-4">
        <div className="mx-auto flex max-w-4xl gap-3">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey && !isClearing) {
                e.preventDefault();
                void sendMessage();
              }
            }}
            placeholder={isClearing ? '清空中，请稍候...' : '说说你的感受...'}
            disabled={loading || isClearing}
            className="flex-1 resize-none rounded-xl border border-gray-300 px-4 py-3 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-gray-100"
            rows={3}
          />
          <button
            onClick={loading ? cancelCurrentResponse : sendMessage}
            disabled={isClearing || (!loading && !input.trim())}
            className="transform rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 px-8 py-3 font-semibold text-white transition-all duration-200 hover:scale-105 hover:shadow-lg disabled:cursor-not-allowed disabled:transform-none disabled:opacity-50"
          >
            {loading ? '停止回复' : isClearing ? '清空中...' : '发送'}
          </button>
        </div>
      </div>

      <ConfirmDialog
        open={showClearDialog}
        title="清空当前对话"
        description="清空后会结束当前会话，已有上下文也会一起移除。确认继续吗？"
        confirmText={isClearing ? '清空中...' : '确认清空'}
        cancelText="继续对话"
        confirmTone="danger"
        pending={isClearing}
        onConfirm={() => {
          void confirmClearChat();
        }}
        onCancel={() => setShowClearDialog(false)}
      />
    </div>
  );
}
