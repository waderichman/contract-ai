import { NextResponse } from "next/server";

type CheckoutRequest = {
  email?: string;
};

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

export async function POST(req: Request) {
  try {
    const payload = (await req.json()) as CheckoutRequest;
    const email = payload.email?.trim().toLowerCase();
    if (!email) {
      return NextResponse.json(
        { error: "Email is required to start checkout." },
        { status: 400 }
      );
    }

    const stripeSecret = getEnv("STRIPE_SECRET_KEY");
    const priceId = getEnv("STRIPE_PRO_PRICE_ID");
    const appUrl = getEnv("NEXT_PUBLIC_APP_URL");

    const body = toFormBody({
      mode: "subscription",
      "line_items[0][price]": priceId,
      "line_items[0][quantity]": "1",
      customer_email: email,
      success_url: `${appUrl}/pricing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/pricing/cancel`,
      "metadata[plan]": "pro",
    });

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
      return NextResponse.json({ error: reason }, { status: 502 });
    }

    return NextResponse.json({ url: stripeData.url });
  } catch (error) {
    console.error("create-checkout-session error", error);
    return NextResponse.json(
      { error: "Billing setup is incomplete. Configure Stripe environment variables." },
      { status: 500 }
    );
  }
}
