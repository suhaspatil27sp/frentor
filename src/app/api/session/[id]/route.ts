//src/app/api/session/[id]/route.ts
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
    const { data: session, error: fetchError } = await supabase
      .from('sessions')
      .select('*')
      .eq('session_id', sessionId)
      .single();

    if (fetchError || !session) {
      console.error('Session fetch error:', fetchError);
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // Handle session ending
    if (body.end_reason) {
      const { data: updatedSession, error: updateError } = await supabase
        .from('sessions')
        .update({
          is_active: false,
          ended_at: new Date().toISOString(),
          end_reason: body.end_reason,
          updated_at: new Date().toISOString()
        })
        .eq('session_id', sessionId)
        .select()
        .single();

      if (updateError) {
        console.error('Session update error:', updateError);
        return NextResponse.json(
          { error: updateError.message || 'Failed to update session' },
          { status: 500 }
        );
      }

      return NextResponse.json(updatedSession);
    }

    // Handle other session updates
    const updates: any = {
      last_message_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    if (body.current_concept !== undefined) {
      updates.current_concept = body.current_concept;
    }
    
    if (body.concepts_covered !== undefined) {
      updates.concepts_covered = body.concepts_covered;
    }
    
    if (body.auto_extended_count !== undefined) {
      updates.auto_extended_count = body.auto_extended_count;
    }

    const { data: updatedSession, error: updateError } = await supabase
      .from('sessions')
      .update(updates)
      .eq('session_id', sessionId)
      .select()
      .single();

    if (updateError) {
      console.error('Session update error:', updateError);
      return NextResponse.json(
        { error: updateError.message || 'Failed to update session' },
        { status: 500 }
      );
    }

    return NextResponse.json(updatedSession);

  } catch (error) {
    console.error('Session update error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
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
    const { data: session, error: fetchError } = await supabase
      .from('sessions')
      .select('*')
      .eq('session_id', sessionId)
      .single();

    if (fetchError || !session) {
      console.error('Session fetch error:', fetchError);
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // End the session instead of deleting (for data integrity)
    const { data: endedSession, error: updateError } = await supabase
      .from('sessions')
      .update({
        is_active: false,
        ended_at: new Date().toISOString(),
        end_reason: 'deleted',
        updated_at: new Date().toISOString()
      })
      .eq('session_id', sessionId)
      .select()
      .single();

    if (updateError) {
      console.error('Session delete error:', updateError);
      return NextResponse.json(
        { error: updateError.message || 'Failed to end session' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ 
      message: 'Session ended successfully',
      session: endedSession 
    });

  } catch (error) {
    console.error('Session deletion error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}