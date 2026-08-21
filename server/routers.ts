import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { getCurrentProfile, updateCurrentProfile } from "./services/profiles";
import { createGig, getNearbyGigs, listActiveGigs } from "./services/gigs";
import { applyToGig } from "./services/applications";
import { createRating } from "./services/ratings";
import { createReport } from "./services/reports";
import { searchMoroccanLocations } from "./services/locationSearch";
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
      nearby: publicProcedure.input(z.unknown()).query(({ input }) => getNearbyGigs(input)),
      create: supabaseProcedure.input(z.unknown()).mutation(({ ctx, input }) => createGig(ctx.supabaseAccessToken!, input)),
    }),
    locations: supabaseRouter({
      search: publicProcedure.input(z.unknown()).mutation(({ input }) => searchMoroccanLocations(input)),
    }),
    applications: supabaseRouter({
      create: supabaseProcedure.input(z.unknown()).mutation(({ ctx, input }) => applyToGig(ctx.supabaseAccessToken!, input)),
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
