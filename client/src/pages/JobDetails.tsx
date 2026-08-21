import { useState } from "react";
import { ArrowRight, Bookmark, BriefcaseBusiness, Clock3, MapPin, ShieldCheck, Volume2, Wallet } from "lucide-react";
import { motion } from "framer-motion";
import { Link, useRoute } from "wouter";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useSupabaseSession } from "@/hooks/useSupabaseSession";
import { AppShell } from "@/components/phase3/AppShell";
import { AppButton } from "@/components/phase3/AppButton";
import { BottomSheet } from "@/components/phase3/BottomSheet";
import { StatusBadge } from "@/components/phase3/StatusBadge";
import { JobSeekerCardSkeleton, JobSeekerFeedback, JobSeekerLoadError } from "@/components/jobSeeker/JobSeekerFeedback";

const detailHero = "/manus-storage/brikouli-hero-local-gig_63b3860c.jpg";

export default function JobDetails() {
  const [, params] = useRoute("/jobs/:jobId");
  const gigId = params?.jobId ?? "";
  const [applyOpen, setApplyOpen] = useState(false);
  const [applicationComplete, setApplicationComplete] = useState(false);
  const { isAuthenticated } = useSupabaseSession();
  const detail = trpc.brikouli.gigs.detail.useQuery({ gigId }, { enabled: Boolean(gigId) });
  const favoriteIds = trpc.brikouli.favorites.ids.useQuery(undefined, { enabled: isAuthenticated, staleTime: 15_000 });
  const utils = trpc.useUtils();
  const save = trpc.brikouli.favorites.save.useMutation();
  const remove = trpc.brikouli.favorites.remove.useMutation();
  const apply = trpc.brikouli.applications.create.useMutation();
  const gig = detail.data?.success ? detail.data.data : null;
  const saved = Boolean(gig && favoriteIds.data?.success && favoriteIds.data.data.includes(gig.id));

  const toggleSave = () => {
    if (!gig) return;
    if (!isAuthenticated) { toast.info("سجّل الدخول لحفظ الفرص ومتابعتها من حسابك."); return; }
    (saved ? remove : save).mutate({ gigId: gig.id }, { onSuccess: response => { if (!response.success) { toast.error(response.message); return; } toast.success(saved ? "أزلنا الفرصة من المحفوظات" : "حُفظت الفرصة في حسابك"); void utils.brikouli.favorites.ids.invalidate(); void utils.brikouli.favorites.list.invalidate(); }, onError: () => toast.error("تعذر تحديث المحفوظات الآن.") });
  };

  const openApply = () => {
    if (!gig) return;
    if (!isAuthenticated) { toast.info("سجّل الدخول أولاً لتقديم طلبك بشكل آمن."); return; }
    setApplicationComplete(false);
    setApplyOpen(true);
  };

  const confirmApply = () => {
    if (!gig) return;
    apply.mutate({ gigId: gig.id }, { onSuccess: response => { if (!response.success) { if (response.code === "APPLICATION_EXISTS") { toast.info(response.message); setApplyOpen(false); return; } toast.error(response.message); return; } setApplicationComplete(true); void utils.brikouli.applications.mine.invalidate(); }, onError: () => toast.error("تعذر إرسال طلبك الآن. حاول مرة أخرى.") });
  };

  if (detail.isLoading) return <AppShell><main className="job-detail-loading"><JobSeekerCardSkeleton /><JobSeekerCardSkeleton /></main></AppShell>;
  if (!gig) return <AppShell><main className="job-detail-loading">{detail.isError || (detail.data && !detail.data.success) ? <JobSeekerLoadError onRetry={() => void detail.refetch()} /> : <JobSeekerFeedback icon={<BriefcaseBusiness size={28} />} title="الفرصة لم تعد متاحة" description="ربما أُغلقت هذه الفرصة أو تغيرت حالتها. استكشف فرصاً أخرى في منطقتك." action={<Link className="app-button app-button-primary" href="/explore">العودة للاستكشاف</Link>} />}</main></AppShell>;

  return <AppShell><article className="job-details job-seeker-details"><Link className="back-link" href="/explore"><ArrowRight size={17} /> العودة للاستكشاف</Link><div className="job-detail-hero"><img src={detailHero} alt="فرصة عمل محلية" /><div className="job-detail-image-shade" /></div><section className="job-detail-content"><div className="detail-topline"><span className="category-pill">{gig.category}</span>{gig.urgent && <StatusBadge type="urgent" />}</div><h1>{gig.title}</h1><div className="detail-employer"><span>{gig.employerName.slice(0, 1) || "ب"}</span><div><b>{gig.employerName}</b><p>صاحب المنشور المحلي</p></div></div><div className="detail-payment"><div><small>المقابل</small><strong>{gig.payment} د.م</strong></div><Wallet size={24} /></div><div className="detail-metrics"><span><Clock3 size={17} /> {gig.duration}</span><span><MapPin size={17} /> {gig.neighborhood ?? gig.city}</span></div><section><h2>عن المهمة</h2><p>{gig.description}</p></section><section><h2>قبل أن تتقدّم</h2><ul><li>راجع الوقت والمكان والتفاصيل مع صاحب المنشور.</li><li>لا تشارك معلومات حساسة أو تدفع مقابل الحصول على فرصة.</li><li>اختر وسيلة تواصل واضحة واتفق على نطاق العمل أولاً.</li></ul></section><aside className="safety-notice"><ShieldCheck size={21} /><div><b>تنبيه للسلامة</b><p>بريكولي منصة لتسهيل الوصول إلى الفرص. راجع الاتفاق والتفاصيل قبل بدء أي عمل.</p></div></aside></section></article><footer className="job-sticky-actions"><button type="button" className={`voice-action ${saved ? "is-saved" : ""}`} onClick={toggleSave} aria-pressed={saved}><Bookmark size={19} fill={saved ? "currentColor" : "none"} /> {saved ? "محفوظة" : "حفظ"}</button><button type="button" className="app-button app-button-primary" onClick={openApply}>قدّم الآن</button></footer><BottomSheet open={applyOpen} onClose={() => setApplyOpen(false)} title={applicationComplete ? "تم إرسال طلبك" : "مراجعة طلب التقديم"}>{applicationComplete ? <motion.div className="application-success" initial={{ opacity: 0, y: 8, scale: .97 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: .24 }}><span>✓</span><h2>تم إرسال طلبك</h2><p>ستظهر أي تحديثات من صاحب المنشور في صفحة طلباتك.</p><Link href="/applications" className="app-button app-button-primary" onClick={() => setApplyOpen(false)}>متابعة طلباتي</Link></motion.div> : <motion.div className="application-review" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .2 }}><p className="application-review-label">أنت على وشك التقديم إلى</p><h2>{gig.title}</h2><div><span><Wallet size={16} /> {gig.payment} د.م</span><span><Clock3 size={16} /> {gig.duration}</span></div><button type="button" className="voice-placeholder" onClick={() => toast.info("الرسالة الصوتية اختيارية وستتوفر عند إضافة المراسلة.")}><Volume2 size={18} /> رسالة صوتية اختيارية <small>قريباً</small></button><p className="application-review-note">بالتأكيد، سيُرسل طلب واحد فقط إلى هذه الفرصة. يمكنك متابعة حالته لاحقاً من حسابك.</p><AppButton onClick={confirmApply} disabled={apply.isPending}>{apply.isPending ? "جارٍ الإرسال…" : "تأكيد التقديم"}</AppButton></motion.div>}</BottomSheet></AppShell>;
}
