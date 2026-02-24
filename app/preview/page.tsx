'use client';

const DEMO_PHONE = '+19999999999';

import { useState, useEffect, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

interface Message {
  id: string;
  direction: 'inbound' | 'outbound';
  body: string;
  created_at: string;
}

function ChatInterface() {
  const searchParams = useSearchParams();
  const [phone, setPhone] = useState('');
  const [inputMessage, setInputMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Access control states
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [accessAllowed, setAccessAllowed] = useState(false);
  const [accessError, setAccessError] = useState('');
  const [isDemo, setIsDemo] = useState(false);

  // Load phone from query param or localStorage and check access
  useEffect(() => {
    const checkAccess = async () => {
      let phoneToCheck = searchParams.get('phone') || '';

      if (!phoneToCheck) {
        const stored = localStorage.getItem('invoke_preview_phone');
        if (stored) phoneToCheck = stored;
      }

      if (!phoneToCheck) {
        setCheckingAccess(false);
        setAccessError('No phone number provided');
        return;
      }

      setPhone(phoneToCheck);

      // Check if demo phone
      if (phoneToCheck === DEMO_PHONE) {
        setIsDemo(true);
        setAccessAllowed(true);
        setCheckingAccess(false);
        localStorage.setItem('invoke_preview_phone', phoneToCheck);
        return;
      }

      // Check access via API
      try {
        const response = await fetch(`/api/preview/access?phone=${encodeURIComponent(phoneToCheck)}`);
        const data = await response.json();

        if (response.ok && data.allowed) {
          setAccessAllowed(true);
          setIsDemo(data.demo || false);
          localStorage.setItem('invoke_preview_phone', phoneToCheck);
        } else {
          setAccessAllowed(false);
          setAccessError(data.error || 'Access denied');
        }
      } catch (err) {
        setAccessAllowed(false);
        setAccessError('Failed to verify access');
      } finally {
        setCheckingAccess(false);
      }
    };

    checkAccess();
  }, [searchParams]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!inputMessage.trim() || !phone || loading) return;

    const messageText = inputMessage.trim();
    setInputMessage('');
    setLoading(true);
    setError('');

    // Optimistically add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      direction: 'inbound',
      body: messageText,
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, userMessage]);

    try {
      const response = await fetch('/api/invoke', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: phone,
          body: messageText,
          channel: isDemo ? 'demo' : 'web',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to get response');
      } else {
        // Add assistant response
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          direction: 'outbound',
          body: data.reply,
          created_at: new Date().toISOString(),
        };
        setMessages(prev => [...prev, assistantMessage]);
      }
    } catch (err) {
      setError('Failed to send message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handlePhoneSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (phone) {
      localStorage.setItem('invoke_preview_phone', phone);
      // Reload to trigger access check
      window.location.href = `/preview?phone=${encodeURIComponent(phone)}`;
    }
  };

  // Format timestamp
  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 flex flex-col">
      {/* Header */}
      <header className="bg-slate-900 border-b border-slate-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-xl font-bold text-white tracking-tight">Invoke</Link>
          <span className="text-slate-500">|</span>
          <span className="text-sm text-slate-400">Preview</span>
        </div>
        <div className="flex items-center gap-4">
          <form onSubmit={handlePhoneSubmit} className="flex items-center gap-2">
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Phone number"
              className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500 w-40"
            />
          </form>
        </div>
      </header>

      {/* Chat Container */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-2xl mx-auto space-y-4">
          {/* Welcome message */}
          {messages.length === 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-white mb-2">
                {isDemo ? 'Demo Mode' : 'Welcome to Invoke Preview'}
              </h2>
              <p className="text-slate-400 max-w-md mx-auto">
                {isDemo
                  ? 'This is a demo with sample data. Type a message below to try the conversation flow.'
                  : 'This simulates the SMS experience. Type a message below to start the conversation. Try typing "hello" or "//invoke" to begin.'}
              </p>
            </div>
          )}

          {/* Messages */}
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.direction === 'inbound' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  message.direction === 'inbound'
                    ? 'bg-blue-600 text-white rounded-br-md'
                    : 'bg-slate-800 text-slate-200 rounded-bl-md'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{message.body}</p>
                <p className={`text-xs mt-1 ${message.direction === 'inbound' ? 'text-blue-200' : 'text-slate-500'}`}>
                  {formatTime(message.created_at)}
                </p>
              </div>
            </div>
          ))}

          {/* Error */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-center">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="bg-slate-900 border-t border-slate-800 px-4 py-4">
        <div className="max-w-2xl mx-auto flex gap-2">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={phone ? "Type a message..." : "Enter phone number first..."}
            disabled={!phone || loading}
            className="flex-1 px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
          />
          <button
            onClick={handleSend}
            disabled={!phone || !inputMessage.trim() || loading}
            className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? (
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            ) : (
              <>
                <span>Send</span>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </>
            )}
          </button>
        </div>
        <p className="max-w-2xl mx-auto mt-2 text-xs text-slate-500 text-center">
          {isDemo
            ? 'Demo mode - No data is saved to the database.'
            : 'This is a preview of the SMS experience. Messages are not sent to your actual phone.'}
        </p>
      </div>
    </div>
  );
}

// Wrap in Suspense for useSearchParams
export default function PreviewPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    }>
      <ChatInterface />
    </Suspense>
  );
}
