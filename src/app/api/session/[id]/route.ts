import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sessionId = params.id;
    const body = await request.json();

    // Check if session exists
    const session = await supabase.getSessionById(sessionId);
    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // Handle session ending
    if (body.end_reason) {
      const updatedSession = await supabase.endSession(sessionId, body.end_reason);
      return NextResponse.json(updatedSession);
    }

    // Handle other session updates
    const updates: any = {};
    
    if (body.current_concept !== undefined) {
      updates.current_concept = body.current_concept;
    }
    
    if (body.concepts_covered !== undefined) {
      updates.concepts_covered = body.concepts_covered;
    }
    
    if (body.auto_extended_count !== undefined) {
      updates.auto_extended_count = body.auto_extended_count;
    }

    const updatedSession = await supabase.updateSession(sessionId, updates);
    return NextResponse.json(updatedSession);

  } catch (error) {
    console.error('Session update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sessionId = params.id;

    // Check if session exists
    const session = await supabase.getSessionById(sessionId);
    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // End the session instead of deleting (for data integrity)
    const endedSession = await supabase.endSession(sessionId, 'deleted');
    
    return NextResponse.json({ 
      message: 'Session ended successfully',
      session: endedSession 
    });

  } catch (error) {
    console.error('Session deletion error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}