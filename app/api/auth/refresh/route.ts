import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generateToken, verifyToken } from '@/lib/jwt';
import { errorResponse, successResponse } from '@/lib/api-response';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const refreshToken = request.cookies.get('refresh_token')?.value;

    if (!refreshToken) {
      return errorResponse('UNAUTHORIZED', 'Refresh token missing', 401);
    }

    // Verify token
    const payload = verifyToken(refreshToken);
    if (!payload) {
      return errorResponse('INVALID_TOKEN', 'Invalid refresh token', 401);
    }

    // Check session in database
    const { data: session, error } = await supabase
      .from('sessions')
      .select('*, users(*)')
      .eq('refresh_token', refreshToken)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (error || !session) {
      return errorResponse('SESSION_EXPIRED', 'Session expired or not found', 401);
    }

    const user = session.users;

    // Generate new access token
    const accessToken = generateToken(user.id, user.email, user.plan);

    return successResponse({
      access_token: accessToken,
      expires_in: 86400,
    });
  } catch (error) {
    console.error('Refresh error:', error);
    return errorResponse('SERVER_ERROR', 'Failed to refresh token', 500);
  }
}
