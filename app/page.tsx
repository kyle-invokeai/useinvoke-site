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
          width: 'clamp(340px, 95vw, 415px)',
          height: 'clamp(720px, 90vh, 880px)',
          borderRadius: '54px',
          background: 'linear-gradient(145deg, #1a1a1a 0%, #0d0d0d 50%, #1a1a1a 100%)',
          boxShadow: `
            0 0 0 2px #2a2a2a,
            0 0 0 4px #1a1a1a,
            0 20px 60px -15px rgba(0,0,0,0.4),
            0 40px 80px -30px rgba(0,0,0,0.25)
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

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(getCurrentTime());
      setDate(getCurrentDate());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const notificationTimer = setTimeout(() => {
      setShowNotification(true);
    }, 800);
    return () => {
      clearTimeout(notificationTimer);
    };
  }, []);

  return (
    <motion.div
      className="relative w-full h-full overflow-hidden cursor-pointer"
      style={{
        background: 'linear-gradient(180deg, #1a1a2e 0%, #16213e 50%, #0f0f23 100%)',
      }}
      onClick={onUnlock}
    >
      <div 
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at 50% 0%, rgba(100,100,150,0.15) 0%, transparent 50%)',
        }}
      />
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
    </motion.div>
  );
}

// ============================================================================
// MESSAGES APP COMPONENT
// ============================================================================

function MessagesApp({ firstName, onComplete }: { firstName: string; onComplete?: () => void }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [showTyping, setShowTyping] = useState(false);
  const [showChips, setShowChips] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const chatScript = [
    `Hi ${firstName}.`,
    "This number is now live.",
    "What would you like to do?",
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
      }, 1600);
      return () => clearTimeout(messageTimer);
    }, currentStep === 0 ? 600 : 1400);
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
  };

  return (
    <div className="flex flex-col h-full bg-[#0a0a0a]">
      <div className="flex items-center justify-center px-4 pt-14 pb-3 bg-[#141414]/90 backdrop-blur-xl">
        <div className="text-center">
          <div className="w-7 h-7 mx-auto mb-1 rounded-full bg-[#28a745] flex items-center justify-center">
            <span className="text-white text-[10px] font-bold">In</span>
          </div>
          <p className="text-white/90 text-[13px] font-medium">Invoke</p>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-4">
        {messages.map((message) => (
          <motion.div
            key={message.id}
            className={`flex ${message.direction === 'inbound' ? 'justify-end' : 'justify-start'}`}
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          >
            <div
              className={`max-w-[72%] px-4 py-2.5 text-[15px] leading-snug ${
                message.direction === 'inbound'
                  ? 'bg-[#28a745] text-white rounded-[18px] rounded-br-[6px]'
                  : 'bg-[#2c2c2e] text-white/90 rounded-[18px] rounded-bl-[6px]'
              }`}
            >
              {message.body}
            </div>
          </motion.div>
        ))}
        <AnimatePresence>
          {showTyping && (
            <motion.div
              className="flex justify-start"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
            >
              <div className="bg-[#2c2c2e] rounded-[18px] rounded-bl-[6px] px-3.5 py-2.5 flex items-center gap-1">
                {[0, 1, 2].map((i) => (
                  <motion.span
                    key={i}
                    className="w-1.5 h-1.5 bg-white/50 rounded-full"
                    animate={{ y: [0, -3, 0], opacity: [0.4, 0.8, 0.4] }}
                    transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.12, ease: 'easeInOut' }}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <AnimatePresence>
          {showChips && (
            <motion.div
              className="flex flex-wrap gap-2 pt-2"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            >
              {['connect', 'schedule', 'research'].map((chip, i) => (
                <motion.button
                  key={chip}
                  onClick={() => handleChipClick(chip)}
                  className="px-4 py-2 bg-[#1c1c1e] hover:bg-[#2c2c2e] text-white/70 hover:text-white/90 rounded-full text-[13px] font-normal transition-colors"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08, duration: 0.25 }}
                  whileTap={{ scale: 0.96 }}
                >
                  {chip}
                </motion.button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>
      <div className="px-4 pb-8 pt-3 bg-[#0a0a0a]">
        <div className="flex items-center gap-2 bg-[#1c1c1e] rounded-full px-4 py-2.5">
          <div className="flex-1 text-white/30 text-[15px]">iMessage</div>
          <button className="w-7 h-7 bg-[#28a745] rounded-full flex items-center justify-center">
            <Send className="w-3.5 h-3.5 text-white" />
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
  isDark,
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
  isDark: boolean;
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
    <div 
      className={`min-h-screen flex flex-col items-center justify-center px-6 transition-all duration-700 relative overflow-hidden ${isTransitioning ? 'blur-md opacity-30 scale-95' : ''}`}
      style={{
        background: isDark 
          ? 'radial-gradient(ellipse at center, #111827 0%, #030712 70%)'
          : 'radial-gradient(ellipse at center, #f9fafb 0%, #e5e7eb 70%)'
      }}
    >
      <motion.div
        className="mb-12 text-center"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white tracking-tight">Invoke</h1>
        <p className="mt-2 text-lg font-light text-gray-500 dark:text-gray-400 lowercase">invoke anything.</p>
      </motion.div>
      <motion.div
        className="w-full max-w-sm space-y-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
      >
        <p className="text-center text-xs text-gray-400 dark:text-gray-500 tracking-wide">
          joining the founding waitlist
        </p>
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
    }, 800);
  };

  const handleUnlock = () => {
    setStep('unlocking');
    setTimeout(() => {
      setStep('messages');
    }, 600);
  };

  // Auto-unlock after 1500ms hold on lock screen
  useEffect(() => {
    if (step === 'lock-screen') {
      const timer = setTimeout(() => {
        handleUnlock();
      }, 2300); // 800ms (notification) + 1500ms hold
      return () => clearTimeout(timer);
    }
  }, [step]);

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
            isDark={isDark}
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
                    animate={{ scale: 1.08, filter: 'blur(16px)', opacity: 0 }}
                    transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
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
