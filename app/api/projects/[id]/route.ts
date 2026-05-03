import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyAuth } from '@/lib/auth-middleware';
import { successResponse, errorResponse } from '@/lib/api-response';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET SINGLE PROJECT
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return errorResponse('UNAUTHORIZED', 'Not authenticated', 401);
    }

    const { id } = await params;

    const { data: project, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (error || !project) {
      return errorResponse('NOT_FOUND', 'Project not found', 404);
    }

    return successResponse(project);
  } catch (error) {
    console.error('Get project error:', error);
    return errorResponse('SERVER_ERROR', 'Failed to get project', 500);
  }
}

// UPDATE PROJECT
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return errorResponse('UNAUTHORIZED', 'Not authenticated', 401);
    }

    const { id } = await params;
    const body = await request.json();

    const { data: project, error } = await supabase
      .from('projects')
      .update({
        ...body,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error || !project) {
      return errorResponse('NOT_FOUND', 'Project not found', 404);
    }

    return successResponse(project);
  } catch (error) {
    console.error('Update project error:', error);
    return errorResponse('SERVER_ERROR', 'Failed to update project', 500);
  }
}

// DELETE PROJECT
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return errorResponse('UNAUTHORIZED', 'Not authenticated', 401);
    }

    const { id } = await params;

    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) throw error;

    return successResponse({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Delete project error:', error);
    return errorResponse('SERVER_ERROR', 'Failed to delete project', 500);
  }
}
