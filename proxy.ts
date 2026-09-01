import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Rutas protegidas: dashboard profesional y portal paciente
  const protectedRoutes = ["/dashboard", "/paciente/dashboard"];
  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route));

  // Rutas públicas que nunca deben ser interceptadas
  const publicRoutes = ["/", "/reservar", "/auth/login", "/auth/sign-up", "/auth/forgot-password", "/auth/update-password"];
  const isPublicRoute = publicRoutes.some((route) => pathname === route || pathname.startsWith("/reservar"));

  // Check for session token
  const sessionToken = request.cookies.get("session_token");

  // Protect routes: si no hay token, redirigir a login
  if (isProtectedRoute && !sessionToken) {
    const loginUrl = new URL("/auth/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Si ya está logueado y visita login/register, deja pasar — el Server Component se encarga del redirect por rol
  if (sessionToken && (pathname === "/auth/login" || pathname === "/auth/sign-up")) {
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images - .svg, .png, .jpg, .jpeg, .gif, .webp
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
