'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// E.164 phone validation and formatting
function formatToE164(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 11 && digits.startsWith('1')) {
    return `+${digits}`;
  }
  if (digits.length === 10) {
    return `+1${digits}`;
  }
  if (phone.startsWith('+')) {
    return phone;
  }
  return `+${digits}`;
}

function isValidE164(phone: string): boolean {
  return /^\+[1-9]\d{1,14}$/.test(phone);
}

function isValidPhoneInput(phone: string): boolean {
  const digits = phone.replace(/\D/g, '');
  return digits.length >= 10 && digits.length <= 15;
}

export default function Home() {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isValid = useMemo(() => {
    return isValidPhoneInput(phone) && consent;
  }, [phone, consent]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!isValidPhoneInput(phone)) {
      setError('Please enter a valid phone number');
      return;
    }

    if (!consent) {
      setError('Please agree to receive text messages');
      return;
    }

    const normalizedPhone = formatToE164(phone);
    
    if (!isValidE164(normalizedPhone)) {
      setError('Invalid phone number format');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: normalizedPhone, consent }),
      });

      const data = await response.json();

      if (!data.ok) {
        setError(data.error || 'Something went wrong. Please try again.');
      } else {
        router.push(`/demo?phone=${encodeURIComponent(normalizedPhone)}`);
      }
    } catch (err) {
      setError('Failed to join waitlist. Please try again.');
    } finally {
      setLoading(false);
    }
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

      {/* Hero Section */}
      <section className="min-h-screen flex items-center justify-center pt-20 pb-16 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-6 leading-tight tracking-tight">
            Your direct line to Invoke.
          </h1>
          <p className="text-lg sm:text-xl text-slate-400 mb-12 max-w-xl mx-auto leading-relaxed">
            Get tasks done, set reminders, plan your day, and coordinate with others — all through text.
          </p>

          {/* Waitlist Form */}
          <form onSubmit={handleSubmit} className="max-w-md mx-auto">
            <div className="space-y-4">
              <div>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Enter your phone number"
                  className="w-full px-4 py-4 bg-slate-900 border border-slate-800 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
                <p className="mt-2 text-sm text-slate-500 text-left">
                  Example: +1 415 555 0123
                </p>
              </div>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  className="mt-1 w-4 h-4 rounded border-slate-700 bg-slate-900 text-blue-500 focus:ring-blue-500"
                />
                <span className="text-sm text-slate-400 text-left">
                  I agree to receive text messages from Invoke. Message & data rates may apply. 
                  Reply STOP to cancel, HELP for assistance. See{' '}
                  <Link href="/privacy" className="text-blue-400 hover:underline">Privacy Policy</Link> and{' '}
                  <Link href="/terms" className="text-blue-400 hover:underline">Terms</Link>.
                </span>
              </label>

              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <p className="text-sm text-red-400">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={!isValid || loading}
                className="w-full px-8 py-4 text-base font-medium text-slate-950 bg-white rounded-lg hover:bg-slate-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Joining...' : 'Join the waitlist'}
              </button>
            </div>
          </form>

          <p className="mt-8 text-sm text-slate-500">
            Limited early access. Launching soon.
          </p>
        </div>
      </section>
    </main>
  );
}
