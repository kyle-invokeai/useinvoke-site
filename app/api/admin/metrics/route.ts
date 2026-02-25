import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Cache metrics for 60 seconds
export const revalidate = 60;

interface MetricsData {
  // Time windows
  h24: string;
  d7: string;
  
  // Visitors
  visitors24h: number;
  visitors7d: number;
  
  // New users
  newUsers24h: number;
  newUsers7d: number;
  
  // Consented users
  consented24h: number;
  consented7d: number;
  
  // Active sessions
  activeSessions: number;
  
  // Invokes
  invokes24h: number;
  invokes7d: number;
  
  // Errors
  errors24h: number;
  errors7d: number;
  
  // Latency
  latencyP50: number | null;
  latencyP95: number | null;
  
  // Token burn
  tokens24h: number;
  tokens7d: number;
  
  // Cost
  cost24h: number;
  cost7d: number;
  
  // Drilldown data
  topAgents: { agent: string; count: number }[];
  topReferrers: { referrer_id: string; count: number }[];
  recentErrors: { ts: string; event_type: string; channel: string; meta: any }[];
  recentUsers: { id: string; phone_hash: string | null; country: string | null; consent_status: string; created_at: string; first_seen_at: string | null; last_seen_at: string | null }[];
}

export async function GET() {
  try {
    // Initialize Supabase
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    const now = new Date();
    const h24 = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
    const d7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

    // Run all queries in parallel
    const [
      visitors24hRes,
      visitors7dRes,
      newUsers24hRes,
      newUsers7dRes,
      consented24hRes,
      consented7dRes,
      activeSessionsRes,
      invokes24hRes,
      invokes7dRes,
      errors24hRes,
      errors7dRes,
      latencyRes,
      tokens24hRes,
      tokens7dRes,
      cost24hRes,
      cost7dRes,
      topAgentsRes,
      topReferrersRes,
      recentErrorsRes,
      recentUsersRes,
    ] = await Promise.all([
      // Visitors (distinct user_id from events)
      supabase.rpc('count_distinct_users', { since: h24 }),
      supabase.rpc('count_distinct_users', { since: d7 }),
      
      // New users
      supabase.from('users').select('*', { count: 'exact', head: true }).gte('created_at', h24),
      supabase.from('users').select('*', { count: 'exact', head: true }).gte('created_at', d7),
      
      // Consented users (via events)
      supabase.from('events').select('*', { count: 'exact', head: true }).eq('event_type', 'consent_accepted').gte('ts', h24),
      supabase.from('events').select('*', { count: 'exact', head: true }).eq('event_type', 'consent_accepted').gte('ts', d7),
      
      // Active sessions
      supabase.from('sessions').select('*', { count: 'exact', head: true }).eq('status', 'active'),
      
      // Invokes
      supabase.from('events').select('*', { count: 'exact', head: true }).eq('event_type', 'invoke_started').gte('ts', h24),
      supabase.from('events').select('*', { count: 'exact', head: true }).eq('event_type', 'invoke_started').gte('ts', d7),
      
      // Errors
      supabase.from('events').select('*', { count: 'exact', head: true }).in('event_type', ['provider_error', 'sms_outbound_failed']).gte('ts', h24),
      supabase.from('events').select('*', { count: 'exact', head: true }).in('event_type', ['provider_error', 'sms_outbound_failed']).gte('ts', d7),
      
      // Latency percentiles (manual calculation from recent events)
      supabase.from('events')
        .select('meta')
        .eq('event_type', 'api_latency')
        .gte('ts', h24)
        .not('meta->>latency_ms', 'is', null)
        .limit(1000),
      
      // Token burn
      supabase.rpc('sum_tokens', { since: h24 }),
      supabase.rpc('sum_tokens', { since: d7 }),
      
      // Cost estimate
      supabase.rpc('sum_cost', { since: h24 }),
      supabase.rpc('sum_cost', { since: d7 }),
      
      // Top agents (7d)
      supabase.rpc('top_agents', { since: d7 }),
      
      // Top referrers
      supabase.rpc('top_referrers'),
      
      // Recent errors
      supabase.from('events')
        .select('ts, event_type, channel, meta')
        .in('event_type', ['provider_error', 'sms_outbound_failed'])
        .order('ts', { ascending: false })
        .limit(20),
      
      // Recent users (latest 20)
      supabase.from('users')
        .select('id, phone_hash, country, consent_status, created_at, first_seen_at, last_seen_at')
        .order('created_at', { ascending: false })
        .limit(20),
    ]);

    // Calculate latency percentiles
    let latencyP50: number | null = null;
    let latencyP95: number | null = null;
    
    if (latencyRes.data && Array.isArray(latencyRes.data)) {
      const latencies = latencyRes.data
        .map((e: any) => e.meta?.latency_ms)
        .filter((n: number | undefined) => typeof n === 'number' && !isNaN(n))
        .sort((a: number, b: number) => a - b);
      
      if (latencies.length > 0) {
        latencyP50 = latencies[Math.floor(latencies.length * 0.5)] || latencies[latencies.length - 1];
        latencyP95 = latencies[Math.floor(latencies.length * 0.95)] || latencies[latencies.length - 1];
      }
    }

    const metrics: MetricsData = {
      h24,
      d7,
      visitors24h: visitors24hRes.data || 0,
      visitors7d: visitors7dRes.data || 0,
      newUsers24h: newUsers24hRes.count || 0,
      newUsers7d: newUsers7dRes.count || 0,
      consented24h: consented24hRes.count || 0,
      consented7d: consented7dRes.count || 0,
      activeSessions: activeSessionsRes.count || 0,
      invokes24h: invokes24hRes.count || 0,
      invokes7d: invokes7dRes.count || 0,
      errors24h: errors24hRes.count || 0,
      errors7d: errors7dRes.count || 0,
      latencyP50,
      latencyP95,
      tokens24h: tokens24hRes.data || 0,
      tokens7d: tokens7dRes.data || 0,
      cost24h: cost24hRes.data || 0,
      cost7d: cost7dRes.data || 0,
      topAgents: topAgentsRes.data || [],
      topReferrers: topReferrersRes.data || [],
      recentErrors: recentErrorsRes.data || [],
      recentUsers: recentUsersRes.data || [],
    };

    return NextResponse.json({ ok: true, metrics }, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      },
    });

  } catch (err) {
    console.error('Metrics API error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
