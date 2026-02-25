'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Send } from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

interface Message {
  id: string;
  direction: 'inbound' | 'outbound';
  body: string;
  timestamp: Date;
  isDraft?: boolean;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function formatPhoneNumber(value: string, countryCode: string): string {
  const digits = value.replace(/\D/g, '');
  
  if (countryCode === '+1') {
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
  }
  return digits.replace(/(\d{3})(?=\d)/g, '$1 ').trim();
}

function getCurrentTime(): string {
  return new Date().toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function getCurrentDate(): string {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

// ============================================================================
// iPHONE COMPONENT (CSS-RENDERED)
// ============================================================================

function IPhoneFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative" style={{ perspective: '1200px' }}>
      <div 
        className="relative mx-auto overflow-hidden"
        style={{
          width: 'clamp(320px, 90vw, 390px)',
          height: 'clamp(680px, 85vh, 844px)',
          borderRadius: '54px',
          background: 'linear-gradient(145deg, #1a1a1a 0%, #0d0d0d 50%, #1a1a1a 100%)',
          boxShadow: `
            0 0 0 2px #2a2a2a,
            0 0 0 4px #1a1a1a,
            0 25px 80px -20px rgba(0,0,0,0.6),
            0 50px 120px -40px rgba(0,0,0,0.4)
          `,
          transformStyle: 'preserve-3d',
        }}
      >
        <div 
          className="absolute inset-2 overflow-hidden"
          style={{
            borderRadius: '46px',
            background: '#000',
            boxShadow: 'inset 0 0 20px rgba(0,0,0,0.5)',
          }}
        >
          <div className="relative w-full h-full overflow-hidden" style={{ borderRadius: '44px' }}>
            {children}
          </div>
          <div 
            className="absolute top-3 left-1/2 -translate-x-1/2 z-50"
            style={{
              width: '120px',
              height: '35px',
              borderRadius: '20px',
              background: '#000',
              boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
            }}
          />
          <div 
            className="absolute inset-0 pointer-events-none z-40"
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, transparent 40%, transparent 60%, rgba(255,255,255,0.01) 100%)',
              borderRadius: '44px',
            }}
          />
        </div>
        <div className="absolute -left-1 top-28 w-1 h-16 rounded-l bg-[#1a1a1a]" />
        <div className="absolute -left-1 top-48 w-1 h-12 rounded-l bg-[#1a1a1a]" />
        <div className="absolute -right-1 top-36 w-1 h-20 rounded-r bg-[#1a1a1a]" />
      </div>
    </div>
  );
}

// ============================================================================
// LOCK SCREEN COMPONENT
// ============================================================================

