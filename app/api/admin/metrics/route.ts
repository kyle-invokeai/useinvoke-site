import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Cache metrics for 60 seconds
export const revalidate = 60;

interface MetricsData {
  // Time windows
  h24: string;
  d7: string;
  d30: string;
  
  // Visitors
  visitors24h: number;
  visitors7d: number;
  visitors30d: number;
  
  // New users (from user_registered events)
  newUsers24h: number;
  newUsers7d: number;
  newUsers30d: number;
  
  // Total unique users ever
  totalUsers: number;
  
  // Returning users (had prior session)
  returningUsers24h: number;
  returningUsers7d: number;
  returningUsers30d: number;
  
  // Returning user %
  returningRate24h: number;
  returningRate7d: number;
  returningRate30d: number;
  
  // Retention rates (cohort analysis)
  retentionD1: number;  // Day 1 retention
  retentionD7: number;  // Day 7 retention
  retentionW1: number;  // Week 1 retention
  retentionM1: number;  // Month 1 retention
  
  // Consented users
  consented24h: number;
  consented7d: number;
  consented30d: number;
  
  // Active sessions
  activeSessions: number;
  
  // Invokes
  invokes24h: number;
  invokes7d: number;
  invokes30d: number;
  
  // Errors
  errors24h: number;
  errors7d: number;
  errors30d: number;
  
  // Latency
  latencyP50: number | null;
  latencyP95: number | null;
  
  // Token burn
  tokens24h: number;
  tokens7d: number;
  tokens30d: number;
  
  // Cost
  cost24h: number;
  cost7d: number;
  cost30d: number;
  
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
    const d30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const d1 = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString();
    const w1 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const m1 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

