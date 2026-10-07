import { useState } from "react";
import { CheckCircle2, PackageSearch } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";

export default function TrackOrder() {
  const [orderNumber, setOrderNumber] = useState("");
  const [phone, setPhone] = useState("");
  type TrackResult = NonNullable<Awaited<ReturnType<typeof trpc.orders.track.useMutation>>["data"]>;
  const [result, setResult] = useState<TrackResult | null>(null);
  const track = trpc.orders.track.useMutation({ onSuccess: setResult });

  return <section className="mx-auto mb-12 max-w-7xl px-4 lg:px-8" id="track-order">
    <div className="overflow-hidden rounded-3xl bg-[#0b1f33] p-6 text-white sm:p-8">
      <div className="flex flex-col gap-7 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-xl"><div className="flex items-center gap-2 text-orange-200"><PackageSearch size={18} /><span className="text-sm font-bold">تتبع شحنتك</span></div><h2 className="mt-2 text-2xl font-black sm:text-3xl">اعرف أين وصلت قطعتك</h2><p className="mt-2 text-sm leading-6 text-slate-300">أدخل رقم الطلب وآخر 4 أرقام من الجوال لحماية بياناتك وعرض آخر تحديث للشحنة.</p></div>
        <div className="w-full max-w-xl rounded-2xl bg-white p-4 text-[#0b1f33] shadow-xl"><div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]"><input className="h-12 rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-orange-300" placeholder="رقم الطلب مثل QH-12345678" value={orderNumber} onChange={(e) => setOrderNumber(e.target.value)} /><input className="h-12 rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-orange-300" placeholder="آخر 4 أرقام من الجوال" inputMode="numeric" value={phone} onChange={(e) => setPhone(e.target.value)} /><Button className="h-12 rounded-xl bg-[#f97316] font-bold text-white hover:bg-[#ea580c]" disabled={track.isPending} onClick={() => { setResult(null); track.mutate({ orderNumber, phone }); }}>تتبع</Button></div>{track.error && <p className="mt-3 text-xs font-bold text-red-600">{track.error.message}</p>}</div>
      </div>
      {result && <div className="mt-6 rounded-2xl bg-white p-5 text-[#0b1f33]"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-bold text-[#f97316]">الطلب {result.orderNumber}</p><h3 className="mt-1 text-xl font-black">{result.shippingStatusLabel}</h3></div><span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-bold text-orange-700">{result.carrier || "شحن قطعها"}</span></div><div className="mt-4 grid gap-3 text-sm sm:grid-cols-3"><div className="rounded-xl bg-slate-50 p-3"><p className="text-xs text-slate-500">رقم التتبع</p><p className="mt-1 font-black">{result.trackingNumber || "سيظهر عند تسليم الشحنة للناقل"}</p></div><div className="rounded-xl bg-slate-50 p-3"><p className="text-xs text-slate-500">التسليم المتوقع</p><p className="mt-1 font-black">{result.estimatedDelivery || "يحدد بعد التجهيز"}</p></div><div className="rounded-xl bg-slate-50 p-3"><p className="text-xs text-slate-500">آخر تحديث</p><p className="mt-1 font-black">{new Date(result.updatedAt).toLocaleString("ar-SA")}</p></div></div><div className="mt-5 space-y-3 border-t border-slate-100 pt-4">{result.events.map((event) => <div key={event.id} className="flex gap-3"><span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600"><CheckCircle2 size={16} /></span><div><p className="text-sm font-bold">{event.title}</p><p className="mt-1 text-xs text-slate-500">{event.description}{event.location ? ` · ${event.location}` : ""}</p><p className="mt-1 text-[10px] text-slate-400">{new Date(event.occurredAt).toLocaleString("ar-SA")}</p></div></div>)}</div></div>}
    </div>
  </section>;
}
