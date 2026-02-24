'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import IPhoneFrame from '@/components/iPhoneFrame';

interface Message {
  id: string;
  direction: 'inbound' | 'outbound';
  body: string;
  timestamp: number;
}

const STORAGE_KEY = 'invoke_demo_chat';
const WELCOME_MESSAGE = 'Welcome to Invoke. Type //hey to begin.';
const INTAKE_QUESTION = 'What are you most excited to invoke? Reply with a number: 1) Tasks 2) Reminders 3) Planning 4) Money 5) Coordination 6) Something else';
const COMPLETION_MESSAGE = "Got it — you're on the early list. We'll text you when your spot opens. Reply STOP to unsubscribe.";

function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

export default function DemoContent() {
  const searchParams = useSearchParams();
  const phone = searchParams.get('phone') || 'demo-user';
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [hasStarted, setHasStarted] = useState(false);
  const [waitingForInterest, setWaitingForInterest] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const storageKey = `${STORAGE_KEY}_${phone}`;
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.messages?.length > 0) {
          setMessages(parsed.messages);
          setHasStarted(parsed.hasStarted || false);
          setWaitingForInterest(parsed.waitingForInterest || false);
        } else {
          initWelcome();
        }
      } catch {
        initWelcome();
      }
    } else {
      initWelcome();
    }
  }, [phone]);

  useEffect(() => {
    if (messages.length > 0) {
      const storageKey = `${STORAGE_KEY}_${phone}`;
      localStorage.setItem(storageKey, JSON.stringify({ messages, hasStarted, waitingForInterest }));
    }
  }, [messages, hasStarted, waitingForInterest, phone]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const initWelcome = () => {
    setMessages([{ id: Date.now().toString(), direction: 'outbound', body: WELCOME_MESSAGE, timestamp: Date.now() }]);
    setHasStarted(false);
    setWaitingForInterest(false);
  };

  const handleSend = () => {
    if (!input.trim()) return;
    const userMessage: Message = { id: Date.now().toString(), direction: 'inbound', body: input.trim(), timestamp: Date.now() };
    setMessages(prev => [...prev, userMessage]);
    const currentInput = input.trim();
    setInput('');

    setTimeout(() => {
      let response: Message | null = null;
      if (currentInput.toLowerCase().includes('//hey')) {
        response = { id: (Date.now() + 1).toString(), direction: 'outbound', body: INTAKE_QUESTION, timestamp: Date.now() };
        setHasStarted(true);
        setWaitingForInterest(true);
      } else if (waitingForInterest && /^[1-6]$/.test(currentInput)) {
        response = { id: (Date.now() + 1).toString(), direction: 'outbound', body: COMPLETION_MESSAGE, timestamp: Date.now() };
        setWaitingForInterest(false);
      }
      if (response) setMessages(prev => [...prev, response!]);
    }, 500);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <IPhoneFrame>
        <div className="flex flex-col h-full bg-slate-900">
          <div className="flex items-center justify-between px-4 py-3 bg-slate-800/50 border-b border-slate-700">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <span className="text-white font-semibold text-sm">Invoke</span>
            </div>
            <span className="text-slate-400 text-xs">SMS Demo</span>
          </div>

          <div className="flex-1 overflow-y-auto px-3 py-4 space-y-3">
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.direction === 'inbound' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${message.direction === 'inbound' ? 'bg-blue-500 text-white rounded-br-md' : 'bg-slate-700 text-slate-200 rounded-bl-md'}`}>
                  <p className="leading-relaxed">{message.body}</p>
                  <span className={`text-[10px] mt-1 block ${message.direction === 'inbound' ? 'text-blue-200' : 'text-slate-400'}`}>
                    {formatTime(message.timestamp)}
                  </span>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div className="px-3 py-3 bg-slate-800/50 border-t border-slate-700">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Type a message..."
                className="flex-1 px-3 py-2 bg-slate-700 rounded-full text-white text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button onClick={handleSend} disabled={!input.trim()} className="px-4 py-2 bg-blue-500 text-white rounded-full text-sm font-medium disabled:opacity-50 hover:bg-blue-600 transition-colors">
                Send
              </button>
            </div>
          </div>
        </div>
      </IPhoneFrame>
    </main>
  );
}
