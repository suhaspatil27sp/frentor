import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { db } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_id } = body;

    if (!user_id) {
      return NextResponse.json(
        { error: 'user_id is required' },
        { status: 400 }
      );
    }

    // Check if user exists
    const user = await db.getUserById(user_id);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Create new session
    const newSession = {
      session_id: uuidv4(),
      user_id,
      is_active: true,
      current_concept: null,
      concepts_covered: [],
      started_at: new Date().toISOString(),
      last_message_at: new Date().toISOString(),
      auto_extended_count: 0,
      session_timeout_hours: 24
    };

    await db.createSession(newSession);

    return NextResponse.json(newSession, { status: 201 });

  } catch (error) {
    console.error('Session creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');
    const sessionId = searchParams.get('session_id');

    if (!userId && !sessionId) {
      return NextResponse.json(
        { error: 'Either user_id or session_id is required' },
        { status: 400 }
      );
    }

    if (sessionId) {
      const session = await db.getSessionById(sessionId);
      if (!session) {
        return NextResponse.json(
          { error: 'Session not found' },
          { status: 404 }
        );
      }
      return NextResponse.json(session);
    }

    if (userId) {
      const sessions = await db.getSessionsByUserId(userId);
      return NextResponse.json(sessions);
    }

  } catch (error) {
    console.error('Session fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}