import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    const { count, error } = await supabase
      .from('waitlist_users')
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.error('Stats error:', error);
      return NextResponse.json(
        { error: 'Failed to load stats' },
        { status: 500 }
      );
    }

    return NextResponse.json({ count: count || 0 });
  } catch (error) {
    console.error('Stats API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
