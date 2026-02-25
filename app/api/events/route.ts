import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Allowed event types - extend as needed
const ALLOWED_EVENT_TYPES = [
  'user_registered',
  'consent_accepted',
  'consent_revoked',
  'session_started',
  'session_ended',
  'invoke_started',
  'invoke_completed',
  'agent_switched',
  'provider_error',
  'sms_outbound_failed',
  'api_latency',
  'token_usage',
  'page_view',
  'message_sent',
  'demo_page_view',
  'demo_intake_started',
  'demo_intake_completed',
] as const;

// Validate that meta does not contain message content
function validateNoMessageContent(meta: unknown): boolean {
  if (typeof meta !== 'object' || meta === null) return true;
  
  const m = meta as Record<string, unknown>;
  const forbiddenKeys = ['message', 'body', 'text', 'content', 'payload', 'response'];
  
  for (const key of forbiddenKeys) {
    if (key in m) return false;
    // Also check nested objects
    for (const k of Object.keys(m)) {
      const val = m[k];
      if (typeof val === 'object' && val !== null) {
        if (key in (val as Record<string, unknown>)) return false;
      }
    }
  }
  
  return true;
}

export async function POST(request: Request) {
  try {
    // Parse request body
    const body = await request.json();
    const { event_type, user_id, session_id, channel, meta = {} } = body;

    // Validate required fields
    if (!event_type || !channel) {
      return NextResponse.json(
        { error: 'Missing required fields: event_type, channel' },
        { status: 400 }
      );
    }

    // Validate event_type is in allowlist
    if (!ALLOWED_EVENT_TYPES.includes(event_type)) {
      return NextResponse.json(
        { error: `Invalid event_type. Allowed: ${ALLOWED_EVENT_TYPES.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate channel
    const allowedChannels = ['web_demo', 'sms'];
    if (!allowedChannels.includes(channel)) {
      return NextResponse.json(
        { error: `Invalid channel. Allowed: ${allowedChannels.join(', ')}` },
        { status: 400 }
      );
    }

    // Block any message content
    if (!validateNoMessageContent(meta)) {
      return NextResponse.json(
        { error: 'Event meta cannot contain message, body, text, content, payload, or response fields' },
        { status: 400 }
      );
    }

    // Initialize Supabase with service role
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

    // Insert event
    const { data, error } = await supabase
      .from('events')
      .insert({
        event_type,
        user_id: user_id || null,
        session_id: session_id || null,
        channel,
        meta,
      })
      .select()
      .single();

    if (error) {
      console.error('Event ingestion error:', error);
      return NextResponse.json(
        { error: 'Failed to record event', details: error.message, code: error.code },
        { status: 500 }
      );
    }

    // If user_registered event, also create/update user in users table
    if (event_type === 'user_registered' && meta?.phone_hash) {
      const phoneHash = meta.phone_hash;
      const country = meta.country || 'Unknown';
      
      // Upsert user (insert if not exists, update if exists)
      const { error: userError } = await supabase
        .from('users')
        .upsert({
          phone_hash: phoneHash,
          country: country,
          consent_status: 'accepted',
          first_seen_at: new Date().toISOString(),
          last_seen_at: new Date().toISOString(),
        }, { onConflict: 'phone_hash' });
      
      if (userError) {
        console.error('User upsert error:', userError);
        // Don't fail the event if user upsert fails
      }
    }

    // If consent_accepted event, update user consent status
    if (event_type === 'consent_accepted' && meta?.phone_hash) {
      const { error: consentError } = await supabase
        .from('users')
        .update({
          consent_status: 'accepted',
          consent_ts: new Date().toISOString(),
          last_seen_at: new Date().toISOString(),
        })
        .eq('phone_hash', meta.phone_hash);
      
      if (consentError) {
        console.error('User consent update error:', consentError);
      }
    }

    return NextResponse.json({ ok: true, id: data.id });

  } catch (err) {
    console.error('Events API error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
