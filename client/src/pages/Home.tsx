import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  BadgeCheck,
  CarFront,
  ChevronDown,
  CircleHelp,
  ClipboardList,
  Filter,
  Heart,
  Globe2,
  MessageCircle,
  MapPin,
  Menu,
  PackageCheck,
  RotateCcw,
  MapPinned,
  CreditCard,
  WalletCards,
  LogOut,
  Search,
  ShieldCheck,
  ShoppingCart,
  SlidersHorizontal,
  Sparkles,
  Truck,
  UserRound,
  X,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { startLogin } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import TrackOrder from "@/components/TrackOrder";
import MoyasarPayment from "@/components/MoyasarPayment";
import VinMatcher from "@/components/VinMatcher";

type Product = {
  id: number;
  name: string;
  brand: string;
  car: string;
  category: string;
  price: number;
  oldPrice?: number;
  image: string;
  badge?: string;
  rating: number;
  stock: string;
};

const categories = [
  { label: "فرامل", count: "1,240 قطعة", icon: "◉", tone: "bg-orange-50 text-orange-600" },
  { label: "فلاتر", count: "860 قطعة", icon: "▦", tone: "bg-blue-50 text-blue-700" },
  { label: "تعليق ومقصات", count: "690 قطعة", icon: "⌁", tone: "bg-slate-100 text-slate-700" },
  { label: "كهرباء السيارة", count: "430 قطعة", icon: "ϟ", tone: "bg-amber-50 text-amber-700" },
  { label: "زيوت وسوائل", count: "320 قطعة", icon: "◌", tone: "bg-emerald-50 text-emerald-700" },
];


const carOptions = ["اختر الماركة", "تويوتا", "هيونداي", "BMW", "مرسيدس", "نيسان"];
const categoryOptions = ["كل الفئات", "فرامل", "فلاتر", "تعليق ومقصات", "كهرباء السيارة", "زيوت وسوائل"];
const searchSuggestions = ["فحمات الفرامل", "فلتر الزيت", "فلتر الهواء", "بطارية سيارة", "مساعدات", "دينمو السيارة", "كمبروسر مكيف", "طرمبة ماء", "حساس الأكسجين", "بواجي السيارة"];
const gulfDeliveryOptions = [
  { country: "السعودية", cities: ["الرياض", "جدة", "الدمام", "مكة المكرمة", "المدينة المنورة", "أبها"] },
  { country: "الإمارات", cities: ["دبي", "أبوظبي", "الشارقة", "العين", "رأس الخيمة"] },
  { country: "الكويت", cities: ["مدينة الكويت", "حولي", "الفروانية", "الأحمدي"] },
  { country: "قطر", cities: ["الدوحة", "الريان", "الوكرة", "أم صلال"] },
  { country: "البحرين", cities: ["المنامة", "المحرق", "الرفاع", "مدينة حمد"] },
  { country: "عُمان", cities: ["مسقط", "صلالة", "صحار", "نزوى"] },
];

