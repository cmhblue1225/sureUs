import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const ADMIN_COHORT_COOKIE_NAME = "admin_selected_cohort";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

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

  // Do not run code between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Protected routes (require login)
  const protectedPaths = ["/dashboard", "/profile", "/search", "/recommendations", "/network", "/settings", "/onboarding", "/clubs", "/admin", "/calendar", "/board", "/announcements", "/messages"];
  const isProtectedPath = protectedPaths.some((path) =>
    request.nextUrl.pathname.startsWith(path)
  );

  // Auth-only routes (redirect to dashboard if logged in)
  const authOnlyPaths = ["/login", "/signup"];
  const isAuthOnlyPath = authOnlyPaths.some((path) =>
    request.nextUrl.pathname.startsWith(path)
  );

  // Check if current path is admin cohorts management
  const isAdminCohortsPath = request.nextUrl.pathname.startsWith("/admin/cohorts");

  // Check if current path is onboarding
  const isOnboardingPath = request.nextUrl.pathname.startsWith("/onboarding");

  if (!user && isProtectedPath) {
    // Redirect to login if trying to access protected route without auth
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (user && isAuthOnlyPath) {
    // Check if admin and onboarding status
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, onboarding_completed")
      .eq("user_id", user.id)
      .single();

    const isAdmin = profile?.role === "admin";

    // Redirect based on role and onboarding status
    const url = request.nextUrl.clone();
    if (isAdmin) {
      url.pathname = "/admin/cohorts";
    } else if (!profile?.onboarding_completed) {
      url.pathname = "/onboarding";
    } else {
      url.pathname = "/dashboard";
    }
    return NextResponse.redirect(url);
  }

  // Onboarding and Admin checks for protected paths
  if (user && isProtectedPath) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, onboarding_completed")
      .eq("user_id", user.id)
      .single();

    const isAdmin = profile?.role === "admin";

    // Admin cohort selection check (skip for /admin/cohorts path itself)
    if (isAdmin && !isAdminCohortsPath) {
      // Check if admin has selected a cohort
      const selectedCohort = request.cookies.get(ADMIN_COHORT_COOKIE_NAME)?.value;

      if (!selectedCohort) {
        // Redirect admin to cohorts selection page
        const url = request.nextUrl.clone();
        url.pathname = "/admin/cohorts";
        return NextResponse.redirect(url);
      }
    }

    // Non-admin onboarding check (skip if already on onboarding page)
    if (!isAdmin && !profile?.onboarding_completed && !isOnboardingPath) {
      // Redirect to onboarding if not completed
      const url = request.nextUrl.clone();
      url.pathname = "/onboarding";
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
