import React from "react";
import { ArrowLeft, ClipboardList, UsersRound } from "lucide-react";
import { Link } from "wouter";
import { EmployerAccessState, EmployerShell } from "@/components/employer/EmployerShell";
import { JobSeekerCardSkeleton, JobSeekerFeedback, JobSeekerLoadError } from "@/components/jobSeeker/JobSeekerFeedback";
import { useSupabaseSession } from "@/hooks/useSupabaseSession";
import { trpc } from "@/lib/trpc";

export default function EmployerApplicantsOverview() { const { isAuthenticated, loading } = useSupabaseSession(); const gigs = trpc.brikouli.employer.gigs.list.useQuery({}, { enabled: isAuthenticated }); if (loading || gigs.isLoading) return <div className="employer-loading"><JobSeekerCardSkeleton /></div>; if (!isAuthenticated) return <EmployerAccessState type="login" />; if (gigs.isError || !gigs.data?.success) return <JobSeekerLoadError onRetry={() => void gigs.refetch()} />; const reviewable = gigs.data.data.filter(gig => gig.applicantCount > 0); return <EmployerShell title="المتقدمون" subtitle="اختر فرصة للاطلاع على طلباتها ومراجعتها بأمان.">{reviewable.length === 0 ? <JobSeekerFeedback icon={<UsersRound size={28}/>} title="لا توجد طلبات للمراجعة بعد" description="عندما يتقدم أحد إلى فرصة تملكها، ستظهر الفرصة هنا." /> : <section className="employer-applicant-overview">{reviewable.map(gig => <Link key={gig.id} href={`/employer/gigs/${gig.id}/applicants`} className="employer-applicant-overview-card"><span><ClipboardList size={20}/></span><div><h2>{gig.title}</h2><p>{gig.city} · {gig.status === "active" ? "منشورة" : "تحتاج متابعة"}</p></div><strong>{gig.applicantCount} طلب</strong><ArrowLeft size={18}/></Link>)}</section>}</EmployerShell>; }
