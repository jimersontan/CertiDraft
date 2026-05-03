import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { successResponse, errorResponse } from '@/lib/api-response';
import { fallbackTemplates } from '@/lib/templates';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { data: templates, error } = await supabase
      .from('templates')
      .select('*');

    if (error) {
      console.warn('Templates table error, returning fallback templates:', error.message);
      return successResponse(fallbackTemplates);
    }

    if (!templates || templates.length === 0) {
      return successResponse(fallbackTemplates);
    }

    return successResponse(templates);
  } catch (error) {
    console.error('Get templates error:', error);
    // Fallback to static templates if DB fails
    return successResponse(fallbackTemplates);
  }
}
