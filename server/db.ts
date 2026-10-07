import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertProduct, InsertUser, orderItems, orders, products, users } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

function requireDb() {
  return getDb().then((db) => {
    if (!db) throw new Error("Database is not available");
    return db;
  });
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await requireDb();
  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const textFields = ["name", "email", "loginMethod"] as const;
  type TextField = (typeof textFields)[number];
  const assignNullable = (field: TextField) => {
    const value = user[field];
    if (value === undefined) return;
    const normalized = value ?? null;
    values[field] = normalized;
    updateSet[field] = normalized;
  };
  textFields.forEach(assignNullable);
  if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
  if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; }
  else if (user.openId === ENV.ownerOpenId) { values.role = 'admin'; updateSet.role = 'admin'; }
  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await requireDb();
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function listCatalogProducts() {
  const db = await requireDb();
  return db.select().from(products).where(eq(products.status, "active")).orderBy(desc(products.createdAt));
}

export async function listCatalogCategories() {
  const db = await requireDb();
  return db.select({ category: products.category, count: sql<number>`count(*)` }).from(products).where(eq(products.status, "active")).groupBy(products.category);
}

export async function listAdminProducts() {
  const db = await requireDb();
  const rows = await db.select().from(products).where(sql`${products.status} <> 'archived'`).orderBy(desc(products.createdAt));
  return rows.map((product) => ({
    id: product.id,
    name: product.name,
    sku: product.sku,
    category: product.category,
    price: product.price,
    stock: product.stockQuantity,
    status: product.status === "active" ? "نشط" as const : "مسودة" as const,
    brand: product.brand,
  }));
}

export async function createProduct(input: Omit<InsertProduct, "id" | "createdAt" | "updatedAt">) {
  const db = await requireDb();
  await db.insert(products).values(input);
  const rows = await db.select().from(products).where(eq(products.sku, input.sku)).limit(1);
  return rows[0];
}

export async function archiveProduct(id: number) {
  const db = await requireDb();
  await db.update(products).set({ status: "archived", updatedAt: new Date() }).where(eq(products.id, id));
  return { success: true };
}

export async function updateProduct(id: number, input: { name: string; brand: string; category: string; price: number; stockQuantity: number }) {
  const db = await requireDb();
  await db.update(products).set({ ...input, updatedAt: new Date() }).where(eq(products.id, id));
  return { success: true };
}

const orderStatusToArabic = { new: "جديد", processing: "قيد التجهيز", shipped: "تم الشحن", completed: "مكتمل", cancelled: "ملغى" } as const;

export async function listAdminOrders() {
  const db = await requireDb();
  const rows = await db.select({ order: orders, itemCount: sql<number>`coalesce((select sum(${orderItems.quantity}) from ${orderItems} where ${orderItems.orderId} = ${orders.id}), 0)` }).from(orders).orderBy(desc(orders.createdAt));
  return rows.map((order) => ({
    id: order.order.orderNumber,
    customer: order.order.customerName,
    items: Number(order.itemCount),
    total: order.order.total,
    date: order.order.createdAt.toLocaleString("ar-SA"),
    status: orderStatusToArabic[order.order.status],
  }));
}

export async function updateOrderStatus(orderNumber: string, status: keyof typeof orderStatusToArabic) {
  const db = await requireDb();
  await db.update(orders).set({ status, updatedAt: new Date() }).where(eq(orders.orderNumber, orderNumber));
  return { success: true };
}

export async function getAdminOverview() {
  const db = await requireDb();
  const [sales, orderCount, productCount, lowStock] = await Promise.all([
    db.select({ value: sql<number>`coalesce(sum(${orders.total}), 0)` }).from(orders).where(sql`${orders.status} <> 'cancelled'`),
    db.select({ value: sql<number>`count(*)` }).from(orders).where(sql`${orders.status} <> 'cancelled'`),
    db.select({ value: sql<number>`count(*)` }).from(products).where(eq(products.status, "active")),
    db.select({ value: sql<number>`count(*)` }).from(products).where(and(eq(products.status, "active"), sql`${products.stockQuantity} < 5`)),
  ]);
  return { salesTotal: Number(sales[0]?.value ?? 0), orderCount: Number(orderCount[0]?.value ?? 0), productCount: Number(productCount[0]?.value ?? 0), lowStockCount: Number(lowStock[0]?.value ?? 0) };
}

export async function createCustomerOrder(input: { userId: number | null; customerName: string; phone: string; shippingAddress: string; items: Array<{ productId: number; quantity: number }> }) {
  const db = await requireDb();
  return db.transaction(async (tx) => {
    const ids = input.items.map((item) => item.productId);
    const rows = await tx.select().from(products).where(inArray(products.id, ids));
    if (rows.length !== ids.length) throw new Error("بعض المنتجات لم تعد متاحة");
    const lineItems = input.items.map((item) => {
      const product = rows.find((row) => row.id === item.productId);
      if (!product || product.status !== "active" || product.stockQuantity < item.quantity) throw new Error(`المخزون غير كافٍ للمنتج رقم ${item.productId}`);
      return { product, quantity: item.quantity };
    });
    const subtotal = lineItems.reduce((sum, line) => sum + line.product.price * line.quantity, 0);
    const shippingCost = subtotal >= 250 ? 0 : 25;
    const orderNumber = `QH-${Date.now().toString().slice(-8)}`;
    await tx.insert(orders).values({ orderNumber, userId: input.userId, customerName: input.customerName, phone: input.phone, shippingAddress: input.shippingAddress, subtotal, shippingCost, total: subtotal + shippingCost, status: "new" });
    const created = await tx.select({ id: orders.id }).from(orders).where(eq(orders.orderNumber, orderNumber)).limit(1);
    const orderId = created[0]?.id;
    if (!orderId) throw new Error("تعذر إنشاء الطلب");
    await tx.insert(orderItems).values(lineItems.map((line) => ({ orderId, productId: line.product.id, productName: line.product.name, quantity: line.quantity, unitPrice: line.product.price })));
    for (const line of lineItems) await tx.update(products).set({ stockQuantity: sql`${products.stockQuantity} - ${line.quantity}`, updatedAt: new Date() }).where(eq(products.id, line.product.id));
    return { orderNumber, total: subtotal + shippingCost };
  });
}