    // Run all queries in parallel
    const [
      visitors24hRes,
      visitors7dRes,
      visitors30dRes,
      newUsers24hRes,
      newUsers7dRes,
      newUsers30dRes,
      totalUsersRes,
      returningUsers24hRes,
      returningUsers7dRes,
      returningUsers30dRes,
      consented24hRes,
      consented7dRes,
      consented30dRes,
      activeSessionsRes,
      invokes24hRes,
      invokes7dRes,
      invokes30dRes,
      errors24hRes,
      errors7dRes,
      errors30dRes,
      latencyRes,
      tokens24hRes,
      tokens7dRes,
      tokens30dRes,
      cost24hRes,
      cost7dRes,
      cost30dRes,
      topAgentsRes,
      topReferrersRes,
      recentErrorsRes,
      recentUsersRes,
      retentionD1Res,
      retentionD7Res,
      retentionW1Res,
      retentionM1Res,
    ] = await Promise.all([
      // Visitors (distinct sessions)
      supabase.rpc('count_distinct_users', { since: h24 }),
      supabase.rpc('count_distinct_users', { since: d7 }),
      supabase.rpc('count_distinct_users', { since: d30 }),
      
      // New users (from user_registered events)
      supabase.from('events').select('*', { count: 'exact', head: true }).eq('event_type', 'user_registered').gte('ts', h24),
      supabase.from('events').select('*', { count: 'exact', head: true }).eq('event_type', 'user_registered').gte('ts', d7),
      supabase.from('events').select('*', { count: 'exact', head: true }).eq('event_type', 'user_registered').gte('ts', d30),
      
      // Total unique users ever (distinct phone_hash from user_registered events)
      supabase.from('events').select('meta->>phone_hash').eq('event_type', 'user_registered').not('meta->>phone_hash', 'is', null),
      
      // Returning users (sessions with prior session from same phone_hash)
      supabase.rpc('count_returning_users', { since: h24 }),
      supabase.rpc('count_returning_users', { since: d7 }),
      supabase.rpc('count_returning_users', { since: d30 }),
      
      // Consented users (via events)
      supabase.from('events').select('*', { count: 'exact', head: true }).eq('event_type', 'consent_accepted').gte('ts', h24),
      supabase.from('events').select('*', { count: 'exact', head: true }).eq('event_type', 'consent_accepted').gte('ts', d7),
      supabase.from('events').select('*', { count: 'exact', head: true }).eq('event_type', 'consent_accepted').gte('ts', d30),
      
      // Active sessions
      supabase.from('sessions').select('*', { count: 'exact', head: true }).eq('status', 'active'),
      
      // Invokes
      supabase.from('events').select('*', { count: 'exact', head: true }).eq('event_type', 'invoke_started').gte('ts', h24),
      supabase.from('events').select('*', { count: 'exact', head: true }).eq('event_type', 'invoke_started').gte('ts', d7),
      supabase.from('events').select('*', { count: 'exact', head: true }).eq('event_type', 'invoke_started').gte('ts', d30),
      
      // Errors
      supabase.from('events').select('*', { count: 'exact', head: true }).in('event_type', ['provider_error', 'sms_outbound_failed']).gte('ts', h24),
      supabase.from('events').select('*', { count: 'exact', head: true }).in('event_type', ['provider_error', 'sms_outbound_failed']).gte('ts', d7),
      supabase.from('events').select('*', { count: 'exact', head: true }).in('event_type', ['provider_error', 'sms_outbound_failed']).gte('ts', d30),
      
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
      supabase.rpc('sum_tokens', { since: d30 }),
      
      // Cost estimate
      supabase.rpc('sum_cost', { since: h24 }),
      supabase.rpc('sum_cost', { since: d7 }),
      supabase.rpc('sum_cost', { since: d30 }),
      
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
      
      // Retention rates (cohort analysis)
      supabase.rpc('calculate_retention', { cohort_date: d1, retention_days: 1 }),
      supabase.rpc('calculate_retention', { cohort_date: d7, retention_days: 7 }),
      supabase.rpc('calculate_retention', { cohort_date: w1, retention_days: 7 }),
      supabase.rpc('calculate_retention', { cohort_date: m1, retention_days: 30 }),
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

    // Calculate unique phone hashes for total users
    const uniquePhoneHashes = new Set();
    if (totalUsersRes.data && Array.isArray(totalUsersRes.data)) {
      totalUsersRes.data.forEach((e: any) => {
        if (e.phone_hash) uniquePhoneHashes.add(e.phone_hash);
      });
    }
    const totalUsers = uniquePhoneHashes.size;
    
    // Calculate returning user rates
    const newUsers24h = newUsers24hRes.count || 0;
    const returningUsers24h = returningUsers24hRes.data || 0;
    const returningRate24h = visitors24hRes.data ? (returningUsers24h / (visitors24hRes.data || 1)) * 100 : 0;
    
    const newUsers7d = newUsers7dRes.count || 0;
    const returningUsers7d = returningUsers7dRes.data || 0;
    const returningRate7d = visitors7dRes.data ? (returningUsers7d / (visitors7dRes.data || 1)) * 100 : 0;
    
    const newUsers30d = newUsers30dRes.count || 0;
    const returningUsers30d = returningUsers30dRes.data || 0;
    const returningRate30d = visitors30dRes.data ? (returningUsers30d / (visitors30dRes.data || 1)) * 100 : 0;

    const metrics: MetricsData = {
      h24,
      d7,
      d30,
      visitors24h: visitors24hRes.data || 0,
      visitors7d: visitors7dRes.data || 0,
      visitors30d: visitors30dRes.data || 0,
      newUsers24h,
      newUsers7d,
      newUsers30d,
      totalUsers,
      returningUsers24h,
      returningUsers7d,
      returningUsers30d,
      returningRate24h: Math.round(returningRate24h * 10) / 10,
      returningRate7d: Math.round(returningRate7d * 10) / 10,
      returningRate30d: Math.round(returningRate30d * 10) / 10,
      retentionD1: retentionD1Res.data || 0,
      retentionD7: retentionD7Res.data || 0,
      retentionW1: retentionW1Res.data || 0,
      retentionM1: retentionM1Res.data || 0,
      consented24h: consented24hRes.count || 0,
      consented7d: consented7dRes.count || 0,
      consented30d: consented30dRes.count || 0,
      activeSessions: activeSessionsRes.count || 0,
      invokes24h: invokes24hRes.count || 0,
      invokes7d: invokes7dRes.count || 0,
      invokes30d: invokes30dRes.count || 0,
      errors24h: errors24hRes.count || 0,
      errors7d: errors7dRes.count || 0,
      errors30d: errors30dRes.count || 0,
      latencyP50,
      latencyP95,
      tokens24h: tokens24hRes.data || 0,
      tokens7d: tokens7dRes.data || 0,
      tokens30d: tokens30dRes.data || 0,
      cost24h: cost24hRes.data || 0,
      cost7d: cost7dRes.data || 0,
      cost30d: cost30dRes.data || 0,
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
