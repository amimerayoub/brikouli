import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { applicationListSchema, applicationSchema, employerApplicationReviewSchema, employerBusinessProfileSchema, employerGigActionSchema, employerGigCreateSchema, employerGigListSchema, employerGigUpdateSchema, jobSeekerGigQuerySchema, nearbyGigQuerySchema, savedGigSchema } from "./schemas/domain";
import { getCurrentProfile, updateCurrentProfile } from "./services/profiles";
import { createGig, getJobSeekerGig, getNearbyGigs, listActiveGigs, listJobSeekerGigs } from "./services/gigs";
import { applyToGig, listMyApplications } from "./services/applications";
import { listSavedGigIds, listSavedGigs, saveGig, unsaveGig } from "./services/favorites";
import { createRating } from "./services/ratings";
import { createReport } from "./services/reports";
import { searchMoroccanLocations } from "./services/locationSearch";
import { cancelEmployerGig, createEmployerGig, deleteEmployerGig, getEmployerBusinessProfile, getEmployerDashboard, listEmployerApplicants, listEmployerGigs, listEmployerNotifications, reviewEmployerApplication, setEmployerGigPause, updateEmployerBusinessProfileSecure, updateEmployerGig } from "./services/employer";
import { supabaseProcedure, supabaseRouter } from "./supabase/trpc";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),
  brikouli: supabaseRouter({
    profile: supabaseRouter({
      me: supabaseProcedure.query(({ ctx }) => getCurrentProfile(ctx.supabaseAccessToken!)),
      update: supabaseProcedure.input(z.unknown()).mutation(({ ctx, input }) => updateCurrentProfile(ctx.supabaseAccessToken!, input)),
    }),
    gigs: supabaseRouter({
      listActive: publicProcedure.query(() => listActiveGigs()),
      nearby: publicProcedure.input(nearbyGigQuerySchema).query(({ input }) => getNearbyGigs(input)),
      listForJobSeeker: publicProcedure.input(jobSeekerGigQuerySchema).query(({ input }) => listJobSeekerGigs(input)),
      detail: publicProcedure.input(savedGigSchema).query(({ input }) => getJobSeekerGig(input)),
      create: supabaseProcedure.input(z.unknown()).mutation(({ ctx, input }) => createGig(ctx.supabaseAccessToken!, input)),
    }),
    favorites: supabaseRouter({
      list: supabaseProcedure.query(({ ctx }) => listSavedGigs(ctx.supabaseAccessToken!)),
      ids: supabaseProcedure.query(({ ctx }) => listSavedGigIds(ctx.supabaseAccessToken!)),
      save: supabaseProcedure.input(savedGigSchema).mutation(({ ctx, input }) => saveGig(ctx.supabaseAccessToken!, input)),
      remove: supabaseProcedure.input(savedGigSchema).mutation(({ ctx, input }) => unsaveGig(ctx.supabaseAccessToken!, input)),
    }),
    locations: supabaseRouter({
      search: publicProcedure.input(z.unknown()).mutation(({ input }) => searchMoroccanLocations(input)),
    }),
    applications: supabaseRouter({
      create: supabaseProcedure.input(applicationSchema).mutation(({ ctx, input }) => applyToGig(ctx.supabaseAccessToken!, input)),
      mine: supabaseProcedure.input(applicationListSchema).query(({ ctx, input }) => listMyApplications(ctx.supabaseAccessToken!, input)),
    }),
    employer: supabaseRouter({
      dashboard: supabaseProcedure.query(({ ctx }) => getEmployerDashboard(ctx.supabaseAccessToken!)),
      gigs: supabaseRouter({
        list: supabaseProcedure.input(employerGigListSchema).query(({ ctx, input }) => listEmployerGigs(ctx.supabaseAccessToken!, input)),
        create: supabaseProcedure.input(employerGigCreateSchema).mutation(({ ctx, input }) => createEmployerGig(ctx.supabaseAccessToken!, input)),
        update: supabaseProcedure.input(employerGigUpdateSchema).mutation(({ ctx, input }) => updateEmployerGig(ctx.supabaseAccessToken!, input)),
        pause: supabaseProcedure.input(employerGigActionSchema).mutation(({ ctx, input }) => setEmployerGigPause(ctx.supabaseAccessToken!, input, true)),
        resume: supabaseProcedure.input(employerGigActionSchema).mutation(({ ctx, input }) => setEmployerGigPause(ctx.supabaseAccessToken!, input, false)),
        cancel: supabaseProcedure.input(employerGigActionSchema).mutation(({ ctx, input }) => cancelEmployerGig(ctx.supabaseAccessToken!, input)),
        delete: supabaseProcedure.input(employerGigActionSchema).mutation(({ ctx, input }) => deleteEmployerGig(ctx.supabaseAccessToken!, input)),
      }),
      applicants: supabaseRouter({
        list: supabaseProcedure.input(employerGigActionSchema).query(({ ctx, input }) => listEmployerApplicants(ctx.supabaseAccessToken!, input)),
        review: supabaseProcedure.input(employerApplicationReviewSchema).mutation(({ ctx, input }) => reviewEmployerApplication(ctx.supabaseAccessToken!, input)),
      }),
      profile: supabaseRouter({
        me: supabaseProcedure.query(({ ctx }) => getEmployerBusinessProfile(ctx.supabaseAccessToken!)),
        update: supabaseProcedure.input(employerBusinessProfileSchema).mutation(({ ctx, input }) => updateEmployerBusinessProfileSecure(ctx.supabaseAccessToken!, input)),
      }),
      notifications: supabaseProcedure.query(({ ctx }) => listEmployerNotifications(ctx.supabaseAccessToken!)),
    }),
    ratings: supabaseRouter({
      create: supabaseProcedure.input(z.unknown()).mutation(({ ctx, input }) => createRating(ctx.supabaseAccessToken!, input)),
    }),
    reports: supabaseRouter({
      create: supabaseProcedure.input(z.unknown()).mutation(({ ctx, input }) => createReport(ctx.supabaseAccessToken!, input)),
    }),
  }),
});

export type AppRouter = typeof appRouter;
