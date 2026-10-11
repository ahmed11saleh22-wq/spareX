import { createHash, randomBytes, randomUUID } from "node:crypto";
import { and, desc, eq, or } from "drizzle-orm";
import { authSessions, loginAttempts, notifications, passwordResetChallenges, registrationChallenges, userConsents, users, vehicles, workshops } from "../drizzle/schema";
import { getDb } from "./db";
import { hashOtp, hashPassword, normalizePhone, safeUser, verifyPassword } from "./self-auth";
import { storagePut } from "./storage";

export type RegistrationInput = {
  accountType: "customer" | "workshop";
  name: string;
  phone: string;
  email: string;
  password: string;
  termsAccepted: boolean;
  marketingAccepted?: boolean;
  workshopName?: string;
  workshopNameEn?: string;
  managerName?: string;
  city?: string;
  country?: string;
  whatsapp?: string;
  district?: string;
  address?: string;
  mapUrl?: string;
  tradeLicenseNumber?: string;
  licenseExpiresAt?: string;
  taxNumber?: string;
  branchCount?: number;
  technicianCount?: number;
  notes?: string;
  businessType?: string;
  monthlyVolume?: string;
  specialties?: string[];
  warehouseDetails?: string;
  warehouseCount?: number;
  tradeLicense?: string;
  taxCertificate?: string;
  storefrontImage?: string;
  logo?: string;
  vehicleSpecialties?: string[];
};

const OTP_TTL_SECONDS = Math.max(60, Number(process.env.OTP_TTL_SECONDS || 300));

function challengeSafeName(email: string) {
  return email.replace(/[^a-z0-9]+/gi, "-").slice(0, 60) || "workshop";
}

async function persistRegistrationAsset(value: string | undefined, name: string, kind: "document" | "image") {
  if (!value || !value.startsWith("data:")) return value;
  const match = value.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) throw new Error("صيغة المرفق غير صحيحة");
  const mime = match[1];
  if (kind === "image" && !mime.startsWith("image/")) throw new Error("شعار الورشة يجب أن يكون صورة");
  if (kind === "document" && !mime.startsWith("image/") && mime !== "application/pdf") throw new Error("الرخصة يجب أن تكون صورة أو ملف PDF");
  const data = Buffer.from(match[2], "base64");
  if (data.byteLength > 5 * 1024 * 1024) throw new Error("حجم المرفق يجب ألا يتجاوز 5 ميجابايت");
  return (await storagePut(`registrations/${name}`, data, mime)).url;
}

function requireDatabase() {
  return getDb().then((db) => {
    if (!db) throw new Error("قاعدة البيانات غير متاحة حالياً");
    return db;
  });
}

function validateRegistration(input: RegistrationInput) {
  const email = input.email.trim().toLowerCase();
  const phone = normalizePhone(input.phone);
  if (!input.termsAccepted) throw new Error("الموافقة على الشروط والخصوصية مطلوبة");
  if (!/^\S+@\S+\.\S+$/.test(email)) throw new Error("أدخل بريداً إلكترونياً صحيحاً");
  if (!/^\+\d{8,15}$/.test(phone)) throw new Error("أدخل رقم جوال صحيحاً مع مفتاح الدولة");
  if (input.name.trim().length < 2) throw new Error("أدخل الاسم الكامل");
  if (input.password.length < 8) throw new Error("كلمة المرور يجب أن تتكون من 8 أحرف أو أكثر");
  if (!/[A-Za-z\u0600-\u06ff]/.test(input.password) || !/\d/.test(input.password)) throw new Error("أضف حرفاً ورقماً إلى كلمة المرور");
  if (input.accountType === "workshop" && (!input.workshopName?.trim() || !input.city?.trim() || !input.address?.trim() || !input.businessType?.trim())) {
    throw new Error("أكمل اسم الورشة والمدينة ونوع النشاط والعنوان");
  }
  if (input.accountType === "workshop" && (!input.specialties || input.specialties.length === 0)) {
    throw new Error("يرجى اختيار نوع نشاط واحد على الأقل");
  }
  return { email, phone };
}

