import { products } from "../drizzle/schema";
import { getDb } from "../server/db";

const catalog = [
  { sku: "BRM-CAM-18", name: "طقم فحمات فرامل أمامية", brand: "Brembo", category: "فرامل", car: "تويوتا كامري 2018–2023", description: "فحمات أمامية بجودة موثوقة للاستخدام اليومي.", price: 179, oldPrice: 229, stockQuantity: 42, imageUrl: "/assets/brake-kit.jpeg", badge: "الأكثر طلبًا", rating: 49, status: "active" as const },
  { sku: "ATE-BMW-21", name: "هوبات فرامل رياضية — زوج", brand: "ATE", category: "فرامل", car: "BMW 3 Series 2016–2021", description: "زوج هوبات فرامل مع تبريد محسّن.", price: 385, oldPrice: null, stockQuantity: 4, imageUrl: "/assets/brake-rotor.jpeg", badge: "أصلي", rating: 48, status: "active" as const },
  { sku: "TRW-SNF-24", name: "طقم فرامل سيراميك كامل", brand: "TRW", category: "فرامل", car: "هيونداي سوناتا 2020–2024", description: "طقم كامل للفرامل الأمامية مع أداء هادئ.", price: 299, oldPrice: 349, stockQuantity: 18, imageUrl: "/assets/brake-box.jpeg", badge: "عرض اليوم", rating: 47, status: "active" as const },
  { sku: "MAN-MBC-22", name: "فلتر هواء عالي الأداء", brand: "MANN-FILTER", category: "فلاتر", car: "مرسيدس C-Class 2017–2022", description: "فلتر هواء عالي الجودة للمحافظة على كفاءة المحرك.", price: 89, oldPrice: null, stockQuantity: 0, imageUrl: "/assets/parts-hero.jpg", badge: null, rating: 46, status: "draft" as const },
];

const main = async () => {
  const db = await getDb();
  if (!db) throw new Error("DATABASE_URL is required to seed the catalog");
  const existing = await db.select({ id: products.id }).from(products).limit(1);
  if (existing.length > 0) {
    console.log("Catalog already seeded; leaving existing products untouched.");
    return;
  }
  await db.insert(products).values(catalog);
  console.log(`Seeded ${catalog.length} catalog products.`);
};

main().then(() => process.exit(0)).catch((error) => { console.error(error); process.exit(1); });
