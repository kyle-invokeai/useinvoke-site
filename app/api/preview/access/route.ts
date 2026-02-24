import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Demo phone that bypasses waitlist check
const DEMO_PHONE = '+19999999999';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const phone = searchParams.get('phone');

    if (!phone) {
      return NextResponse.json(
        { error: 'Phone number required' },
        { status: 400 }
      );
    }

    // Demo phone bypasses all checks
    if (phone === DEMO_PHONE) {
      return NextResponse.json({ allowed: true, demo: true });
    }

    // Check if user exists and has consented
    const { data: user, error } = await supabase
      .from('waitlist_users')
      .select('consented, status')
      .eq('phone', phone)
      .single();

    if (error || !user) {
      return NextResponse.json(
        { allowed: false, error: 'Phone not found in waitlist' },
        { status: 403 }
      );
    }

    if (!user.consented) {
      return NextResponse.json(
        { allowed: false, error: 'Consent not provided' },
        { status: 403 }
      );
    }

    return NextResponse.json({ allowed: true, demo: false });
  } catch (error) {
    console.error('Access check error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
