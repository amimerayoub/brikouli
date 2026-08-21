import React from "react";
import { Bookmark } from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useSupabaseSession } from "@/hooks/useSupabaseSession";
import { AppShell, PageHeading } from "@/components/phase3/AppShell";
import { JobSeekerGigCard } from "@/components/jobSeeker/JobSeekerGigCard";
import { JobSeekerCardSkeleton, JobSeekerFeedback, JobSeekerLoadError, NoSavedGigs } from "@/components/jobSeeker/JobSeekerFeedback";
import { removeFavoriteId, removeFavoriteItem } from "@/lib/favorites";
import type { SavedGig } from "@shared/brikouli.types";

export function SavedGigCards({ gigs, onRemove }: { gigs: SavedGig[]; onRemove: (gigId: string) => void }) { return <div className="jobseeker-page-list">{gigs.map(gig => <JobSeekerGigCard gig={gig} isSaved onToggleSave={() => onRemove(gig.id)} key={gig.id} />)}</div>; }

export default function SavedGigs() {
  const { isAuthenticated } = useSupabaseSession();
  const saved = trpc.brikouli.favorites.list.useQuery(undefined, { enabled: isAuthenticated, staleTime: 15_000 });
  const utils = trpc.useUtils();
  const remove = trpc.brikouli.favorites.remove.useMutation({ onMutate: async ({ gigId }) => { await Promise.all([utils.brikouli.favorites.list.cancel(), utils.brikouli.favorites.ids.cancel()]); const previousList = utils.brikouli.favorites.list.getData(); const previousIds = utils.brikouli.favorites.ids.getData(); utils.brikouli.favorites.list.setData(undefined, current => current?.success ? { success: true, data: removeFavoriteItem(current.data, gigId) } : current); utils.brikouli.favorites.ids.setData(undefined, current => current?.success ? { success: true, data: removeFavoriteId(current.data, gigId) } : current); return { previousList, previousIds }; }, onError: (_error, _input, context) => { if (context?.previousList) utils.brikouli.favorites.list.setData(undefined, context.previousList); if (context?.previousIds) utils.brikouli.favorites.ids.setData(undefined, context.previousIds); toast.error("تعذر تحديث المحفوظات الآن."); }, onSettled: () => { void utils.brikouli.favorites.list.invalidate(); void utils.brikouli.favorites.ids.invalidate(); } });
  const gigs = saved.data?.success ? saved.data.data : [];
  const removeSavedGig = (gigId: string) => { remove.mutate({ gigId }, { onSuccess: response => { if (!response.success) { toast.error(response.message); return; } toast.success("أزلنا الفرصة من المحفوظات"); } }); };
  return <AppShell><main className="jobseeker-page"><PageHeading eyebrow="فرصك المختارة" title="المحفوظات" /><p className="jobseeker-page-intro">احتفظ بالفرص التي تريد العودة إليها، ثم قدّم عندما تكون جاهزاً.</p>{!isAuthenticated ? <JobSeekerFeedback icon={<Bookmark size={28} />} title="سجّل الدخول لرؤية محفوظاتك" description="تُحفظ اختياراتك في حسابك لتبقى متاحة من أي جهاز." action={<Link className="app-button app-button-primary" href="/login">تسجيل الدخول</Link>} /> : saved.isLoading ? <div className="jobseeker-page-list"><JobSeekerCardSkeleton /><JobSeekerCardSkeleton /></div> : saved.isError || (saved.data && !saved.data.success) ? <JobSeekerLoadError onRetry={() => void saved.refetch()} /> : gigs.length === 0 ? <NoSavedGigs /> : <SavedGigCards gigs={gigs} onRemove={removeSavedGig} />}</main></AppShell>;
}
