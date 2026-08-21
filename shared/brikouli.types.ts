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
