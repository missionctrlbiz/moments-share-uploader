import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const adminToken = request.cookies.get("admin_token")?.value;
  const adminPassword = process.env.ADMIN_PASSWORD;

  const isValid =
    adminPassword &&
    adminPassword.length > 0 &&
    adminToken === adminPassword;

  if (request.nextUrl.pathname.startsWith("/api/files")) {
    if (!isValid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/files"],
};
