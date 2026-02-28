import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Auth is handled client-side by AutoAuth.
// This proxy only excludes Next.js internals from running unnecessarily.
export function proxy(_req: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
