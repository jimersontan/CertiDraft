import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return supabaseResponse;
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: Do not remove this line.
  // Refreshing the auth token is required for Server Components to read
  // the up-to-date session. Calling getUser() sends a request to the
  // Supabase Auth server every time, which is safer than getSession().
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Route protection: redirect unauthenticated users away from /dashboard
    if (
      !user &&
      request.nextUrl.pathname.startsWith("/dashboard")
    ) {
      const url = request.nextUrl.clone();
      url.pathname = "/auth/login";
      return NextResponse.redirect(url);
    }

    // Redirect authenticated users away from /auth pages to /dashboard
    if (
      user &&
      request.nextUrl.pathname.startsWith("/auth")
    ) {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }
  } catch (e) {
    // If Supabase is unreachable, allow the request through
    console.error("Supabase middleware error:", e);
  }

  return supabaseResponse;
}
