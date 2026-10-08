import { useEffect, useRef, useState } from "react";
import { LoaderCircle, ShieldCheck } from "lucide-react";
import { trpc } from "@/lib/trpc";

declare global {
  interface Window {
    Moyasar?: { init: (options: Record<string, unknown>) => void };
  }
}

type Props = { orderNumber: string; amount: number; onPaid: () => void };

export default function MoyasarPayment({ orderNumber, amount, onPaid }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [config, setConfig] = useState<{ enabled: boolean; publishableApiKey: string | null; currency: string; country: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const verify = trpc.payments.verifyMoyasar.useMutation({ onSuccess: (result) => result.status === "paid" ? onPaid() : setError("لم يكتمل الدفع. جرّب وسيلة أخرى.") });

  useEffect(() => {
    let cancelled = false;
    fetch("/api/moyasar/config").then((response) => response.json()).then((data) => { if (!cancelled) setConfig(data); }).catch(() => setError("تعذر تحميل إعدادات الدفع."));
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!config?.enabled || !config.publishableApiKey || !ref.current) return;
    const start = () => {
      if (!window.Moyasar || !ref.current) return;
      ref.current.innerHTML = "";
      window.Moyasar.init({
        element: ".mysr-form",
        amount: amount * 100,
        currency: config.currency,
        description: `سبير إكس - الطلب ${orderNumber}`,
        publishable_api_key: config.publishableApiKey,
        callback_url: `${window.location.origin}/payment/callback?order=${encodeURIComponent(orderNumber)}`,
        supported_networks: ["mada", "visa", "mastercard"],
        methods: ["creditcard", "applepay"],
        apple_pay: { country: config.country, label: "سبير إكس لقطع غيار السيارات", validate_merchant_url: "https://api.moyasar.com/v1/applepay/initiate" },
        metadata: { orderNumber },
        on_completed: (payment: { id?: string }) => { if (payment.id) verify.mutate({ orderNumber, paymentId: payment.id }); },
      });
    };
    if (window.Moyasar) { start(); return; }
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/moyasar-payment-form@2.3.0/dist/moyasar.umd.min.js";
    script.async = true;
    script.onload = start;
    script.onerror = () => setError("تعذر تحميل بوابة الدفع. أعد المحاولة لاحقًا.");
    document.body.appendChild(script);
    return () => { script.onload = null; };
  }, [amount, config, orderNumber, verify]);

  if (!config) return <div className="flex items-center gap-2 rounded-xl bg-slate-50 p-4 text-sm text-slate-500"><LoaderCircle className="animate-spin" size={18} /> جارٍ تجهيز الدفع الآمن…</div>;
  if (!config.enabled) return <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-800"><b>بوابة Moyasar غير مفعّلة بعد.</b><br />أضف المفتاح العام والسري وWebhook Secret من إعدادات المشروع، ثم أعد تشغيل الخادم.</div>;
  return <div><div className="mb-3 flex items-center gap-2 text-xs text-slate-500"><ShieldCheck className="text-emerald-600" size={16} /> دفع آمن عبر Moyasar · Apple Pay وmada والبطاقات</div><div ref={ref} className="mysr-form" />{error && <p className="mt-3 text-xs font-bold text-red-600">{error}</p>}</div>;
}
