import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth-middleware';
import { errorResponse, successResponse } from '@/lib/api-response';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: NextRequest) {
  try {
    const userAuth = await verifyAuth(request);
    console.log('Upgrade Auth:', userAuth);
    if (!userAuth) {
      return errorResponse('UNAUTHORIZED', 'Authentication required', 401);
    }

    const body = await request.json();
    const { plan, billingCycle } = body;
    console.log('Upgrade Plan:', plan, 'Cycle:', billingCycle);

    if (!plan) {
      return errorResponse('BAD_REQUEST', 'Plan is required', 400);
    }

    // Calculate expiration date
    let expiresAt = null;
    if (plan !== 'free') {
      const now = new Date();
      if (billingCycle === 'yearly') {
        now.setFullYear(now.getFullYear() + 1);
      } else {
        now.setMonth(now.getMonth() + 1);
      }
      expiresAt = now.toISOString();
    }

    const admin = createAdminClient();
    console.log('Attempting DB update for user:', userAuth.id);
    
    const { data: updatedUser, error } = await admin
      .from('users')
      .update({ 
        plan,
        plan_expires_at: expiresAt
      })
      .eq('id', userAuth.id)
      .select('*')
      .single();

    if (error) {
      console.error('DB Update Error:', error);
      throw error;
    }

    console.log('DB Update Success:', updatedUser);
    return successResponse({
      id: updatedUser.id,
      email: updatedUser.email,
      full_name: updatedUser.full_name,
      plan: updatedUser.plan,
      plan_expires_at: updatedUser.plan_expires_at,
      success: true,
      message: 'Subscription updated successfully'
    });
  } catch (error: any) {
    console.error('Upgrade Error Detail:', error.message || error);
    return errorResponse('SERVER_ERROR', `Failed to update subscription: ${error.message || 'Unknown error'}`, 500);
  }
}
