'use client';

import { useState, useEffect } from 'react';

interface MetricsData {
  h24: string;
  d7: string;
  visitors24h: number;
  visitors7d: number;
  newUsers24h: number;
  newUsers7d: number;
  consented24h: number;
  consented7d: number;
  activeSessions: number;
  invokes24h: number;
  invokes7d: number;
  errors24h: number;
  errors7d: number;
  latencyP50: number | null;
  latencyP95: number | null;
  tokens24h: number;
  tokens7d: number;
  cost24h: number;
  cost7d: number;
  topAgents: { agent: string; count: number }[];
  topReferrers: { referrer_id: string; count: number }[];
  recentErrors: { ts: string; event_type: string; channel: string; meta: any }[];
  recentUsers: { id: string; phone_hash: string | null; country: string | null; consent_status: string; created_at: string; first_seen_at: string | null; last_seen_at: string | null }[];
}

function formatNumber(n: number): string {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return n.toString();
}

function formatLatency(ms: number | null): string {
  if (ms === null) return '-';
  if (ms < 1000) return `${Math.round(ms)}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function formatCurrency(n: number): string {
  return `$${n.toFixed(2)}`;
}

function MetricCard({ 
  title, 
  value24h, 
  value7d, 
  format = 'number' 
}: { 
  title: string; 
  value24h: number; 
  value7d: number; 
  format?: 'number' | 'latency' | 'currency';
}) {
  const formatter = format === 'latency' ? formatLatency : format === 'currency' ? formatCurrency : formatNumber;
  
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
      <h3 className="text-sm text-slate-400 mb-2">{title}</h3>
      <div className="flex items-baseline gap-3">
        <span className="text-2xl font-semibold text-white">{formatter(value24h)}</span>
        <span className="text-xs text-slate-500">24h</span>
      </div>
      <div className="flex items-baseline gap-3 mt-1">
        <span className="text-sm text-slate-300">{formatter(value7d)}</span>
        <span className="text-xs text-slate-500">7d</span>
      </div>
    </div>
  );
}

function SimpleMetricCard({ title, value }: { title: string; value: string | number }) {
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
      <h3 className="text-sm text-slate-400 mb-2">{title}</h3>
      <span className="text-2xl font-semibold text-white">{value}</span>
    </div>
  );
}

export default function AdminPage() {
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 60000);
    return () => clearInterval(interval);
  }, []);

  async function fetchMetrics() {
    try {
      const res = await fetch('/api/admin/metrics');
      if (!res.ok) throw new Error('Failed to load metrics');
      const data = await res.json();
      if (data.ok) {
        setMetrics(data.metrics);
      } else {
        setError(data.error || 'Unknown error');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load metrics');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-slate-400">Loading metrics...</div>
      </div>
    );
  }

  if (error || !metrics) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-red-400">Error: {error || 'No data available'}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Invoke Admin</h1>
            <p className="text-sm text-slate-500 mt-1">Privacy-safe analytics dashboard</p>
          </div>
          <div className="text-xs text-slate-500">
            Last updated: {new Date().toLocaleTimeString()}
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 mb-8">
          <MetricCard title="Visitors" value24h={metrics.visitors24h} value7d={metrics.visitors7d} />
          <MetricCard title="New Users" value24h={metrics.newUsers24h} value7d={metrics.newUsers7d} />
          <MetricCard title="Consented" value24h={metrics.consented24h} value7d={metrics.consented7d} />
          <SimpleMetricCard title="Active Sessions" value={metrics.activeSessions} />
          <MetricCard title="Invokes" value24h={metrics.invokes24h} value7d={metrics.invokes7d} />
          <MetricCard title="Errors" value24h={metrics.errors24h} value7d={metrics.errors7d} />
          <MetricCard title="P50 Latency" value24h={metrics.latencyP50 || 0} value7d={metrics.latencyP95 || 0} format="latency" />
          <MetricCard title="Token Burn" value24h={metrics.tokens24h} value7d={metrics.tokens7d} />
          <MetricCard title="Est. Cost" value24h={metrics.cost24h} value7d={metrics.cost7d} format="currency" />
        </div>

        {/* Drilldown Tables */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Top Agents */}
          <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-700">
              <h3 className="text-sm font-medium text-white">Top Agents (7d)</h3>
            </div>
            <div className="divide-y divide-slate-700">
              {metrics.topAgents.length === 0 ? (
                <div className="px-4 py-3 text-sm text-slate-500">No data</div>
              ) : (
                metrics.topAgents.map((agent, i) => (
                  <div key={i} className="px-4 py-2 flex items-center justify-between">
                    <span className="text-sm text-slate-300 truncate">{agent.agent}</span>
                    <span className="text-sm text-slate-500">{formatNumber(agent.count)}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Top Referrers */}
          <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-700">
              <h3 className="text-sm font-medium text-white">Top Referrers</h3>
            </div>
            <div className="divide-y divide-slate-700">
              {metrics.topReferrers.length === 0 ? (
                <div className="px-4 py-3 text-sm text-slate-500">No data</div>
              ) : (
                metrics.topReferrers.map((ref, i) => (
                  <div key={i} className="px-4 py-2 flex items-center justify-between">
                    <span className="text-sm text-slate-300 font-mono truncate">
                      {ref.referrer_id.slice(0, 8)}...
                    </span>
                    <span className="text-sm text-slate-500">{ref.count} refs</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Recent Errors */}
          <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden md:col-span-2 lg:col-span-1">
            <div className="px-4 py-3 border-b border-slate-700">
              <h3 className="text-sm font-medium text-white">Recent Errors (Latest 20)</h3>
            </div>
            <div className="divide-y divide-slate-700 max-h-64 overflow-y-auto">
              {metrics.recentErrors.length === 0 ? (
                <div className="px-4 py-3 text-sm text-slate-500">No errors</div>
              ) : (
                metrics.recentErrors.map((err, i) => (
                  <div key={i} className="px-4 py-2">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-slate-500">{new Date(err.ts).toLocaleTimeString()}</span>
                      <span className="text-red-400">{err.event_type}</span>
                      <span className="text-slate-600">{err.channel}</span>
                    </div>
                    {err.meta?.error_code && (
                      <div className="text-xs text-slate-500 mt-0.5">
                        Code: {err.meta.error_code}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Recent Users Section */}
        <div className="mt-6 bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-700">
            <h3 className="text-sm font-medium text-white">Recent Users (Latest 20)</h3>
          </div>
          <div className="divide-y divide-slate-700 max-h-80 overflow-y-auto">
            {metrics.recentUsers.length === 0 ? (
              <div className="px-4 py-3 text-sm text-slate-500">No users yet</div>
            ) : (
              metrics.recentUsers.map((user, i) => (
                <div key={i} className="px-4 py-2 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-500 font-mono">{user.id.slice(0, 8)}...</span>
                    <span className="text-sm text-slate-300">{user.phone_hash ? `***${user.phone_hash.slice(-4)}` : 'No phone'}</span>
                    <span className="text-xs text-slate-500">{user.country || 'Unknown'}</span>
                    <span className={`text-xs px-2 py-0.5 rounded ${user.consent_status === 'accepted' ? 'bg-green-900 text-green-300' : user.consent_status === 'pending' ? 'bg-yellow-900 text-yellow-300' : 'bg-red-900 text-red-300'}`}>
                      {user.consent_status}
                    </span>
                  </div>
                  <span className="text-xs text-slate-500">{new Date(user.created_at).toLocaleDateString()}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-4 border-t border-slate-800 text-xs text-slate-500">
          No message content stored. Events-only analytics. Cache: 60s.
        </div>
      </div>
    </div>
  );
}
