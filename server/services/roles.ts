import type { VerifiedActor } from "./supabase";

/** Server-side role helpers. Call only after verifyActor() has validated the bearer token. */
export const isAdmin = (actor: VerifiedActor) => actor.profile.role === "admin";
export const isEmployer = (actor: VerifiedActor) => actor.profile.role === "employer";
export const isJobSeeker = (actor: VerifiedActor) => actor.profile.role === "job_seeker";
