import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyAuth } from '@/lib/auth-middleware';
import { errorResponse } from '@/lib/api-response';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ batchId: string; certId: string }> }
) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return errorResponse('UNAUTHORIZED', 'Authentication required', 401);
    }

    const { batchId, certId } = await params;

    // Get PDF from storage
    const { data, error } = await supabase.storage
      .from('certificates')
      .download(`batch_${batchId}/${certId}.pdf`);

    if (error) {
      console.error('Storage error:', error);
      return errorResponse('NOT_FOUND', 'Certificate file not found', 404);
    }

    const buffer = await data.arrayBuffer();

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${certId}.pdf"`,
      },
    });
  } catch (error) {
    console.error('Download error:', error);
    return errorResponse('SERVER_ERROR', 'Failed to download certificate', 500);
  }
}
