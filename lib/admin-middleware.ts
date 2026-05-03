import { NextRequest } from 'next/server';
import { createClient } from './supabase/server';

export async function verifyAdminAccess(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return { admin: null, error: 'Unauthenticated' };
    }

    const adminEmail = user.email?.toLowerCase().trim();
    const isFallbackAdmin = adminEmail === 'admin@certidraft.com';

    // Get user details from database for role verification
    const { data: profile, error: dbError } = await supabase
      .from('users')
      .select('id, email, role')
      .eq('id', user.id)
      .maybeSingle();

    const hasAdminRole = isFallbackAdmin || profile?.role === 'admin' || profile?.role === 'super_admin';

    if (!hasAdminRole) {
      console.warn(`[verifyAdminAccess] Unauthorized access attempt by ${adminEmail}`);
      return { admin: null, error: 'Not authorized' };
    }

    return { 
      admin: {
        id: user.id,
        email: user.email,
        role: profile?.role || (isFallbackAdmin ? 'super_admin' : 'user')
      }, 
      error: null 
    };
  } catch (err) {
    console.error('Admin verification error:', err);
    return { admin: null, error: 'Server error' };
  }
}
