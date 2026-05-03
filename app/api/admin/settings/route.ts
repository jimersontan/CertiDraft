import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { verifyAdminAccess } from '@/lib/admin-middleware';

export async function GET(request: NextRequest) {
  try {
    const { admin, error: authError } = await verifyAdminAccess(request);
    if (authError || !admin) {
      return NextResponse.json(
        { status: 'error', error: { code: 'UNAUTHORIZED' } },
        { status: 401 }
      );
    }

    const supabase = createAdminClient();

    const { data: settings, error } = await supabase
      .from('system_settings')
      .select('*');

    if (error) throw error;

    // Convert array of {key, value} to object { [key]: value }
    const formattedSettings = settings?.reduce((acc: any, s: any) => {
      acc[s.key] = s.value;
      return acc;
    }, {}) || {};

    return NextResponse.json({
      status: 'success',
      data: formattedSettings
    });
  } catch (error) {
    console.error('Get settings error:', error);
    return NextResponse.json(
      { status: 'error', error: { code: 'SERVER_ERROR', message: (error as Error).message } },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { admin, error: authError } = await verifyAdminAccess(request);
    if (authError || !admin) {
      return NextResponse.json(
        { status: 'error', error: { code: 'UNAUTHORIZED' } },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { key, value } = body;

    if (!key || value === undefined) {
      return NextResponse.json({ status: 'error', message: 'Missing key or value' }, { status: 400 });
    }

    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from('system_settings')
      .upsert({ key, value, updated_at: new Date().toISOString() })
      .select()
      .single();

    if (error) throw error;

    // Log the action
    await supabase.from('audit_logs').insert({
      admin_id: admin.id,
      action: 'update_settings',
      target_type: 'settings',
      target_id: null,
      changes: { [key]: value }
    });

    return NextResponse.json({
      status: 'success',
      data
    });
  } catch (error) {
    console.error('Update settings error:', error);
    return NextResponse.json(
      { status: 'error', error: { code: 'SERVER_ERROR', message: (error as Error).message } },
      { status: 500 }
    );
  }
}
