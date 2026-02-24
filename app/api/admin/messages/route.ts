import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    const { data: messages, error } = await supabase
      .from('messages')
      .select('id, phone, direction, body, channel, created_at')
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('Messages error:', error);
      return NextResponse.json(
        { error: 'Failed to load messages' },
        { status: 500 }
      );
    }

    return NextResponse.json({ messages: messages || [] });
  } catch (error) {
    console.error('Messages API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
