//src/app/api/user/route.ts
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.first_name || !body.age || !body.grade_level) {
      return NextResponse.json(
        { error: 'first_name, age, and grade_level are required' },
        { status: 400 }
      );
    }

    // Create new user object
    const newUser = {
      user_id: uuidv4(),
      username: body.username || `student_${Date.now()}`,
      first_name: body.first_name,
      last_name: body.last_name || '',
      age: body.age,
      grade_level: body.grade_level,
      education_board: body.education_board || 'OTHER',
      preferred_language: body.preferred_language || 'en',
      timezone: body.timezone || 'Asia/Kolkata',
      facts_opt_in: body.facts_opt_in !== undefined ? body.facts_opt_in : true,
      onboarding_completed: body.onboarding_completed !== undefined ? body.onboarding_completed : true,
      created_at: new Date().toISOString(),
      is_active: true
    };

    // Store user in database
    const { data: createdUser, error } = await supabase
      .from('users')
      .insert(newUser)
      .select()
      .single();

    if (error) {
      console.error('Error creating user:', error);
      throw error;
    }

    return NextResponse.json(createdUser, { status: 201 });

  } catch (error) {
    console.error('User creation error:', error);
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
        { error: 'user_id or username is required' },
        { status: 400 }
      );
    }

    let query = supabase.from('users').select('*');

    if (userId) {
      query = query.eq('user_id', userId);
    } else if (username) {
      query = query.eq('username', username);
    }

    const { data: user, error } = await query.single();

    if (error || !user) {
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