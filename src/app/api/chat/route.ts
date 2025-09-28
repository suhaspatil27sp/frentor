import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { db } from '@/lib/database';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user, session, message, source } = body;

    if (!user || !session || !message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Store user message in database
    const userMessage = {
      message_id: uuidv4(),
      session_id: session.session_id,
      user_id: user.user_id,
      sender_type: 'user' as const,
      message_text: message.message_text,
      sent_at: new Date().toISOString(),
      is_meaningful: message.is_meaningful || true,
      intent: message.intent,
      token_count: message.token_count || message.message_text.split(' ').length
    };

    await db.storeMessage(userMessage);

    // Generate AI response (placeholder logic)
    const aiResponse = await generateAIResponse(message.message_text, user, session);
    
    // Store bot response in database
    const botMessage = {
      message_id: uuidv4(),
      session_id: session.session_id,
      user_id: user.user_id,
      sender_type: 'bot' as const,
      message_text: aiResponse,
      sent_at: new Date().toISOString(),
      is_meaningful: true,
      token_count: aiResponse.split(' ').length
    };

    await db.storeMessage(botMessage);

    // Update session activity
    await db.updateSessionActivity(session.session_id);

    return NextResponse.json({
      userMessage,
      botMessage,
      session: {
        ...session,
        last_message_at: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function generateAIResponse(userMessage: string, user: any, session: any): Promise<string> {
  // This is a placeholder AI response generator
  // In a real implementation, you would integrate with OpenAI, Claude, or another AI service
  
  const responses = [
    `That's a great question, ${user.first_name}! Let me help you understand that better.`,
    `I can see you're working on something challenging. Let's break it down step by step.`,
    `Excellent thinking! Here's how we can approach this problem...`,
    `That's a common question for Grade ${user.grade_level} students. Let me explain...`,
    `Good observation! This relates to what we've been discussing about ${session.current_concept || 'your studies'}.`
  ];

  // Simple keyword-based responses
  const lowerMessage = userMessage.toLowerCase();
  
  if (lowerMessage.includes('math') || lowerMessage.includes('calculate')) {
    return `Great! I love helping with math problems. For Grade ${user.grade_level} ${user.education_board} curriculum, let's work through this together. Can you show me the specific problem you're working on?`;
  }
  
  if (lowerMessage.includes('science') || lowerMessage.includes('physics') || lowerMessage.includes('chemistry')) {
    return `Science is fascinating! As a Grade ${user.grade_level} student, you're exploring some really interesting concepts. What specific topic would you like to dive into?`;
  }
  
  if (lowerMessage.includes('help') || lowerMessage.includes('don\'t understand')) {
    return `Don't worry, ${user.first_name}! Learning can be challenging sometimes. I'm here to help you understand. Can you tell me which part is confusing you the most?`;
  }
  
  if (lowerMessage.includes('homework') || lowerMessage.includes('assignment')) {
    return `I'd be happy to help you with your homework! Remember, I'm here to guide your learning, not give you direct answers. What subject is this for, and where would you like to start?`;
  }

  // Default response
  const randomResponse = responses[Math.floor(Math.random() * responses.length)];
  return `${randomResponse} Could you provide more details about what you'd like to learn or any specific questions you have?`;
}