-- Supabase SQL Migration for Invoke Waitlist & Conversations
-- Run this in your Supabase SQL Editor

-- Waitlist users table
CREATE TABLE IF NOT EXISTS waitlist_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone TEXT UNIQUE NOT NULL,
    source TEXT DEFAULT 'web',
    status TEXT DEFAULT 'waitlist',
    interest_category INT,
    consented BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add index on phone for fast lookups
CREATE INDEX IF NOT EXISTS idx_waitlist_phone ON waitlist_users(phone);

-- Conversations state table (for web + SMS)
CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone TEXT UNIQUE NOT NULL,
    state JSONB DEFAULT '{}',
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add index on phone for fast lookups
CREATE INDEX IF NOT EXISTS idx_conversations_phone ON conversations(phone);

-- Messages log table
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone TEXT NOT NULL,
    direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
    body TEXT NOT NULL,
    channel TEXT DEFAULT 'web',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_messages_phone ON messages(phone);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);

-- Enable Row Level Security (RLS) - we'll use service key for admin access
ALTER TABLE waitlist_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users (admin access via service key)
CREATE POLICY "Allow full access to authenticated" ON waitlist_users
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow full access to authenticated" ON conversations
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow full access to authenticated" ON messages
    FOR ALL USING (auth.role() = 'authenticated');

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers to auto-update updated_at
DROP TRIGGER IF EXISTS update_waitlist_updated_at ON waitlist_users;
CREATE TRIGGER update_waitlist_updated_at
    BEFORE UPDATE ON waitlist_users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_conversations_updated_at ON conversations;
CREATE TRIGGER update_conversations_updated_at
    BEFORE UPDATE ON conversations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
