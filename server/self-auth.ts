import { createHash, randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import type { Request, Response } from "express";
import { and, eq, gt } from "drizzle-orm";
import { authSessions, users, type User } from "../drizzle/schema";
import { getDb } from "./db";
import { getSessionCookieOptions } from "./_core/cookies";
import { ENV } from "./_core/env";

const scryptAsync = promisify(scrypt);
export const SELF_SESSION_COOKIE = "sparex_session";
export const SELF_SESSION_DAYS = 30;

function readCookie(request: Request, name: string) {
  const raw = request.headers.cookie ?? "";
  const match = raw.match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`));
  return match?.[1] ? decodeURIComponent(match[1]) : null;
}

export function normalizePhone(phone: string) {
  const digits = phone.replace(/[^0-9+]/g, "");
  if (digits.startsWith("00")) return `+${digits.slice(2)}`;
  if (digits.startsWith("05")) return `+966${digits.slice(1)}`;
  if (digits.startsWith("5") && digits.length === 9) return `+966${digits}`;
  return digits;
}

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const derived = await scryptAsync(password, salt, 64) as Buffer;
  return `scrypt$${salt}$${derived.toString("hex")}`;
}

export async function verifyPassword(password: string, encoded: string | null | undefined) {
  if (!encoded?.startsWith("scrypt$")) return false;
  const [, salt, expectedHex] = encoded.split("$");
  if (!salt || !expectedHex) return false;
  const actual = await scryptAsync(password, salt, 64) as Buffer;
  const expected = Buffer.from(expectedHex, "hex");
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

export function hashSessionToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function hashOtp(challengeId: string, code: string) {
  return createHash("sha256").update(`${challengeId}:${code}:${ENV.cookieSecret || "sparex"}`).digest("hex");
}

export function safeUser(user: User) {
  const { passwordHash: _passwordHash, ...publicUser } = user;
  return publicUser;
}

export async function createSelfSession(userId: number, request: Request, response: Response) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const token = randomBytes(32).toString("base64url");
  const now = new Date();
  const expiresAt = new Date(now.getTime() + SELF_SESSION_DAYS * 24 * 60 * 60 * 1000);
  await db.insert(authSessions).values({
    tokenHash: hashSessionToken(token),
    userId,
    expiresAt,
    userAgent: request.get("user-agent")?.slice(0, 255) ?? null,
    ipAddress: request.ip?.slice(0, 80) ?? null,
  });
  response.cookie(SELF_SESSION_COOKIE, token, { ...getSessionCookieOptions(request), maxAge: SELF_SESSION_DAYS * 24 * 60 * 60 * 1000 });
  return token;
}

export async function authenticateSelfSession(request: Request) {
  const token = readCookie(request, SELF_SESSION_COOKIE);
  if (!token) return null;
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select({ session: authSessions, user: users })
    .from(authSessions)
    .innerJoin(users, eq(authSessions.userId, users.id))
    .where(and(eq(authSessions.tokenHash, hashSessionToken(token)), gt(authSessions.expiresAt, new Date())))
    .limit(1);
  const row = rows[0];
  if (!row || row.user.status === "suspended") return null;
  await db.update(authSessions).set({ lastSeenAt: new Date() }).where(eq(authSessions.id, row.session.id));
  return row.user;
}

export async function clearSelfSession(request: Request, response: Response) {
  const token = readCookie(request, SELF_SESSION_COOKIE);
  const db = await getDb();
  if (db && token) await db.delete(authSessions).where(eq(authSessions.tokenHash, hashSessionToken(token)));
  response.clearCookie(SELF_SESSION_COOKIE, { ...getSessionCookieOptions(request), maxAge: -1 });
}
