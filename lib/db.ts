import { sql } from "@vercel/postgres";
import crypto from "crypto";

type UserRow = {
  id: string;
  email: string;
  password_hash: string;
  subscription_status: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  created_at: string;
};

let schemaReady = false;

const ensureSchema = async () => {
  if (schemaReady) return;
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      subscription_status TEXT DEFAULT 'free',
      stripe_customer_id TEXT UNIQUE,
      stripe_subscription_id TEXT UNIQUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS usage_events (
      id BIGSERIAL PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      event_name TEXT NOT NULL,
      model TEXT,
      input_tokens INTEGER,
      output_tokens INTEGER,
      estimated_cost_usd DOUBLE PRECISION,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;
  await sql`
    ALTER TABLE usage_events
    ADD COLUMN IF NOT EXISTS model TEXT;
  `;
  await sql`
    ALTER TABLE usage_events
    ADD COLUMN IF NOT EXISTS input_tokens INTEGER;
  `;
  await sql`
    ALTER TABLE usage_events
    ADD COLUMN IF NOT EXISTS output_tokens INTEGER;
  `;
  await sql`
    ALTER TABLE usage_events
    ADD COLUMN IF NOT EXISTS estimated_cost_usd DOUBLE PRECISION;
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS idx_usage_events_user_event_created
    ON usage_events(user_id, event_name, created_at DESC);
  `;
  schemaReady = true;
};

export const createUser = async (input: { email: string; passwordHash: string }) => {
  await ensureSchema();
  const userId = crypto.randomUUID();
  const result = await sql<UserRow>`
    INSERT INTO users (id, email, password_hash)
    VALUES (${userId}, ${input.email}, ${input.passwordHash})
    RETURNING id, email, password_hash, subscription_status, stripe_customer_id, stripe_subscription_id, created_at;
  `;
  return result.rows[0] || null;
};

export const getUserByEmail = async (email: string) => {
  await ensureSchema();
  const result = await sql<UserRow>`
    SELECT id, email, password_hash, subscription_status, stripe_customer_id, stripe_subscription_id, created_at
    FROM users
    WHERE email = ${email}
    LIMIT 1;
  `;
  return result.rows[0] || null;
};

export const getUserById = async (id: string) => {
  await ensureSchema();
  const result = await sql<UserRow>`
    SELECT id, email, password_hash, subscription_status, stripe_customer_id, stripe_subscription_id, created_at
    FROM users
    WHERE id = ${id}
    LIMIT 1;
  `;
  return result.rows[0] || null;
};

export const updateUserSubscriptionByEmail = async (input: {
  email: string;
  subscriptionStatus: string;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
}) => {
  await ensureSchema();
  await sql`
    UPDATE users
    SET
      subscription_status = ${input.subscriptionStatus},
      stripe_customer_id = COALESCE(${input.stripeCustomerId || null}, stripe_customer_id),
      stripe_subscription_id = COALESCE(${input.stripeSubscriptionId || null}, stripe_subscription_id)
    WHERE email = ${input.email};
  `;
};

export const updateUserSubscriptionByStripeCustomer = async (input: {
  stripeCustomerId: string;
  subscriptionStatus: string;
  stripeSubscriptionId?: string | null;
}) => {
  await ensureSchema();
  await sql`
    UPDATE users
    SET
      subscription_status = ${input.subscriptionStatus},
      stripe_subscription_id = COALESCE(${input.stripeSubscriptionId || null}, stripe_subscription_id)
    WHERE stripe_customer_id = ${input.stripeCustomerId};
  `;
};

export const incrementUsage = async (input: {
  userId: string;
  eventName: string;
  model?: string | null;
  inputTokens?: number | null;
  outputTokens?: number | null;
  estimatedCostUsd?: number | null;
}) => {
  await ensureSchema();
  await sql`
    INSERT INTO usage_events (
      user_id,
      event_name,
      model,
      input_tokens,
      output_tokens,
      estimated_cost_usd
    )
    VALUES (
      ${input.userId},
      ${input.eventName},
      ${input.model || null},
      ${input.inputTokens ?? null},
      ${input.outputTokens ?? null},
      ${input.estimatedCostUsd ?? null}
    );
  `;
};

export const getTodayUsageCount = async (input: { userId: string; eventName: string }) => {
  await ensureSchema();
  const result = await sql<{ count: number }>`
    SELECT COUNT(*)::int AS count
    FROM usage_events
    WHERE user_id = ${input.userId}
      AND event_name = ${input.eventName}
      AND created_at >= date_trunc('day', now());
  `;
  return result.rows[0]?.count || 0;
};

export const getUsageCountSince = async (input: {
  userId: string;
  eventName: string;
  sinceIso: string;
}) => {
  await ensureSchema();
  const result = await sql<{ count: number }>`
    SELECT COUNT(*)::int AS count
    FROM usage_events
    WHERE user_id = ${input.userId}
      AND event_name = ${input.eventName}
      AND created_at >= ${input.sinceIso}::timestamptz;
  `;
  return result.rows[0]?.count || 0;
};

export const getMonthlyUsageCount = async (input: { userId: string; eventName: string }) => {
  await ensureSchema();
  const result = await sql<{ count: number }>`
    SELECT COUNT(*)::int AS count
    FROM usage_events
    WHERE user_id = ${input.userId}
      AND event_name = ${input.eventName}
      AND created_at >= date_trunc('month', now());
  `;
  return result.rows[0]?.count || 0;
};

export const getMonthlyUsageCostUsd = async (input: {
  userId: string;
  eventName: string;
}) => {
  await ensureSchema();
  const result = await sql<{ total: number | null }>`
    SELECT COALESCE(SUM(estimated_cost_usd), 0)::float8 AS total
    FROM usage_events
    WHERE user_id = ${input.userId}
      AND event_name = ${input.eventName}
      AND created_at >= date_trunc('month', now());
  `;
  return Number(result.rows[0]?.total || 0);
};

export const hasActiveSubscription = (status: string | null | undefined): boolean =>
  status === "active" || status === "trialing";
