-- Migration: Create admin tables for privacy-safe analytics
-- No message content stored anywhere

-- Users table with privacy-safe fields
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  phone_hash text UNIQUE,
  country text,
  referral_code text UNIQUE,
  referred_by_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  consent_status text DEFAULT 'pending' CHECK (consent_status IN ('pending', 'accepted', 'revoked')),
  consent_ts timestamptz NULL,
  first_seen_at timestamptz,
  last_seen_at timestamptz
);

-- Sessions table (id as text for client-generated IDs)
CREATE TABLE IF NOT EXISTS sessions (
  id text PRIMARY KEY,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  channel text NOT NULL CHECK (channel IN ('web_demo', 'sms')),
  status text DEFAULT 'active' CHECK (status IN ('active', 'ended', 'error')),
  active_agent text NULL,
  started_at timestamptz DEFAULT now(),
  ended_at timestamptz NULL,
  last_event_at timestamptz DEFAULT now()
);

-- Events table (append-only, no message content, no FK constraints for flexibility)
CREATE TABLE IF NOT EXISTS events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ts timestamptz DEFAULT now(),
  user_id uuid NULL,
  session_id text NULL,
  event_type text NOT NULL,
  channel text NOT NULL,
  meta jsonb DEFAULT '{}'::jsonb,
  -- Block message content fields via constraint
  CONSTRAINT no_message_content CHECK (
    NOT (meta ? 'message') AND 
    NOT (meta ? 'body') AND 
    NOT (meta ? 'text') AND 
    NOT (meta ? 'content')
  )
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_events_ts ON events(ts DESC);
CREATE INDEX IF NOT EXISTS idx_events_event_type ON events(event_type);
CREATE INDEX IF NOT EXISTS idx_events_user_id ON events(user_id);
CREATE INDEX IF NOT EXISTS idx_events_session_id ON events(session_id);
CREATE INDEX IF NOT EXISTS idx_users_phone_hash ON users(phone_hash);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions(status) WHERE status = 'active';

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Drop existing policies first to avoid conflicts
DROP POLICY IF EXISTS events_insert_only ON events;
DROP POLICY IF EXISTS users_insert_only ON users;
DROP POLICY IF EXISTS sessions_insert_only ON sessions;
DROP POLICY IF EXISTS events_select ON events;
DROP POLICY IF EXISTS users_select ON users;
DROP POLICY IF EXISTS sessions_select ON sessions;
DROP POLICY IF EXISTS events_service_insert ON events;
DROP POLICY IF EXISTS users_service_insert ON users;
DROP POLICY IF EXISTS sessions_service_insert ON sessions;

-- Allow inserts (service role bypasses RLS check)
CREATE POLICY events_service_insert ON events FOR INSERT WITH CHECK (true);
CREATE POLICY users_service_insert ON users FOR INSERT WITH CHECK (true);
CREATE POLICY sessions_service_insert ON sessions FOR INSERT WITH CHECK (true);

-- Allow SELECT for reading metrics
CREATE POLICY events_select ON events FOR SELECT USING (true);
CREATE POLICY users_select ON users FOR SELECT USING (true);
CREATE POLICY sessions_select ON sessions FOR SELECT USING (true);

-- Helper functions for metrics API

-- Count distinct sessions (visitors) since a given time
CREATE OR REPLACE FUNCTION count_distinct_users(since timestamptz)
RETURNS bigint AS $$
BEGIN
  RETURN (
    SELECT COUNT(DISTINCT session_id)
    FROM events
    WHERE ts >= since AND session_id IS NOT NULL
  );
END;
$$ LANGUAGE plpgsql;

-- Sum tokens (in + out) since a given time
CREATE OR REPLACE FUNCTION sum_tokens(since timestamptz)
RETURNS bigint AS $$
BEGIN
  RETURN (
    SELECT COALESCE(
      SUM(
        COALESCE((meta->>'tokens_in')::bigint, 0) + 
        COALESCE((meta->>'tokens_out')::bigint, 0)
      ),
      0
    )
    FROM events
    WHERE ts >= since
  );
END;
$$ LANGUAGE plpgsql;

-- Sum cost estimate since a given time
CREATE OR REPLACE FUNCTION sum_cost(since timestamptz)
RETURNS numeric AS $$
BEGIN
  RETURN (
    SELECT COALESCE(SUM((meta->>'cost_usd_estimate')::numeric), 0)
    FROM events
    WHERE ts >= since
  );
END;
$$ LANGUAGE plpgsql;

-- Top agents by invoke count since a given time
CREATE OR REPLACE FUNCTION top_agents(since timestamptz)
RETURNS TABLE(agent text, count bigint) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(meta->>'agent', 'unknown') as agent,
    COUNT(*)::bigint as count
  FROM events
  WHERE event_type = 'invoke_started' AND ts >= since
  GROUP BY meta->>'agent'
  ORDER BY count DESC
  LIMIT 10;
END;
$$ LANGUAGE plpgsql;

-- Top referrers (users who referred others)
CREATE OR REPLACE FUNCTION top_referrers()
RETURNS TABLE(referrer_id uuid, count bigint) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    referred_by_user_id as referrer_id,
    COUNT(*)::bigint as count
  FROM users
  WHERE referred_by_user_id IS NOT NULL
  GROUP BY referred_by_user_id
  ORDER BY count DESC
  LIMIT 10;
END;
$$ LANGUAGE plpgsql;
