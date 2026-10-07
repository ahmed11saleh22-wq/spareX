import { useState } from "react";
import { AlertCircle, ArrowLeft, CheckCircle2, ScanLine, Search, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

type VinResult = {
  make: string;
  model: string;
  years: string;
  engine: string;
  note: string;
};

export default function VinMatcher({ onVehicleMatch }: { onVehicleMatch: (make: string) => void }) {
  const [vin, setVin] = useState("");
  const [result, setResult] = useState<VinResult | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const lookupVin = async () => {
    const normalized = vin.toUpperCase().replace(/[\s-]/g, "");
    setResult(null);
    setMessage("");
    if (!/^[A-HJ-NPR-Z0-9]{17}$/.test(normalized)) {
      setMessage("أدخل رقم هيكل صحيح من 17 خانة، من دون الأحرف I أو O أو Q.");
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`/api/vin/lookup?vin=${encodeURIComponent(normalized)}`);
      const payload = await response.json();
      if (!response.ok || !payload.success) throw new Error(payload.message || "تعذر مطابقة الرقم");
      setResult(payload.vehicle);
      onVehicleMatch(payload.vehicle.make);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "تعذر مطابقة الرقم حاليًا.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="mx-auto max-w-7xl px-4 pt-5 lg:px-8" id="vin-matcher">
      <div className="overflow-hidden rounded-2xl border border-orange-200 bg-gradient-to-l from-[#fff7ed] via-white to-white shadow-sm">
        <div className="grid gap-6 p-5 sm:p-7 lg:grid-cols-[.85fr_1.15fr] lg:items-center">
          <div>
            <div className="flex items-center gap-2 text-sm font-bold text-[#f97316]"><ScanLine size={18} /> بحث ذكي برقم الهيكل</div>
            <h2 className="mt-2 text-2xl font-black text-[#0b1f33]">قطعتك المطابقة تبدأ من VIN</h2>
            <p className="mt-2 max-w-lg text-sm leading-7 text-slate-600">أدخل رقم الهيكل وسنحدد عائلة سيارتك ونرشح لك القطع المناسبة قبل أن تضيع وقتك في البحث.</p>
            <div className="mt-4 flex flex-wrap gap-3 text-xs text-slate-500"><span className="flex items-center gap-1"><ShieldCheck size={15} className="text-emerald-600" /> تحقق من 17 خانة</span><span>مثال: JTDB11HK5K3000001</span></div>
          </div>
          <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
            <label className="text-xs font-bold text-slate-500" htmlFor="vin-input">رقم الهيكل VIN</label>
            <div className="mt-2 flex flex-col gap-2 sm:flex-row"><div className="flex flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 focus-within:border-orange-300 focus-within:bg-white"><Search size={17} className="shrink-0 text-slate-400" /><input id="vin-input" dir="ltr" className="h-11 w-full bg-transparent text-left text-sm font-bold tracking-[.12em] outline-none" placeholder="17 خانة" maxLength={17} value={vin} onChange={(event) => setVin(event.target.value.toUpperCase())} onKeyDown={(event) => event.key === "Enter" && lookupVin()} /></div><Button className="h-11 rounded-xl bg-[#f97316] px-5 font-bold text-white hover:bg-[#ea580c]" onClick={lookupVin} disabled={loading}>{loading ? "جارٍ المطابقة..." : "طابق القطعة"} {!loading && <ArrowLeft size={16} />}</Button></div>
            {message && <p className="mt-3 flex items-start gap-2 text-xs font-bold leading-5 text-red-600"><AlertCircle size={16} className="mt-0.5 shrink-0" />{message}</p>}
            {result && <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3"><p className="flex items-center gap-2 text-sm font-black text-emerald-800"><CheckCircle2 size={17} /> تم التعرف على السيارة</p><div className="mt-2 grid grid-cols-2 gap-2 text-xs text-emerald-900 sm:grid-cols-4"><span><b className="block text-emerald-600">الماركة</b>{result.make}</span><span><b className="block text-emerald-600">الموديل</b>{result.model}</span><span><b className="block text-emerald-600">السنوات</b>{result.years}</span><span><b className="block text-emerald-600">المحرك</b>{result.engine}</span></div><p className="mt-2 text-xs text-emerald-700">{result.note}</p></div>}
          </div>
        </div>
      </div>
    </section>
  );
}
