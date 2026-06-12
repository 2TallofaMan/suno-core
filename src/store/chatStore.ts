import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ChatMessage } from '@/types';

interface ChatState {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  context: string | null;
  
  // Actions
  addMessage: (message: ChatMessage) => void;
  setMessages: (messages: ChatMessage[]) => void;
  clearMessages: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setContext: (context: string | null) => void;
}

export const useChatStore = create<ChatState>()(
  persist(
    (set) => ({
      messages: [],
      isLoading: false,
      error: null,
      context: null,

      addMessage: (message) => set((state) => ({
        messages: [...state.messages, message],
      })),

      setMessages: (messages) => set({ messages }),

      clearMessages: () => set({ messages: [] }),

      setLoading: (loading) => set({ isLoading: loading }),

      setError: (error) => set({ error }),

      setContext: (context) => set({ context }),
    }),
    {
      name: 'suno-chat-storage',
    }
  )
);
