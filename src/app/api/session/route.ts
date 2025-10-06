//src/app/api/session/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

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
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('user_id', user_id)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Create new session - let database generate session_id
    const newSession = {
      user_id,
      is_active: true,
      current_concept: null,
      concepts_covered: [],
      auto_extended_count: 0,
      session_timeout_hours: 24
      // started_at, last_message_at, updated_at will be auto-generated
    };

    const { data: createdSession, error: createError } = await supabase
      .from('sessions')
      .insert(newSession)
      .select()
      .single();

    if (createError) {
      console.error('Supabase error creating session:', createError);
      return NextResponse.json(
        { error: createError.message || 'Failed to create session' },
        { status: 500 }
      );
    }

    return NextResponse.json(createdSession, { status: 201 });

  } catch (error) {
    console.error('Session creation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
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
      const { data: session, error } = await supabase
        .from('sessions')
        .select('*')
        .eq('session_id', sessionId)
        .single();

      if (error || !session) {
        return NextResponse.json(
          { error: 'Session not found' },
          { status: 404 }
        );
      }
      return NextResponse.json(session);
    }

    if (userId) {
      const { data: sessions, error } = await supabase
        .from('sessions')
        .select('*')
        .eq('user_id', userId)
        .order('started_at', { ascending: false });

      if (error) {
        throw error;
      }

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