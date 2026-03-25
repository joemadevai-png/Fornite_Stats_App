import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { passcode } = await request.json();

  if (passcode !== process.env.PASSCODE) {
    return NextResponse.json({ error: "Wrong code" }, { status: 401 });
  }

  // Set cookie to expire at midnight tonight
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(23, 59, 59, 999);
  const maxAge = Math.floor((midnight.getTime() - now.getTime()) / 1000);

  const response = NextResponse.json({ success: true });
  response.cookies.set("fort-stats-pass", "valid", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge,
  });

  return response;
}
