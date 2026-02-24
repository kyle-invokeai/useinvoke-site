import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { processMessage, isInvokeTrigger, ConversationState } from '@/lib/invoke';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { from, body: messageBody, channel = 'web' } = body;

    // Validation
    if (!from || !messageBody) {
      return NextResponse.json(
        { error: 'Phone number (from) and message body are required' },
        { status: 400 }
      );
    }

    // Normalize phone
    let phone = from.trim();
    if (!phone.startsWith('+')) {
      phone = '+1' + phone.replace(/\D/g, '');
    }

    // Log incoming message
    await supabase.from('messages').insert([
      {
        phone,
        direction: 'inbound',
        body: messageBody,
        channel,
      },
    ]);

    // Load or create conversation state
    const { data: convData } = await supabase
      .from('conversations')
      .select('state')
      .eq('phone', phone)
      .single();

    const currentState: ConversationState = convData?.state || { step: 'greeting' };

    // Check if this is a new user
    const { data: userData } = await supabase
      .from('waitlist_users')
      .select('id, interest_category')
      .eq('phone', phone)
      .single();

    // Process the message through shared logic
    const result = processMessage(messageBody, currentState);

    // If category was selected, update user record
    if (result.category && userData) {
      await supabase
        .from('waitlist_users')
        .update({ interest_category: result.category })
        .eq('phone', phone);
    }

    // If user doesn't exist and they triggered the flow, create them
    if (!userData && isInvokeTrigger(messageBody)) {
      await supabase.from('waitlist_users').insert([
        {
          phone,
          source: channel,
          status: 'waitlist',
        },
      ]);
    }

    // Update conversation state
    await supabase.from('conversations').upsert(
      {
        phone,
        state: result.state,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'phone' }
    );

    // Log outgoing message
    await supabase.from('messages').insert([
      {
        phone,
        direction: 'outbound',
        body: result.reply,
        channel,
      },
    ]);

    return NextResponse.json(
      {
        success: true,
        reply: result.reply,
        state: result.state,
        category: result.category,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Invoke API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
