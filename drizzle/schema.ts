import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

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
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const workshops = mysqlTable("workshops", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  workshopName: varchar("workshopName", { length: 180 }).notNull(),
  city: varchar("city", { length: 100 }).notNull(),
  address: text("address").notNull(),
  businessType: varchar("businessType", { length: 100 }).notNull(),
  monthlyVolume: varchar("monthlyVolume", { length: 80 }).notNull(),
  tradeLicense: varchar("tradeLicense", { length: 500 }),
  logo: varchar("logo", { length: 500 }),
  approvalStatus: mysqlEnum("approvalStatus", ["pending", "approved", "rejected"]).default("pending").notNull(),
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
export type Workshop = typeof workshops.$inferSelect;
export type InsertWorkshop = typeof workshops.$inferInsert;
export type Product = typeof products.$inferSelect;
export type InsertProduct = typeof products.$inferInsert;
export type Order = typeof orders.$inferSelect;
export type InsertOrder = typeof orders.$inferInsert;
export type OrderItem = typeof orderItems.$inferSelect;
export type InsertOrderItem = typeof orderItems.$inferInsert;
export type ShipmentEvent = typeof shipmentEvents.$inferSelect;
export type InsertShipmentEvent = typeof shipmentEvents.$inferInsert;
