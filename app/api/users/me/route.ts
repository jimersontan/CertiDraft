import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyAuth } from '@/lib/auth-middleware';
import { errorResponse, successResponse } from '@/lib/api-response';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const userAuth = await verifyAuth(request);
    if (!userAuth) {
      return errorResponse('UNAUTHORIZED', 'Authentication required', 401);
    }

    // First try to find existing user - use * to avoid column-not-found errors
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userAuth.id)
      .maybeSingle();

    if (error) {
      console.error('User fetch error:', error);
      return errorResponse('SERVER_ERROR', 'Database query failed', 500);
    }

    if (user) {
      // Logic for monthly usage reset
      let certificatesThisMonth = user.certificates_this_month || 0;
      let lastReset = user.last_usage_reset ? new Date(user.last_usage_reset) : new Date(user.created_at);
      const now = new Date();
      
      // If more than 30 days have passed since last reset
      const thirtyDays = 30 * 24 * 60 * 60 * 1000;
      if (now.getTime() - lastReset.getTime() > thirtyDays) {
        certificatesThisMonth = 0;
        lastReset = now;
        
        // Update in DB (fire and forget or await?)
        await supabase
          .from('users')
          .update({ 
            certificates_this_month: 0, 
            last_usage_reset: now.toISOString() 
          })
          .eq('id', user.id);
      }

      return successResponse({
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        company: user.company || null,
        plan: user.plan || 'free',
        plan_expires_at: user.plan_expires_at || null,
        certificates_this_month: certificatesThisMonth,
        last_usage_reset: lastReset.toISOString(),
        avatar_url: user.avatar_url || null,
        email_verified: user.email_verified || false,
        created_at: user.created_at,
      });
    }

    // User doesn't exist yet — create with defaults (never overwrite existing data)
    console.log('Creating new user profile for:', userAuth.id);
    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert({
        id: userAuth.id,
        email: userAuth.email,
        full_name: 'New User',
        plan: 'free',
      })
      .select('*')
      .single();

    if (insertError || !newUser) {
      console.error('User creation error:', insertError);
      return errorResponse('SERVER_ERROR', 'Failed to create user profile', 500);
    }

    return successResponse({
      id: newUser.id,
      email: newUser.email,
      full_name: newUser.full_name,
      company: newUser.company || null,
      plan: newUser.plan || 'free',
      plan_expires_at: newUser.plan_expires_at || null,
      avatar_url: newUser.avatar_url || null,
      email_verified: newUser.email_verified || false,
      created_at: newUser.created_at,
    });
  } catch (error) {
    console.error('Get profile error:', error);
    return errorResponse('SERVER_ERROR', 'Failed to get profile', 500);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const userAuth = await verifyAuth(request);
    if (!userAuth) {
      return errorResponse('UNAUTHORIZED', 'Authentication required', 401);
    }

    const body = await request.json();
    const { full_name, company, avatar_url } = body;

    const { data: updatedUser, error } = await supabase
      .from('users')
      .update({
        full_name,
        company,
        avatar_url,
      })
      .eq('id', userAuth.id)
      .select('id, email, full_name, company, plan, avatar_url')
      .single();

    if (error) throw error;

    return successResponse(updatedUser);
  } catch (error) {
    console.error('Update profile error:', error);
    return errorResponse('SERVER_ERROR', 'Failed to update profile', 500);
  }
}
