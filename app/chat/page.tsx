'use client';

import { useState, useEffect, useRef } from 'react';
import { useChatStore } from '../../store/chatStore';
import { chat } from '../../lib/mistral';

export default function ChatPage() {
  const { messages, addMessage, setLoading, clearMessages, setContext, isLoading } = useChatStore();
  const [input, setInput] = useState('');
  const [projectContext, setProjectContext] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = {
      id: `msg_${Date.now()}`,
      role: 'user' as const,
      content: input,
      timestamp: new Date().toISOString(),
    };
    addMessage(userMessage);
    setInput('');
    setLoading(true);

    try {
      const response = await chat(
        [...messages, userMessage],
        projectContext || 'Suno Core music production'
      );

      addMessage({
        id: `msg_${Date.now() + 1}`,
        role: 'assistant' as const,
        content: response,
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      addMessage({
        id: `msg_${Date.now() + 1}`,
        role: 'system' as const,
        content: 'Error: Could not get response from AI',
        timestamp: new Date().toISOString(),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Creative Assistant
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Brainstorm, get lyrics, plan your music
          </p>
        </header>

        <div className="card flex flex-col h-[calc(100vh-200px)]">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                <p>Start a conversation with your AI music assistant</p>
                <p className="text-sm mt-2">Try: "Suggest a chord progression for a sad piano ballad"</p>
              </div>
            ) : (
              messages.map((msg: any) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] p-3 rounded-lg ${
                      msg.role === 'user'
                        ? 'bg-blue-600 text-white'
                        : msg.role === 'assistant'
                        ? 'bg-gray-200 dark:bg-gray-700'
                        : 'bg-red-100 dark:bg-red-900/30'
                    }`}
                  >
                    {msg.content}
                    <span className="block text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {new Date(msg.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask me anything about your music..."
                className="flex-1 input"
                disabled={isLoading}
              />
              <button
                type="submit"
                className="btn btn-primary px-6"
                disabled={!input.trim() || isLoading}
              >
                {setLoading ? (
                  <span className="animate-spin inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full"></span>
                ) : (
                  'Send'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
