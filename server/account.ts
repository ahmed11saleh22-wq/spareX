import { randomBytes, randomUUID } from "node:crypto";
import { and, desc, eq, or } from "drizzle-orm";
import { authSessions, registrationChallenges, users, vehicles, workshops } from "../drizzle/schema";
import { getDb } from "./db";
import { hashOtp, hashPassword, normalizePhone, safeUser, verifyPassword } from "./self-auth";

export type RegistrationInput = {
  accountType: "customer" | "workshop";
  name: string;
  phone: string;
  email: string;
  password: string;
  workshopName?: string;
  city?: string;
  address?: string;
  businessType?: string;
  monthlyVolume?: string;
  specialties?: string[];
  warehouseDetails?: string;
  warehouseCount?: number;
  tradeLicense?: string;
  logo?: string;
};

function requireDatabase() {
  return getDb().then((db) => {
    if (!db) throw new Error("قاعدة البيانات غير متاحة حالياً");
    return db;
  });
}

function validateRegistration(input: RegistrationInput) {
  const email = input.email.trim().toLowerCase();
  const phone = normalizePhone(input.phone);
  if (!/^\S+@\S+\.\S+$/.test(email)) throw new Error("أدخل بريداً إلكترونياً صحيحاً");
  if (!/^\+\d{8,15}$/.test(phone)) throw new Error("أدخل رقم جوال صحيحاً مع مفتاح الدولة");
  if (input.name.trim().length < 2) throw new Error("أدخل الاسم الكامل");
  if (input.password.length < 8) throw new Error("كلمة المرور يجب أن تتكون من 8 أحرف أو أكثر");
  if (!/[A-Za-z\u0600-\u06ff]/.test(input.password) || !/\d/.test(input.password)) throw new Error("أضف حرفاً ورقماً إلى كلمة المرور");
  if (input.accountType === "workshop" && (!input.workshopName?.trim() || !input.city?.trim() || !input.address?.trim())) {
    throw new Error("أكمل اسم الورشة والمدينة والعنوان");
  }
  return { email, phone };
}

export async function startRegistration(input: RegistrationInput) {
  const db = await requireDatabase();
  const { email, phone } = validateRegistration(input);
  const existing = await db.select({ id: users.id }).from(users).where(or(eq(users.email, email), eq(users.phone, phone))).limit(1);
  if (existing.length) throw new Error("يوجد حساب مسجل بهذا البريد أو رقم الجوال");

  const challengeId = randomBytes(24).toString("hex");
  const passwordHash = await hashPassword(input.password);
  const payload = {
    ...input,
    name: input.name.trim(),
    email,
    phone,
    password: undefined,
    passwordHash,
    specialties: input.specialties ?? [],
    warehouseCount: input.warehouseCount ?? 0,
  };
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
  await db.insert(registrationChallenges).values({
    challengeId,
    accountType: input.accountType,
    phone,
    payload: JSON.stringify(payload),
    codeHash: hashOtp(challengeId, "123456"),
    expiresAt,
  });
  return { challengeId, expiresInSeconds: 300, maskedPhone: `${phone.slice(0, 4)}••••${phone.slice(-2)}`, debugCode: "123456" };
}

export async function resendRegistrationOtp(challengeId: string) {
  const db = await requireDatabase();
  const rows = await db.select().from(registrationChallenges).where(eq(registrationChallenges.challengeId, challengeId)).limit(1);
  if (!rows[0] || rows[0].verifiedAt || rows[0].expiresAt.getTime() < Date.now()) throw new Error("انتهت صلاحية طلب التسجيل، ابدأ التسجيل من جديد");
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
  await db.update(registrationChallenges).set({ codeHash: hashOtp(challengeId, "123456"), expiresAt, attempts: 0 }).where(eq(registrationChallenges.id, rows[0].id));
  return { expiresInSeconds: 300, debugCode: "123456" };
}

export async function verifyRegistration(challengeId: string, code: string) {
  const db = await requireDatabase();
  const rows = await db.select().from(registrationChallenges).where(eq(registrationChallenges.challengeId, challengeId)).limit(1);
  const challenge = rows[0];
  if (!challenge || challenge.verifiedAt || challenge.expiresAt.getTime() < Date.now()) throw new Error("انتهت صلاحية رمز التحقق");
  if (challenge.attempts >= 5) throw new Error("تم تجاوز عدد المحاولات. أعد إرسال رمز جديد");
  if (hashOtp(challengeId, code) !== challenge.codeHash) {
    await db.update(registrationChallenges).set({ attempts: challenge.attempts + 1 }).where(eq(registrationChallenges.id, challenge.id));
    throw new Error("رمز التحقق غير صحيح");
  }
  const payload = JSON.parse(challenge.payload) as RegistrationInput & { passwordHash: string; specialties?: string[]; warehouseCount?: number };
  const openId = `local_${randomUUID()}`;
  const created = await db.transaction(async (tx) => {
    await tx.insert(users).values({
      openId,
      name: payload.name,
      phone: payload.phone,
      email: payload.email,
      passwordHash: payload.passwordHash,
      accountType: payload.accountType,
      status: payload.accountType === "workshop" ? "pending" : "active",
      loginMethod: "password",
      role: "user",
    });
    if (payload.accountType === "workshop") {
      await tx.insert(workshops).values({
        userId: (await tx.select({ id: users.id }).from(users).where(eq(users.openId, openId)).limit(1))[0]!.id,
        workshopName: payload.workshopName!,
        city: payload.city!,
        address: payload.address!,
        businessType: payload.businessType ?? "متعدد الخدمات",
        monthlyVolume: payload.monthlyVolume ?? "غير محدد",
        specialties: JSON.stringify(payload.specialties ?? []),
        warehouseDetails: payload.warehouseDetails ?? null,
        warehouseCount: payload.warehouseCount ?? 0,
        tradeLicense: payload.tradeLicense ?? null,
        logo: payload.logo ?? null,
        approvalStatus: "pending",
      });
    }
    await tx.update(registrationChallenges).set({ verifiedAt: new Date() }).where(eq(registrationChallenges.id, challenge.id));
    return tx.select().from(users).where(eq(users.openId, openId)).limit(1);
  });
  const user = created[0];
  if (!user) throw new Error("تعذر إنشاء الحساب");
  return safeUser(user);
}

