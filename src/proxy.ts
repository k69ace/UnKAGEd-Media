import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Refreshes the Supabase auth session cookie on every request into the
// estimator app. The public marketing site does not need auth, but running
// this globally keeps the session fresh for any route and is cheap when
// there's no session to refresh.
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isLoginRoute = request.nextUrl.pathname === "/estimator/login";
  if (!user && !isLoginRoute) {
    const loginUrl = new URL("/estimator/login", request.url);
    return NextResponse.redirect(loginUrl);
  }
  if (user && isLoginRoute) {
    return NextResponse.redirect(new URL("/estimator/pipeline", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/estimator/:path*"],
};
