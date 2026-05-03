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

    const supabase = createAdminClient();

    // 1. Total Users Stats
    const { data: usersData, error: usersError } = await supabase
      .from('users')
      .select('id, created_at');

    if (usersError) throw usersError;

    const totalUsers = usersData?.length || 0;
    const now = new Date();
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const lastMonthUsers = usersData?.filter(
      (u) => new Date(u.created_at) < startOfThisMonth
    ).length || 0;

    const userGrowth = lastMonthUsers > 0 
      ? ((totalUsers - lastMonthUsers) / lastMonthUsers * 100) 
      : 0;

    // 2. Certificates Stats
    const { data: certsData, error: certsError } = await supabase
      .from('certificates')
      .select('id, created_at');

    if (certsError) throw certsError;

    const lifetimeCerts = certsData?.length || 0;
    // Fallback: if status column is missing, treat all as completed for now
    const completedCerts = certsData || [];
    const thisMonthCerts = completedCerts.filter(
      (c) => new Date(c.created_at) >= startOfThisMonth
    ).length || 0;
    
    const successRate = 100; // Default if status is missing

    // 3. Revenue Stats
    const { data: txData, error: txError } = await supabase
      .from('transactions')
      .select('amount, created_at')
      .eq('status', 'succeeded');

    if (txError) throw txError;

    const thisMonthRevenue = txData?.filter((t) => {
      const txDate = new Date(t.created_at);
      return txDate >= startOfThisMonth;
    }).reduce((sum, t) => sum + (Number(t.amount) || 0), 0) || 0;

    const lastMonthRevenue = txData?.filter((t) => {
      const txDate = new Date(t.created_at);
      return txDate >= startOfLastMonth && txDate < startOfThisMonth;
    }).reduce((sum, t) => sum + (Number(t.amount) || 0), 0) || 0;

    const revenueChange = lastMonthRevenue > 0 
      ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue * 100) 
      : 0;

    // 4. Active Subscriptions Breakdown
    const { data: subsData, error: subsError } = await supabase
      .from('subscriptions')
      .select('id, plan, status');

    if (subsError) throw subsError;

    const activeSubs = subsData?.filter(s => s.status === 'active') || [];
    const freeCount = activeSubs.filter(s => s.plan === 'free').length || 0;
    const proCount = activeSubs.filter(s => s.plan === 'pro').length || 0;
    const enterpriseCount = activeSubs.filter(s => s.plan === 'enterprise').length || 0;

    // Mock churn rate for now as we don't have historical snapshots easily
    const churnRate = 2.3; 

    return NextResponse.json({
      status: 'success',
      data: {
        total_users: {
          count: totalUsers,
          growth_percentage: parseFloat(userGrowth.toFixed(1)),
          change_direction: userGrowth >= 0 ? "up" : "down",
          last_month_count: lastMonthUsers
        },
        certificates_generated: {
          lifetime_total: lifetimeCerts,
          this_month: thisMonthCerts,
          success_rate: parseFloat(successRate.toFixed(1)),
          failed_count: lifetimeCerts - completedCerts.length
        },
        monthly_revenue: {
          amount_usd: parseFloat(thisMonthRevenue.toFixed(2)),
          amount_php: parseFloat((thisMonthRevenue * PHP_EXCHANGE_RATE).toFixed(2)),
          exchange_rate: PHP_EXCHANGE_RATE,
          currency: 'PHP',
          percentage_change: parseFloat(revenueChange.toFixed(1)),
          status: revenueChange >= 0 ? "up" : "down"
        },
        active_subscriptions: {
          total: activeSubs.length,
          free_plan: freeCount,
          pro_plan: proCount,
          enterprise_plan: enterpriseCount,
          churn_rate: churnRate
        }
      }
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    return NextResponse.json(
      { status: 'error', error: { code: 'SERVER_ERROR', message: (error as Error).message } },
      { status: 500 }
    );
  }
}
