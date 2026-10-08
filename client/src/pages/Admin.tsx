import { useMemo, useState } from "react";
import {
  Activity,
  ArrowDownLeft,
  ArrowRight,
  BarChart3,
  Bell,
  Boxes,
  Check,
  ChevronDown,
  ClipboardList,
  Edit3,
  LayoutDashboard,
  MoreHorizontal,
  Package,
  Plus,
  Search,
  Settings,
  ShoppingBag,
  Truck,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import ShipmentEditor from "@/components/ShipmentEditor";

type AdminProduct = { id: number; name: string; sku: string; category: string; price: number; stock: number; status: "نشط" | "مسودة"; brand: string };
type Order = { id: string; customer: string; items: number; total: number; date: string; status: "جديد" | "قيد التجهيز" | "تم الشحن" | "مكتمل" | "ملغى" };


const statusStyles: Record<Order["status"], string> = { "جديد": "bg-orange-50 text-orange-700", "قيد التجهيز": "bg-blue-50 text-blue-700", "تم الشحن": "bg-violet-50 text-violet-700", "مكتمل": "bg-emerald-50 text-emerald-700", "ملغى": "bg-red-50 text-red-700" };
const navItems: Array<{ key: "overview" | "products" | "orders"; label: string; icon: LucideIcon }> = [
  { key: "overview", label: "نظرة عامة", icon: LayoutDashboard },
  { key: "products", label: "المنتجات", icon: Package },
  { key: "orders", label: "الطلبات", icon: ClipboardList },
];

export default function Admin() {
  const [tab, setTab] = useState<"overview" | "products" | "orders">("overview");
  const [editingProduct, setEditingProduct] = useState<AdminProduct | null>(null);
  const [shipmentOrder, setShipmentOrder] = useState<string | null>(null);
  const utils = trpc.useUtils();
  const { data: products = [] } = trpc.admin.listProducts.useQuery();
  const { data: orders = [] } = trpc.admin.listOrders.useQuery();
  const { data: overview = { salesTotal: 0, orderCount: 0, productCount: 0, lowStockCount: 0 } } = trpc.admin.overview.useQuery();
  const createProductMutation = trpc.admin.createProduct.useMutation({ onSuccess: () => { setAddOpen(false); setEditingProduct(null); void utils.admin.listProducts.invalidate(); void utils.admin.overview.invalidate(); } });
  const updateProductMutation = trpc.admin.updateProduct.useMutation({ onSuccess: () => { setAddOpen(false); setEditingProduct(null); void utils.admin.listProducts.invalidate(); void utils.admin.overview.invalidate(); } });
  const archiveProductMutation = trpc.admin.archiveProduct.useMutation({ onSuccess: () => { void utils.admin.listProducts.invalidate(); void utils.admin.overview.invalidate(); } });
  const updateOrderMutation = trpc.admin.updateOrderStatus.useMutation({ onSuccess: () => { void utils.admin.listOrders.invalidate(); void utils.admin.overview.invalidate(); } });
  const [search, setSearch] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [productDraft, setProductDraft] = useState({ name: "", sku: "", category: "فرامل", price: "", stock: "", brand: "" });

  const visibleProducts = useMemo(() => products.filter((product) => `${product.name} ${product.sku} ${product.brand}`.toLowerCase().includes(search.toLowerCase())), [products, search]);
  const updateOrder = (id: string, status: Order["status"]) => {
    const statusMap = { "جديد": "new", "قيد التجهيز": "processing", "تم الشحن": "shipped", "مكتمل": "completed", "ملغى": "cancelled" } as const;
    updateOrderMutation.mutate({ orderNumber: id, status: statusMap[status] });
  };
  const openProductForm = (product?: AdminProduct) => {
    setEditingProduct(product ?? null);
    setProductDraft(product ? { name: product.name, sku: product.sku, category: product.category, price: String(product.price), stock: String(product.stock), brand: product.brand } : { name: "", sku: "", category: "فرامل", price: "", stock: "", brand: "" });
    setAddOpen(true);
  };
  const saveProduct = () => {
    if (!productDraft.name || !productDraft.sku || !productDraft.price) return;
    if (editingProduct) updateProductMutation.mutate({ id: editingProduct.id, name: productDraft.name, brand: productDraft.brand || "بدون علامة", category: productDraft.category, price: Number(productDraft.price), stockQuantity: Number(productDraft.stock) || 0 });
    else createProductMutation.mutate({ sku: productDraft.sku, name: productDraft.name, brand: productDraft.brand || "بدون علامة", category: productDraft.category, car: "توافق يحدد لاحقًا", price: Number(productDraft.price), stockQuantity: Number(productDraft.stock) || 0, imageUrl: "/assets/parts-hero.jpg", rating: 0 });
  };

  return <div className="min-h-screen bg-[#f6f8fb] text-[#0b1f33]" dir="rtl">
    <aside className="fixed inset-y-0 right-0 z-30 hidden w-64 border-l border-slate-200 bg-[#0b1f33] p-5 text-white lg:block"><a href="/" className="flex items-center border-b border-white/10 pb-6"><img src="/manus-storage/spearx-logo-yellow_80ac65ec.jpg" alt="سبير إكس" className="h-14 w-[190px] rounded-lg object-contain" /></a><div className="mt-8"><p className="px-3 text-[10px] font-bold uppercase tracking-[.2em] text-slate-400">الإدارة</p><nav className="mt-3 space-y-1">{navItems.map(({ key, label, icon: Icon }) => <button key={key as string} className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-bold transition ${tab === key ? "bg-[#f97316] text-white" : "text-slate-300 hover:bg-white/10 hover:text-white"}`} onClick={() => setTab(key)}><Icon size={18} />{label}</button>)}</nav></div><div className="absolute bottom-6 right-5 left-5 rounded-2xl bg-white/10 p-4"><p className="text-xs font-bold text-orange-200">مركز العمليات</p><p className="mt-2 text-xs leading-5 text-slate-300">تأكد من تحديث حالة المخزون قبل اعتماد الطلبات.</p><a href="/" className="mt-3 flex items-center gap-1 text-xs font-bold text-white">العودة للمتجر <ArrowRight size={14} /></a></div></aside>
    <div className="lg:mr-64"><header className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 bg-white/95 px-4 py-4 backdrop-blur sm:px-8"><div><p className="text-xs font-bold text-[#f97316]">لوحة تحكم سبير إكس</p><h1 className="mt-1 text-xl font-black">{tab === "overview" ? "نظرة عامة" : tab === "products" ? "إدارة المنتجات" : "إدارة الطلبات"}</h1></div><div className="flex items-center gap-2"><button className="rounded-xl p-2 text-slate-500 hover:bg-slate-100" aria-label="الإشعارات"><Bell size={19} /></button><div className="hidden items-center gap-2 rounded-xl bg-slate-100 px-3 py-2 text-sm font-bold sm:flex"><span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#0b1f33] text-xs text-white">م</span> مدير المتجر <ChevronDown size={14} /></div></div></header><main className="p-4 sm:p-8">
      {tab === "overview" && <Overview stats={overview} orders={orders} onProducts={() => setTab("products")} onOrders={() => setTab("orders")} />}
      {tab === "products" && <ProductsView products={visibleProducts} search={search} setSearch={setSearch} onAdd={() => openProductForm()} onEdit={openProductForm} onDelete={(id) => archiveProductMutation.mutate({ id })} />}
      {tab === "orders" && <OrdersView orders={orders} onUpdate={updateOrder} onShipment={setShipmentOrder} />}
    </main></div>
    {shipmentOrder && <ShipmentEditor orderNumber={shipmentOrder} onClose={() => { setShipmentOrder(null); void utils.admin.listOrders.invalidate(); }} />}
    {addOpen && <div className="fixed inset-0 z-50 flex items-center justify-center p-4"><button className="absolute inset-0 bg-[#0b1f33]/55" onClick={() => setAddOpen(false)} aria-label="إغلاق" /><div className="relative w-full max-w-xl rounded-3xl bg-white p-6 shadow-2xl"><button className="absolute left-4 top-4 rounded-xl p-2 text-slate-500 hover:bg-slate-100" onClick={() => setAddOpen(false)}><X size={18} /></button><p className="text-sm font-bold text-[#f97316]">كتالوج المتجر</p><h2 className="mt-1 text-2xl font-black">{editingProduct ? "تعديل المنتج" : "إضافة منتج جديد"}</h2><div className="mt-6 grid gap-3 sm:grid-cols-2"><input className="h-12 rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-orange-300 sm:col-span-2" placeholder="اسم المنتج" value={productDraft.name} onChange={(e) => setProductDraft({ ...productDraft, name: e.target.value })} /><input className="h-12 rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-orange-300" placeholder="SKU / رقم القطعة" value={productDraft.sku} onChange={(e) => setProductDraft({ ...productDraft, sku: e.target.value })} /><input className="h-12 rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-orange-300" placeholder="العلامة التجارية" value={productDraft.brand} onChange={(e) => setProductDraft({ ...productDraft, brand: e.target.value })} /><input type="number" className="h-12 rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-orange-300" placeholder="السعر" value={productDraft.price} onChange={(e) => setProductDraft({ ...productDraft, price: e.target.value })} /><input type="number" className="h-12 rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-orange-300" placeholder="المخزون" value={productDraft.stock} onChange={(e) => setProductDraft({ ...productDraft, stock: e.target.value })} /><select className="h-12 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold outline-none focus:border-orange-300 sm:col-span-2" value={productDraft.category} onChange={(e) => setProductDraft({ ...productDraft, category: e.target.value })}><option>فرامل</option><option>فلاتر</option><option>تعليق ومقصات</option><option>كهرباء السيارة</option></select></div><Button className="mt-5 h-12 w-full rounded-xl bg-[#f97316] font-bold text-white hover:bg-[#ea580c]" onClick={saveProduct}>{editingProduct ? "حفظ التعديل" : "حفظ المنتج"} <Check size={17} /></Button></div></div>}
  </div>;
}

function Overview({ stats, orders, onProducts, onOrders }: { stats: { salesTotal: number; orderCount: number; productCount: number; lowStockCount: number }; orders: Order[]; onProducts: () => void; onOrders: () => void }) {
  const metricCards: Array<{ label: string; value: string; change: string; icon: LucideIcon }> = [
    { label: "إجمالي المبيعات", value: `${stats.salesTotal.toLocaleString()} ر.س`, change: "من قاعدة البيانات", icon: ShoppingBag },
    { label: "الطلبات", value: String(stats.orderCount), change: "من قاعدة البيانات", icon: ClipboardList },
    { label: "المنتجات النشطة", value: String(stats.productCount), change: "من قاعدة البيانات", icon: Boxes },
    { label: "المخزون المنخفض", value: String(stats.lowStockCount), change: "تحتاج متابعة", icon: Users },
  ];
  return <div className="mx-auto max-w-7xl"><div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end"><div><p className="text-sm font-bold text-[#f97316]">الأربعاء، 7 أكتوبر 2026</p><h2 className="mt-1 text-3xl font-black">صباح الخير، مدير المتجر</h2><p className="mt-2 text-sm text-slate-500">هذه نظرة سريعة على أداء سبير إكس اليوم.</p></div><Button className="rounded-xl bg-[#0b1f33] font-bold" onClick={onProducts}><Plus size={16} /> إضافة منتج</Button></div><div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{metricCards.map(({ label, value, change, icon: Icon }) => <div key={label} className="rounded-2xl border border-slate-200 bg-white p-5"><div className="flex items-center justify-between"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-[#f97316]"><Icon size={19} /></span><span className="text-xs font-bold text-emerald-600">{change}</span></div><p className="mt-5 text-sm text-slate-500">{label}</p><p className="mt-1 text-2xl font-black">{value}</p></div>)}</div><div className="mt-6 grid gap-6 xl:grid-cols-[1.15fr_.85fr]"><div className="rounded-2xl border border-slate-200 bg-white p-5"><div className="flex items-center justify-between"><div><h3 className="font-black">المبيعات خلال الأسبوع</h3><p className="mt-1 text-xs text-slate-500">مقارنة بالأسبوع السابق</p></div><BarChart3 className="text-slate-400" size={20} /></div><div className="mt-6 flex h-44 items-end gap-3 sm:gap-5">{[42, 58, 48, 72, 64, 86, 78].map((height, index) => <div key={index} className="flex flex-1 flex-col items-center gap-2"><div className={`w-full rounded-t-lg ${index === 5 ? "bg-[#f97316]" : "bg-orange-100"}`} style={{ height: `${height}%` }} /><span className="text-[10px] text-slate-400">{["سبت", "أحد", "اثن", "ثلث", "أرب", "خمي", "جمع"][index]}</span></div>)}</div></div><div className="rounded-2xl border border-slate-200 bg-white p-5"><div className="flex items-center justify-between"><div><h3 className="font-black">آخر الطلبات</h3><p className="mt-1 text-xs text-slate-500">تحتاج متابعة سريعة</p></div><button className="text-xs font-bold text-[#f97316]" onClick={onOrders}>عرض الكل</button></div><div className="mt-4 space-y-3">{orders.slice(0, 3).map((order) => <div key={order.id} className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 p-3"><div className="min-w-0"><p className="text-sm font-bold">{order.customer}</p><p className="mt-1 text-xs text-slate-400">{order.id} · {order.date}</p></div><span className={`shrink-0 rounded-lg px-2 py-1 text-[10px] font-bold ${statusStyles[order.status]}`}>{order.status}</span></div>)}</div></div></div><div className="mt-6 rounded-2xl border border-orange-200 bg-[#fff7ed] p-5"><div className="flex items-start gap-3"><Activity className="mt-0.5 text-[#f97316]" size={20} /><div><h3 className="font-black">تذكير تشغيلي</h3><p className="mt-1 text-sm leading-6 text-slate-600">هناك {stats.lowStockCount} منتجات مخزونها منخفض أو نفد. راجع المنتجات قبل إطلاق الحملات القادمة.</p></div></div></div></div>;
}

function ProductsView({ products, search, setSearch, onAdd, onEdit, onDelete }: { products: AdminProduct[]; search: string; setSearch: (value: string) => void; onAdd: () => void; onEdit: (product: AdminProduct) => void; onDelete: (id: number) => void }) {
  return <div className="mx-auto max-w-7xl"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-sm font-bold text-[#f97316]">كتالوج المتجر</p><h2 className="mt-1 text-3xl font-black">المنتجات</h2></div><Button className="rounded-xl bg-[#f97316] font-bold text-white" onClick={onAdd}><Plus size={17} /> إضافة منتج</Button></div><div className="mt-6 flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3"><Search size={18} className="text-slate-400" /><input className="w-full text-sm outline-none" placeholder="ابحث بالاسم أو SKU أو العلامة..." value={search} onChange={(e) => setSearch(e.target.value)} /></div><div className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white"><div className="hidden grid-cols-[1.6fr_1fr_.8fr_.7fr_.7fr_.35fr] gap-4 border-b border-slate-200 bg-slate-50 px-5 py-3 text-xs font-bold text-slate-500 md:grid"><span>المنتج</span><span>SKU</span><span>الفئة</span><span>السعر</span><span>المخزون</span><span /></div>{products.map((product) => <div key={product.id} className="grid gap-3 border-b border-slate-100 px-5 py-4 last:border-0 md:grid-cols-[1.6fr_1fr_.8fr_.7fr_.7fr_.35fr] md:items-center md:gap-4"><div><p className="font-bold">{product.name}</p><p className="mt-1 text-xs text-[#f97316]">{product.brand} · {product.status}</p></div><span className="text-xs font-bold text-slate-500">{product.sku}</span><span className="text-sm text-slate-600">{product.category}</span><span className="font-black">{product.price} ر.س</span><span className={`text-sm font-bold ${product.stock === 0 ? "text-red-600" : product.stock < 5 ? "text-orange-600" : "text-emerald-600"}`}>{product.stock === 0 ? "نفد" : `${product.stock} قطعة`}</span><div className="flex items-center gap-1"><button className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-[#f97316]" aria-label="تعديل المنتج" onClick={() => onEdit(product)}><Edit3 size={16} /></button><button className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600" onClick={() => onDelete(product.id)} aria-label="حذف المنتج"><X size={16} /></button></div></div>)}{products.length === 0 && <div className="p-12 text-center text-sm text-slate-500">لا توجد منتجات مطابقة.</div>}</div></div>;
}

function OrdersView({ orders, onUpdate, onShipment }: { orders: Order[]; onUpdate: (id: string, status: Order["status"]) => void; onShipment: (orderNumber: string) => void }) {
  const pending = orders.filter((order) => order.status === "جديد" || order.status === "قيد التجهيز").length;
  const shipping = orders.filter((order) => order.status === "تم الشحن").length;
  const completed = orders.filter((order) => order.status === "مكتمل").length;
  return <div className="mx-auto max-w-7xl"><div><p className="text-sm font-bold text-[#f97316]">العمليات</p><h2 className="mt-1 text-3xl font-black">الطلبات</h2><p className="mt-2 text-sm text-slate-500">تابع حالة الطلب من الاستلام حتى التسليم.</p></div><div className="mt-6 grid gap-4 sm:grid-cols-3"><MiniStat label="تحتاج معالجة" value={String(pending)} icon={ClipboardList} /><MiniStat label="قيد الشحن" value={String(shipping)} icon={Truck} /><MiniStat label="مكتملة" value={String(completed)} icon={Check} /></div><div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white"><div className="hidden grid-cols-[1fr_1.3fr_.5fr_.8fr_1fr_.35fr] gap-4 border-b border-slate-200 bg-slate-50 px-5 py-3 text-xs font-bold text-slate-500 md:grid"><span>رقم الطلب</span><span>العميل</span><span>القطع</span><span>الإجمالي</span><span>الحالة</span><span /></div>{orders.map((order) => <div key={order.id} className="grid gap-3 border-b border-slate-100 px-5 py-4 last:border-0 md:grid-cols-[1fr_1.3fr_.5fr_.8fr_1fr_.35fr] md:items-center md:gap-4"><span className="font-black text-[#f97316]">{order.id}</span><div><p className="font-bold">{order.customer}</p><p className="mt-1 text-xs text-slate-400">{order.date}</p></div><span className="text-sm text-slate-600">{order.items}</span><span className="font-black">{order.total} ر.س</span><label className={`flex w-fit items-center gap-2 rounded-lg px-2 py-1 text-xs font-bold ${statusStyles[order.status]}`}><select className="bg-transparent outline-none" value={order.status} onChange={(e) => onUpdate(order.id, e.target.value as Order["status"])}><option>جديد</option><option>قيد التجهيز</option><option>تم الشحن</option><option>مكتمل</option><option>ملغى</option></select></label><button className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-[#f97316]" aria-label="تحديث الشحنة" onClick={() => onShipment(order.id)}><Truck size={17} /></button></div>)}</div></div>;
}

function MiniStat({ label, value, icon: Icon }: { label: string; value: string; icon: typeof ClipboardList }) {
  return <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600"><Icon size={18} /></span><div><p className="text-xs text-slate-500">{label}</p><p className="mt-1 text-xl font-black">{value}</p></div></div>;
}