export async function startRegistration(input: RegistrationInput) {
  const db = await requireDatabase();
  const { email, phone } = validateRegistration(input);
  const existingEmail = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
  if (existingEmail.length) throw new Error("البريد الإلكتروني مستخدم مسبقاً");
  const existingPhone = await db.select({ id: users.id }).from(users).where(eq(users.phone, phone)).limit(1);
  if (existingPhone.length) throw new Error("رقم الهاتف مستخدم مسبقاً");
  const storedTradeLicense = await persistRegistrationAsset(input.tradeLicense, `${challengeSafeName(email)}-license`, "document");
  const storedTaxCertificate = await persistRegistrationAsset(input.taxCertificate, `${challengeSafeName(email)}-tax`, "document");
  const storedStorefront = await persistRegistrationAsset(input.storefrontImage, `${challengeSafeName(email)}-storefront`, "image");
  const storedLogo = await persistRegistrationAsset(input.logo, `${challengeSafeName(email)}-logo`, "image");

  const challengeId = randomBytes(24).toString("hex");
  const passwordHash = await hashPassword(input.password);
  const payload = {
    ...input,
    name: input.name.trim(),
    email,
    phone,
    tradeLicense: storedTradeLicense,
    taxCertificate: storedTaxCertificate,
    storefrontImage: storedStorefront,
    logo: storedLogo,
    password: undefined,
    passwordHash,
    specialties: input.specialties ?? [],
    warehouseCount: input.warehouseCount ?? 0,
  };
  const expiresAt = new Date(Date.now() + OTP_TTL_SECONDS * 1000);
  await db.insert(registrationChallenges).values({
    challengeId,
    accountType: input.accountType,
    phone,
    payload: JSON.stringify(payload),
    codeHash: hashOtp(challengeId, "123456"),
    expiresAt,
    lastSentAt: new Date(),
  });
  return { challengeId, expiresInSeconds: OTP_TTL_SECONDS, maskedPhone: `${phone.slice(0, 4)}••••${phone.slice(-2)}`, debugCode: "123456" };
}

