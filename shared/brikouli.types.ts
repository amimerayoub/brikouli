export type UserRole = "job_seeker" | "employer" | "admin";
export type GigStatus = "draft" | "active" | "assigned" | "completed" | "cancelled";
export type ApplicationStatus = "pending" | "accepted" | "rejected";
export type PaymentType = "fixed" | "hourly";
export type ReportStatus = "open" | "reviewing" | "resolved" | "dismissed";

export type ApiSuccess<T> = { success: true; data: T };
export type ApiFailure = { success: false; message: string; code: string };
export type ApiResult<T> = ApiSuccess<T> | ApiFailure;

export type BrikouliProfile = { id: string; fullName: string; phone: string | null; role: UserRole; city: string | null; neighborhood: string | null; avatarUrl: string | null; rating: number; completedJobs: number; acceptedTerms: boolean; createdAt: string; updatedAt: string };
export type Gig = { id: string; employerId: string; title: string; description: string; category: string; city: string; neighborhood: string | null; latitude: number | null; longitude: number | null; payment: number; paymentType: PaymentType; duration: string; urgent: boolean; status: GigStatus; createdAt: string };
export type NearbyGig = Gig & { employerName: string; distanceMeters: number };
export type JobSeekerGig = Gig & { employerName: string; employerAvatarUrl: string | null };
export type SavedGig = JobSeekerGig & { savedAt: string };
export type JobSeekerApplication = { id: string; gigId: string; status: ApplicationStatus; createdAt: string; gig: JobSeekerGig | null };
export type EmployerBusinessProfile = BrikouliProfile & { businessName: string | null; businessCategory: string | null; businessDescription: string | null };
export type EmployerGig = Gig & { acceptanceLimit: number; isPaused: boolean; workDate: string | null; publishedAt: string | null; applicantCount: number };
export type EmployerApplicant = { id: string; gigId: string; status: ApplicationStatus; createdAt: string; reviewedAt: string | null; applicant: Pick<BrikouliProfile, "id" | "fullName" | "avatarUrl" | "rating" | "completedJobs" | "city"> };
export type EmployerDashboard = { stats: { totalGigs: number; activeGigs: number; completedGigs: number; pendingApplications: number; totalHires: number; acceptanceRate: number }; weeklyActivity: Array<{ label: string; gigs: number; applications: number }>; monthlyHires: Array<{ label: string; hires: number }> };
export type EmployerNotification = { id: string; type: "new_applicant" | "gig_date_soon" | "accepted_application" | "rejected_application"; title: string; description: string; createdAt: string; href: string };
