'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function Home() {
  const [phone, setPhone] = useState('');
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [submittedPhone, setSubmittedPhone] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!phone) {
      setError('Please enter your phone number');
      return;
    }

    if (!consent) {
      setError('Please agree to receive text messages');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, consent }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Something went wrong. Please try again.');
      } else {
        setSubmitted(true);
        setSubmittedPhone(data.phone || phone);
      }
    } catch (err) {
      setError('Failed to join waitlist. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Normalize phone for preview link
  const getPreviewLink = () => {
    let normalized = submittedPhone || phone;
    if (!normalized.startsWith('+')) {
      normalized = '+1' + normalized.replace(/\D/g, '');
    }
    return `/preview?phone=${encodeURIComponent(normalized)}`;
  };

  if (submitted) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-200">
        <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-slate-800">
          <div className="max-w-6xl mx-auto px-6 py-4">
            <Link href="/" className="text-2xl font-bold text-white tracking-tight">Invoke</Link>
          </div>
        </nav>

        <section className="min-h-screen flex items-center justify-center pt-20 pb-16 px-6">
          <div className="max-w-xl mx-auto text-center">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-white mb-4">You're on the list!</h1>
            <p className="text-slate-400 mb-8">
              We'll text you when your spot opens. Want to try Invoke now?
            </p>
            <Link
              href={getPreviewLink()}
              className="inline-flex items-center justify-center px-8 py-4 text-base font-medium text-slate-950 bg-white rounded-lg hover:bg-slate-100 transition-colors"
            >
              Preview Invoke →
            </Link>
            <p className="mt-6 text-sm text-slate-500">
              Or just text <strong>//invoke</strong> to our number when we launch
            </p>
          </div>
        </section>
      </main>
    );
  }

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
            This is your direct line to Invoke — no app required.
          </h1>
          <p className="text-lg sm:text-xl text-slate-400 mb-12 max-w-xl mx-auto leading-relaxed">
            Get tasks done, set reminders, plan your day, and coordinate with others. All through text.
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
                  I agree to receive text messages from Invoke. Message and data rates may apply. 
                  Reply STOP to cancel, HELP for assistance. See our{' '}
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
                disabled={loading}
                className="w-full px-8 py-4 text-base font-medium text-slate-950 bg-white rounded-lg hover:bg-slate-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Joining...' : 'Join the waitlist'}
              </button>
            </div>
          </form>

          <p className="mt-8 text-sm text-slate-500">
            Limited early access. Launching soon.
          </p>

          {/* Demo Option */}
          <div className="mt-6 pt-6 border-t border-slate-800">
            <p className="text-sm text-slate-400 mb-3">Want to try it first?</p>
            <Link
              href="/preview?phone=%2B19999999999"
              className="inline-flex items-center justify-center px-6 py-3 text-sm font-medium text-slate-300 bg-slate-800 border border-slate-700 rounded-lg hover:bg-slate-700 transition-colors"
            >
              Try Demo (no signup required)
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6 border-t border-slate-800">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-white mb-12 text-center">What you can invoke</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-2">Tasks</h3>
              <p className="text-slate-400 text-sm">"Add milk to my grocery list" or "Remind me to call mom tomorrow"</p>
            </div>
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-2">Reminders</h3>
              <p className="text-slate-400 text-sm">Smart nudges based on your schedule and priorities</p>
            </div>
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-2">Planning</h3>
              <p className="text-slate-400 text-sm">Break down projects, set deadlines, track progress</p>
            </div>
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-2">Coordination</h3>
              <p className="text-slate-400 text-sm">Schedule with others, share updates, keep everyone aligned</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-8">
              <Link href="/privacy" className="text-sm text-slate-400 hover:text-white transition-colors">Privacy Policy</Link>
              <Link href="/terms" className="text-sm text-slate-400 hover:text-white transition-colors">Terms of Service</Link>
            </div>
            <p className="text-sm text-slate-500">
              <a href="mailto:support@useinvoke.ai" className="hover:text-slate-300 transition-colors">support@useinvoke.ai</a>
            </p>
            <p className="text-sm text-slate-600">&copy; 2026 Invoke. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </main>
  );
}
