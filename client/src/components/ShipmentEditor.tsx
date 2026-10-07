import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";

type Props = { orderNumber: string; onClose: () => void };
const statuses = [["pending", "تم استلام الطلب"], ["preparing", "جاري التجهيز"], ["shipped", "تم تسليمها للناقل"], ["in_transit", "في الطريق"], ["out_for_delivery", "خرجت للتوصيل"], ["delivered", "تم التسليم"], ["exception", "تحتاج متابعة"]] as const;

export default function ShipmentEditor({ orderNumber, onClose }: Props) {
  const [shippingStatus, setShippingStatus] = useState<(typeof statuses)[number][0]>("preparing");
  const [carrier, setCarrier] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [estimatedDelivery, setEstimatedDelivery] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const update = trpc.admin.updateShipment.useMutation({ onSuccess: onClose });

  return <div className="fixed inset-0 z-[80] flex items-center justify-center p-4"><button className="absolute inset-0 bg-[#0b1f33]/55" onClick={onClose} aria-label="إغلاق" /><div className="relative w-full max-w-xl rounded-3xl bg-white p-6 text-[#0b1f33] shadow-2xl"><button className="absolute left-4 top-4 rounded-xl p-2 text-slate-500 hover:bg-slate-100" onClick={onClose} aria-label="إغلاق"><X size={18} /></button><p className="text-sm font-bold text-[#f97316]">تحديث الشحنة</p><h2 className="mt-1 text-2xl font-black">الطلب {orderNumber}</h2><div className="mt-6 grid gap-3 sm:grid-cols-2"><select className="h-12 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold outline-none" value={shippingStatus} onChange={(e) => setShippingStatus(e.target.value as typeof shippingStatus)}>{statuses.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select><input className="h-12 rounded-xl border border-slate-200 px-3 text-sm outline-none" placeholder="شركة الشحن" value={carrier} onChange={(e) => setCarrier(e.target.value)} /><input className="h-12 rounded-xl border border-slate-200 px-3 text-sm outline-none" placeholder="رقم التتبع" value={trackingNumber} onChange={(e) => setTrackingNumber(e.target.value)} /><input className="h-12 rounded-xl border border-slate-200 px-3 text-sm outline-none" placeholder="التسليم المتوقع" value={estimatedDelivery} onChange={(e) => setEstimatedDelivery(e.target.value)} /><input className="h-12 rounded-xl border border-slate-200 px-3 text-sm outline-none sm:col-span-2" placeholder="الموقع الحالي" value={location} onChange={(e) => setLocation(e.target.value)} /><textarea className="min-h-24 rounded-xl border border-slate-200 p-3 text-sm outline-none sm:col-span-2" placeholder="وصف التحديث" value={description} onChange={(e) => setDescription(e.target.value)} /></div>{update.error && <p className="mt-3 text-xs font-bold text-red-600">{update.error.message}</p>}<Button className="mt-5 h-12 w-full rounded-xl bg-[#f97316] font-bold text-white hover:bg-[#ea580c]" disabled={update.isPending} onClick={() => update.mutate({ orderNumber, shippingStatus, carrier, trackingNumber, estimatedDelivery, location, description, title: statuses.find(([value]) => value === shippingStatus)?.[1] || "تحديث الشحنة" })}>حفظ تحديث الشحنة</Button></div></div>;
}
