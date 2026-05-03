import { NextRequest, NextResponse } from 'next/server';
import { certificateQueue } from '@/lib/queue';
import { verifyAuth } from '@/lib/auth-middleware';
import { successResponse, errorResponse } from '@/lib/api-response';

export async function POST(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return errorResponse('UNAUTHORIZED', 'Authentication required', 401);
    }

    const body = await request.json();
    const { project_id, upload_id, ai_enabled } = body;

    if (!project_id || !upload_id) {
      return errorResponse('VALIDATION_ERROR', 'Missing project_id or upload_id');
    }

    // Get user and their plan details
    const { createAdminClient } = await import('@/lib/supabase/admin');
    const { getPlanDetails } = await import('@/lib/subscriptions');
    const admin = createAdminClient();
    
    const { data: profile, error: profileError } = await admin
      .from('users')
      .select('plan, certificates_this_month')
      .eq('id', user.id)
      .single();
      
    if (profileError || !profile) {
      return errorResponse('SERVER_ERROR', 'Failed to verify user status');
    }
    
    const plan = getPlanDetails(profile.plan);
    const remaining = plan.limit - (profile.certificates_this_month || 0);
    
    // Get batch size
    const { data: upload, error: uploadError } = await admin
      .from('batch_uploads')
      .select('recipient_count')
      .eq('id', upload_id)
      .single();
      
    if (uploadError || !upload) {
      return errorResponse('VALIDATION_ERROR', 'Batch upload not found');
    }
    
    const count = upload.recipient_count || 0;
    if (count > remaining) {
      return errorResponse('QUOTA_EXCEEDED', `Batch size (${count}) exceeds remaining monthly quota (${remaining}). Please upgrade your plan.`);
    }

    // Add job to queue
    const job = await certificateQueue.add('generate-certificates', {
      projectId: project_id,
      uploadId: upload_id,
      userId: user.id,
      aiEnabled: ai_enabled,
      batchSize: count, // Pass batch size to increment usage later
    });

    return successResponse({
      batch_id: job.id,
      status: 'processing',
      created_at: new Date().toISOString(),
    }, 202);
  } catch (error) {
    console.error('Batch error:', error);
    return errorResponse('SERVER_ERROR', 'Failed to start batch', 500);
  }
}