export default function Home() {
  const { user, isAuthenticated, logout } = useAuth();
  const [query, setQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [suggestionIndex, setSuggestionIndex] = useState(0);
  const [car, setCar] = useState("اختر الماركة");
  const [model, setModel] = useState("اختر الموديل");
  const [category, setCategory] = useState("كل الفئات");
  const [sort, setSort] = useState("الأكثر صلة");
  const [cart, setCart] = useState<number[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [locationOpen, setLocationOpen] = useState(false);
  const [deliveryLocation, setDeliveryLocation] = useState({ country: "السعودية", city: "الرياض" });
  const [geoStatus, setGeoStatus] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [checkoutForm, setCheckoutForm] = useState({ customerName: "", phone: "", shippingAddress: "" });
  const [orderSuccess, setOrderSuccess] = useState<string | null>(null);
  const [paymentOrder, setPaymentOrder] = useState<{ orderNumber: string; total: number } | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [authTab, setAuthTab] = useState<"login" | "register">("login");
  const [authMethod, setAuthMethod] = useState<"phone" | "email">("phone");
  const [otpStep, setOtpStep] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [authPhone, setAuthPhone] = useState("");
  const [authEmail, setAuthEmail] = useState("");
  const [authOtp, setAuthOtp] = useState("");
  useEffect(() => {
    const timer = window.setInterval(() => setSuggestionIndex((index) => (index + 1) % searchSuggestions.length), 2400);
    return () => window.clearInterval(timer);
  }, []);
  const createOrderMutation = trpc.orders.create.useMutation({ onSuccess: (result) => { setPaymentOrder(result); setCheckoutOpen(false); setCartOpen(false); setCart([]); setCheckoutForm({ customerName: "", phone: "", shippingAddress: "" }); } });
  const { data: catalogRows = [] } = trpc.catalog.list.useQuery();
  const { data: categoryRows = [] } = trpc.catalog.categories.useQuery();
  const categoryCards = categories.map((item) => ({ ...item, count: `${Number(categoryRows.find((row) => row.category === item.label)?.count ?? 0)} قطعة` }));
  const products: Product[] = catalogRows.map((product) => ({
    id: product.id,
    name: product.name,
    brand: product.brand,
    car: product.car,
    category: product.category,
    price: product.price,
    oldPrice: product.oldPrice ?? undefined,
    image: product.imageUrl,
    badge: product.badge ?? undefined,
    rating: product.rating / 10,
    stock: product.stockQuantity > 0 ? (product.stockQuantity < 5 ? `باقي ${product.stockQuantity} قطع` : "متوفر الآن") : "غير متوفر",
  }));

  const liveSearchResults = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return [];
    const productResults = products.filter((product) => [product.name, product.brand, product.car, product.category].join(" ").toLowerCase().includes(normalized)).slice(0, 4).map((product) => ({ type: "منتج", label: product.name, detail: `${product.brand} · ${product.category}`, id: product.id }));
    const categoryResults = categories.filter((item) => item.label.toLowerCase().includes(normalized)).map((item) => ({ type: "تصنيف", label: item.label, detail: "تصفح جميع القطع في التصنيف" }));
    const brandResults = Array.from(new Set(products.map((product) => product.brand))).filter((brand) => brand.toLowerCase().includes(normalized)).slice(0, 3).map((brand) => ({ type: "ماركة", label: brand, detail: "قطع متوافقة من هذه الماركة" }));
    return [...productResults, ...categoryResults, ...brandResults].slice(0, 7);
  }, [products, query]);

  const filteredProducts = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const result = products.filter((product) => {
      const matchesQuery = !normalized || [product.name, product.brand, product.car, product.category].join(" ").toLowerCase().includes(normalized);
      const matchesCategory = category === "كل الفئات" || product.category === category;
      const matchesCar = car === "اختر الماركة" || product.car.includes(car);
      return matchesQuery && matchesCategory && matchesCar;
    });
    if (sort === "السعر: الأقل") return [...result].sort((a, b) => a.price - b.price);
    if (sort === "السعر: الأعلى") return [...result].sort((a, b) => b.price - a.price);
    return result;
  }, [products, query, category, car, sort]);

  const cartCount = cart.length;
  const cartProducts = products.filter((product) => cart.includes(product.id));
  const cartTotal = cartProducts.reduce((sum, product) => sum + product.price, 0);
  const vehicleLabel = car === "اختر الماركة" ? "لم تحدد سيارة" : `${car}${model !== "اختر الموديل" ? ` ${model}` : ""}`;

  const addToCart = (id: number) => {
    setCart((current) => (current.includes(id) ? current : [...current, id]));
    setCartOpen(true);
  };

  const selectedCountry = gulfDeliveryOptions.find((option) => option.country === deliveryLocation.country) ?? gulfDeliveryOptions[0];
  const isCurrentLocation = deliveryLocation.country === "الخليج العربي";
  const deliveryCities = isCurrentLocation ? ["موقعك الحالي", ...selectedCountry.cities] : selectedCountry.cities;
  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      setGeoStatus("المتصفح لا يدعم تحديد الموقع. اختر مدينتك من القائمة.");
      return;
    }
    setGeoStatus("جارٍ تحديد موقعك الحالي…");
    navigator.geolocation.getCurrentPosition(
      () => { setDeliveryLocation({ country: "الخليج العربي", city: "موقعك الحالي" }); setGeoStatus("تم تحديد موقعك الحالي بنجاح."); setLocationOpen(false); },
      () => setGeoStatus("لم نتمكن من الوصول للموقع. اختر الدولة والمدينة يدويًا."),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 },
    );
  };

  return (
    <div className="min-h-screen bg-[#f7f8fa] text-[#0b1f33]" dir="rtl">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "ItemList", name: "قطع غيار السيارات من سبير إكس", itemListElement: products.map((product, index) => ({ "@type": "ListItem", position: index + 1, item: { "@type": "Product", name: product.name, brand: { "@type": "Brand", name: product.brand }, image: `${window.location.origin}${product.image}`, sku: String(product.id), offers: { "@type": "Offer", price: product.price, priceCurrency: "SAR", availability: product.stock === "غير متوفر" ? "https://schema.org/OutOfStock" : "https://schema.org/InStock", url: `${window.location.origin}/#shop` } } })) }) }} />
      <header className="sticky top-0 z-30 border-b border-[#203a55] bg-[#0b1f33] text-white shadow-lg shadow-[#0b1f33]/20">
        <div className="mx-auto flex min-h-[64px] w-full max-w-[1500px] items-center justify-between gap-2 overflow-visible px-3 sm:gap-4 sm:px-6 lg:gap-7 lg:px-8">
          <div className="order-1 flex shrink-0 items-center gap-2 sm:gap-4">
            <a href="#" className="flex shrink-0 flex-col leading-none" aria-label="سبير X الرئيسية"><span className="text-[1.18rem] font-black tracking-tight sm:text-[1.45rem]">سـبـيـر <b className="text-[#f97316]">X</b></span><small className="mt-1 text-[7px] font-medium tracking-wide text-slate-300 sm:text-[9px]">قطع غيار السيارات</small></a>
            <button className="hidden items-center gap-1 whitespace-nowrap rounded-lg px-1 py-2 text-xs font-bold hover:bg-white/10 sm:flex sm:px-2" onClick={() => setLocationOpen(true)} aria-label="تغيير موقع التوصيل"><MapPin size={18} className="text-[#fb923c]" /><span>إلى {deliveryLocation.city}</span><ChevronDown size={13} /></button>
          </div>
          <div className="relative order-2 min-w-0 flex-1">
            <div className="flex h-10 items-center rounded-full border border-slate-200 bg-white px-3 shadow-sm sm:h-11 sm:px-4"><input className="min-w-0 w-full bg-transparent text-xs text-[#111827] caret-[#f97316] outline-none placeholder:text-slate-500 sm:text-sm" placeholder="ابحث باسم القطعة، رقم القطعة الأصلي (OEM)، أو رقم الهيكل (VIN)..." value={query} onChange={(e) => setQuery(e.target.value)} onFocus={() => setSearchFocused(true)} aria-label="بحث المنتجات" /><Search size={19} className="shrink-0 text-[#111827]" /></div>
            {searchFocused && liveSearchResults.length > 0 && <div className="absolute inset-x-0 top-[calc(100%+8px)] z-50 overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 text-[#0b1f33] shadow-2xl">{liveSearchResults.map((result, index) => <button key={`${result.type}-${result.label}-${index}`} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-right hover:bg-orange-50" onMouseDown={(event) => event.preventDefault()} onClick={() => { setQuery(result.label); setSearchFocused(false); document.getElementById("shop")?.scrollIntoView({ behavior: "smooth" }); }}><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-orange-50 text-[#f97316]"><Search size={15} /></span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-bold">{result.label}</span><span className="block truncate text-xs text-slate-500">{result.type} · {result.detail}</span></span></button>)}</div>}
          </div>
          <nav className="order-3 flex shrink-0 items-center gap-0.5 sm:gap-1" aria-label="خيارات الحساب والتسوق">
            <button className="hidden rounded-lg px-2 py-2 text-xs font-bold hover:bg-white/10 sm:flex sm:items-center sm:gap-1" aria-label="تغيير اللغة"><Globe2 size={17} className="text-[#fb923c]" /><span>English</span></button>
            <div className="relative"><button className="flex items-center gap-1 rounded-lg px-1.5 py-2 text-xs font-bold hover:bg-white/10 sm:px-2" onClick={() => isAuthenticated ? setUserMenuOpen((open) => !open) : setAuthOpen(true)} aria-label={isAuthenticated ? "قائمة الحساب" : "تسجيل الدخول"}><UserRound size={19} className="text-[#fb923c]" /><span className="hidden lg:inline">{isAuthenticated ? `أهلاً، ${user?.name || "عبد الله"}` : "تسجيل الدخول"}</span></button>{isAuthenticated && userMenuOpen && <div className="absolute left-0 top-[calc(100%+8px)] z-[70] w-[292px] overflow-hidden rounded-2xl border border-slate-200 bg-white text-right text-[#111827] shadow-2xl sm:w-[312px]"><div className="flex items-center gap-3 border-b border-slate-100 px-4 py-4"><div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#0b1f33] text-sm font-black uppercase text-white">{(user?.name || "AS").slice(0, 2)}</div><div className="min-w-0 flex-1"><p className="truncate text-lg font-bold">{user?.name || "ahmed saleh"}</p><button className="mt-0.5 flex items-center gap-1 text-sm text-slate-400 hover:text-[#f97316]" onClick={() => { setUserMenuOpen(false); setProfileOpen(true); }}>ملفك الشخصي <span aria-hidden="true">‹</span></button></div></div><div className="p-2"><button className="flex w-full items-center justify-between rounded-xl px-3 py-3 text-[17px] font-bold hover:bg-slate-50"><span>الطلبات</span><PackageCheck size={23} strokeWidth={1.7} /></button><button className="flex w-full items-center justify-between rounded-xl px-3 py-3 text-[17px] font-bold hover:bg-slate-50"><span>الاسترجاع</span><RotateCcw size={22} strokeWidth={1.7} /></button><button className="flex w-full items-center justify-between rounded-xl px-3 py-3 text-[17px] font-bold hover:bg-slate-50"><span>العناوين</span><MapPinned size={23} strokeWidth={1.7} /></button><button className="flex w-full items-center justify-between rounded-xl px-3 py-3 text-[17px] font-bold hover:bg-slate-50"><span>المدفوعات</span><CreditCard size={23} strokeWidth={1.7} /></button><button className="flex w-full items-center justify-between rounded-xl px-3 py-3 text-[17px] font-bold hover:bg-slate-50"><span>رصيد سبير X</span><WalletCards size={23} strokeWidth={1.7} /></button><button className="flex w-full items-center justify-between rounded-xl px-3 py-3 text-[17px] font-bold hover:bg-slate-50"><span>مطالبات الضمان</span><ShieldCheck size={23} strokeWidth={1.7} /></button><button className="flex w-full items-center justify-between rounded-xl px-3 py-3 text-[17px] font-bold hover:bg-slate-50"><span>تحتاج مساعدة؟</span><CircleHelp size={23} strokeWidth={1.7} /></button></div><div className="border-t border-slate-100 p-2"><button className="flex w-full items-center justify-between rounded-xl px-3 py-3 text-[17px] font-bold text-[#ef5350] hover:bg-red-50" onClick={() => { void logout(); setUserMenuOpen(false); }}><span>تسجيل الخروج</span><LogOut size={23} strokeWidth={1.8} /></button></div></div>}</div>
            <a className="hidden items-center gap-1 rounded-lg px-2 py-2 text-xs font-bold hover:bg-white/10 md:flex" href="#track-order" aria-label="الطلبات"><ClipboardList size={18} className="text-[#fb923c]" /><span>الطلبات</span></a>
            <button className="flex items-center gap-1 rounded-lg px-1.5 py-2 text-xs font-bold hover:bg-white/10 sm:px-2" onClick={() => document.getElementById("finder")?.scrollIntoView({ behavior: "smooth" })} aria-label="سيارتي"><CarFront size={19} className="text-[#fb923c]" /><span className="hidden lg:inline">سيارتي</span></button>
            <button className="relative flex items-center gap-1 rounded-lg px-1.5 py-2 text-xs font-bold hover:bg-white/10 sm:px-2" onClick={() => setCartOpen(true)} aria-label="عربة التسوق"><ShoppingCart size={20} className="text-[#fb923c]" /><span className="hidden lg:inline">عربة التسوق</span>{cartCount > 0 && <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#f97316] px-1 text-[10px] font-bold text-white">{cartCount}</span>}</button>
            <button className="rounded-lg p-1.5 hover:bg-white/10 sm:hidden" onClick={() => setLocationOpen(true)} aria-label="تغيير موقع التوصيل"><MapPin size={19} className="text-[#fb923c]" /></button>
          </nav>
        </div>
      </header>
      <a className="fixed bottom-5 left-5 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg shadow-green-900/25 transition hover:-translate-y-1 hover:bg-[#1ebe5d]" href="https://wa.me/?text=%D9%85%D8%B1%D8%AD%D8%A8%D8%A7%D8%8C%20%D8%A3%D8%AD%D8%AA%D8%A7%D8%AC%20%D9%85%D8%B3%D8%A7%D8%B9%D8%AF%D8%A9%20%D8%A8%D8%AE%D8%B5%D9%88%D8%B5%20%D9%82%D8%B7%D8%B9%D8%A9%20%D8%B3%D9%8A%D8%A7%D8%B1%D8%A9" target="_blank" rel="noreferrer" aria-label="تواصل مع دعم واتساب"><MessageCircle size={24} /></a>

      <main>
        <section className="mx-auto grid max-w-7xl gap-5 px-4 pb-10 pt-6 lg:grid-cols-[1.15fr_.85fr] lg:px-8 lg:pt-10">
          <div className="relative overflow-hidden rounded-[2rem] bg-[#0b1f33] px-6 py-9 text-white sm:px-10 sm:py-12">
            <div className="absolute -left-16 -top-20 h-64 w-64 rounded-full bg-[#f97316]/20 blur-3xl" />
            <div className="relative max-w-xl">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-bold text-orange-200"><Sparkles size={14} /> خبرة تفهم سيارتك</div>
              <h1 className="max-w-lg text-4xl font-black leading-[1.1] tracking-tight sm:text-6xl">خلّ سيارتك <span className="text-[#fb923c]">علينا.</span></h1>
              <p className="mt-5 max-w-md text-base leading-8 text-slate-300">قطع أصلية ومضمونة للسيارات الأوروبية والكورية واليابانية. اختَر سيارتك ونطلع لك القطعة المطابقة.</p>
              <div className="mt-8 flex flex-wrap gap-3"><Button className="h-12 rounded-xl bg-[#f97316] px-6 font-bold text-white hover:bg-[#ea580c]" onClick={() => document.getElementById("shop")?.scrollIntoView({ behavior: "smooth" })}>ابدأ التسوق <ArrowLeft size={17} /></Button><Button variant="ghost" className="h-12 rounded-xl border border-white/20 px-5 text-white hover:bg-white/10 hover:text-white" onClick={() => document.getElementById("help")?.scrollIntoView({ behavior: "smooth" })}>أحتاج مساعدة</Button></div>
              <div className="mt-9 flex flex-wrap gap-5 text-xs text-slate-300"><span className="flex items-center gap-2"><ShieldCheck size={16} className="text-orange-300" /> جودة مضمونة</span><span className="flex items-center gap-2"><Truck size={16} className="text-orange-300" /> توصيل سريع</span><span className="flex items-center gap-2"><BadgeCheck size={16} className="text-orange-300" /> توافق مؤكد</span></div>
            </div>
          </div>
          <div className="relative min-h-[310px] overflow-hidden rounded-[2rem] bg-[#e7ebee]">
            <img src="/assets/parts-hero.jpg" alt="مجموعة من قطع غيار السيارات" className="h-full w-full object-cover mix-blend-multiply opacity-80" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#dbe1e6] via-transparent to-transparent" />
            <div className="absolute bottom-6 right-6 left-6 flex items-end justify-between"><div><p className="text-xs font-bold uppercase tracking-[.2em] text-slate-500">مجموعة مختارة</p><p className="mt-1 text-2xl font-black text-[#0b1f33]">لأن التفاصيل تفرق</p></div><span className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-[#f97316] shadow-lg"><Zap size={20} fill="currentColor" /></span></div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 lg:px-8" id="finder">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center"><div className="flex items-center gap-3 lg:w-1/4"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50 text-[#f97316]"><CarFront size={22} /></span><div><p className="font-extrabold">ابحث حسب سيارتك</p><p className="text-xs text-slate-500">قطع مطابقة بدون تخمين</p></div></div><div className="grid flex-1 gap-3 sm:grid-cols-3"><SelectBox label="الماركة" value={car} options={carOptions} onChange={setCar} /><SelectBox label="الموديل" value={model} options={["اختر الموديل", "2020", "2021", "2022", "2023"]} onChange={setModel} /><SelectBox label="الفئة" value={category} options={categoryOptions} onChange={setCategory} /></div><Button className="h-11 rounded-xl bg-[#0b1f33] px-5 font-bold text-white hover:bg-[#173b5d]" onClick={() => document.getElementById("shop")?.scrollIntoView({ behavior: "smooth" })}>اعرض القطع <ArrowLeft size={17} /></Button></div>
          </div>
        </section>

        <VinMatcher onVehicleMatch={(make) => setCar(make)} />

        <section className="mx-auto max-w-7xl px-4 pb-4 pt-12 lg:px-8" id="categories"><div className="mb-5 flex items-end justify-between"><div><p className="text-sm font-bold text-[#f97316]">تسوّق بذكاء</p><h2 className="mt-1 text-2xl font-black sm:text-3xl">كل ما تحتاجه في مكان واحد</h2></div><a href="#shop" className="hidden items-center gap-1 text-sm font-bold text-slate-500 hover:text-[#f97316] sm:flex">عرض كل الفئات <ArrowLeft size={16} /></a></div><div className="grid grid-cols-2 gap-3 md:grid-cols-5">{categoryCards.map((item) => <button key={item.label} onClick={() => setCategory(item.label)} className="group rounded-2xl border border-slate-200 bg-white p-4 text-right transition hover:-translate-y-1 hover:border-orange-200 hover:shadow-lg hover:shadow-orange-100/50"><span className={`flex h-11 w-11 items-center justify-center rounded-xl text-xl font-black ${item.tone}`}>{item.icon}</span><p className="mt-4 font-extrabold">{item.label}</p><p className="mt-1 text-xs text-slate-400">{item.count}</p></button>)}</div></section>

        <section className="mx-auto max-w-7xl px-4 pb-20 pt-12 lg:px-8" id="shop"><div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-sm font-bold text-[#f97316]">اختيارات سبير إكس</p><h2 className="mt-1 text-2xl font-black sm:text-3xl">قطع تستاهلها سيارتك</h2></div><div className="flex items-center gap-2"><button className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-600 sm:hidden"><Filter size={16} /> تصفية</button><label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-500"><SlidersHorizontal size={16} /><select className="bg-transparent font-bold outline-none" value={sort} onChange={(e) => setSort(e.target.value)}><option>الأكثر صلة</option><option>السعر: الأقل</option><option>السعر: الأعلى</option></select></label></div></div><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{filteredProducts.map((product) => <ProductCard key={product.id} product={product} onAdd={addToCart} onDetails={setSelectedProduct} />)}</div>{filteredProducts.length === 0 && <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center"><Search className="mx-auto text-slate-300" size={32} /><p className="mt-3 font-bold">ما لقينا قطع مطابقة</p><p className="mt-1 text-sm text-slate-500">جرّب كلمة بحث ثانية أو غيّر الفئة.</p></div>}</section>

        <TrackOrder />

        <section className="mx-auto mb-16 max-w-7xl px-4 lg:px-8" id="help"><div className="flex flex-col items-start justify-between gap-5 rounded-2xl bg-[#fff1e8] p-6 sm:flex-row sm:items-center sm:p-8"><div className="flex items-start gap-4"><span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white text-[#f97316] shadow-sm"><CircleHelp /></span><div><h3 className="text-lg font-black">مو متأكد من القطعة؟</h3><p className="mt-1 text-sm leading-6 text-slate-600">فريقنا يساعدك تتأكد من التوافق قبل الطلب. أرسل رقم الهيكل أو صورة القطعة.</p></div></div><Button className="rounded-xl bg-[#f97316] font-bold text-white hover:bg-[#ea580c]">تواصل مع خبير <ArrowLeft size={16} /></Button></div></section>
      </main>

      <footer className="border-t border-slate-200 bg-white"><div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-7 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between lg:px-8"><div className="flex flex-col leading-none font-black text-[#0b1f33]"><span className="text-xl">سـبـيـر <b className="text-[#f97316]">X</b></span><small className="mt-1 text-[9px] font-medium tracking-wide text-slate-400">قطع غيار السيارات</small></div><p>قطع غيار أوروبية · كورية · يابانية</p><p>© 2026 سبير X. جميع الحقوق محفوظة.</p></div></footer>

      {locationOpen && <div className="fixed inset-0 z-[55] flex items-center justify-center p-4"><button className="absolute inset-0 bg-[#0b1f33]/35" onClick={() => setLocationOpen(false)} aria-label="إغلاق اختيار الموقع" /><div className="relative w-full max-w-sm rounded-2xl bg-white p-5 text-[#0b1f33] shadow-2xl ring-1 ring-black/5"><button className="absolute left-3 top-3 rounded-lg p-2 text-slate-500 hover:bg-slate-100" onClick={() => setLocationOpen(false)} aria-label="إغلاق"><X size={18} /></button><div className="flex items-start gap-3 border-b border-slate-100 pb-4"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-yellow-100 text-yellow-700"><MapPin size={21} /></span><div><p className="text-xs font-bold text-[#f97316]">التوصيل إلى</p><h2 className="mt-1 text-lg font-black">حدد موقعك</h2><p className="mt-1 text-xs leading-5 text-slate-500">نوصل قطع الغيار إلى جميع دول الخليج العربي.</p></div></div><button className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-[#0b1f33] px-4 py-3 text-sm font-bold text-[#0b1f33] hover:bg-slate-50" onClick={useCurrentLocation}><MapPin size={17} /> استخدم موقعي الحالي</button>{geoStatus && <p className={`mt-2 text-xs font-bold ${geoStatus.includes("بنجاح") ? "text-emerald-600" : "text-slate-500"}`}>{geoStatus}</p>}<div className="mt-4 grid gap-3"><label className="text-xs font-bold text-slate-600">الدولة<select className="mt-1 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold outline-none focus:border-orange-300" value={isCurrentLocation ? "" : deliveryLocation.country} onChange={(event) => { const country = event.target.value; const firstCity = gulfDeliveryOptions.find((option) => option.country === country)?.cities[0] ?? ""; setDeliveryLocation({ country, city: firstCity }); setGeoStatus(null); }}><option value="">موقعك الحالي</option>{gulfDeliveryOptions.map((option) => <option key={option.country}>{option.country}</option>)}</select></label><label className="text-xs font-bold text-slate-600">المدينة<select className="mt-1 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold outline-none focus:border-orange-300" value={deliveryLocation.city} onChange={(event) => { setDeliveryLocation({ ...deliveryLocation, city: event.target.value }); setGeoStatus(null); setLocationOpen(false); }}>{deliveryCities.map((city) => <option key={city}>{city}</option>)}</select></label></div><div className="mt-4 flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2.5 text-xs"><span className="text-slate-500">وجهة التوصيل</span><b>{deliveryLocation.country} · {deliveryLocation.city}</b></div><button className="mt-4 h-11 w-full rounded-xl bg-[#f97316] text-sm font-bold text-white hover:bg-[#ea580c]" onClick={() => setLocationOpen(false)}>تأكيد الموقع</button></div></div>}

      {cartOpen && <div className="fixed inset-0 z-50"><button className="absolute inset-0 bg-[#0b1f33]/45" onClick={() => setCartOpen(false)} aria-label="إغلاق السلة" /><aside className="absolute left-0 top-0 flex h-full w-full max-w-md flex-col bg-white p-5 shadow-2xl"><div className="flex items-center justify-between border-b border-slate-200 pb-4"><div><p className="text-xs font-bold text-[#f97316]">مراجعة الطلب</p><h2 className="text-xl font-black">سلة سبير إكس ({cartCount})</h2></div><button className="rounded-xl p-2 hover:bg-slate-100" onClick={() => setCartOpen(false)} aria-label="إغلاق"><X size={20} /></button></div>{cartProducts.length ? <><div className="flex-1 space-y-3 overflow-auto py-5">{cartProducts.map((product) => <div key={product.id} className="flex gap-3 rounded-xl bg-slate-50 p-3"><img src={product.image} alt="" className="h-16 w-16 rounded-lg object-cover" /><div className="min-w-0 flex-1"><p className="truncate text-sm font-bold">{product.name}</p><p className="mt-1 text-xs text-slate-500">{product.brand} · {product.car}</p><div className="mt-2 flex items-center justify-between"><span className="font-black">{product.price} ر.س</span><button className="text-xs font-bold text-red-500" onClick={() => setCart((current) => current.filter((id) => id !== product.id))}>حذف</button></div></div></div>)}</div><div className="border-t border-slate-200 pt-4"><div className="mb-4 flex items-center justify-between"><span className="text-slate-500">الإجمالي</span><span className="text-2xl font-black">{cartTotal} ر.س</span></div><Button className="h-12 w-full rounded-xl bg-[#f97316] font-bold text-white hover:bg-[#ea580c]" onClick={() => setCheckoutOpen(true)}>متابعة الطلب <ArrowLeft size={17} /></Button><p className="mt-3 text-center text-xs text-slate-400">الخطوة التالية: بيانات العميل والشحن</p></div></> : <div className="flex flex-1 flex-col items-center justify-center text-center"><ShoppingCart size={44} className="text-slate-200" /><p className="mt-4 font-black">السلة فاضية</p><p className="mt-1 text-sm text-slate-500">أضف قطعة مطابقة لسيارتك وابدأ الطلب.</p><Button className="mt-5 rounded-xl bg-[#0b1f33] font-bold" onClick={() => { setCartOpen(false); document.getElementById("shop")?.scrollIntoView({ behavior: "smooth" }); }}>تصفح القطع</Button></div>}</aside></div>}

      {selectedProduct && <div className="fixed inset-0 z-[60] flex items-center justify-center p-4"><button className="absolute inset-0 bg-[#0b1f33]/55" onClick={() => setSelectedProduct(null)} aria-label="إغلاق تفاصيل القطعة" /><div className="relative max-h-[90vh] w-full max-w-2xl overflow-auto rounded-3xl bg-white p-5 shadow-2xl sm:p-7"><button className="absolute left-4 top-4 rounded-xl bg-white p-2 text-slate-500 shadow-sm" onClick={() => setSelectedProduct(null)} aria-label="إغلاق"><X size={19} /></button><div className="grid gap-6 sm:grid-cols-2"><div className="overflow-hidden rounded-2xl bg-slate-50"><img src={selectedProduct.image} alt={selectedProduct.name} className="h-full min-h-64 w-full object-cover mix-blend-multiply" /></div><div className="pt-3"><span className="text-sm font-bold text-[#f97316]">{selectedProduct.brand} · قطعة أصلية</span><h2 className="mt-2 text-2xl font-black leading-tight">{selectedProduct.name}</h2><p className="mt-3 text-sm leading-7 text-slate-600">قطعة مختارة بجودة موثوقة، مناسبة للاستخدام اليومي ومراجعة التوافق قبل الشحن.</p><div className="mt-4 rounded-xl bg-emerald-50 p-3 text-sm font-bold text-emerald-700"><BadgeCheck className="ml-1 inline" size={16} /> متوافق مع {selectedProduct.car}</div><div className="mt-5 flex items-end justify-between"><div><span className="text-3xl font-black">{selectedProduct.price}</span> <span className="font-bold">ر.س</span><p className="mt-1 text-xs font-bold text-emerald-600">● {selectedProduct.stock}</p></div><Button className="rounded-xl bg-[#f97316] font-bold text-white hover:bg-[#ea580c]" onClick={() => { addToCart(selectedProduct.id); setSelectedProduct(null); }}>أضف للسلة <ShoppingCart size={17} /></Button></div></div></div></div></div>}

      {paymentOrder && <div className="fixed inset-0 z-[75] flex items-center justify-center p-4"><button className="absolute inset-0 bg-[#0b1f33]/55" onClick={() => setPaymentOrder(null)} aria-label="إغلاق الدفع" /><div className="relative w-full max-w-xl rounded-3xl bg-white p-6 shadow-2xl"><p className="text-sm font-bold text-[#f97316]">الخطوة الأخيرة</p><h2 className="mt-1 text-2xl font-black">ادفع طلبك بأمان</h2><p className="mt-2 text-sm text-slate-500">الطلب {paymentOrder.orderNumber} · الإجمالي {paymentOrder.total} ر.س</p><div className="mt-6"><MoyasarPayment orderNumber={paymentOrder.orderNumber} amount={paymentOrder.total} onPaid={() => { setOrderSuccess(paymentOrder.orderNumber); setPaymentOrder(null); }} /></div><button className="mt-4 w-full rounded-xl py-2 text-sm font-bold text-slate-500 hover:bg-slate-50" onClick={() => setPaymentOrder(null)}>الدفع لاحقًا</button></div></div>}

      {orderSuccess && <button className="fixed bottom-5 left-1/2 z-[80] -translate-x-1/2 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white shadow-xl" onClick={() => setOrderSuccess(null)}>تم استلام طلبك رقم {orderSuccess} · إغلاق</button>}

      {profileOpen && <div className="fixed inset-0 z-[85] overflow-y-auto bg-[#f5f6fa] p-3 sm:p-6"><button className="fixed inset-0 cursor-default" onClick={() => setProfileOpen(false)} aria-label="إغلاق الحساب" /><div className="relative mx-auto min-h-[calc(100vh-24px)] max-w-7xl" dir="rtl"><button className="absolute left-0 top-0 z-10 rounded-xl bg-white px-4 py-2 text-sm font-bold text-slate-500 shadow-sm hover:text-[#f97316]" onClick={() => setProfileOpen(false)}>إغلاق <X size={16} className="mr-1 inline" /></button><div className="mb-5 px-1 pt-12 sm:pt-2"><h1 className="text-2xl font-black text-[#0b1f33]">حسابك</h1><p className="mt-1 text-sm text-slate-500">استعرض وحدّث بيانات التواصل ومعلومات حسابك</p></div><div className="grid gap-5 lg:grid-cols-[300px_1fr]"><main className="space-y-5 lg:order-2"><section className="rounded-2xl bg-white p-5 shadow-sm sm:p-7"><h2 className="text-lg font-black">معلومات الاتصال</h2><div className="mt-5 grid gap-4 sm:grid-cols-2"><label className="block"><span className="mb-2 block text-sm font-bold text-slate-600">البريد الإلكتروني</span><div className="flex h-12 items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm"><span>{user?.email || "لم تتم إضافة بريد إلكتروني"}</span><span className="text-slate-400">✎</span></div></label><label className="block"><span className="mb-2 block text-sm font-bold text-slate-600">رقم الجوال</span><div className="flex h-12 items-center justify-between rounded-xl border border-slate-200 px-4 text-sm"><span>لم تتم إضافة رقم جوال</span><span className="text-slate-400">✎</span></div></label></div><p className="mt-3 text-xs text-slate-400">يمكن استخدام رقم الجوال هذا لتسجيل الدخول واستلام تحديثات الطلبات.</p></section><section className="rounded-2xl bg-white p-5 shadow-sm sm:p-7"><h2 className="text-lg font-black">معلوماتك الشخصية</h2><div className="mt-5 grid gap-4 sm:grid-cols-2"><label><span className="mb-2 block text-sm font-bold text-slate-600">الاسم الأول</span><input className="h-12 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-orange-300" defaultValue={(user?.name || "").split(" ")[0]} /></label><label><span className="mb-2 block text-sm font-bold text-slate-600">اسم العائلة</span><input className="h-12 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-orange-300" defaultValue={(user?.name || "").split(" ").slice(1).join(" ")} /></label><label><span className="mb-2 block text-sm font-bold text-slate-600">الجنسية</span><select className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none focus:border-orange-300"><option>السعودية</option><option>الإمارات</option><option>الكويت</option><option>قطر</option><option>البحرين</option><option>عُمان</option></select></label><label><span className="mb-2 block text-sm font-bold text-slate-600">تاريخ الميلاد</span><input type="date" className="h-12 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-orange-300" /></label></div><div className="mt-5 flex justify-end"><button className="rounded-xl bg-[#0b1f33] px-6 py-3 text-sm font-black text-white hover:bg-[#173b5c]">تحديث حسابك</button></div></section></main><aside className="space-y-4 lg:order-1"><section className="rounded-2xl bg-white p-4 shadow-sm"><div className="flex items-center gap-3 border-b border-slate-100 pb-4"><div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#0b1f33] text-sm font-black uppercase text-white">{(user?.name || "AS").slice(0, 2)}</div><div className="min-w-0"><p className="truncate font-black">هلا {user?.name || "بك"}</p><p className="truncate text-xs text-slate-500">{user?.email || "حساب سبير X"}</p></div></div><button className="mt-3 flex w-full items-center justify-between rounded-xl bg-orange-50 px-3 py-3 text-sm font-black text-[#0b1f33]"><span>رصيد سبير X</span><WalletCards size={19} className="text-[#f97316]" /></button></section><section className="rounded-2xl bg-white p-2 shadow-sm"><button className="flex w-full items-center justify-between rounded-xl px-4 py-3.5 text-sm font-bold hover:bg-slate-50"><span>الطلبات</span><PackageCheck size={19} /></button><button className="flex w-full items-center justify-between rounded-xl px-4 py-3.5 text-sm font-bold hover:bg-slate-50"><span>الاسترجاع</span><RotateCcw size={19} /></button><button className="flex w-full items-center justify-between rounded-xl px-4 py-3.5 text-sm font-bold hover:bg-slate-50"><span>رصيد سبير X</span><WalletCards size={19} /></button><button className="flex w-full items-center justify-between rounded-xl bg-yellow-100 px-4 py-3.5 text-sm font-black"><span>حسابك</span><UserRound size={19} /></button><button className="flex w-full items-center justify-between rounded-xl px-4 py-3.5 text-sm font-bold hover:bg-slate-50"><span>سيارتي</span><CarFront size={19} /></button><button className="flex w-full items-center justify-between rounded-xl px-4 py-3.5 text-sm font-bold hover:bg-slate-50"><span>العناوين</span><MapPinned size={19} /></button><button className="flex w-full items-center justify-between rounded-xl px-4 py-3.5 text-sm font-bold hover:bg-slate-50"><span>المدفوعات</span><CreditCard size={19} /></button><button className="flex w-full items-center justify-between rounded-xl px-4 py-3.5 text-sm font-bold hover:bg-slate-50"><span>مطالبات الضمان</span><ShieldCheck size={19} /></button></section><section className="rounded-2xl bg-white p-2 shadow-sm"><button className="flex w-full items-center justify-between rounded-xl px-4 py-3.5 text-sm font-bold hover:bg-slate-50"><span>الإشعارات</span><CircleHelp size={19} /></button><button className="flex w-full items-center justify-between rounded-xl px-4 py-3.5 text-sm font-bold hover:bg-slate-50"><span>إعدادات الأمان</span><ShieldCheck size={19} /></button><button className="flex w-full items-center justify-between rounded-xl px-4 py-3.5 text-sm font-bold hover:bg-slate-50"><span>كود QR</span><span className="text-xs font-black text-[#f97316]">QR</span></button></section><button className="flex w-full items-center justify-between rounded-2xl bg-white px-5 py-4 text-sm font-black text-[#ef5350] shadow-sm hover:bg-red-50" onClick={() => { void logout(); setProfileOpen(false); }}><span>تسجيل الخروج</span><LogOut size={19} /></button></aside></div></div></div>}
      {authOpen && <div className="fixed inset-0 z-[90] flex items-center justify-center p-4"><button className="absolute inset-0 bg-[#0b1f33]/65 backdrop-blur-sm" onClick={() => { setAuthOpen(false); setOtpStep(false); }} aria-label="إغلاق نافذة تسجيل الدخول" /><div className="relative w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl"><button className="absolute left-4 top-4 z-10 rounded-xl p-2 text-slate-400 hover:bg-slate-100" onClick={() => { setAuthOpen(false); setOtpStep(false); }} aria-label="إغلاق"><X size={19} /></button><div className="bg-[#0b1f33] px-6 pb-6 pt-8 text-white"><p className="text-sm font-bold text-orange-300">سـبـيـر <span className="text-orange-400">X</span></p><h2 className="mt-2 text-2xl font-black">{otpStep ? "تحقق من رقم الجوال" : authTab === "login" ? "أهلاً بعودتك" : "أنشئ حسابك الآن"}</h2><p className="mt-2 text-sm text-slate-300">احفظ سياراتك وتابع طلبات قطع الغيار بسهولة.</p></div><div className="p-6">{!otpStep && <div className="mb-5 grid grid-cols-2 rounded-xl bg-slate-100 p-1"><button className={`rounded-lg py-2 text-sm font-black ${authTab === "login" ? "bg-white text-[#0b1f33] shadow-sm" : "text-slate-500"}`} onClick={() => setAuthTab("login")}>تسجيل الدخول</button><button className={`rounded-lg py-2 text-sm font-black ${authTab === "register" ? "bg-white text-[#0b1f33] shadow-sm" : "text-slate-500"}`} onClick={() => setAuthTab("register")}>إنشاء حساب جديد</button></div>}{otpStep ? <form className="space-y-4" onSubmit={(event) => { event.preventDefault(); if (authOtp.length === 4) startLogin(); }}><p className="text-center text-sm text-slate-500">أدخل الرمز المكوّن من 4 أرقام المرسل إلى <b className="text-[#0b1f33]">{authPhone || "رقمك"}</b></p><input autoFocus inputMode="numeric" maxLength={4} className="h-14 w-full rounded-xl border border-slate-200 text-center text-2xl font-black tracking-[0.7em] outline-none focus:border-orange-400" value={authOtp} onChange={(event) => setAuthOtp(event.target.value.replace(/\D/g, ""))} placeholder="••••" /><button disabled={authOtp.length !== 4} className="h-12 w-full rounded-xl bg-[#f97316] font-black text-white disabled:cursor-not-allowed disabled:opacity-50">تأكيد والمتابعة الآمنة</button><button type="button" className="w-full text-sm font-bold text-slate-500 hover:text-[#f97316]" onClick={() => setOtpStep(false)}>تغيير الرقم</button></form> : <><button className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 font-black text-[#0b1f33] hover:bg-slate-50" onClick={startLogin}><span className="text-lg font-black text-[#4285F4]">G</span> متابعة باستخدام Google</button><div className="my-5 flex items-center gap-3 text-xs text-slate-400"><span className="h-px flex-1 bg-slate-200" />أو<span className="h-px flex-1 bg-slate-200" /></div><div className="mb-4 grid grid-cols-2 gap-2"><button className={`rounded-xl py-2.5 text-sm font-black ${authMethod === "phone" ? "bg-orange-50 text-[#f97316] ring-1 ring-orange-200" : "bg-slate-50 text-slate-500"}`} onClick={() => setAuthMethod("phone")}>رقم الجوال</button><button className={`rounded-xl py-2.5 text-sm font-black ${authMethod === "email" ? "bg-orange-50 text-[#f97316] ring-1 ring-orange-200" : "bg-slate-50 text-slate-500"}`} onClick={() => setAuthMethod("email")}>البريد الإلكتروني</button></div>{authMethod === "phone" ? <form className="space-y-3" onSubmit={(event) => { event.preventDefault(); if (authPhone.trim()) setOtpStep(true); }}><div className="flex h-12 overflow-hidden rounded-xl border border-slate-200 focus-within:border-orange-400"><span className="flex items-center bg-slate-50 px-3 text-sm font-bold text-slate-500">+966</span><input className="min-w-0 flex-1 px-3 text-sm outline-none" inputMode="tel" placeholder="5X XXX XXXX" value={authPhone} onChange={(event) => setAuthPhone(event.target.value)} required /></div><button className="h-12 w-full rounded-xl bg-[#f97316] font-black text-white hover:bg-[#ea580c]">إرسال رمز التحقق</button></form> : <form className="space-y-3" onSubmit={(event) => { event.preventDefault(); startLogin(); }}><input type="email" className="h-12 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-orange-400" placeholder="البريد الإلكتروني" value={authEmail} onChange={(event) => setAuthEmail(event.target.value)} required /><input type="password" className="h-12 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-orange-400" placeholder="كلمة المرور" minLength={6} required /><button className="h-12 w-full rounded-xl bg-[#f97316] font-black text-white hover:bg-[#ea580c]">{authTab === "login" ? "دخول آمن" : "إنشاء الحساب"}</button></form>}<p className="mt-4 text-center text-[11px] leading-5 text-slate-400">بالمتابعة، سيتم إكمال المصادقة عبر بوابة الحساب الآمنة وحفظ الجلسة في حسابك.</p></>}</div></div></div>}
      {checkoutOpen && <div className="fixed inset-0 z-[70] flex items-center justify-center p-4"><button className="absolute inset-0 bg-[#0b1f33]/55" onClick={() => setCheckoutOpen(false)} aria-label="إغلاق الطلب" /><div className="relative max-h-[92vh] w-full max-w-3xl overflow-auto rounded-3xl bg-white p-5 shadow-2xl sm:p-7"><button className="absolute left-4 top-4 rounded-xl p-2 text-slate-500 hover:bg-slate-100" onClick={() => setCheckoutOpen(false)} aria-label="إغلاق"><X size={19} /></button><div className="mb-6"><p className="text-sm font-bold text-[#f97316]">الخطوة الأخيرة</p><h2 className="mt-1 text-2xl font-black">بيانات الشحن وملخص الطلب</h2></div><div className="grid gap-6 md:grid-cols-[1.2fr_.8fr]"><div className="space-y-4"><input className="h-12 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-orange-300" placeholder="الاسم الكامل" value={checkoutForm.customerName} onChange={(e) => setCheckoutForm({ ...checkoutForm, customerName: e.target.value })} /><input className="h-12 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-orange-300" placeholder="رقم الجوال" value={checkoutForm.phone} onChange={(e) => setCheckoutForm({ ...checkoutForm, phone: e.target.value })} /><div className="flex items-center justify-between rounded-xl bg-yellow-50 px-4 py-3 text-sm"><span className="flex items-center gap-2 font-bold text-yellow-800"><MapPin size={17} /> التوصيل إلى</span><b className="text-[#0b1f33]">{deliveryLocation.country} · {deliveryLocation.city}</b></div><textarea className="min-h-28 w-full rounded-xl border border-slate-200 p-4 text-sm outline-none focus:border-orange-300" placeholder="عنوان التوصيل بالتفصيل" value={checkoutForm.shippingAddress} onChange={(e) => setCheckoutForm({ ...checkoutForm, shippingAddress: e.target.value })} /><div className="flex items-center gap-2 rounded-xl bg-slate-50 p-3 text-xs text-slate-500"><ShieldCheck className="text-emerald-600" size={18} /> سيتم التواصل لتأكيد الطلب قبل الشحن. بعد تأكيد الطلب ستنتقل إلى بوابة Moyasar الآمنة للدفع عبر Apple Pay أو mada.</div></div><div className="rounded-2xl bg-[#f7f8fa] p-4"><p className="font-black">ملخص السلة</p><div className="mt-4 space-y-3">{cartProducts.map((product) => <div key={product.id} className="flex items-center justify-between gap-3 text-sm"><span className="line-clamp-1">{product.name}</span><b>{product.price} ر.س</b></div>)}</div><div className="my-4 border-t border-slate-200" /><div className="flex items-center justify-between"><span className="text-slate-500">الإجمالي</span><b className="text-xl">{cartTotal} ر.س</b></div><Button className="mt-5 h-12 w-full rounded-xl bg-[#f97316] font-bold text-white hover:bg-[#ea580c]" onClick={() => createOrderMutation.mutate({ ...checkoutForm, shippingAddress: `${deliveryLocation.country} - ${deliveryLocation.city}
${checkoutForm.shippingAddress}`, items: cartProducts.map((product) => ({ productId: product.id, quantity: 1 })) })}>تأكيد الطلب <PackageCheck size={17} /></Button></div></div></div></div>}
    </div>
  );
}

function SelectBox({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) {
  return <label className="relative block"><span className="absolute right-3 top-1.5 text-[10px] font-bold text-slate-400">{label}</span><select className="h-14 w-full appearance-none rounded-xl border border-slate-200 bg-white px-3 pb-1 pt-5 text-sm font-bold outline-none focus:border-orange-300" value={value} onChange={(e) => onChange(e.target.value)}>{options.map((option) => <option key={option}>{option}</option>)}</select><ChevronDown className="pointer-events-none absolute left-3 top-7 text-slate-400" size={16} /></label>;
}

function ProductCard({ product, onAdd, onDetails }: { product: Product; onAdd: (id: number) => void; onDetails: (product: Product) => void }) {
  return <article onClick={() => onDetails(product)} className="group relative cursor-pointer overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:-translate-y-1 hover:border-orange-200 hover:shadow-xl hover:shadow-slate-200/70"><button onClick={(event) => event.stopPropagation()} className="absolute left-3 top-3 z-10 rounded-full bg-white/90 p-2 text-slate-400 shadow-sm hover:text-[#f97316]" aria-label="إضافة للمفضلة"><Heart size={17} /></button><div className="relative h-52 overflow-hidden bg-slate-50"><img src={product.image} alt={product.name} className="h-full w-full object-cover mix-blend-multiply transition duration-500 group-hover:scale-105" />{product.badge && <span className="absolute right-3 top-3 rounded-md bg-[#0b1f33] px-2 py-1 text-[10px] font-bold text-white">{product.badge}</span>}</div><div className="p-4"><div className="flex items-center justify-between gap-2"><span className="text-xs font-bold text-[#f97316]">{product.brand}</span><span className="text-xs text-slate-400">★ {product.rating}</span></div><h3 className="mt-2 line-clamp-1 font-extrabold">{product.name}</h3><p className="mt-1 line-clamp-1 text-xs text-slate-500">مطابق لـ {product.car}</p><div className="mt-3 flex items-center justify-between"><div><span className="text-lg font-black">{product.price} <small className="text-xs font-bold">ر.س</small></span>{product.oldPrice && <del className="mr-2 text-xs text-slate-400">{product.oldPrice}</del>}<p className="mt-0.5 text-[11px] font-bold text-emerald-600">● {product.stock}</p></div><Button size="icon" className="h-10 w-10 rounded-xl bg-[#f97316] text-white hover:bg-[#ea580c]" onClick={(event) => { event.stopPropagation(); onAdd(product.id); }} aria-label={`إضافة ${product.name} للسلة`}><ShoppingCart size={17} /></Button></div></div></article>;
}
