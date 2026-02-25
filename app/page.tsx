'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import IPhoneFrame from '@/components/iPhoneFrame';

interface Message {
  id: string;
  direction: 'inbound' | 'outbound';
  body: string;
  timestamp: number;
}

const CHIPS = [
  { id: 'chatgpt', label: 'ChatGPT', response: 'Connecting to ChatGPT...\n\nHello! I\'m ready to assist you. What would you like to know?' },
  { id: 'planner', label: 'Planner', response: 'Opening Planner...\n\nToday: 3 tasks pending\n- Review project proposal (11:00 AM)\n- Team standup (2:00 PM)\n- Deploy to production (4:00 PM)' },
  { id: 'notes', label: 'Notes', response: 'Accessing Notes...\n\nQuick Capture:\n- Call dentist about appointment\n- Grocery: milk, eggs, coffee\n- Book flight to SF' },
  { id: 'coordination', label: 'Coordination', response: 'Initiating Coordination...\n\nTeam Status:\n- Sarah: Available now\n- Mike: In meeting until 3 PM\n- Alex: Remote today\n\nShall I schedule a standup?' },
];

function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

export default function Home() {
  const [showDemo, setShowDemo] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showChips, setShowChips] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-type //invoke when demo starts
  useEffect(() => {
    if (showDemo) {
      setIsTyping(true);
      const text = '//invoke';
      let i = 0;
      const interval = setInterval(() => {
        if (i <= text.length) {
          setInputText(text.slice(0, i));
          i++;
        } else {
          clearInterval(interval);
          setIsTyping(false);
          setTimeout(() => {
            const userMsg: Message = {
              id: Date.now().toString(),
              direction: 'inbound',
              body: '//invoke',
              timestamp: Date.now(),
            };
            setMessages([userMsg]);
            setTimeout(() => {
              const systemMsg: Message = {
                id: (Date.now() + 1).toString(),
                direction: 'outbound',
                body: 'Connected: Intake Agent\n\nWelcome to Invoke.\nWhat would you like to access?',
                timestamp: Date.now(),
              };
              setMessages(prev => [...prev, systemMsg]);
              setShowChips(true);
            }, 600);
          }, 400);
        }
      }, 100);
      return () => clearInterval(interval);
    }
  }, [showDemo]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleChipClick = (chip: typeof CHIPS[0]) => {
    const userMsg: Message = {
      id: Date.now().toString(),
      direction: 'inbound',
      body: chip.label,
      timestamp: Date.now(),
    };
    setMessages(prev => [...prev, userMsg]);
    setShowChips(false);
    setTimeout(() => {
      const responseMsg: Message = {
        id: (Date.now() + 1).toString(),
        direction: 'outbound',
        body: chip.response,
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, responseMsg]);
      setShowChips(true);
    }, 800);
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-200">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-white tracking-tight">Invoke</Link>
          <div className="flex items-center gap-6">
            <Link href="/privacy" className="text-sm text-slate-400 hover:text-white transition-colors">Privacy</Link>
            <Link href="/terms" className="text-sm text-slate-400 hover:text-white transition-colors">Terms</Link>
          </div>
        </div>
      </nav>

      {/* Hero Section - Fades out when demo starts */}
      <section 
        className={`min-h-screen flex items-center justify-center pt-20 pb-16 px-6 transition-all duration-700 ease-out ${
          showDemo ? 'opacity-0 pointer-events-none absolute inset-0' : 'opacity-100'
        }`}
      >
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-6 leading-tight tracking-tight">
            Your direct command line to Invoke.
          </h1>
          <p className="text-lg sm:text-xl text-slate-400 mb-12 max-w-xl mx-auto leading-relaxed">
            Get tasks done, set reminders, plan your day, and coordinate with others — all through text.
          </p>

          <button
            onClick={() => setShowDemo(true)}
            className="w-full max-w-md mx-auto px-8 py-4 text-base font-medium text-slate-950 bg-white rounded-lg hover:bg-slate-100 transition-colors"
          >
            Invoke
          </button>
        </div>
      </section>
      {/* Demo Experience - Slides in when activated */}
      <section 
        className={`min-h-screen flex items-center justify-center pt-20 pb-16 px-6 transition-all duration-700 ease-out ${
          showDemo ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8 pointer-events-none absolute inset-0'
        }`}
      >
        <div className="flex flex-col items-center">
          <IPhoneFrame>
            <div className="flex flex-col h-full bg-slate-900">
              {/* Chat Header */}
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

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto px-3 py-4 space-y-3">
                {messages.map((message) => (
                  <div 
                    key={message.id} 
                    className={`flex ${message.direction === 'inbound' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm whitespace-pre-line ${
                      message.direction === 'inbound'
                        ? 'bg-blue-500 text-white rounded-br-md'
                        : 'bg-slate-700 text-slate-200 rounded-bl-md'
                    }`}>
                      <p className="leading-relaxed">{message.body}</p>
                      <span className={`text-[10px] mt-1 block ${
                        message.direction === 'inbound' ? 'text-blue-200' : 'text-slate-400'
                      }`}>
                        {formatTime(message.timestamp)}
                      </span>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area with Auto-type */}
              <div className="px-3 py-3 bg-slate-800/50 border-t border-slate-700">
                <div className="flex gap-2">
                  <div className="flex-1 px-3 py-2 bg-slate-700 rounded-full text-white text-sm flex items-center min-h-[36px]">
                    <span className={isTyping ? 'animate-pulse' : ''}>
                      {inputText}
                      {isTyping && <span className="inline-block w-0.5 h-4 bg-blue-400 ml-0.5 animate-pulse" />}
                    </span>
                    {!isTyping && inputText && (
                      <span className="inline-block w-0.5 h-4 bg-slate-500 ml-0.5 animate-pulse" />
                    )}
                  </div>
                  <button className="px-4 py-2 bg-blue-500 text-white rounded-full text-sm font-medium opacity-50">
                    Send
                  </button>
                </div>

                {/* Clickable Chips */}
                {showChips && (
                  <div className="mt-3 flex flex-wrap gap-2 animate-fade-in">
                    {CHIPS.map((chip) => (
                      <button
                        key={chip.id}
                        onClick={() => handleChipClick(chip)}
                        className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs rounded-full transition-colors"
                      >
                        {chip.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </IPhoneFrame>

          {/* Back Button */}
          <button
            onClick={() => {
              setShowDemo(false);
              setMessages([]);
              setInputText('');
              setShowChips(false);
            }}
            className="mt-8 text-sm text-slate-400 hover:text-white transition-colors"
          >
            ← Back to home
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="fixed bottom-0 left-0 right-0 py-4 px-6 text-center">
        <p className="text-xs text-slate-500">
          Explicit. Controlled. Command-based AI.
        </p>
      </footer>
    </main>
  );
}
