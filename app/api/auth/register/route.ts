import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { generateToken, generateRefreshToken } from '@/lib/jwt';
import { errorResponse } from '@/lib/api-response';

const registerSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be 8+ characters'),
  full_name: z.string().min(2, 'Name required'),
  company: z.string().optional(),
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const validated = registerSchema.parse(body);

    // Check if user exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', validated.email)
      .single();

    if (existingUser) {
      return errorResponse('USER_EXISTS', 'Email already registered', 409);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(validated.password, 10);

    // Create user
    const { data: newUser, error: createError } = await supabase
      .from('users')
      .insert([
        {
          email: validated.email,
          password_hash: hashedPassword,
          full_name: validated.full_name,
          company: validated.company || null,
          plan: 'free',
          email_verified: false,
        },
      ])
      .select('id, email, full_name, plan')
      .single();

    if (createError) throw createError;

    // Generate tokens
    const accessToken = generateToken(newUser.id, newUser.email, newUser.plan);
    const refreshToken = generateRefreshToken(newUser.id);

    // Store refresh token in database (Session Management)
    await supabase.from('sessions').insert([
      {
        user_id: newUser.id,
        refresh_token: refreshToken,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ]);

    const response = NextResponse.json(
      {
        status: 'success',
        message: 'User registered successfully',
        data: newUser,
        access_token: accessToken,
        refresh_token: refreshToken,
        expires_in: 86400,
      },
      { status: 201 }
    );

    // Set refresh token in httpOnly cookie
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

    console.error('Register error:', error);
    return errorResponse('SERVER_ERROR', 'Failed to register user', 500);
  }
}
