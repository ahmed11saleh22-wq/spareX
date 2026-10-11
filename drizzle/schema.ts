import { boolean, int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  phone: varchar("phone", { length: 40 }),
  email: varchar("email", { length: 320 }),
  passwordHash: varchar("passwordHash", { length: 255 }),
  accountType: mysqlEnum("accountType", ["customer", "workshop"]).default("customer").notNull(),
  status: mysqlEnum("status", ["active", "pending", "suspended"]).default("active").notNull(),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin", "super_admin", "workshop_owner", "workshop_employee"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const workshops = mysqlTable("workshops", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  workshopName: varchar("workshopName", { length: 180 }).notNull(),
  workshopNameEn: varchar("workshopNameEn", { length: 180 }),
  managerName: varchar("managerName", { length: 180 }),
  phone: varchar("phone", { length: 40 }),
  whatsapp: varchar("whatsapp", { length: 40 }),
  email: varchar("email", { length: 320 }),
  country: varchar("country", { length: 100 }),
  city: varchar("city", { length: 100 }).notNull(),
  district: varchar("district", { length: 120 }),
  address: text("address").notNull(),
  mapUrl: varchar("mapUrl", { length: 500 }),
  tradeLicenseNumber: varchar("tradeLicenseNumber", { length: 100 }),
  licenseExpiresAt: varchar("licenseExpiresAt", { length: 30 }),
  taxNumber: varchar("taxNumber", { length: 100 }),
  branchCount: int("branchCount"),
  technicianCount: int("technicianCount"),
  businessType: varchar("businessType", { length: 100 }).notNull(),
  monthlyVolume: varchar("monthlyVolume", { length: 80 }).notNull(),
  specialties: text("specialties"),
  vehicleSpecialties: text("vehicleSpecialties"),
  notes: text("notes"),
  warehouseDetails: text("warehouseDetails"),
  warehouseCount: int("warehouseCount").default(0).notNull(),
  tradeLicense: varchar("tradeLicense", { length: 500 }),
  taxCertificate: varchar("taxCertificate", { length: 500 }),
  storefrontImage: varchar("storefrontImage", { length: 500 }),
  logo: varchar("logo", { length: 500 }),
  rejectionReason: text("rejectionReason"),
  changeFields: text("changeFields"),
  internalNotes: text("internalNotes"),
  reapplyAllowed: boolean("reapplyAllowed").default(false).notNull(),
  workshopLevel: varchar("workshopLevel", { length: 30 }),
  discountPercent: int("discountPercent"),
  priceListId: varchar("priceListId", { length: 80 }),
  minOrderAmount: int("minOrderAmount"),
  creditLimit: int("creditLimit"),
  paymentTermDays: int("paymentTermDays"),
  creditAllowed: boolean("creditAllowed").default(false).notNull(),
  approvalStatus: mysqlEnum("approvalStatus", ["draft", "pending", "approved", "rejected", "suspended", "requires_changes"]).default("draft").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const registrationChallenges = mysqlTable("registration_challenges", {
  id: int("id").autoincrement().primaryKey(),
  challengeId: varchar("challengeId", { length: 80 }).notNull().unique(),
  accountType: mysqlEnum("accountType", ["customer", "workshop"]).notNull(),
  phone: varchar("phone", { length: 40 }).notNull(),
  payload: text("payload").notNull(),
  codeHash: varchar("codeHash", { length: 128 }).notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  lastSentAt: timestamp("lastSentAt").defaultNow().notNull(),
  attempts: int("attempts").default(0).notNull(),
  verifiedAt: timestamp("verifiedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const authSessions = mysqlTable("auth_sessions", {
  id: int("id").autoincrement().primaryKey(),
  tokenHash: varchar("tokenHash", { length: 128 }).notNull().unique(),
  userId: int("userId").notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  lastSeenAt: timestamp("lastSeenAt").defaultNow().notNull(),
  userAgent: varchar("userAgent", { length: 255 }),
  ipAddress: varchar("ipAddress", { length: 80 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const passwordResetChallenges = mysqlTable("password_reset_challenges", {
  id: int("id").autoincrement().primaryKey(),
  challengeId: varchar("challengeId", { length: 80 }).notNull().unique(),
  userId: int("userId").notNull(),
  channel: mysqlEnum("channel", ["phone", "email"]).notNull(),
  codeHash: varchar("codeHash", { length: 128 }).notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  lastSentAt: timestamp("lastSentAt").defaultNow().notNull(),
  attempts: int("attempts").default(0).notNull(),
  verifiedAt: timestamp("verifiedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const loginAttempts = mysqlTable("login_attempts", {
  id: int("id").autoincrement().primaryKey(),
  identifierHash: varchar("identifierHash", { length: 128 }).notNull(),
  ipAddress: varchar("ipAddress", { length: 80 }),
  success: boolean("success").default(false).notNull(),
  reason: varchar("reason", { length: 80 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const userConsents = mysqlTable("user_consents", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  consentType: mysqlEnum("consentType", ["terms_privacy", "marketing"]).notNull(),
  accepted: boolean("accepted").notNull(),
  policyVersion: varchar("policyVersion", { length: 40 }).notNull(),
  acceptedAt: timestamp("acceptedAt").defaultNow().notNull(),
});

export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  type: varchar("type", { length: 80 }).notNull(),
  title: varchar("title", { length: 180 }).notNull(),
  message: text("message").notNull(),
  readAt: timestamp("readAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const workshopEmployees = mysqlTable("workshop_employees", {
  id: int("id").autoincrement().primaryKey(),
  workshopId: int("workshopId").notNull(),
  userId: int("userId").notNull(),
  permissions: text("permissions").notNull(),
  status: mysqlEnum("status", ["invited", "active", "disabled"]).default("invited").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const vehicles = mysqlTable("vehicles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  make: varchar("make", { length: 100 }).notNull(),
  model: varchar("model", { length: 120 }).notNull(),
  year: int("year").notNull(),
  trim: varchar("trim", { length: 120 }),
  vin: varchar("vin", { length: 17 }),
  isPrimary: boolean("isPrimary").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export const products = mysqlTable("products", {
  id: int("id").autoincrement().primaryKey(),
  sku: varchar("sku", { length: 80 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  brand: varchar("brand", { length: 120 }).notNull(),
  category: varchar("category", { length: 120 }).notNull(),
  car: varchar("car", { length: 255 }).notNull(),
  description: text("description"),
  price: int("price").notNull(),
  oldPrice: int("oldPrice"),
  stockQuantity: int("stockQuantity").default(0).notNull(),
  imageUrl: varchar("imageUrl", { length: 500 }).notNull(),
  badge: varchar("badge", { length: 80 }),
  rating: int("rating").default(0).notNull(),
  status: mysqlEnum("status", ["active", "draft", "archived"]).default("active").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const vehicleFitments = mysqlTable("vehicle_fitments", {
  id: int("id").autoincrement().primaryKey(),
  productId: int("productId").notNull(),
  make: varchar("make", { length: 100 }).notNull(),
  model: varchar("model", { length: 120 }).notNull(),
  yearFrom: int("yearFrom").notNull(),
  yearTo: int("yearTo").notNull(),
  engine: varchar("engine", { length: 80 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const orders = mysqlTable("orders", {
  id: int("id").autoincrement().primaryKey(),
  orderNumber: varchar("orderNumber", { length: 40 }).notNull().unique(),
  userId: int("userId"),
  customerName: varchar("customerName", { length: 180 }).notNull(),
  phone: varchar("phone", { length: 40 }).notNull(),
  shippingAddress: text("shippingAddress").notNull(),
  subtotal: int("subtotal").notNull(),
  shippingCost: int("shippingCost").default(0).notNull(),
  total: int("total").notNull(),
  status: mysqlEnum("status", ["new", "processing", "shipped", "completed", "cancelled"]).default("new").notNull(),
  paymentStatus: mysqlEnum("paymentStatus", ["pending", "paid", "failed", "refunded", "cancelled"]).default("pending").notNull(),
  paymentMethod: varchar("paymentMethod", { length: 40 }),
  moyasarPaymentId: varchar("moyasarPaymentId", { length: 80 }).unique(),
  shippingStatus: mysqlEnum("shippingStatus", ["pending", "preparing", "shipped", "in_transit", "out_for_delivery", "delivered", "exception"]).default("pending").notNull(),
  trackingNumber: varchar("trackingNumber", { length: 120 }),
  carrier: varchar("carrier", { length: 80 }),
  estimatedDelivery: varchar("estimatedDelivery", { length: 120 }),
  shippingUpdatedAt: timestamp("shippingUpdatedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const orderItems = mysqlTable("order_items", {
  id: int("id").autoincrement().primaryKey(),
  orderId: int("orderId").notNull(),
  productId: int("productId").notNull(),
  productName: varchar("productName", { length: 255 }).notNull(),
  quantity: int("quantity").notNull(),
  unitPrice: int("unitPrice").notNull(),
});

export const shipmentEvents = mysqlTable("shipment_events", {
  id: int("id").autoincrement().primaryKey(),
  orderId: int("orderId").notNull(),
  status: mysqlEnum("status", ["pending", "preparing", "shipped", "in_transit", "out_for_delivery", "delivered", "exception"]).notNull(),
  title: varchar("title", { length: 180 }).notNull(),
  description: text("description"),
  location: varchar("location", { length: 180 }),
  occurredAt: timestamp("occurredAt").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type PasswordResetChallenge = typeof passwordResetChallenges.$inferSelect;
export type InsertPasswordResetChallenge = typeof passwordResetChallenges.$inferInsert;
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;
export type Workshop = typeof workshops.$inferSelect;
export type InsertWorkshop = typeof workshops.$inferInsert;
export type RegistrationChallenge = typeof registrationChallenges.$inferSelect;
export type InsertRegistrationChallenge = typeof registrationChallenges.$inferInsert;
export type AuthSession = typeof authSessions.$inferSelect;
export type InsertAuthSession = typeof authSessions.$inferInsert;
export type Vehicle = typeof vehicles.$inferSelect;
export type InsertVehicle = typeof vehicles.$inferInsert;
export type Product = typeof products.$inferSelect;
export type InsertProduct = typeof products.$inferInsert;
export type Order = typeof orders.$inferSelect;
export type InsertOrder = typeof orders.$inferInsert;
export type OrderItem = typeof orderItems.$inferSelect;
export type InsertOrderItem = typeof orderItems.$inferInsert;
export type ShipmentEvent = typeof shipmentEvents.$inferSelect;
export type InsertShipmentEvent = typeof shipmentEvents.$inferInsert;
