import crypto from "crypto";
import { cookies } from "next/headers";

const SESSION_COOKIE = "contractai_session";
const SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 30;

export type SessionPayload = {
  userId: string;
  email: string;
  exp: number;
};

const getAuthSecret = (): string => {
  const value = process.env.AUTH_SESSION_SECRET;
  if (value) return value;
  return "dev-only-insecure-auth-secret-change-in-production";
};

const toBase64Url = (input: string): string =>
  Buffer.from(input, "utf8").toString("base64url");

const fromBase64Url = (input: string): string =>
  Buffer.from(input, "base64url").toString("utf8");

const sign = (payloadPart: string): string => {
  const secret = getAuthSecret();
  return crypto.createHmac("sha256", secret).update(payloadPart).digest("base64url");
};

export const hashPassword = (password: string): string => {
  const salt = crypto.randomBytes(16).toString("hex");
  const derived = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${derived}`;
};

export const verifyPassword = (password: string, stored: string): boolean => {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const derived = crypto.scryptSync(password, salt, 64).toString("hex");
  return crypto.timingSafeEqual(Buffer.from(derived), Buffer.from(hash));
};

export const createSessionToken = (input: { userId: string; email: string }): string => {
  const payload: SessionPayload = {
    userId: input.userId,
    email: input.email,
    exp: Date.now() + SESSION_DURATION_MS,
  };
  const encoded = toBase64Url(JSON.stringify(payload));
  const signature = sign(encoded);
  return `${encoded}.${signature}`;
};

export const parseSessionToken = (token: string): SessionPayload | null => {
  const [encoded, providedSignature] = token.split(".");
  if (!encoded || !providedSignature) return null;
  const expectedSignature = sign(encoded);
  if (!crypto.timingSafeEqual(Buffer.from(providedSignature), Buffer.from(expectedSignature))) {
    return null;
  }
  try {
    const payload = JSON.parse(fromBase64Url(encoded)) as SessionPayload;
    if (!payload.userId || !payload.email || typeof payload.exp !== "number") return null;
    if (payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
};

export const setSessionCookie = async (token: string) => {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DURATION_MS / 1000,
  });
};

export const clearSessionCookie = async () => {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
};

export const getSessionFromCookies = async (): Promise<SessionPayload | null> => {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return parseSessionToken(token);
};
