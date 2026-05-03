import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { generateToken, generateRefreshToken } from '@/lib/jwt';
import { errorResponse } from '@/lib/api-response';

const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string(),
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = loginSchema.parse(body);

    // Get user
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', validated.email)
      .single();

    if (error || !user) {
      return errorResponse('INVALID_CREDENTIALS', 'Invalid email or password', 401);
    }

    // Verify password
    const isValid = await bcrypt.compare(validated.password, user.password_hash);
    if (!isValid) {
      return errorResponse('INVALID_CREDENTIALS', 'Invalid email or password', 401);
    }

    // Generate tokens
    const accessToken = generateToken(user.id, user.email, user.plan);
    const refreshToken = generateRefreshToken(user.id);

    // Update session
    await supabase.from('sessions').insert([
      {
        user_id: user.id,
        refresh_token: refreshToken,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ]);

    const response = NextResponse.json(
      {
        status: 'success',
        message: 'Login successful',
        data: {
          id: user.id,
          email: user.email,
          full_name: user.full_name,
          plan: user.plan,
        },
        access_token: accessToken,
        refresh_token: refreshToken,
        expires_in: 86400,
      },
      { status: 200 }
    );

    response.cookies.set('refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    });

    return response;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse('VALIDATION_ERROR', 'Invalid input', 400, error.issues);
    }

    console.error('Login error:', error);
    return errorResponse('SERVER_ERROR', 'Login failed', 500);
  }
}
