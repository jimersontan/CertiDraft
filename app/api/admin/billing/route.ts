import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { verifyAdminAccess } from '@/lib/admin-middleware';

const PHP_EXCHANGE_RATE = 55.4;

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
    const perPage = parseInt(searchParams.get('per_page') || '20');

    const supabase = createAdminClient();

    // 1. Billing Metrics
    const { data: subs } = await supabase
      .from('subscriptions')
      .select('price, billing_cycle, status')
      .eq('status', 'active');

    const mrrUsd = subs?.reduce((sum, s) => {
      const price = Number(s.price) || 0;
      return sum + (s.billing_cycle === 'yearly' ? price / 12 : price);
    }, 0) || 0;

    const { data: txsYtd } = await supabase
      .from('transactions')
      .select('amount')
      .eq('status', 'succeeded')
      .gte('created_at', new Date(new Date().getFullYear(), 0, 1).toISOString());

    const totalRevenueYtd = txsYtd?.reduce((sum, t) => sum + (Number(t.amount) || 0), 0) || 0;

    // 2. Transactions History
    const { data: transactions, count, error: txError } = await supabase
      .from('transactions')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range((page - 1) * perPage, page * perPage - 1);

    if (txError) throw txError;

    // Fetch related users and subscriptions manually
    const userIds = [...new Set(transactions?.map(t => t.user_id).filter(Boolean))];
    const subIds = [...new Set(transactions?.map(t => t.subscription_id).filter(Boolean))];
    
    let usersMap: Record<string, any> = {};
    let subsMap: Record<string, any> = {};

    if (userIds.length > 0) {
      const { data: usersData } = await supabase.from('users').select('id, email, full_name').in('id', userIds);
      usersMap = (usersData || []).reduce((acc: any, u: any) => { acc[u.id] = u; return acc; }, {});
    }

    if (subIds.length > 0) {
      const { data: subsData } = await supabase.from('subscriptions').select('id, plan').in('id', subIds);
      subsMap = (subsData || []).reduce((acc: any, s: any) => { acc[s.id] = s; return acc; }, {});
    }

    const formattedTransactions = transactions?.map(t => {
      const user = usersMap[t.user_id];
      const subscription = subsMap[t.subscription_id];
      return {
        ...t,
        user_email: user?.email,
        user_name: user?.full_name,
        plan: subscription?.plan,
        amount_usd: parseFloat(Number(t.amount).toFixed(2)),
        amount_php: parseFloat((Number(t.amount) * PHP_EXCHANGE_RATE).toFixed(2))
      };
    }) || [];

    return NextResponse.json({
      status: 'success',
      data: {
        metrics: {
          mrr_usd: parseFloat(mrrUsd.toFixed(2)),
          mrr_php: parseFloat((mrrUsd * PHP_EXCHANGE_RATE).toFixed(2)),
          total_revenue_ytd_usd: parseFloat(totalRevenueYtd.toFixed(2)),
          total_revenue_ytd_php: parseFloat((totalRevenueYtd * PHP_EXCHANGE_RATE).toFixed(2)),
          active_paid_subscriptions: subs?.filter(s => s.price > 0).length || 0
        },
        transactions: formattedTransactions,
        pagination: {
          page,
          per_page: perPage,
          total: count || 0,
          total_pages: Math.ceil((count || 0) / perPage)
        }
      }
    });
  } catch (error) {
    console.error('Billing error:', error);
    return NextResponse.json(
      { status: 'error', error: { code: 'SERVER_ERROR', message: (error as Error).message } },
      { status: 500 }
    );
  }
}
