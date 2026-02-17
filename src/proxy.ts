import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

/**
 * Next.js Proxy (formerly Middleware) for route protection.
 * Redirects unauthenticated users from /internal/* to the login page.
 *
 * Renamed from middleware.ts → proxy.ts per Next.js 16 convention.
 * See: https://nextjs.org/docs/app/building-your-application/routing/middleware
 */
export async function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Protect /internal/* routes (except auth pages)
    if (pathname.startsWith("/internal")) {
        // Allow access to auth pages without authentication
        const isAuthPage =
            pathname.startsWith("/internal/login") ||
            pathname.startsWith("/internal/register") ||
            pathname.startsWith("/internal/forgot-password");

        if (isAuthPage) {
            return NextResponse.next();
        }

        // Check for valid session token
        const token = await getToken({
            req: request,
            secret: process.env.NEXTAUTH_SECRET,
        });

        if (!token) {
            const loginUrl = new URL("/internal/login", request.url);
            loginUrl.searchParams.set("callbackUrl", pathname);
            return NextResponse.redirect(loginUrl);
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/internal/:path*"],
};
