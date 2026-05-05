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

    // Only include columns that exist in the DB schema
    const insertData = {
      name: body.name,
      category: body.category,
      description: body.description,
      accent_color: body.accent_color,
      secondary_color: body.secondary_color,
      is_featured: body.is_featured || false,
      industry: body.industry || "",
      style: body.style || "Modern",
      elements: body.elements || [],
      created_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('templates')
      .insert(insertData)
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
    const { id, ...bodyData } = body;

    if (!id) {
      return NextResponse.json({ status: 'error', message: 'Missing template ID' }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Map fields and filter out unknowns
    const updateData: any = {};
    if (bodyData.name) updateData.name = bodyData.name;
    if (bodyData.category) updateData.category = bodyData.category;
    if (bodyData.description) updateData.description = bodyData.description;
    if (bodyData.accent_color) updateData.accent_color = bodyData.accent_color;
    if (bodyData.secondary_color) updateData.secondary_color = bodyData.secondary_color;
    if (bodyData.is_featured !== undefined) updateData.is_featured = bodyData.is_featured;
    if (bodyData.industry) updateData.industry = bodyData.industry;
    if (bodyData.style) updateData.style = bodyData.style;
    if (bodyData.elements) updateData.elements = bodyData.elements;

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