export async function loginWithPassword(identifier: string, password: string) {
  const db = await requireDatabase();
  const normalized = identifier.includes("@") ? identifier.trim().toLowerCase() : normalizePhone(identifier);
  const rows = await db.select().from(users).where(or(eq(users.email, normalized), eq(users.phone, normalized))).limit(1);
  const user = rows[0];
  if (!user || !(await verifyPassword(password, user.passwordHash))) throw new Error("بيانات الدخول غير صحيحة");
  if (user.status === "suspended") throw new Error("هذا الحساب موقوف، تواصل مع الدعم");
  await db.update(users).set({ lastSignedIn: new Date() }).where(eq(users.id, user.id));
  return safeUser({ ...user, lastSignedIn: new Date() });
}

export async function listVehicles(userId: number) {
  const db = await requireDatabase();
  return db.select().from(vehicles).where(eq(vehicles.userId, userId)).orderBy(desc(vehicles.isPrimary), desc(vehicles.updatedAt));
}

export async function saveVehicle(userId: number, input: { id?: number; make: string; model: string; year: number; trim?: string; vin?: string; isPrimary?: boolean }) {
  const db = await requireDatabase();
  const vin = input.vin?.trim().toUpperCase() || null;
  if (vin && !/^[A-HJ-NPR-Z0-9]{17}$/.test(vin)) throw new Error("رقم الهيكل يجب أن يتكون من 17 خانة صالحة");
  return db.transaction(async (tx) => {
    if (input.isPrimary) await tx.update(vehicles).set({ isPrimary: false, updatedAt: new Date() }).where(eq(vehicles.userId, userId));
    if (input.id) {
      await tx.update(vehicles).set({ make: input.make, model: input.model, year: input.year, trim: input.trim ?? null, vin, isPrimary: input.isPrimary ?? false, updatedAt: new Date() }).where(and(eq(vehicles.id, input.id), eq(vehicles.userId, userId)));
      return (await tx.select().from(vehicles).where(and(eq(vehicles.id, input.id), eq(vehicles.userId, userId))).limit(1))[0];
    }
    const existing = await tx.select({ id: vehicles.id }).from(vehicles).where(eq(vehicles.userId, userId)).limit(1);
    const primary = input.isPrimary ?? existing.length === 0;
    await tx.insert(vehicles).values({ userId, make: input.make, model: input.model, year: input.year, trim: input.trim ?? null, vin, isPrimary: primary });
    return (await tx.select().from(vehicles).where(eq(vehicles.userId, userId)).orderBy(desc(vehicles.id)).limit(1))[0];
  });
}

export async function deleteVehicle(userId: number, id: number) {
  const db = await requireDatabase();
  await db.delete(vehicles).where(and(eq(vehicles.id, id), eq(vehicles.userId, userId)));
  return { success: true };
}

export async function setPrimaryVehicle(userId: number, id: number) {
  const db = await requireDatabase();
  await db.transaction(async (tx) => {
    await tx.update(vehicles).set({ isPrimary: false, updatedAt: new Date() }).where(eq(vehicles.userId, userId));
    await tx.update(vehicles).set({ isPrimary: true, updatedAt: new Date() }).where(and(eq(vehicles.id, id), eq(vehicles.userId, userId)));
  });
  return { success: true };
}

export async function listWorkshopApplications() {
  const db = await requireDatabase();
  return db.select({ workshop: workshops, user: users }).from(workshops).innerJoin(users, eq(workshops.userId, users.id)).orderBy(desc(workshops.createdAt));
}

export async function updateWorkshopApproval(id: number, approvalStatus: "approved" | "rejected" | "pending") {
  const db = await requireDatabase();
  const rows = await db.select({ userId: workshops.userId }).from(workshops).where(eq(workshops.id, id)).limit(1);
  const workshop = rows[0];
  if (!workshop) throw new Error("طلب الورشة غير موجود");
  await db.transaction(async (tx) => {
    await tx.update(workshops).set({ approvalStatus, updatedAt: new Date() }).where(eq(workshops.id, id));
    await tx.update(users).set({ status: approvalStatus === "rejected" ? "suspended" : approvalStatus === "approved" ? "active" : "pending", updatedAt: new Date() }).where(eq(users.id, workshop.userId));
  });
  return { success: true };
}

export async function logoutAllOtherSessions(userId: number, currentTokenHash?: string) {
  const db = await requireDatabase();
  if (currentTokenHash) await db.delete(authSessions).where(and(eq(authSessions.userId, userId), eq(authSessions.tokenHash, currentTokenHash)));
  else await db.delete(authSessions).where(eq(authSessions.userId, userId));
  return { success: true };
}
