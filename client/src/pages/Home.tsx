import React, { useDeferredValue, useMemo, useState } from "react";
import { ArrowLeft, MapPinned, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { toast } from "sonner";
import { categories } from "@/lib/phase3-data";
import { useSupabaseSession } from "@/hooks/useSupabaseSession";
import { trpc } from "@/lib/trpc";
import { AppShell, PageHeading } from "@/components/phase3/AppShell";
import { JobSeekerCategories } from "@/components/jobSeeker/JobSeekerCategories";
import { JobSeekerGigCard } from "@/components/jobSeeker/JobSeekerGigCard";
import { JobSeekerCardSkeleton, JobSeekerLoadError, NoJobsFound, NoSearchResults } from "@/components/jobSeeker/JobSeekerFeedback";
import { JobSeekerSearch } from "@/components/jobSeeker/JobSeekerSearch";
import { addFavoriteId, removeFavoriteId } from "@/lib/favorites";
import type { JobSeekerGig } from "@shared/brikouli.types";

export default function Home() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>();
  const deferredSearch = useDeferredValue(search);
  const { isAuthenticated } = useSupabaseSession();
  const queryInput = useMemo(() => ({ query: deferredSearch, category, urgentOnly: false, sort: "newest" as const, limit: 40 }), [deferredSearch, category]);
  const gigsQuery = trpc.brikouli.gigs.listForJobSeeker.useQuery(queryInput, { staleTime: 15_000 });
  const smartSearchInput = useMemo(() => ({ query: deferredSearch.trim(), category, urgentOnly: false, sort: "newest" as const, limit: 40 }), [deferredSearch, category]);
  const smartSearchQuery = trpc.brikouli.search?.smart?.useQuery ? trpc.brikouli.search.smart.useQuery(smartSearchInput, { enabled: isAuthenticated && smartSearchInput.query.length >= 2, staleTime: 20_000 }) : { data: undefined, isLoading: false, isError: false, refetch: async () => undefined };
  const favoriteIdsQuery = trpc.brikouli.favorites.ids.useQuery(undefined, { enabled: isAuthenticated, staleTime: 15_000 });
  const recommendationsQuery = trpc.brikouli.recommendations?.list?.useQuery ? trpc.brikouli.recommendations.list.useQuery({ limit: 2 }, { enabled: isAuthenticated && !deferredSearch && !category, staleTime: 60_000 }) : { data: undefined, isLoading: false, isError: false };
  const utils = trpc.useUtils();
  const save = trpc.brikouli.favorites.save.useMutation({ onMutate: async ({ gigId }) => { await utils.brikouli.favorites.ids.cancel(); const previousIds = utils.brikouli.favorites.ids.getData(); utils.brikouli.favorites.ids.setData(undefined, current => current?.success ? { success: true, data: addFavoriteId(current.data, gigId) } : current); return { previousIds }; }, onError: (_error, _input, context) => { if (context?.previousIds) utils.brikouli.favorites.ids.setData(undefined, context.previousIds); toast.error("تعذر تحديث المحفوظات الآن."); }, onSettled: () => { void utils.brikouli.favorites.ids.invalidate(); void utils.brikouli.favorites.list.invalidate(); } });
  const remove = trpc.brikouli.favorites.remove.useMutation({ onMutate: async ({ gigId }) => { await utils.brikouli.favorites.ids.cancel(); const previousIds = utils.brikouli.favorites.ids.getData(); utils.brikouli.favorites.ids.setData(undefined, current => current?.success ? { success: true, data: removeFavoriteId(current.data, gigId) } : current); return { previousIds }; }, onError: (_error, _input, context) => { if (context?.previousIds) utils.brikouli.favorites.ids.setData(undefined, context.previousIds); toast.error("تعذر تحديث المحفوظات الآن."); }, onSettled: () => { void utils.brikouli.favorites.ids.invalidate(); void utils.brikouli.favorites.list.invalidate(); } });
  const publicGigs = gigsQuery.data?.success ? gigsQuery.data.data : [];
  const gigs = smartSearchQuery.data?.success ? smartSearchQuery.data.data.gigs : publicGigs;
  const savedIds = new Set(favoriteIdsQuery.data?.success ? favoriteIdsQuery.data.data : []);
  const recommended = recommendationsQuery.data?.success ? recommendationsQuery.data.data : [...gigs].sort((left, right) => Number(right.urgent) - Number(left.urgent) || right.payment - left.payment).slice(0, 2);
  const recent = gigs.slice(0, 5);
  const searchLoading = gigsQuery.isLoading || smartSearchQuery.isLoading;
  const searchFailed = gigsQuery.isError || smartSearchQuery.isError || (smartSearchQuery.data && !smartSearchQuery.data.success);
  const showSearchFeedback = Boolean(deferredSearch || category) && !searchLoading && !searchFailed && gigs.length === 0;

  const toggleSave = (gig: JobSeekerGig) => {
    if (!isAuthenticated) { toast.info("سجّل الدخول لحفظ الفرص ومتابعتها من حسابك."); return; }
    const mutation = savedIds.has(gig.id) ? remove : save;
    mutation.mutate({ gigId: gig.id }, {
      onSuccess: result => {
        if (!result.success) { toast.error(result.message); return; }
        toast.success(savedIds.has(gig.id) ? "أزلنا الفرصة من المحفوظات" : "حُفظت الفرصة في حسابك");
      },
    });
  };

  return <AppShell><section className="home-welcome job-home-welcome"><motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .26 }}><p className="welcome-eyebrow"><MapPinned size={15} /> الفرص القريبة تبدأ من هنا</p><h1>أهلاً بك في <em>بريكولي</em></h1><p>ابحث، احفظ، وتقدّم إلى فرصة مناسبة لوقتك في الحي.</p></motion.div><div className="job-home-search-stack"><JobSeekerSearch value={search} onChange={setSearch} placeholder="ابحث عن فرصة أو متجر أو حي" /><JobSeekerCategories categories={categories} value={category} onChange={setCategory} /></div><Link href="/explore" className="home-explore-cta">استكشف على الخريطة <ArrowLeft size={17} /></Link></section>
    <section className="phase-section notebook-section"><PageHeading eyebrow="اختصارات سريعة" title="اختر مجالاً يناسبك" /><JobSeekerCategories categories={categories} value={category} onChange={setCategory} /></section>
    {searchLoading && <section className="phase-section"><PageHeading eyebrow="يتم التحديث" title="فرص تناسبك" /><div className="home-job-grid"><JobSeekerCardSkeleton /><JobSeekerCardSkeleton /></div></section>}
    {searchFailed || (gigsQuery.data && !gigsQuery.data.success) ? <section className="phase-section"><JobSeekerLoadError onRetry={() => { void gigsQuery.refetch(); void smartSearchQuery.refetch(); }} /></section> : null}
    {showSearchFeedback ? <section className="phase-section"><NoSearchResults query={search || category || "اختيارك"} /></section> : null}
    {!searchLoading && !searchFailed && !showSearchFeedback && gigs.length === 0 ? <section className="phase-section"><NoJobsFound /></section> : null}
    {recommended.length > 0 && <section className="phase-section"><PageHeading eyebrow={recommendationsQuery.data?.success ? "ترشيحات محسوبة من تفضيلاتك" : "تابع من حيث توقفت"} title={search || category ? "نتائج تناسب بحثك" : "فرص قد تناسبك"} action={<Link className="section-link" href="/explore">عرض الكل <ArrowLeft size={15} /></Link>} /><div className="home-job-grid">{recommended.map(gig => <div key={gig.id} className="phase10-recommendation"><JobSeekerGigCard gig={gig} isSaved={savedIds.has(gig.id)} onToggleSave={toggleSave} />{"reason" in gig && typeof gig.reason === "string" && <p>{gig.reason}</p>}</div>)}</div></section>}
    <section className="nearby-banner"><div><p><Sparkles size={15} /> قريب منك</p><h2>فرص محلية، بخطوات أبسط.</h2><span>افتح الخريطة لمشاهدة الفرص ضمن نطاقك واستخدام فلاتر المسافة.</span></div><Link href="/explore">استكشف القريب <MapPinned size={17} /></Link></section>
    {recent.length > 0 && <section className="phase-section"><PageHeading eyebrow="آخر الإضافات" title="مهام حديثة" /><div className="recent-scroll">{recent.map(gig => <JobSeekerGigCard compact gig={gig} isSaved={savedIds.has(gig.id)} onToggleSave={toggleSave} key={gig.id} />)}</div></section>}
  </AppShell>;
}
