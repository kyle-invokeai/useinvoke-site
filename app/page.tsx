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

// Phone formatting and validation helpers
function extractDigits(input: string): string {
  return input.replace(/\D/g, '');
}

function normalizePhone(input: string): string {
  const digits = extractDigits(input);
  
  if (digits.length === 0) return '';
  
  // US number: 10 digits or 11 digits starting with 1
  if (digits.length === 10) {
    return `+1${digits}`;
  }
  if (digits.length === 11 && digits[0] === '1') {
    return `+${digits}`;
  }
  
  // International fallback
  if (digits.length >= 8) {
    return `+${digits}`;
  }
  
  return `+${digits}`;
}

function formatPhoneDisplay(input: string): string {
  const digits = extractDigits(input);
  
  if (digits.length === 0) return '';
  
  // Handle international numbers (non-US)
  if (digits.length > 11 || (digits.length === 11 && digits[0] !== '1')) {
    return '+' + digits;
  }
  
  // US formatting
  let country = '1';
  let national = digits;
  
  if (digits.length === 11 && digits[0] === '1') {
    country = '1';
    national = digits.slice(1);
  } else if (digits.length <= 10) {
    country = '1';
    national = digits.padStart(10, '0').slice(-10);
    if (digits.length < 10) {
      national = digits;
    }
  }
  
  const area = national.slice(0, 3);
  const mid = national.slice(3, 6);
  const last = national.slice(6, 10);
  
  let formatted = `+${country}`;
  if (area) formatted += ` (${area}`;
  if (area.length === 3) formatted += ')';
  if (mid) formatted += ` ${mid}`;
  if (last) formatted += `-${last}`;
  
  return formatted;
}

function isValidPhone(input: string): boolean {
  const normalized = normalizePhone(input);
  return /^\+\d{10,15}$/.test(normalized) && extractDigits(input).length >= 10;
}

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

  // Phone & consent state
  const [phoneDisplay, setPhoneDisplay] = useState('');
  const [consent, setConsent] = useState(false);
  const [phoneError, setPhoneError] = useState('');
  const [consentError, setConsentError] = useState('');
  const [sessionPhone, setSessionPhone] = useState('');

  // Validation
  const isPhoneValid = phoneDisplay.length > 0 && isValidPhone(phoneDisplay);
  const isFormValid = isPhoneValid && consent;

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    // Allow typing digits and + only
    if (!/^[\d\s\-\(\)\+\.]*$/.test(raw)) return;
    
    const formatted = formatPhoneDisplay(raw);
    setPhoneDisplay(formatted);
    setPhoneError('');
  };

  const handleInvoke = () => {
    setPhoneError('');
    setConsentError('');

    if (!isValidPhone(phoneDisplay)) {
      setPhoneError('Enter a valid phone number (include country code).');
      return;
    }

    if (!consent) {
      setConsentError('Consent is required.');
      return;
    }

    const normalized = normalizePhone(phoneDisplay);
    setSessionPhone(normalized);
    setShowDemo(true);
  };

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
          <p className="text-lg sm:text-xl text-slate-400 mb-8 max-w-xl mx-auto leading-relaxed">
            Get tasks done, set reminders, plan your day, and coordinate with others — all through text.
          </p>

          {/* Phone Input */}
          <div className="max-w-md mx-auto mb-4">
            <input
              type="tel"
              value={phoneDisplay}
              onChange={handlePhoneChange}
              placeholder="+1 (415) 555-0123"
              className="w-full px-4 py-3 bg-slate-900 border border-slate-800 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center"
            />
            {phoneError && (
              <p className="mt-2 text-sm text-red-400">{phoneError}</p>
            )}
          </div>

          {/* Consent Checkbox */}
          <div className="max-w-md mx-auto mb-8 text-left">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => {
                  setConsent(e.target.checked);
                  setConsentError('');
                }}
                className="mt-1 w-4 h-4 rounded border-slate-700 bg-slate-900 text-blue-500 focus:ring-blue-500"
              />
              <span className="text-sm text-slate-400">
                I agree to receive texts from Invoke. Msg & data rates may apply. Reply STOP to cancel.{' '}
                <Link href="/privacy" className="text-blue-400 hover:underline">Privacy</Link> +{' '}
                <Link href="/terms" className="text-blue-400 hover:underline">Terms</Link>.
              </span>
            </label>
            {consentError && (
              <p className="mt-2 text-sm text-red-400">{consentError}</p>
            )}
          </div>

          <button
            onClick={handleInvoke}
            disabled={!isFormValid}
            className="w-full max-w-md mx-auto px-8 py-4 text-base font-medium text-slate-950 bg-white rounded-lg hover:bg-slate-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                <div className="text-right">
                  <span className="text-slate-400 text-xs block">Session</span>
                  <span className="text-slate-300 text-[10px]">{sessionPhone}</span>
                </div>
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
              // Keep phone and consent values
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
