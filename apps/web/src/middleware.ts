import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const isLoginPage = req.nextUrl.pathname === "/login";
  const isApiAuth = req.nextUrl.pathname.startsWith("/api/auth");
  const isHealth = req.nextUrl.pathname.startsWith("/api/health");

  if (isApiAuth || isHealth) return NextResponse.next();

  if (!isLoggedIn && !isLoginPage) {
    return NextResponse.redirect(new URL("/login", req.nextUrl));
  }

  if (isLoggedIn && isLoginPage) {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl));
  }

  if (isLoggedIn && req.nextUrl.pathname.startsWith("/admin")) {
    const role = req.auth?.user?.role;
    if (role !== "ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", req.nextUrl));
    }
  }

  if (isLoggedIn && req.nextUrl.pathname.startsWith("/budget")) {
    const role = req.auth?.user?.role;
    if (
      role !== "DIRECTOR" &&
      role !== "HOS" &&
      role !== "ADMIN" &&
      role !== "PROJECT_ADMIN"
    ) {
      return NextResponse.redirect(new URL("/dashboard", req.nextUrl));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
