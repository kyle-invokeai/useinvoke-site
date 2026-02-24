'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface WaitlistUser {
  id: string;
  phone: string;
  source: string;
  status: string;
  interest_category: number | null;
  created_at: string;
}

interface Message {
  id: string;
  phone: string;
  direction: 'inbound' | 'outbound';
  body: string;
  channel: string;
  created_at: string;
}

const CATEGORY_NAMES: Record<number, string> = {
  1: 'Tasks',
  2: 'Reminders',
  3: 'Planning',
  4: 'Money',
  5: 'Coordination',
  6: 'Something else',
};

function maskPhone(phone: string): string {
  if (phone.length < 8) return phone;
  return phone.slice(0, 4) + '***' + phone.slice(-4);
}

export default function AdminPage() {
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [waitlistCount, setWaitlistCount] = useState(0);
  const [recentSignups, setRecentSignups] = useState<WaitlistUser[]>([]);
  const [recentMessages, setRecentMessages] = useState<Message[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const checkPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      if (response.ok) {
        setIsAuthenticated(true);
        localStorage.setItem('invoke_admin_auth', password);
        loadData();
      } else {
        setError('Invalid password');
      }
    } catch (err) {
      setError('Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const loadData = async () => {
    setRefreshing(true);
    try {
      const [statsRes, signupsRes, messagesRes] = await Promise.all([
        fetch('/api/admin/stats'),
        fetch('/api/admin/signups'),
        fetch('/api/admin/messages'),
      ]);

      if (statsRes.ok) {
        const stats = await statsRes.json();
        setWaitlistCount(stats.count);
      }

      if (signupsRes.ok) {
        const signups = await signupsRes.json();
        setRecentSignups(signups.users || []);
      }

      if (messagesRes.ok) {
        const messages = await messagesRes.json();
        setRecentMessages(messages.messages || []);
      }
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setRefreshing(false);
    }
  };

  // Check for stored password on mount
  useEffect(() => {
    const stored = localStorage.getItem('invoke_admin_auth');
    if (stored) {
      setPassword(stored);
      // Auto-authenticate
      fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: stored }),
      }).then(res => {
        if (res.ok) {
          setIsAuthenticated(true);
          loadData();
        }
      });
    }
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <Link href="/" className="text-3xl font-bold text-white tracking-tight">Invoke</Link>
            <p className="mt-2 text-slate-400">Admin Dashboard</p>
          </div>

          <form onSubmit={checkPassword} className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Admin Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter admin password"
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            
            {error && (
              <p className="mt-3 text-sm text-red-400">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-4 px-4 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-500 transition-colors disabled:opacity-50"
            >
              {loading ? 'Authenticating...' : 'Access Dashboard'}
            </button>
          </form>

          <p className="mt-4 text-center text-sm text-slate-500">
            <Link href="/" className="hover:text-slate-300">← Back to home</Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      {/* Header */}
      <header className="bg-slate-900 border-b border-slate-800 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-2xl font-bold text-white tracking-tight">Invoke</Link>
            <span className="text-slate-500">|</span>
            <span className="text-slate-400">Admin Dashboard</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={loadData}
              disabled={refreshing}
              className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {refreshing ? (
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              ) : (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              )}
              Refresh
            </button>
            <button
              onClick={() => {
                localStorage.removeItem('invoke_admin_auth');
                setIsAuthenticated(false);
                setPassword('');
              }}
              className="text-sm text-slate-400 hover:text-white"
            >
              Log out
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <p className="text-sm text-slate-400">Waitlist Count</p>
            <p className="text-3xl font-bold text-white mt-1">{waitlistCount.toLocaleString()}</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <p className="text-sm text-slate-400">Recent Signups</p>
            <p className="text-3xl font-bold text-white mt-1">{recentSignups.length}</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <p className="text-sm text-slate-400">Recent Messages</p>
            <p className="text-3xl font-bold text-white mt-1">{recentMessages.length}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Signups */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
              <h2 className="font-semibold text-white">Recent Signups</h2>
              <span className="text-xs text-slate-500">Last 20</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-800/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-400">Phone</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-400">Source</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-400">Category</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-400">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {recentSignups.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-800/30">
                      <td className="px-4 py-3 text-sm font-mono text-slate-300">
                        {maskPhone(user.phone)}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-400">{user.source}</td>
                      <td className="px-4 py-3 text-sm text-slate-400">
                        {user.interest_category ? CATEGORY_NAMES[user.interest_category] : '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-500">
                        {formatDate(user.created_at)}
                      </td>
                    </tr>
                  ))}
                  {recentSignups.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                        No signups yet
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent Messages */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
              <h2 className="font-semibold text-white">Recent Messages</h2>
              <span className="text-xs text-slate-500">Last 20</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-800/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-400">Direction</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-400">From</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-400">Message</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-400">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {recentMessages.map((msg) => (
                    <tr key={msg.id} className="hover:bg-slate-800/30">
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                          msg.direction === 'inbound' 
                            ? 'bg-blue-500/20 text-blue-400' 
                            : 'bg-green-500/20 text-green-400'
                        }`}>
                          {msg.direction === 'inbound' ? 'In' : 'Out'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm font-mono text-slate-400">
                        {maskPhone(msg.phone)}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-300 max-w-xs truncate">
                        {msg.body}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-500">
                        {formatDate(msg.created_at)}
                      </td>
                    </tr>
                  ))}
                  {recentMessages.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                        No messages yet
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
