import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function verifyAuth(request: NextRequest) {
  // Try to get user from Supabase session (handles cookies automatically)
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (user && !error) {
      // Fetch plan from users table
      const { data: profile, error: profileErr } = await supabase
        .from('users')
        .select('plan')
        .eq('id', user.id)
        .maybeSingle();

      if (profileErr) {
        console.error('Profile fetch error in auth middleware:', profileErr);
      }

      return {
        id: user.id,
        email: user.email!,
        plan: profile?.plan || 'free',
        role: 'user'
      };
    }
  } catch (err) {
    console.error('Supabase auth check failed:', err);
  }

  // Fallback to manual token verification if provided in headers
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    try {
      const supabase = await createClient();
      const { data: { user }, error } = await supabase.auth.getUser(token);
      
      if (user && !error) {
        const { data: profile, error: profileErr } = await supabase
          .from('users')
          .select('plan')
          .eq('id', user.id)
          .maybeSingle();

        if (profileErr) {
          console.error('Profile fetch error (bearer) in auth middleware:', profileErr);
        }

        return {
          id: user.id,
          email: user.email!,
          plan: profile?.plan || 'free',
          role: 'user'
        };
      }
    } catch (err) {
      console.error('Bearer token verification failed:', err);
    }
  }

  return null;
}
