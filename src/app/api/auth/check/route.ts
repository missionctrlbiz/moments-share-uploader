import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const token = request.cookies.get("admin_token")?.value;
  const adminPassword = process.env.ADMIN_PASSWORD;

  const authenticated =
    !!adminPassword &&
    adminPassword.length > 0 &&
    token === adminPassword;

  return NextResponse.json({ authenticated });
}
