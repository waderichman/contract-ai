import crypto from "crypto";
import { NextResponse } from "next/server";
import {
  updateUserSubscriptionByEmail,
  updateUserSubscriptionByStripeCustomer,
} from "@/lib/db";

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

const asString = (value: unknown): string | null =>
  typeof value === "string" && value.length > 0 ? value : null;

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
      const sessionObject = event.data.object;
      const email = asString(sessionObject.customer_email);
      const stripeCustomerId = asString(sessionObject.customer);
      const stripeSubscriptionId = asString(sessionObject.subscription);

      if (email) {
        await updateUserSubscriptionByEmail({
          email: email.toLowerCase(),
          subscriptionStatus: "active",
          stripeCustomerId,
          stripeSubscriptionId,
        });
      }
      console.log("Stripe checkout complete:", event.id, email);
    }

    if (
      event.type === "customer.subscription.updated" ||
      event.type === "customer.subscription.deleted"
    ) {
      const subscription = event.data.object;
      const stripeCustomerId = asString(subscription.customer);
      const stripeSubscriptionId = asString(subscription.id);
      const status = asString(subscription.status) || "canceled";

      if (stripeCustomerId) {
        await updateUserSubscriptionByStripeCustomer({
          stripeCustomerId,
          subscriptionStatus: status,
          stripeSubscriptionId,
        });
      }

      console.log("Stripe subscription lifecycle:", event.type, event.id, status);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("billing webhook error", error);
    return NextResponse.json({ error: "Webhook handler failed." }, { status: 500 });
  }
}
