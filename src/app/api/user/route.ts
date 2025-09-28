import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { db } from '@/lib/database';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      username,
      first_name,
      last_name,
      age,
      grade_level,
      education_board,
      telegram_user_id,
      preferred_language,
      timezone,
      facts_opt_in,
      onboarding_completed
    } = body;

    // Validation
    if (!first_name || !age || !grade_level) {
      return NextResponse.json(
        { error: 'Missing required fields: first_name, age, grade_level' },
        { status: 400 }
      );
    }

    if (age < 6 || age > 18) {
      return NextResponse.json(
        { error: 'Age must be between 6 and 18' },
        { status: 400 }
      );
    }

    if (grade_level < 6 || grade_level > 12) {
      return NextResponse.json(
        { error: 'Grade level must be between 6 and 12' },
        { status: 400 }
      );
    }

    // Create new user
    const newUser = {
      user_id: uuidv4(),
      telegram_user_id: telegram_user_id || Math.floor(Math.random() * 1000000),
      username: username || `student_${first_name}_${Date.now()}`,
      first_name,
      last_name: last_name || '',
      age,
      grade_level,
      education_board: education_board || 'OTHER',
      preferred_language: preferred_language || 'en',
      timezone: timezone || 'Asia/Kolkata',
      facts_opt_in: facts_opt_in !== undefined ? facts_opt_in : true,
      onboarding_completed: onboarding_completed !== undefined ? onboarding_completed : true,
      created_at: new Date().toISOString(),
      is_active: true
    };

    // Store user in database
    await db.createUser(newUser);

    return NextResponse.json(newUser, { status: 201 });

  } catch (error) {
    console.error('User creation error:', error);
    
    // Check for duplicate username
    if (error instanceof Error && error.message.includes('duplicate')) {
      return NextResponse.json(
        { error: 'Username already exists' },
        { status: 409 }
      );
    }

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
    const username = searchParams.get('username');

    if (!userId && !username) {
      return NextResponse.json(
        { error: 'Either user_id or username is required' },
        { status: 400 }
      );
    }

    const user = userId 
      ? await db.getUserById(userId)
      : await db.getUserByUsername(username!);

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(user);

  } catch (error) {
    console.error('User fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}