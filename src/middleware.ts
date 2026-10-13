import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

const authMiddleware = withAuth(
  function middleware(req) {
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: "/auth/signin",
    },
  }
);

export default authMiddleware;

export const config = {
  matcher: [
    /*
     * Korumalı rotalar:
     * - api/auth ve auth/signin hariç tüm sayfalar
     * - _next, static, manifest, service worker hariç
     */
    "/((?!api/auth|auth/signin|_next/static|_next/image|favicon.ico|manifest.json|manifest.webmanifest|sw.js|icons).*)",
  ],
};
