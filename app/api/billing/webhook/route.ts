import crypto from "crypto";
import { NextResponse } from "next/server";

const verifyStripeSignature = (
  signatureHeader: string,
  payload: string,
  endpointSecret: string
): boolean => {
  const parts = signatureHeader.split(",").map((part) => part.trim());
  const timestamp = parts.find((part) => part.startsWith("t="))?.slice(2);
  const signatures = parts
    .filter((part) => part.startsWith("v1="))
    .map((part) => part.slice(3));

  if (!timestamp || signatures.length === 0) return false;

  const age = Math.abs(Date.now() / 1000 - Number(timestamp));
  if (!Number.isFinite(age) || age > 300) return false;

  const signedPayload = `${timestamp}.${payload}`;
  const expected = crypto
    .createHmac("sha256", endpointSecret)
    .update(signedPayload, "utf8")
    .digest("hex");

  const expectedBuffer = Buffer.from(expected);
  return signatures.some((signature) => {
    const signatureBuffer = Buffer.from(signature);
    if (signatureBuffer.length !== expectedBuffer.length) return false;
    return crypto.timingSafeEqual(signatureBuffer, expectedBuffer);
  });
};

type StripeWebhookEvent = {
  id: string;
  type: string;
  data: { object: Record<string, unknown> };
};

export async function POST(req: Request) {
  try {
    const signature = req.headers.get("stripe-signature");
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!signature || !endpointSecret) {
      return NextResponse.json(
        { error: "Missing webhook signature configuration." },
        { status: 400 }
      );
    }

    const payload = await req.text();
    const isValid = verifyStripeSignature(signature, payload, endpointSecret);
    if (!isValid) {
      return NextResponse.json({ error: "Invalid Stripe signature." }, { status: 400 });
    }

    const event = JSON.parse(payload) as StripeWebhookEvent;

    if (event.type === "checkout.session.completed") {
      console.log("Stripe checkout complete:", event.id);
      // TODO: persist entitlement in your user/subscription store.
    }

    if (
      event.type === "customer.subscription.updated" ||
      event.type === "customer.subscription.deleted"
    ) {
      console.log("Stripe subscription lifecycle:", event.type, event.id);
      // TODO: sync active/canceled status in your user/subscription store.
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("billing webhook error", error);
    return NextResponse.json({ error: "Webhook handler failed." }, { status: 500 });
  }
}
