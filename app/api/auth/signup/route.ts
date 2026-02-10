import { NextResponse } from "next/server";
import { createSessionToken, hashPassword, setSessionCookie } from "@/lib/auth";
import { createUser, getUserByEmail } from "@/lib/db";

type SignupBody = {
  email?: string;
  password?: string;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as SignupBody;
    const email = body.email?.trim().toLowerCase();
    const password = body.password?.trim() || "";

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400 }
      );
    }
    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters." },
        { status: 400 }
      );
    }

    const existing = await getUserByEmail(email);
    if (existing) {
      return NextResponse.json({ error: "Account already exists." }, { status: 409 });
    }

    const passwordHash = hashPassword(password);
    const user = await createUser({ email, passwordHash });
    if (!user) {
      return NextResponse.json({ error: "Unable to create account." }, { status: 500 });
    }

    const sessionToken = createSessionToken({ userId: user.id, email: user.email });
    await setSessionCookie(sessionToken);

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        subscriptionStatus: user.subscription_status || "free",
      },
    });
  } catch (error) {
    console.error("signup error", error);
    return NextResponse.json({ error: "Sign up failed." }, { status: 500 });
  }
}
