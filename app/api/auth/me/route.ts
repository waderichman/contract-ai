import { NextResponse } from "next/server";
import { getSessionFromCookies } from "@/lib/auth";
import { getUserById } from "@/lib/db";

export async function GET() {
  try {
    const session = await getSessionFromCookies();
    if (!session) return NextResponse.json({ user: null });

    const user = await getUserById(session.userId);
    if (!user) return NextResponse.json({ user: null });

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        subscriptionStatus: user.subscription_status || "free",
      },
    });
  } catch (error) {
    console.error("auth me error", error);
    return NextResponse.json({ user: null });
  }
}
