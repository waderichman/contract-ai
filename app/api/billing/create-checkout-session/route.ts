import { NextResponse } from "next/server";
import { getSessionFromCookies } from "@/lib/auth";
import { getUserById } from "@/lib/db";

const getEnv = (name: string): string => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
};

const toFormBody = (entries: Record<string, string>): URLSearchParams => {
  const body = new URLSearchParams();
  for (const [key, value] of Object.entries(entries)) {
    body.set(key, value);
  }
  return body;
};

export async function POST() {
  try {
    const session = await getSessionFromCookies();
    if (!session) {
      return NextResponse.json({ error: "You must be logged in to upgrade." }, { status: 401 });
    }

    const user = await getUserById(session.userId);
    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 401 });
    }
    if (!user.email) {
      return NextResponse.json(
        { error: "Account email is required to start checkout." },
        { status: 400 }
      );
    }

    const required = [
      "STRIPE_SECRET_KEY",
      "STRIPE_PRO_PRICE_ID",
      "NEXT_PUBLIC_APP_URL",
    ] as const;
    const missing = required.filter((name) => !process.env[name]);
    if (missing.length > 0) {
      return NextResponse.json(
        {
          error: `Missing environment variable(s): ${missing.join(", ")}`,
        },
        { status: 500 }
      );
    }

    const stripeSecret = getEnv("STRIPE_SECRET_KEY");
    const priceId = getEnv("STRIPE_PRO_PRICE_ID");
    const appUrl = getEnv("NEXT_PUBLIC_APP_URL");

    const body = toFormBody({
      mode: "subscription",
      "line_items[0][price]": priceId,
      "line_items[0][quantity]": "1",
      customer_email: user.email,
      success_url: `${appUrl}/pricing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/pricing/cancel`,
      "metadata[plan]": "pro",
      "metadata[user_id]": user.id,
      "metadata[user_email]": user.email,
    });

    const keyMode = stripeSecret.startsWith("sk_live_") ? "live" : "test";
    const priceMode = priceId.startsWith("price_") ? null : "invalid";
    if (priceMode === "invalid") {
      return NextResponse.json(
        { error: "STRIPE_PRO_PRICE_ID must be a Stripe price id that starts with price_." },
        { status: 500 }
      );
    }

    const stripeResponse = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${stripeSecret}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    });

    const stripeData = (await stripeResponse.json()) as {
      url?: string;
      error?: { message?: string };
    };

    if (!stripeResponse.ok || !stripeData.url) {
      const reason = stripeData.error?.message || "Unable to create checkout session.";
      const enhancedReason =
        reason.includes("No such price")
          ? `${reason} Check that STRIPE_PRO_PRICE_ID is from the same Stripe mode as STRIPE_SECRET_KEY (${keyMode}).`
          : reason;
      return NextResponse.json({ error: enhancedReason }, { status: 502 });
    }

    return NextResponse.json({ url: stripeData.url });
  } catch (error) {
    console.error("create-checkout-session error", error);
    const message =
      error instanceof Error
        ? error.message
        : "Billing setup is incomplete. Configure Stripe environment variables.";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
