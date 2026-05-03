import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { verifyAuth } from '@/lib/auth-middleware';
import { errorResponse, successResponse } from '@/lib/api-response';

export async function POST(request: NextRequest) {
  try {
    const userAuth = await verifyAuth(request);
    if (!userAuth) {
      return errorResponse('UNAUTHORIZED', 'Authentication required', 401);
    }

    const admin = createAdminClient();

    // Increment certificates_this_month
    const { data: updatedUser, error } = await admin.rpc('increment_usage', { user_id: userAuth.id });
    
    // If RPC doesn't exist, use manual update
    if (error) {
      console.warn('RPC increment_usage failed, falling back to manual update:', error);
      
      // Get current usage first to be safe, but a direct update is faster
      const { data: user, error: fetchError } = await admin
        .from('users')
        .select('certificates_this_month')
        .eq('id', userAuth.id)
        .single();
        
      if (fetchError) throw fetchError;
      
      const { data: finalUser, error: updateError } = await admin
        .from('users')
        .update({ certificates_this_month: (user.certificates_this_month || 0) + 1 })
        .eq('id', userAuth.id)
        .select('*')
        .single();
        
      if (updateError) throw updateError;
      
      return successResponse({
        usage: finalUser.certificates_this_month,
        message: 'Usage updated successfully (manual)'
      });
    }

    return successResponse({
      usage: updatedUser,
      message: 'Usage updated successfully'
    });
  } catch (error: any) {
    console.error('Update usage error:', error);
    return errorResponse('SERVER_ERROR', `Failed to update usage: ${error.message}`, 500);
  }
}