function LockScreen({ onUnlock }: { onUnlock: () => void }) {
  const [time, setTime] = useState(getCurrentTime());
  const [date, setDate] = useState(getCurrentDate());
  const [showNotification, setShowNotification] = useState(false);
  const [vibrate, setVibrate] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(getCurrentTime());
      setDate(getCurrentDate());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const vibrateTimer = setTimeout(() => {
      setVibrate(true);
      setTimeout(() => setVibrate(false), 400);
    }, 300);
    const notificationTimer = setTimeout(() => {
      setShowNotification(true);
    }, 800);
    return () => {
      clearTimeout(vibrateTimer);
      clearTimeout(notificationTimer);
    };
  }, []);

  return (
    <motion.div
      className="relative w-full h-full overflow-hidden cursor-pointer"
      style={{
        background: 'linear-gradient(180deg, #1a1a2e 0%, #16213e 50%, #0f0f23 100%)',
      }}
      animate={vibrate ? { x: [-2, 2, -2, 2, 0] } : {}}
      transition={{ duration: 0.4 }}
      onClick={onUnlock}
    >
      <div 
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at 50% 0%, rgba(100,100,150,0.15) 0%, transparent 50%)',
        }}
      />
      <div className="absolute top-2 left-0 right-0 flex justify-between items-center px-8 pt-2 text-white text-xs font-medium z-20">
        <span>{time}</span>
        <div className="flex items-center gap-1.5">
          <div className="flex gap-0.5">
            <div className="w-1 h-2.5 bg-white rounded-sm" />
            <div className="w-1 h-2.5 bg-white rounded-sm" />
            <div className="w-1 h-2.5 bg-white rounded-sm" />
            <div className="w-1 h-2.5 bg-white/40 rounded-sm" />
          </div>
          <div className="w-6 h-3 border border-white/40 rounded-sm flex items-center px-0.5">
            <div className="w-4 h-1.5 bg-white rounded-sm" />
          </div>
        </div>
      </div>
      <div className="absolute top-20 left-1/2 -translate-x-1/2">
        <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
      </div>
      <div className="absolute top-32 left-0 right-0 text-center">
        <motion.h1 
          className="text-7xl font-light text-white tracking-tight"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          {time.replace(/\s*(AM|PM)/i, '')}
        </motion.h1>
        <motion.p 
          className="mt-2 text-lg text-white/80 font-medium"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.4 }}
        >
          {date}
        </motion.p>
      </div>
      <AnimatePresence>
        {showNotification && (
          <motion.div
            className="absolute top-56 left-4 right-4"
            initial={{ y: -100, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -100, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25, delay: 0.1 }}
          >
            <div 
              className="p-4 rounded-2xl backdrop-blur-xl"
              style={{
                background: 'rgba(255,255,255,0.12)',
                border: '1px solid rgba(255,255,255,0.1)',
                boxShadow: '0 4px 30px rgba(0,0,0,0.2)',
              }}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                  <span className="text-white text-xs font-bold">In</span>
                </div>
                <div className="flex-1">
                  <p className="text-white text-sm font-semibold">Invoke</p>
                  <p className="text-white/60 text-xs">now</p>
                </div>
              </div>
              <p className="text-white text-base">You're connected.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <motion.div 
        className="absolute bottom-12 left-0 right-0 text-center"
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      >
        <p className="text-white/60 text-sm font-medium">Swipe up to unlock</p>
      </motion.div>
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1 bg-white/50 rounded-full" />
    </motion.div>
  );
}

// ============================================================================
// MESSAGES APP COMPONENT
// ============================================================================