export async function resendRegistrationOtp(challengeId: string) {
  const db = await requireDatabase();
  const rows = await db.select().from(registrationChallenges).where(eq(registrationChallenges.challengeId, challengeId)).limit(1);
  if (!rows[0] || rows[0].verifiedAt || rows[0].expiresAt.getTime() < Date.now()) throw new Error("انتهت صلاحية طلب التسجيل، ابدأ التسجيل من جديد");
  if (Date.now() - rows[0].lastSentAt.getTime() < 30_000) throw new Error("انتظر 30 ثانية قبل إعادة إرسال الرمز");
  const expiresAt = new Date(Date.now() + OTP_TTL_SECONDS * 1000);
  await db.update(registrationChallenges).set({ codeHash: hashOtp(challengeId, "123456"), expiresAt, lastSentAt: new Date(), attempts: 0 }).where(eq(registrationChallenges.id, rows[0].id));
  return { expiresInSeconds: OTP_TTL_SECONDS, debugCode: "123456" };
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
      role: payload.accountType === "workshop" ? "workshop_owner" : "user",
    });
    const insertedUser = (await tx.select({ id: users.id }).from(users).where(eq(users.openId, openId)).limit(1))[0];
    if (!insertedUser) throw new Error("تعذر إنشاء الحساب");
    await tx.insert(userConsents).values([
      { userId: insertedUser.id, consentType: "terms_privacy", accepted: true, policyVersion: "2026-10" },
      { userId: insertedUser.id, consentType: "marketing", accepted: Boolean(payload.marketingAccepted), policyVersion: "2026-10" },
    ]);
    await tx.insert(notifications).values({ userId: insertedUser.id, type: "account_created", title: "تم إنشاء الحساب", message: "تم إنشاء حسابك في سبير إكس بنجاح." });
    if (payload.accountType === "workshop") {
      await tx.insert(workshops).values({
        userId: insertedUser.id,
        workshopName: payload.workshopName!,
        workshopNameEn: payload.workshopNameEn ?? null,
        managerName: payload.managerName ?? payload.name,
        phone: payload.phone,
        whatsapp: payload.whatsapp ?? payload.phone,
        email: payload.email,
        country: payload.country ?? null,
        city: payload.city!,
        district: payload.district ?? null,
        address: payload.address!,
        mapUrl: payload.mapUrl ?? null,
        tradeLicenseNumber: payload.tradeLicenseNumber ?? null,
        licenseExpiresAt: payload.licenseExpiresAt ?? null,
        taxNumber: payload.taxNumber ?? null,
        branchCount: payload.branchCount ?? null,
        technicianCount: payload.technicianCount ?? null,
        notes: payload.notes ?? null,
        businessType: payload.businessType ?? "متعدد الخدمات",
        monthlyVolume: payload.monthlyVolume ?? "غير محدد",
        specialties: JSON.stringify(payload.specialties ?? []),
        vehicleSpecialties: JSON.stringify(payload.vehicleSpecialties ?? []),
        warehouseDetails: payload.warehouseDetails ?? null,
        warehouseCount: payload.warehouseCount ?? 0,
        tradeLicense: payload.tradeLicense ?? null,
        taxCertificate: payload.taxCertificate ?? null,
        storefrontImage: payload.storefrontImage ?? null,
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

const loginWindows = new Map<string, { count: number; startedAt: number }>();
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const MAX_LOGIN_ATTEMPTS = 8;

function identifierKey(identifier: string) {
  return createHash("sha256").update(identifier.trim().toLowerCase()).digest("hex");
}

async function recordLoginAttempt(db: Awaited<ReturnType<typeof getDb>>, identifier: string, success: boolean, ipAddress?: string, reason?: string) {
  if (!db) return;
  await db.insert(loginAttempts).values({ identifierHash: identifierKey(identifier), ipAddress: ipAddress?.slice(0, 80) ?? null, success, reason: reason ?? null });
}

export async function loginWithPassword(identifier: string, password: string, ipAddress?: string) {
  const db = await requireDatabase();
  const key = identifierKey(identifier);
  const current = loginWindows.get(key);
  if (current && Date.now() - current.startedAt < LOGIN_WINDOW_MS && current.count >= MAX_LOGIN_ATTEMPTS) throw new Error("محاولات الدخول كثيرة. حاول بعد قليل");
  if (!current || Date.now() - current.startedAt >= LOGIN_WINDOW_MS) loginWindows.set(key, { count: 0, startedAt: Date.now() });
  const normalized = identifier.includes("@") ? identifier.trim().toLowerCase() : normalizePhone(identifier);
  const rows = await db.select().from(users).where(or(eq(users.email, normalized), eq(users.phone, normalized))).limit(1);
  const user = rows[0];
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    const window = loginWindows.get(key)!; window.count += 1;
    await recordLoginAttempt(db, identifier, false, ipAddress, "invalid_credentials");
    throw new Error("بيانات الدخول غير صحيحة");
  }
  if (user.status === "suspended") {
    await recordLoginAttempt(db, identifier, false, ipAddress, "suspended");
    throw new Error("هذا الحساب موقوف، تواصل مع الدعم");
  }
  loginWindows.delete(key);
  await recordLoginAttempt(db, identifier, true, ipAddress, "success");
  await db.update(users).set({ lastSignedIn: new Date() }).where(eq(users.id, user.id));
  return safeUser({ ...user, lastSignedIn: new Date() });
}

export async function startPasswordReset(identifier: string) {
  const db = await requireDatabase();
  const normalized = identifier.includes("@") ? identifier.trim().toLowerCase() : normalizePhone(identifier);
  const channel = identifier.includes("@") ? "email" : "phone";
  const rows = await db.select({ id: users.id, phone: users.phone, email: users.email }).from(users).where(or(eq(users.email, normalized), eq(users.phone, normalized))).limit(1);
  const challengeId = randomBytes(24).toString("hex");
  if (!rows[0]) return { challengeId, expiresInSeconds: 300, debugCode: "123456", maskedDestination: "إذا كانت البيانات صحيحة ستصلك رسالة التحقق" };
  await db.insert(passwordResetChallenges).values({ challengeId, userId: rows[0].id, channel, codeHash: hashOtp(challengeId, "123456"), expiresAt: new Date(Date.now() + 300_000), lastSentAt: new Date() });
  const destination = channel === "email" ? rows[0].email ?? "بياناتك" : rows[0].phone ?? "رقم جوالك";
  return { challengeId, expiresInSeconds: 300, debugCode: "123456", maskedDestination: channel === "email" ? destination.replace(/^(.{2}).*(@.*)$/, "$1••••$2") : `${destination.slice(0, 4)}••••${destination.slice(-2)}` };
}

export async function resetPassword(challengeId: string, code: string, newPassword: string) {
  const db = await requireDatabase();
  if (newPassword.length < 8 || !/[A-Za-z\u0600-\u06ff]/.test(newPassword) || !/\d/.test(newPassword)) throw new Error("كلمة المرور يجب أن تتكون من 8 أحرف وتحتوي حرفاً ورقماً");
  const rows = await db.select().from(passwordResetChallenges).where(eq(passwordResetChallenges.challengeId, challengeId)).limit(1);
  const challenge = rows[0];
  if (!challenge || challenge.verifiedAt || challenge.expiresAt.getTime() < Date.now()) throw new Error("انتهت صلاحية رمز الاستعادة");
  if (challenge.attempts >= 5) throw new Error("تم تجاوز عدد المحاولات. ابدأ الاستعادة من جديد");
  if (hashOtp(challengeId, code) !== challenge.codeHash) {
    await db.update(passwordResetChallenges).set({ attempts: challenge.attempts + 1 }).where(eq(passwordResetChallenges.id, challenge.id));
    throw new Error("رمز التحقق غير صحيح");
  }
  await db.transaction(async (tx) => {
    await tx.update(users).set({ passwordHash: await hashPassword(newPassword), loginMethod: "password", updatedAt: new Date() }).where(eq(users.id, challenge.userId));
    await tx.delete(authSessions).where(eq(authSessions.userId, challenge.userId));
    await tx.update(passwordResetChallenges).set({ verifiedAt: new Date() }).where(eq(passwordResetChallenges.id, challenge.id));
    await tx.insert(notifications).values({ userId: challenge.userId, type: "password_changed", title: "تم تغيير كلمة المرور", message: "تم تغيير كلمة المرور وتسجيل الخروج من الجلسات القديمة." });
  });
  return { success: true };
}

export async function listNotifications(userId: number) {
  const db = await requireDatabase();
  return db.select().from(notifications).where(eq(notifications.userId, userId)).orderBy(desc(notifications.createdAt));
}

export async function markNotificationRead(userId: number, id: number) {
  const db = await requireDatabase();
  await db.update(notifications).set({ readAt: new Date() }).where(and(eq(notifications.id, id), eq(notifications.userId, userId)));
  return { success: true };
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

export async function updateWorkshopApproval(id: number, approvalStatus: "approved" | "rejected" | "pending" | "suspended" | "requires_changes", details: { rejectionReason?: string; changeFields?: string[]; reapplyAllowed?: boolean; internalNotes?: string } = {}) {
  const db = await requireDatabase();
  const rows = await db.select({ userId: workshops.userId }).from(workshops).where(eq(workshops.id, id)).limit(1);
  const workshop = rows[0];
  if (!workshop) throw new Error("طلب الورشة غير موجود");
  await db.transaction(async (tx) => {
    await tx.update(workshops).set({ approvalStatus, rejectionReason: details.rejectionReason ?? null, changeFields: details.changeFields ? JSON.stringify(details.changeFields) : null, reapplyAllowed: details.reapplyAllowed ?? false, internalNotes: details.internalNotes ?? null, updatedAt: new Date() }).where(eq(workshops.id, id));
    await tx.update(users).set({ status: approvalStatus === "suspended" ? "suspended" : "active", updatedAt: new Date() }).where(eq(users.id, workshop.userId));
  });
  return { success: true };
}

export async function updateWorkshopPricing(id: number, input: { workshopLevel?: "Bronze" | "Silver" | "Gold" | "Platinum"; discountPercent?: number; priceListId?: string; minOrderAmount?: number; creditLimit?: number; paymentTermDays?: number; creditAllowed?: boolean }) {
  const db = await requireDatabase();
  await db.update(workshops).set({ ...input, updatedAt: new Date() }).where(eq(workshops.id, id));
  return { success: true };
}

export async function logoutAllOtherSessions(userId: number, currentTokenHash?: string) {
  const db = await requireDatabase();
  if (currentTokenHash) await db.delete(authSessions).where(and(eq(authSessions.userId, userId), eq(authSessions.tokenHash, currentTokenHash)));
  else await db.delete(authSessions).where(eq(authSessions.userId, userId));
  return { success: true };
}


export async function changePassword(userId: number, currentPassword: string, newPassword: string) {
  const db = await requireDatabase();
  const row = (await db.select({ passwordHash: users.passwordHash }).from(users).where(eq(users.id, userId)).limit(1))[0];
  if (!row || !(await verifyPassword(currentPassword, row.passwordHash))) throw new Error("كلمة المرور الحالية غير صحيحة");
  if (newPassword.length < 8 || !/[A-Za-z\u0600-\u06ff]/.test(newPassword) || !/\d/.test(newPassword)) throw new Error("كلمة المرور يجب أن تتكون من 8 أحرف وتحتوي حرفاً ورقماً");
  await db.transaction(async (tx) => {
    await tx.update(users).set({ passwordHash: await hashPassword(newPassword), updatedAt: new Date() }).where(eq(users.id, userId));
    await tx.delete(authSessions).where(eq(authSessions.userId, userId));
    await tx.insert(notifications).values({ userId, type: "password_changed", title: "تم تغيير كلمة المرور", message: "تم تغيير كلمة المرور وتسجيل الخروج من الجلسات القديمة." });
  });
  return { success: true };
}
