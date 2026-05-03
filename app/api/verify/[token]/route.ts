import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { successResponse, errorResponse } from '@/lib/api-response';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    // Get certificate by verification token
    const { data: certificate, error } = await supabase
      .from('certificates')
      .select('*')
      .eq('verification_token', token)
      .single();

    if (error || !certificate) {
      return errorResponse('INVALID_TOKEN', 'Certificate not found', 404);
    }

    // Log verification
    try {
      await supabase.from('verifications').insert([
        {
          certificate_id: certificate.id,
          verified_at: new Date().toISOString(),
          ip_address: request.headers.get('x-forwarded-for') || 'unknown',
        },
      ]);
    } catch (e) {
      console.error('Failed to log verification:', e);
    }

    return successResponse({
      is_valid: true,
      recipient_name: certificate.recipient_name,
      achievement: certificate.achievement_text,
      issue_date: certificate.created_at,
      organization: 'CertiDraft',
    });
  } catch (error) {
    console.error('Verification error:', error);
    return errorResponse('SERVER_ERROR', 'Verification failed', 500);
  }
}