function MessagesApp({ firstName }: { firstName: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [showTyping, setShowTyping] = useState(false);
  const [showChips, setShowChips] = useState(false);
  const [showMattFlow, setShowMattFlow] = useState(false);
  const [showDelivered, setShowDelivered] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const chatScript = [
    `Hi ${firstName}.`,
    "I'm your Invoke node.",
    "You can route anything through me.",
    "What would you like to invoke?",
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, showTyping, showChips]);

  useEffect(() => {
    if (currentStep >= chatScript.length) {
      setShowChips(true);
      return;
    }
    const timer = setTimeout(() => {
      setShowTyping(true);
      const messageTimer = setTimeout(() => {
        setShowTyping(false);
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          direction: 'outbound',
          body: chatScript[currentStep],
          timestamp: new Date(),
        }]);
        setCurrentStep(prev => prev + 1);
      }, 1800);
      return () => clearTimeout(messageTimer);
    }, currentStep === 0 ? 500 : 1200);
    return () => clearTimeout(timer);
  }, [currentStep, firstName]);

  const handleChipClick = (chip: string) => {
    setShowChips(false);
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      direction: 'inbound',
      body: chip,
      timestamp: new Date(),
    }]);
    if (chip === 'reach someone') {
      setTimeout(() => {
        setShowTyping(true);
        setTimeout(() => {
          setShowTyping(false);
          setMessages(prev => [...prev, {
            id: Date.now().toString(),
            direction: 'outbound',
            body: 'Who should I connect you to?',
            timestamp: new Date(),
          }]);
          setTimeout(() => setShowMattFlow(true), 500);
        }, 1500);
      }, 400);
    }
  };

  const handleMattClick = () => {
    setShowMattFlow(false);
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      direction: 'inbound',
      body: 'Text Matt about AI commissioner rules.',
      timestamp: new Date(),
    }]);
    const sequence = [
      { msg: 'Adding Matt.', delay: 800 },
      { msg: 'Drafting message.', delay: 1500 },
      { msg: 'Hey Matt — want to lock in AI commissioner rules for this season this week?', delay: 2000, isDraft: true },
      { msg: 'Send?', delay: 2500 },
    ];
    let cumulativeDelay = 600;
    sequence.forEach(({ msg, delay, isDraft }) => {
      cumulativeDelay += delay;
      setTimeout(() => {
        setShowTyping(true);
        setTimeout(() => {
          setShowTyping(false);
          setMessages(prev => [...prev, {
            id: Date.now().toString(),
            direction: isDraft ? 'inbound' : 'outbound',
            body: msg,
            timestamp: new Date(),
            isDraft,
          }]);
          if (msg === 'Send?') {
            setTimeout(() => setShowDelivered(true), 300);
          }
        }, isDraft ? 1200 : 800);
      }, cumulativeDelay);
    });
  };

  const handleSend = () => {
    setShowDelivered(false);
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      direction: 'inbound',
      body: 'Send',
      timestamp: new Date(),
    }]);
    setTimeout(() => {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        direction: 'outbound',
        body: 'Delivered.',
        timestamp: new Date(),
      }]);
      setTimeout(() => {
        setShowTyping(true);
        setTimeout(() => {
          setShowTyping(false);
          setMessages(prev => [...prev, {
            id: Date.now().toString(),
            direction: 'outbound',
            body: 'Anything else?',
            timestamp: new Date(),
          }]);
        }, 1200);
      }, 600);
    }, 400);
  };

  return (
    <div className="flex flex-col h-full bg-black">
      <div className="flex items-center justify-center px-4 pt-12 pb-3 bg-[#1a1a1a]/80 backdrop-blur-xl border-b border-white/5">
        <div className="text-center">
          <div className="w-8 h-8 mx-auto mb-1 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
            <span className="text-white text-xs font-bold">In</span>
          </div>
          <p className="text-white text-sm font-semibold">Invoke</p>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.map((message) => (
          <motion.div
            key={message.id}
            className={`flex ${message.direction === 'inbound' ? 'justify-end' : 'justify-start'}`}
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            <div
              className={`max-w-[75%] px-4 py-2.5 text-[15px] leading-relaxed ${
                message.direction === 'inbound'
                  ? 'bg-[#34c759] text-black rounded-2xl rounded-br-md'
                  : 'bg-[#3a3a3c] text-white rounded-2xl rounded-bl-md'
              }`}
            >
              {message.body}
              {message.isDraft && (
                <div className="mt-2 pt-2 border-t border-black/10">
                  <button
                    onClick={handleSend}
                    className="px-4 py-1.5 bg-black/10 hover:bg-black/20 rounded-full text-sm font-medium transition-colors"
                  >
                    Send
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        ))}
        <AnimatePresence>
          {showTyping && (
            <motion.div
              className="flex justify-start"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <div className="bg-[#3a3a3c] rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-1">
                {[0, 1, 2].map((i) => (
                  <motion.span
                    key={i}
                    className="w-1.5 h-1.5 bg-white/60 rounded-full"
                    animate={{ y: [0, -4, 0], opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.15, ease: 'easeInOut' }}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <AnimatePresence>
          {showDelivered && !showTyping && (
            <motion.p
              className="text-[11px] text-white/40 text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              Delivered
            </motion.p>
          )}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>
      <AnimatePresence>
        {showChips && !showMattFlow && (
          <motion.div
            className="px-4 pb-4 space-y-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            {['reach someone', 'schedule something', 'research something'].map((chip, i) => (
              <motion.button
                key={chip}
                onClick={() => handleChipClick(chip)}
                className="block w-full text-left px-4 py-3 bg-[#2c2c2e] hover:bg-[#3a3a3c] text-white/90 rounded-xl text-sm transition-colors"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1, duration: 0.3 }}
                whileTap={{ scale: 0.98 }}
              >
                {chip}
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showMattFlow && (
          <motion.div
            className="px-4 pb-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
          >
            <button
              onClick={handleMattClick}
              className="block w-full text-left px-4 py-3 bg-[#2c2c2e] hover:bg-[#3a3a3c] text-white/90 rounded-xl text-sm transition-colors"
            >
              Text Matt about AI commissioner rules.
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="px-4 pb-8 pt-2 bg-[#1a1a1a]">
        <div className="flex items-center gap-2 bg-[#2c2c2e] rounded-full px-4 py-2">
          <div className="flex-1 text-white/40 text-sm">iMessage</div>
          <button className="w-8 h-8 bg-[#34c759] rounded-full flex items-center justify-center">
            <Send className="w-4 h-4 text-black" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// LANDING PAGE COMPONENT
// ============================================================================

function LandingPage({
  firstName,
  setFirstName,
  phone,
  setPhone,
  countryCode,
  setCountryCode,
  consent,
  setConsent,
  onInvoke,
  isTransitioning,
}: {
  firstName: string;
  setFirstName: (v: string) => void;
  phone: string;
  setPhone: (v: string) => void;
  countryCode: string;
  setCountryCode: (v: string) => void;
  consent: boolean;
  setConsent: (v: boolean) => void;
  onInvoke: () => void;
  isTransitioning: boolean;
}) {
  const [errors, setErrors] = useState({ firstName: '', phone: '', consent: '' });

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value, countryCode);
    setPhone(formatted);
  };

  const handleInvoke = () => {
    const newErrors = {
      firstName: !firstName.trim() ? 'First name required' : '',
      phone: !phone.trim() || phone.replace(/\D/g, '').length < 10 ? 'Valid phone required' : '',
      consent: !consent ? 'Consent required to continue' : '',
    };
    setErrors(newErrors);
    if (!newErrors.firstName && !newErrors.phone && !newErrors.consent) {
      onInvoke();
    }
  };

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center px-6 transition-all duration-700 ${isTransitioning ? 'blur-md opacity-30 scale-95' : ''}`}>
      <motion.div
        className="mb-12"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white tracking-tight">Invoke</h1>
      </motion.div>
      <motion.div
        className="w-full max-w-sm space-y-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
      >
        <div>
          <input
            type="text"
            placeholder="First Name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="w-full px-4 py-3.5 bg-gray-100 dark:bg-gray-800 rounded-xl text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-600 transition-all"
          />
          {errors.firstName && <p className="mt-1 text-xs text-red-500">{errors.firstName}</p>}
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <select
              value={countryCode}
              onChange={(e) => setCountryCode(e.target.value)}
              className="appearance-none px-3 py-3.5 bg-gray-100 dark:bg-gray-800 rounded-xl text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-600 transition-all pr-8 cursor-pointer"
            >
              <option value="+1">+1</option>
              <option value="+44">+44</option>
              <option value="+61">+61</option>
              <option value="+81">+81</option>
              <option value="+49">+49</option>
              <option value="+33">+33</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
          <input
            type="tel"
            placeholder="(949) 500-1553"
            value={phone}
            onChange={handlePhoneChange}
            className="flex-1 px-4 py-3.5 bg-gray-100 dark:bg-gray-800 rounded-xl text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-600 transition-all"
          />
        </div>
        {errors.phone && <p className="text-xs text-red-500">{errors.phone}</p>}
        
        {/* Consent Checkbox */}
        <div className="pt-2">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => {
                setConsent(e.target.checked);
                if (e.target.checked) setErrors(prev => ({ ...prev, consent: '' }));
              }}
              className="mt-1 w-4 h-4 rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-blue-600 focus:ring-blue-500 shrink-0"
            />
            <span className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
              I agree to receive texts from Invoke. Msg & data rates may apply. Reply STOP to cancel.{' '}
              <a href="/privacy" className="text-blue-500 hover:underline">Privacy</a> +{' '}
              <a href="/terms" className="text-blue-500 hover:underline">Terms</a>.
            </span>
          </label>
          {errors.consent && <p className="mt-1 text-xs text-red-500">{errors.consent}</p>}
        </div>

        <motion.button
          onClick={handleInvoke}
          disabled={!firstName.trim() || !phone.trim() || phone.replace(/\D/g, '').length < 10 || !consent}
          className="w-full mt-4 py-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-full font-medium text-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          transition={{ duration: 0.15 }}
        >
          //invoke
        </motion.button>
        <p className="text-center text-xs text-gray-400 dark:text-gray-500">
          invokes a live demo message
        </p>
      </motion.div>
    </div>
  );
}

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================

export default function InvokeDemo() {
  const [step, setStep] = useState<'landing' | 'transition' | 'lock-screen' | 'unlocking' | 'messages'>('landing');
  const [firstName, setFirstName] = useState('');
  const [phone, setPhone] = useState('');
  const [countryCode, setCountryCode] = useState('+1');
  const [consent, setConsent] = useState(false);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setIsDark(mediaQuery.matches);
    const handler = (e: MediaQueryListEvent) => setIsDark(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  const handleInvoke = () => {
    setStep('transition');
    setTimeout(() => {
      setStep('lock-screen');
    }, 1200);
  };

  const handleUnlock = () => {
    setStep('unlocking');
    setTimeout(() => {
      setStep('messages');
    }, 900);
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDark ? 'bg-gray-950' : 'bg-gray-50'}`}>
      <AnimatePresence mode="wait">
        {step === 'landing' && (
          <LandingPage
            firstName={firstName}
            setFirstName={setFirstName}
            phone={phone}
            setPhone={setPhone}
            countryCode={countryCode}
            setCountryCode={setCountryCode}
            consent={consent}
            setConsent={setConsent}
            onInvoke={handleInvoke}
            isTransitioning={false}
          />
        )}
      </AnimatePresence>
      {step !== 'landing' && (
        <motion.div
          className="fixed inset-0 z-40"
          style={{
            background: isDark ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.7)',
            backdropFilter: 'blur(12px)',
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        />
      )}
      <AnimatePresence>
        {step !== 'landing' && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center"
            initial={{ y: '120%', rotateX: 12, scale: 0.92, opacity: 0 }}
            animate={{ y: 0, rotateX: 0, scale: 1, opacity: 1 }}
            transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
          >
            <motion.div
              animate={step === 'lock-screen' || step === 'unlocking' ? {
                y: [0, -2, 0],
                rotateZ: [0, 0.5, 0, -0.5, 0],
              } : {}}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            >
              <IPhoneFrame>
                {step === 'lock-screen' || step === 'transition' ? (
                  <LockScreen key="lock" onUnlock={handleUnlock} />
                ) : step === 'unlocking' ? (
                  <motion.div
                    key="unlocking"
                    initial={{ scale: 1 }}
                    animate={{ scale: 1.1, filter: 'blur(20px)', opacity: 0 }}
                    transition={{ duration: 0.4 }}
                    className="w-full h-full"
                  >
                    <LockScreen onUnlock={() => {}} />
                  </motion.div>
                ) : (
                  <motion.div
                    key="messages"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                    className="w-full h-full"
                  >
                    <MessagesApp firstName={firstName} />
                  </motion.div>
                )}
              </IPhoneFrame>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
