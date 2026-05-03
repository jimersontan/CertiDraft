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
    const limit = parseInt(searchParams.get('limit') || '10');

    const supabase = createAdminClient();

    const { data: activities, error } = await supabase
      .from('activity_logs')
      .select('id, action, details, created_at, user_id')
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    // Fetch user info for each activity manually to avoid Join issues
    const userIds = [...new Set(activities?.map(a => a.user_id).filter(Boolean))];
    let usersMap: Record<string, any> = {};
    
    if (userIds.length > 0) {
      const { data: usersData } = await supabase
        .from('users')
        .select('id, full_name, email')
        .in('id', userIds);
      
      usersMap = (usersData || []).reduce((acc: any, u: any) => {
        acc[u.id] = u;
        return acc;
      }, {});
    }

    const formattedActivities = activities?.map((a: any) => {
      const user = usersMap[a.user_id];
      return {
        id: a.id,
        action: a.action,
        user_name: user?.full_name || 'System',
        user_email: user?.email || '',
        details: a.details,
        timestamp: a.created_at
      };
    }) || [];

    return NextResponse.json({
      status: 'success',
      data: {
        recent_activities: formattedActivities
      }
    });
  } catch (error) {
    console.error('Activities error:', error);
    return NextResponse.json(
      { status: 'error', error: { code: 'SERVER_ERROR', message: (error as Error).message } },
      { status: 500 }
    );
  }
}
