import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    const { data: users, error } = await supabase
      .from('waitlist_users')
      .select('id, phone, source, status, interest_category, created_at')
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('Signups error:', error);
      return NextResponse.json(
        { error: 'Failed to load signups' },
        { status: 500 }
      );
    }

    return NextResponse.json({ users: users || [] });
  } catch (error) {
    console.error('Signups API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
