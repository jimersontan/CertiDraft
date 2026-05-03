import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { errorResponse, successResponse } from '@/lib/api-response';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const refreshToken = request.cookies.get('refresh_token')?.value;

    if (refreshToken) {
      // Remove session from database
      await supabase
        .from('sessions')
        .delete()
        .eq('refresh_token', refreshToken);
    }

    const response = successResponse({ message: 'Logged out successfully' });

    // Clear refresh token cookie
    response.cookies.set('refresh_token', '', {
      httpOnly: true,
      maxAge: 0,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Logout error:', error);
    return errorResponse('SERVER_ERROR', 'Failed to logout', 500);
  }
}
