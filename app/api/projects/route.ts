import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { verifyAuth } from '@/lib/auth-middleware';
import { successResponse, errorResponse } from '@/lib/api-response';

const projectSchema = z.object({
  name: z.string().min(1),
  event_type: z.string(),
  description: z.string().optional().nullable(),
  template_id: z.string().optional().nullable(),
  elements: z.array(z.any()).optional(),
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return errorResponse('UNAUTHORIZED', 'Session expired, please login again', 401);
    }

    const body = await request.json();
    console.log('--- Project Creation Debug ---');
    console.log('User ID:', user.id);
    console.log('Payload:', JSON.stringify(body, null, 2));

    const validated = projectSchema.parse(body);

    // Insert into DB
    const insertData = {
      user_id: user.id,
      name: validated.name,
      event_type: validated.event_type.toLowerCase(),
      description: validated.description || null,
      template_id: validated.template_id || null,
      elements: validated.elements || [],
      status: 'draft',
    };

    const { data: project, error: dbError } = await supabase
      .from('projects')
      .insert([insertData])
      .select()
      .single();

    if (dbError) {
      console.error('Database Insert Error:', dbError);
      return errorResponse('DATABASE_ERROR', dbError.message, 500, dbError);
    }

    console.log('Project created successfully:', project.id);
    return successResponse(project, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
        const firstError = error.issues[0];
        const errorMsg = firstError ? `${firstError.path.join('.')}: ${firstError.message}` : 'Invalid project data';
        return errorResponse('VALIDATION_ERROR', errorMsg, 400, error.issues);
    }
    console.error('Create project error:', error);
    return errorResponse('SERVER_ERROR', (error as any).message || 'Failed to create project', 500, error);
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return errorResponse('UNAUTHORIZED', 'Not authenticated', 401);
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const perPage = parseInt(searchParams.get('per_page') || '20');
    const status = searchParams.get('status');
    const eventType = searchParams.get('event_type');
    const search = searchParams.get('search');
    const sort = searchParams.get('sort') || '-created_at';

    let query = supabase
      .from('projects')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id);

    if (status) query = query.eq('status', status);
    if (eventType) query = query.eq('event_type', eventType);
    if (search) query = query.ilike('name', `%${search}%`);

    const { data: projects, error, count } = await query
      .order(sort.startsWith('-') ? sort.slice(1) : sort, {
        ascending: !sort.startsWith('-'),
      })
      .range((page - 1) * perPage, page * perPage - 1);

    if (error) throw error;

    return NextResponse.json({
      status: 'success',
      data: projects,
      pagination: {
        page,
        per_page: perPage,
        total: count || 0,
        total_pages: Math.ceil((count || 0) / perPage),
      },
    });
  } catch (error) {
    console.error('Get projects error:', error);
    return errorResponse('SERVER_ERROR', 'Failed to get projects', 500);
  }
}
