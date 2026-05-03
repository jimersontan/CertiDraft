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
    const period = searchParams.get('period') || '30days';

    const supabase = createAdminClient();

    // 1. Certificates Over Time (Last 30 days)
    const { data: certsData } = await supabase
      .from('certificates')
      .select('created_at')
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

    const certsChartData = processTimeSeries(certsData || [], 30);

    // 2. Revenue Trend (Last 6 months)
    const { data: revenueData } = await supabase
      .from('transactions')
      .select('amount, created_at')
      .eq('status', 'succeeded')
      .gte('created_at', new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString());

    const revenueChartData = processMonthlyRevenue(revenueData || []);

    // 3. User Breakdown by Plan
    const { data: planData } = await supabase
      .from('users')
      .select('plan');

    const planBreakdown = {
      free: planData?.filter(u => u.plan === 'free').length || 0,
      pro: planData?.filter(u => u.plan === 'pro').length || 0,
      enterprise: planData?.filter(u => u.plan === 'enterprise').length || 0,
    };

    // 4. Top Templates Used
    const { data: topTemplates } = await supabase
      .from('templates')
      .select('name, uses')
      .order('uses', { ascending: false })
      .limit(10);

    return NextResponse.json({
      status: 'success',
      data: {
        certificates_over_time: certsChartData,
        revenue_trend: revenueChartData,
        plan_breakdown: planBreakdown,
        top_templates: topTemplates || []
      }
    });
  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json(
      { status: 'error', error: { code: 'SERVER_ERROR', message: (error as Error).message } },
      { status: 500 }
    );
  }
}

function processTimeSeries(data: any[], days: number) {
  const result: any[] = [];
  const now = new Date();
  
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    
    const count = data.filter(item => item.created_at.split('T')[0] === dateStr).length;
    result.push({ date: dateStr, certificates: count });
  }
  
  return result;
}

function processMonthlyRevenue(data: any[]) {
  const result: any[] = [];
  const now = new Date();
  
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthName = d.toLocaleString('default', { month: 'short' });
    const yearMonth = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`;
    
    const amountUsd = data.filter(item => item.created_at.startsWith(yearMonth))
      .reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
      
    result.push({ 
      month: monthName, 
      revenue_usd: parseFloat(amountUsd.toFixed(2)),
      revenue_php: parseFloat((amountUsd * PHP_EXCHANGE_RATE).toFixed(2))
    });
  }
  
  return result;
}
