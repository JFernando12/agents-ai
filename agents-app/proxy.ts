import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(req: NextRequest) {
  const urlToken = req.nextUrl.searchParams.get("token");

  if (urlToken) {
    return NextResponse.next();
  }

  return NextResponse.json(
    {
      error: "Authentication required",
    },
    { status: 401 }
  );
}

export const config = {
  matcher: [
    "/((?!api/verify-jwt|api/logout|_next/static|_next/image|favicon.ico|images).*)",
  ],
};
