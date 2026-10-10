import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Building2, CarFront, CheckCircle2, Clock3, FileUp, ShieldCheck, UserRound, Wrench } from "lucide-react";
import { trpc } from "@/lib/trpc";

type AccountType = "customer" | "workshop";

type RegistrationWizardProps = {
  accountType: AccountType;
  onAccountTypeChange: (type: AccountType) => void;
  onCustomerComplete: () => void;
  onWorkshopComplete: () => void;
};

type FormState = {
  name: string;
  phone: string;
  email: string;
  password: string;
  confirm: string;
  workshopName: string;
  city: string;
  address: string;
  businessType: string;
  monthlyVolume: string;
  specialties: string[];
  warehouseCount: string;
  warehouseDetails: string;
  tradeLicense: string;
  logo: string;
  terms: boolean;
};

const initialForm: FormState = {
  name: "", phone: "", email: "", password: "", confirm: "", workshopName: "", city: "الرياض", address: "", businessType: "ميكانيكا", monthlyVolume: "أقل من 5000 درهم", specialties: [], warehouseCount: "1", warehouseDetails: "", tradeLicense: "", logo: "", terms: false,
};

const specialtyOptions = ["ميكانيكا المحرك", "الكهرباء والحساسات", "التكييف والتبريد", "الفرامل والتعليق", "السمكرة والدهان", "قطع الغيار الأصلية"];

