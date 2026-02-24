// Shared conversation logic for Invoke
// Used by both SMS webhook and web chat

export interface ConversationState {
  step: 'greeting' | 'awaiting_category' | 'completed';
  lastMessageAt?: string;
}

export interface InvokeResponse {
  reply: string;
  state: ConversationState;
  category?: number;
}

const CATEGORY_OPTIONS: Record<number, string> = {
  1: 'Tasks',
  2: 'Reminders',
  3: 'Planning',
  4: 'Money',
  5: 'Coordination',
  6: 'Something else',
};

const INTAKE_QUESTION = `Perfect. Last one — what are you most excited to invoke? Reply with a number:
1 Tasks
2 Reminders
3 Planning
4 Money
5 Coordination
6 Something else`;

const COMPLETION_MESSAGE = `You're on the early list. We're launching soon — I'll text you when your spot opens. You can //invoke here anytime for updates.`;

/**
 * Process an incoming message and return the appropriate response
 * @param body - The message text from the user
 * @param currentState - The current conversation state
 * @returns InvokeResponse with reply text and updated state
 */
export function processMessage(
  body: string,
  currentState: ConversationState = { step: 'greeting' }
): InvokeResponse {
  const text = body.trim().toLowerCase();

  // Check for trigger words that restart the flow
  const isTrigger = text.includes('//invoke') || 
                    text.includes('hello') || 
                    text.includes('hi') ||
                    text.includes('start') ||
                    text.includes('invoke');

  // If trigger word or first interaction, send greeting + intake question
  if (isTrigger || currentState.step === 'greeting') {
    return {
      reply: INTAKE_QUESTION,
      state: { step: 'awaiting_category', lastMessageAt: new Date().toISOString() },
    };
  }

  // If we're awaiting category selection
  if (currentState.step === 'awaiting_category') {
    // Try to parse as number 1-6
    const categoryNum = parseInt(text.replace(/[^0-9]/g, ''), 10);
    
    if (categoryNum >= 1 && categoryNum <= 6) {
      // Valid category selected
      return {
        reply: COMPLETION_MESSAGE,
        state: { step: 'completed', lastMessageAt: new Date().toISOString() },
        category: categoryNum,
      };
    }

    // Invalid input - remind them to select 1-6
    return {
      reply: `Please reply with a number 1-6 to let us know what you're most interested in:\n1 Tasks\n2 Reminders\n3 Planning\n4 Money\n5 Coordination\n6 Something else`,
      state: { step: 'awaiting_category', lastMessageAt: new Date().toISOString() },
    };
  }

  // Completed state - handle follow-up messages
  if (currentState.step === 'completed') {
    // If they send a trigger again, restart
    if (isTrigger) {
      return {
        reply: INTAKE_QUESTION,
        state: { step: 'awaiting_category', lastMessageAt: new Date().toISOString() },
      };
    }

    // Otherwise give helpful response
    return {
      reply: `Thanks for reaching out! You're on the early list. Reply "//invoke" anytime for updates or to change your preferences.`,
      state: { step: 'completed', lastMessageAt: new Date().toISOString() },
    };
  }

  // Default fallback
  return {
    reply: `Hi there! Reply "//invoke" to get started or reply with a number 1-6 if you're selecting your interest.`,
    state: currentState,
  };
}

/**
 * Check if a message contains the invoke trigger
 * @param body - The message text
 * @returns boolean indicating if this should trigger the flow
 */
export function isInvokeTrigger(body: string): boolean {
  const text = body.trim().toLowerCase();
  return text.includes('//invoke') || 
         text.includes('hello') || 
         text.includes('hi') ||
         text.includes('start') ||
         text.includes('invoke');
}

/**
 * Get category name from number
 * @param categoryNum - The category number 1-6
 * @returns The category name or undefined
 */
export function getCategoryName(categoryNum: number): string | undefined {
  return CATEGORY_OPTIONS[categoryNum];
}
