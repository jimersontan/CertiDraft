import { NextRequest, NextResponse } from 'next/server';
import { certificateQueue } from '@/lib/queue';
import { verifyAuth } from '@/lib/auth-middleware';
import { successResponse, errorResponse } from '@/lib/api-response';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ batchId: string }> }
) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return errorResponse('UNAUTHORIZED', 'Authentication required', 401);
    }

    const { batchId } = await params;

    // Get job status
    const job = await certificateQueue.getJob(batchId);
    if (!job) {
      return errorResponse('NOT_FOUND', 'Batch not found', 404);
    }

    const state = await job.getState();
    const progress = job.progress;

    return successResponse({
      batch_id: job.id,
      status: state,
      progress_percentage: progress,
      data: job.data,
      returnvalue: job.returnvalue,
    });
  } catch (error) {
    console.error('Get batch error:', error);
    return errorResponse('SERVER_ERROR', 'Failed to get batch status', 500);
  }
}
