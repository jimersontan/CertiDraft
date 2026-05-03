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

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const perPage = parseInt(searchParams.get('per_page') || '50');
    const plan = searchParams.get('plan');
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    const supabase = createAdminClient();

    let query = supabase
      .from('users')
      .select(
        `
        id,
        email,
        full_name,
        plan,
        status,
        profile_picture,
        created_at,
        last_login
      `,
        { count: 'exact' }
      )
      .is('deleted_at', null);

    if (plan && plan !== 'All') query = query.eq('plan', plan.toLowerCase());
    if (status && status !== 'All') query = query.eq('status', status.toLowerCase());
    
    if (search) {
      query = query.or(`email.ilike.%${search}%,full_name.ilike.%${search}%`);
    }

    const { data: users, count, error: queryError } = await query
      .order('created_at', { ascending: false })
      .range((page - 1) * perPage, page * perPage - 1);

    if (queryError) throw queryError;

    // Get certificate counts for these users
    const userIds = users?.map(u => u.id) || [];
    const { data: certCounts } = await supabase
      .from('certificates')
      .select('user_id')
      .in('user_id', userIds)
      .eq('status', 'completed');

    const formattedUsers = users?.map((user) => ({
      ...user,
      certificates_count: certCounts?.filter(c => c.user_id === user.id).length || 0,
      avatar_url: user.profile_picture // map for frontend
    })) || [];

    return NextResponse.json({
      status: 'success',
      data: formattedUsers,
      pagination: {
        page,
        per_page: perPage,
        total: count || 0,
        total_pages: Math.ceil((count || 0) / perPage),
      },
    });
  } catch (error) {
    console.error('Get users error:', error);
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
    const { id, plan, status, company, full_name } = body;

    if (!id) {
      return NextResponse.json({ status: 'error', message: 'Missing user ID' }, { status: 400 });
    }

    const supabase = createAdminClient();
    
    const updateData: any = {};
    if (plan) updateData.plan = plan;
    if (status) updateData.status = status;
    if (company !== undefined) updateData.company = company;
    if (full_name !== undefined) updateData.full_name = full_name;

    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Log the action
    await supabase.from('audit_logs').insert({
      admin_id: admin.id,
      action: 'update_user',
      target_type: 'user',
      target_id: id,
      changes: body
    });

    return NextResponse.json({
      status: 'success',
      message: 'User updated successfully',
      data,
    });
  } catch (error) {
    console.error('Update user error:', error);
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
    const userId = searchParams.get('id');

    if (!userId) {
      return NextResponse.json({ status: 'error', message: 'Missing user ID' }, { status: 400 });
    }

    const supabase = createAdminClient();
    
    // Soft delete
    const { error } = await supabase
      .from('users')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', userId);

    if (error) throw error;

    // Log the action
    await supabase.from('audit_logs').insert({
      admin_id: admin.id,
      action: 'soft_delete_user',
      target_type: 'user',
      target_id: userId
    });

    return NextResponse.json({
      status: 'success',
      message: 'User deleted successfully',
    });
  } catch (error) {
    console.error('Delete user error:', error);
    return NextResponse.json(
      { status: 'error', error: { code: 'SERVER_ERROR', message: (error as Error).message } },
      { status: 500 }
    );
  }
}
