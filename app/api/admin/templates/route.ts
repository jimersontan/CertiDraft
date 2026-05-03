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

    const { data: templates, error } = await supabase
      .from('templates')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({
      status: 'success',
      data: templates || []
    });
  } catch (error) {
    console.error('Get templates error:', error);
    return NextResponse.json(
      { status: 'error', error: { code: 'SERVER_ERROR', message: (error as Error).message } },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { admin, error: authError } = await verifyAdminAccess(request);
    if (authError || !admin) {
      return NextResponse.json(
        { status: 'error', error: { code: 'UNAUTHORIZED' } },
        { status: 401 }
      );
    }

    const body = await request.json();
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from('templates')
      .insert({
        ...body,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    // Log the action
    await supabase.from('audit_logs').insert({
      admin_id: admin.id,
      action: 'create_template',
      target_type: 'template',
      target_id: data.id,
      changes: body
    });

    return NextResponse.json({
      status: 'success',
      data
    });
  } catch (error) {
    console.error('Create template error:', error);
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
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ status: 'error', message: 'Missing template ID' }, { status: 400 });
    }

    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from('templates')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Log the action
    await supabase.from('audit_logs').insert({
      admin_id: admin.id,
      action: 'update_template',
      target_type: 'template',
      target_id: id,
      changes: updateData
    });

    return NextResponse.json({
      status: 'success',
      data
    });
  } catch (error) {
    console.error('Update template error:', error);
    return NextResponse.json(
      { status: 'error', error: { code: 'SERVER_ERROR', message: (error as Error).message } },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { admin, error: authError } = await verifyAdminAccess(request);
    if (authError || !admin) {
      return NextResponse.json(
        { status: 'error', error: { code: 'UNAUTHORIZED' } },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const templateId = searchParams.get('id');

    if (!templateId) {
      return NextResponse.json({ status: 'error', message: 'Missing template ID' }, { status: 400 });
    }

    const supabase = createAdminClient();

    const { error } = await supabase
      .from('templates')
      .delete()
      .eq('id', templateId);

    if (error) throw error;

    // Log the action
    await supabase.from('audit_logs').insert({
      admin_id: admin.id,
      action: 'delete_template',
      target_type: 'template',
      target_id: templateId
    });

    return NextResponse.json({
      status: 'success',
      message: 'Template deleted successfully'
    });
  } catch (error) {
    console.error('Delete template error:', error);
    return NextResponse.json(
      { status: 'error', error: { code: 'SERVER_ERROR', message: (error as Error).message } },
      { status: 500 }
    );
  }
}