export default function RegistrationWizard({ accountType, onAccountTypeChange, onCustomerComplete, onWorkshopComplete }: RegistrationWizardProps) {
  const totalSteps = accountType === "customer" ? 4 : 6;
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormState>(initialForm);
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [otp, setOtp] = useState("");
  const [otpHint, setOtpHint] = useState("");
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [error, setError] = useState("");
  const [complete, setComplete] = useState(false);
  const utils = trpc.useUtils();
  const startMutation = trpc.auth.startRegistration.useMutation({ onSuccess: (result) => { setChallengeId(result.challengeId); setOtpHint(result.debugCode ? `رمز التجربة: ${result.debugCode}` : "تم إرسال الرمز إلى جوالك"); setSecondsLeft(result.expiresInSeconds); setError(""); setStep(accountType === "customer" ? 3 : 5); }, onError: (mutationError) => setError(mutationError.message) });
  const verifyMutation = trpc.auth.verifyRegistration.useMutation({ onSuccess: () => { void utils.auth.me.invalidate(); setComplete(true); setError(""); setStep(accountType === "customer" ? 4 : 6); }, onError: (mutationError) => setError(mutationError.message) });
  const resendMutation = trpc.auth.resendRegistrationOtp.useMutation({ onSuccess: (result) => { setSecondsLeft(result.expiresInSeconds); setOtpHint(result.debugCode ? `رمز التجربة الجديد: ${result.debugCode}` : "تم إرسال رمز جديد"); setError(""); }, onError: (mutationError) => setError(mutationError.message) });
  const patch = (values: Partial<FormState>) => setForm((current) => ({ ...current, ...values }));
  const stepTitle = useMemo(() => {
    if (accountType === "customer") return ["بياناتك الأساسية", "أنشئ كلمة مرور آمنة", "تحقق من رقم الجوال", "أضف سيارتك الأولى"][step - 1];
    return ["بيانات صاحب الحساب", "بيانات الورشة", "تخصصات الورشة", "المستودعات والمستندات", "تحقق من رقم الجوال", "تم استلام الطلب"][step - 1];
  }, [accountType, step]);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = window.setInterval(() => setSecondsLeft((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [secondsLeft]);

  useEffect(() => {
    setStep(1); setComplete(false); setChallengeId(null); setOtp(""); setError("");
  }, [accountType]);

  const next = () => {
    setError("");
    if (accountType === "customer") {
      if (step === 1 && (!form.name.trim() || !form.phone.trim() || !form.email.trim())) return setError("أكمل الاسم ورقم الجوال والبريد الإلكتروني");
      if (step === 2) {
        if (form.password.length < 8 || !/[A-Za-z\u0600-\u06ff]/.test(form.password) || !/\d/.test(form.password)) return setError("كلمة المرور يجب أن تتكون من 8 أحرف وتحتوي حرفاً ورقماً");
        if (form.password !== form.confirm) return setError("كلمتا المرور غير متطابقتين");
        if (!form.terms) return setError("وافق على الشروط والأحكام للمتابعة");
        return startMutation.mutate({ accountType, name: form.name, phone: form.phone, email: form.email, password: form.password });
      }
      if (step < 3) setStep((value) => value + 1);
      return;
    }
    if (step === 1 && (!form.name.trim() || !form.phone.trim() || !form.email.trim())) return setError("أكمل بيانات صاحب الحساب");
    if (step === 2 && (!form.workshopName.trim() || !form.address.trim())) return setError("أكمل اسم الورشة والعنوان");
    if (step === 3 && form.specialties.length === 0) return setError("اختر تخصصاً واحداً على الأقل");
    if (step === 4) {
      if (!form.warehouseDetails.trim()) return setError("أدخل تفاصيل المستودع أو اكتب لا يوجد");
      return startMutation.mutate({ accountType, name: form.name, phone: form.phone, email: form.email, password: form.password, workshopName: form.workshopName, city: form.city, address: form.address, businessType: form.businessType, monthlyVolume: form.monthlyVolume, specialties: form.specialties, warehouseCount: Number(form.warehouseCount) || 0, warehouseDetails: form.warehouseDetails, tradeLicense: form.tradeLicense || undefined, logo: form.logo || undefined });
    }
    if (step < 5) setStep((value) => value + 1);
  };

  const verify = () => {
    if (!challengeId) return setError("ابدأ إرسال رمز التحقق أولاً");
    if (!/^\d{6}$/.test(otp)) return setError("أدخل رمز التحقق المكوّن من 6 أرقام");
    verifyMutation.mutate({ challengeId, code: otp });
  };

  return <div className="space-y-5">
    <div className="flex flex-wrap gap-3">
      <button type="button" className={`flex flex-1 items-center gap-3 rounded-2xl border-2 p-4 text-right ${accountType === "customer" ? "border-[#f97316] bg-orange-50" : "border-slate-200"}`} onClick={() => onAccountTypeChange("customer")}><CarFront className="text-[#f97316]" size={22} /><span><b className="block">عميل / مالك سيارة</b><small className="text-xs text-slate-500">تسوق وتتبع واحفظ سياراتك</small></span></button>
      <button type="button" className={`flex flex-1 items-center gap-3 rounded-2xl border-2 p-4 text-right ${accountType === "workshop" ? "border-[#f97316] bg-orange-50" : "border-slate-200"}`} onClick={() => onAccountTypeChange("workshop")}><Wrench className="text-[#f97316]" size={22} /><span><b className="block">ورشة صيانة</b><small className="text-xs text-slate-500">أسعار خاصة ومراجعة اعتماد</small></span></button>
    </div>
    <div className="rounded-2xl bg-slate-50 p-4"><div className="flex items-center justify-between text-xs font-bold text-slate-500"><span>الخطوة {step} من {totalSteps}</span><span>{stepTitle}</span></div><div className="mt-3 flex gap-1.5">{Array.from({ length: totalSteps }, (_, index) => <span key={index} className={`h-1.5 flex-1 rounded-full transition ${index < step ? "bg-[#f97316]" : "bg-slate-200"}`} />)}</div></div>
    {complete && accountType === "customer" && <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-center"><CheckCircle2 className="mx-auto text-emerald-500" size={46} /><h3 className="mt-3 text-xl font-black">تم إنشاء حسابك بنجاح</h3><p className="mt-2 text-sm text-slate-600">أضف سيارتك الأولى الآن لنعرض القطع المتوافقة معها.</p><button type="button" className="mt-5 rounded-xl bg-[#f97316] px-5 py-3 text-sm font-black text-white" onClick={onCustomerComplete}>إضافة سيارتي الأولى <ArrowLeft className="mr-1 inline" size={16} /></button></div>}
    {complete && accountType === "workshop" && <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-center"><CheckCircle2 className="mx-auto text-emerald-500" size={46} /><h3 className="mt-3 text-xl font-black">تم استلام طلب الورشة</h3><p className="mt-2 text-sm leading-7 text-slate-600">حالة الطلب الآن قيد المراجعة. سنفعّل الأسعار الخاصة بعد اعتماد البيانات.</p><button type="button" className="mt-5 rounded-xl bg-[#0b1f33] px-5 py-3 text-sm font-black text-white" onClick={onWorkshopComplete}>العودة للمتجر</button></div>}
    {!complete && accountType === "customer" && <>
      {step === 1 && <section className="space-y-3"><h3 className="flex items-center gap-2 font-black"><UserRound className="text-[#f97316]" size={19} /> البيانات الأساسية</h3><input className="h-12 w-full rounded-xl border border-slate-200 px-4 text-sm" placeholder="الاسم الكامل" value={form.name} onChange={(event) => patch({ name: event.target.value })} /><input className="h-12 w-full rounded-xl border border-slate-200 px-4 text-sm" placeholder="رقم الجوال، مثال: 05xxxxxxxx" value={form.phone} onChange={(event) => patch({ phone: event.target.value })} /><input type="email" className="h-12 w-full rounded-xl border border-slate-200 px-4 text-sm" placeholder="البريد الإلكتروني" value={form.email} onChange={(event) => patch({ email: event.target.value })} /></section>}
      {step === 2 && <section className="space-y-3"><h3 className="flex items-center gap-2 font-black"><ShieldCheck className="text-[#f97316]" size={19} /> كلمة المرور والشروط</h3><input type="password" className="h-12 w-full rounded-xl border border-slate-200 px-4 text-sm" placeholder="كلمة المرور: 8 أحرف وحرف ورقم" value={form.password} onChange={(event) => patch({ password: event.target.value })} /><input type="password" className="h-12 w-full rounded-xl border border-slate-200 px-4 text-sm" placeholder="تأكيد كلمة المرور" value={form.confirm} onChange={(event) => patch({ confirm: event.target.value })} /><label className="flex items-center gap-2 text-sm font-bold text-slate-600"><input type="checkbox" checked={form.terms} onChange={(event) => patch({ terms: event.target.checked })} className="h-4 w-4 accent-orange-500" /> أوافق على الشروط والأحكام وسياسة الخصوصية</label></section>}
      {step === 3 && <OtpStep phone={form.phone} otp={otp} setOtp={setOtp} hint={otpHint} secondsLeft={secondsLeft} onVerify={verify} onResend={() => challengeId && resendMutation.mutate({ challengeId })} loading={verifyMutation.isPending} />}
      {step === 4 && <div className="rounded-2xl border border-orange-200 bg-orange-50 p-5 text-center"><CarFront className="mx-auto text-[#f97316]" size={42} /><h3 className="mt-3 font-black">الكراج جاهز لسيارتك الأولى</h3><p className="mt-2 text-sm text-slate-600">إضافة السيارة الآن تجعل مطابقة القطع أسرع وأكثر دقة.</p></div>}
    </>}
    {!complete && accountType === "workshop" && <>
      {step === 1 && <section className="space-y-3"><h3 className="flex items-center gap-2 font-black"><UserRound className="text-[#f97316]" size={19} /> بيانات صاحب الحساب</h3><input className="h-12 w-full rounded-xl border border-slate-200 px-4 text-sm" placeholder="الاسم الكامل" value={form.name} onChange={(event) => patch({ name: event.target.value })} /><input className="h-12 w-full rounded-xl border border-slate-200 px-4 text-sm" placeholder="رقم الجوال" value={form.phone} onChange={(event) => patch({ phone: event.target.value })} /><input type="email" className="h-12 w-full rounded-xl border border-slate-200 px-4 text-sm" placeholder="البريد الإلكتروني" value={form.email} onChange={(event) => patch({ email: event.target.value })} /><input type="password" className="h-12 rounded-xl border border-slate-200 px-4 text-sm" placeholder="كلمة مرور آمنة" value={form.password} onChange={(event) => patch({ password: event.target.value })} /></section>}
      {step === 2 && <section className="space-y-3"><h3 className="flex items-center gap-2 font-black"><Building2 className="text-[#f97316]" size={19} /> بيانات الورشة</h3><input className="h-12 w-full rounded-xl border border-slate-200 px-4 text-sm" placeholder="اسم الورشة" value={form.workshopName} onChange={(event) => patch({ workshopName: event.target.value })} /><div className="grid gap-3 sm:grid-cols-2"><select className="h-12 rounded-xl border border-slate-200 bg-white px-4 text-sm" value={form.city} onChange={(event) => patch({ city: event.target.value })}><option>الرياض</option><option>جدة</option><option>الدمام</option><option>دبي</option><option>أبوظبي</option><option>مدينة الكويت</option></select><select className="h-12 rounded-xl border border-slate-200 bg-white px-4 text-sm" value={form.businessType} onChange={(event) => patch({ businessType: event.target.value })}><option>ميكانيكا</option><option>كهرباء سيارات</option><option>تكييف سيارات</option><option>سمكرة ودهان</option><option>متعدد الخدمات</option></select></div><textarea className="min-h-24 w-full rounded-xl border border-slate-200 p-3 text-sm" placeholder="عنوان الورشة بالتفصيل" value={form.address} onChange={(event) => patch({ address: event.target.value })} /></section>}
      {step === 3 && <section><h3 className="flex items-center gap-2 font-black"><Wrench className="text-[#f97316]" size={19} /> تخصصات الورشة</h3><div className="mt-4 grid gap-2 sm:grid-cols-2">{specialtyOptions.map((specialty) => <label key={specialty} className={`flex cursor-pointer items-center gap-2 rounded-xl border p-3 text-sm font-bold ${form.specialties.includes(specialty) ? "border-orange-300 bg-orange-50" : "border-slate-200"}`}><input type="checkbox" checked={form.specialties.includes(specialty)} onChange={() => patch({ specialties: form.specialties.includes(specialty) ? form.specialties.filter((item) => item !== specialty) : [...form.specialties, specialty] })} className="h-4 w-4 accent-orange-500" />{specialty}</label>)}</div></section>}
      {step === 4 && <section className="space-y-3"><h3 className="flex items-center gap-2 font-black"><FileUp className="text-[#f97316]" size={19} /> المستودعات والمستندات</h3><input inputMode="numeric" className="h-12 w-full rounded-xl border border-slate-200 px-4 text-sm" placeholder="عدد المستودعات" value={form.warehouseCount} onChange={(event) => patch({ warehouseCount: event.target.value })} /><textarea className="min-h-24 w-full rounded-xl border border-slate-200 p-3 text-sm" placeholder="مواقع المستودعات أو اكتب: لا يوجد" value={form.warehouseDetails} onChange={(event) => patch({ warehouseDetails: event.target.value })} /><div className="grid gap-3 sm:grid-cols-2"><label className="flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-slate-300 p-3 text-xs font-bold"><FileUp size={18} className="text-[#f97316]" /> الرخصة التجارية<input type="file" accept="image/*,.pdf" className="hidden" onChange={(event) => patch({ tradeLicense: event.target.files?.[0]?.name ?? "" })} />{form.tradeLicense && <span className="text-emerald-600">تم الاختيار</span>}</label><label className="flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-slate-300 p-3 text-xs font-bold"><FileUp size={18} className="text-[#f97316]" /> شعار الورشة<input type="file" accept="image/*" className="hidden" onChange={(event) => patch({ logo: event.target.files?.[0]?.name ?? "" })} />{form.logo && <span className="text-emerald-600">تم الاختيار</span>}</label></div></section>}
      {step === 5 && <OtpStep phone={form.phone} otp={otp} setOtp={setOtp} hint={otpHint} secondsLeft={secondsLeft} onVerify={verify} onResend={() => challengeId && resendMutation.mutate({ challengeId })} loading={verifyMutation.isPending} />}
    </>}
    {error && <p className="rounded-xl bg-red-50 p-3 text-sm font-bold text-red-700">{error}</p>}
    {!complete && step !== (accountType === "customer" ? 3 : 5) && <div className="flex items-center justify-between gap-3"><button type="button" className="flex items-center gap-1 rounded-xl px-4 py-3 text-sm font-bold text-slate-500 disabled:opacity-40" disabled={step === 1 || startMutation.isPending} onClick={() => setStep((value) => Math.max(1, value - 1))}><ArrowRight size={17} /> السابق</button><button type="button" className="flex flex-1 items-center justify-center gap-1 rounded-xl bg-[#f97316] px-5 py-3 text-sm font-black text-white disabled:opacity-50" disabled={startMutation.isPending} onClick={next}>{startMutation.isPending ? "جارٍ الحفظ…" : step === 4 && accountType === "customer" ? "متابعة إلى الكراج" : "متابعة"}<ArrowLeft size={17} /></button></div>}
    {accountType === "customer" && step === 4 && !complete && <button type="button" className="w-full rounded-xl bg-[#0b1f33] px-5 py-3 text-sm font-black text-white" onClick={onCustomerComplete}>فتح الكراج وإضافة السيارة</button>}
  </div>;
}

function OtpStep({ phone, otp, setOtp, hint, secondsLeft, onVerify, onResend, loading }: { phone: string; otp: string; setOtp: (value: string) => void; hint: string; secondsLeft: number; onVerify: () => void; onResend: () => void; loading: boolean }) {
  return <section className="mx-auto max-w-md space-y-4 text-center"><Clock3 className="mx-auto text-[#f97316]" size={34} /><h3 className="text-lg font-black">تحقق من رقم الجوال</h3><p className="text-sm text-slate-500">أدخل الرمز المكوّن من 6 أرقام المرسل إلى {phone || "رقمك"}.</p><input autoFocus inputMode="numeric" maxLength={6} className="h-14 w-full rounded-xl border border-slate-200 text-center text-2xl font-black tracking-[0.7em] outline-none focus:border-orange-400" value={otp} onChange={(event) => setOtp(event.target.value.replace(/\D/g, ""))} placeholder="••••••" /><p className="text-xs font-bold text-orange-700">{hint}</p><button type="button" disabled={loading || otp.length !== 6} className="h-12 w-full rounded-xl bg-[#f97316] font-black text-white disabled:opacity-50" onClick={onVerify}>{loading ? "جارٍ التحقق…" : "تأكيد الرمز"}</button><div className="flex items-center justify-center gap-3 text-xs font-bold text-slate-500"><span>{secondsLeft > 0 ? `إعادة الإرسال بعد ${secondsLeft} ثانية` : "يمكنك طلب رمز جديد"}</span><button type="button" disabled={secondsLeft > 0} className="text-[#f97316] disabled:opacity-40" onClick={onResend}>إعادة الإرسال</button></div></section>;
}
