import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Validate E.164 phone format
function isValidE164(phone: string): boolean {
  return /^\+[1-9]\d{1,14}$/.test(phone);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone, consent } = body;

    // Validation
    if (!phone) {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      );
    }

    if (!consent) {
      return NextResponse.json(
        { error: 'Consent is required to join the waitlist' },
        { status: 400 }
      );
    }

    // Normalize phone to E.164
    let normalizedPhone = phone.trim();
    if (!normalizedPhone.startsWith('+')) {
      // Assume US number if no country code
      normalizedPhone = '+1' + normalizedPhone.replace(/\D/g, '');
    }

    if (!isValidE164(normalizedPhone)) {
      return NextResponse.json(
        { error: 'Invalid phone number format. Please use E.164 format (+1234567890)' },
        { status: 400 }
      );
    }

    // Check if phone already exists
    const { data: existing } = await supabase
      .from('waitlist_users')
      .select('id, status')
      .eq('phone', normalizedPhone)
      .single();

    if (existing) {
      return NextResponse.json(
        { 
          success: true, 
          message: 'You are already on the waitlist!',
          phone: normalizedPhone,
          status: existing.status 
        },
        { status: 200 }
      );
    }

    // Insert into waitlist
    const { data, error } = await supabase
      .from('waitlist_users')
      .insert([
        {
          phone: normalizedPhone,
          source: 'web',
          status: 'waitlist',
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Supabase insert error:', error);
      return NextResponse.json(
        { error: 'Failed to join waitlist. Please try again.' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { 
        success: true, 
        message: 'Successfully joined the waitlist!',
        phone: normalizedPhone,
        user: data 
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Waitlist API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
