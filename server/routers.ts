import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { applicationListSchema, applicationSchema, blockedUserListSchema, chatMediaMessageSchema, chatTextMessageSchema, completionRatingListSchema, conversationCloseSchema, conversationIdSchema, conversationListSchema, conversationMemberActionSchema, conversationMessageListSchema, conversationReportSchema, employerApplicationReviewSchema, employerBusinessProfileSchema, employerGigActionSchema, employerGigCreateSchema, employerGigListSchema, employerGigUpdateSchema, gigCompletionSchema, gigModerationPreviewSchema, jobSeekerGigQuerySchema, nearbyGigQuerySchema, ratingCreateSchema, reportCreateSchema, reportListSchema, savedGigSchema, trustProfileSchema, userBlockSchema } from "./schemas/domain";
import { getCurrentProfile, updateCurrentProfile } from "./services/profiles";
import { createGig, getJobSeekerGig, getNearbyGigs, listActiveGigs, listJobSeekerGigs } from "./services/gigs";
import { applyToGig, listMyApplications } from "./services/applications";
import { listSavedGigIds, listSavedGigs, saveGig, unsaveGig } from "./services/favorites";
import { completeGigSecure, createPrivateReport, getModerationPreview, getTrustProfile, listBlockedUsers, listCompletionRatingTargets, listMyReports, setTrustedBlock, submitRating } from "./services/trustSafety";
import { searchMoroccanLocations } from "./services/locationSearch";
import { cancelEmployerGig, createEmployerGig, deleteEmployerGig, getEmployerBusinessProfile, getEmployerDashboard, listEmployerApplicants, listEmployerGigs, listEmployerNotifications, reviewEmployerApplication, setEmployerGigPause, updateEmployerBusinessProfileSecure, updateEmployerGig } from "./services/employer";
import { closeConversation, getConversation, listConversations, markConversationRead, reportConversationContent, sendMediaMessage, sendTextMessage, setUserBlock, updateConversationMember } from "./services/messaging";
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
    messaging: supabaseRouter({
      list: supabaseProcedure.input(conversationListSchema).query(({ ctx, input }) => listConversations(ctx.supabaseAccessToken!, input)),
      detail: supabaseProcedure.input(conversationMessageListSchema).query(({ ctx, input }) => getConversation(ctx.supabaseAccessToken!, input)),
      sendText: supabaseProcedure.input(chatTextMessageSchema).mutation(({ ctx, input }) => sendTextMessage(ctx.supabaseAccessToken!, input)),
      sendMedia: supabaseProcedure.input(chatMediaMessageSchema).mutation(({ ctx, input }) => sendMediaMessage(ctx.supabaseAccessToken!, input)),
      markRead: supabaseProcedure.input(conversationIdSchema).mutation(({ ctx, input }) => markConversationRead(ctx.supabaseAccessToken!, input)),
      memberState: supabaseProcedure.input(conversationMemberActionSchema).mutation(({ ctx, input }) => updateConversationMember(ctx.supabaseAccessToken!, input)),
      close: supabaseProcedure.input(conversationCloseSchema).mutation(({ ctx, input }) => closeConversation(ctx.supabaseAccessToken!, input)),
      block: supabaseProcedure.input(z.object({ userId: z.string().uuid(), blocked: z.boolean() })).mutation(({ ctx, input }) => setUserBlock(ctx.supabaseAccessToken!, input)),
      report: supabaseProcedure.input(conversationReportSchema).mutation(({ ctx, input }) => reportConversationContent(ctx.supabaseAccessToken!, input)),
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
    trust: supabaseRouter({ profile: publicProcedure.input(trustProfileSchema).query(({ input }) => getTrustProfile(input)), ratingTargets: supabaseProcedure.input(completionRatingListSchema).query(({ ctx, input }) => listCompletionRatingTargets(ctx.supabaseAccessToken!, input)), submitRating: supabaseProcedure.input(ratingCreateSchema).mutation(({ ctx, input }) => submitRating(ctx.supabaseAccessToken!, input)), completeGig: supabaseProcedure.input(gigCompletionSchema).mutation(({ ctx, input }) => completeGigSecure(ctx.supabaseAccessToken!, input)), moderateGig: supabaseProcedure.input(gigModerationPreviewSchema).query(({ ctx, input }) => getModerationPreview(ctx.supabaseAccessToken!, input)) }),
    reports: supabaseRouter({ create: supabaseProcedure.input(reportCreateSchema).mutation(({ ctx, input }) => createPrivateReport(ctx.supabaseAccessToken!, input)), mine: supabaseProcedure.input(reportListSchema).query(({ ctx, input }) => listMyReports(ctx.supabaseAccessToken!, input)) }),
    blocks: supabaseRouter({ set: supabaseProcedure.input(userBlockSchema.extend({ blocked: z.boolean() })).mutation(({ ctx, input }) => setTrustedBlock(ctx.supabaseAccessToken!, input)), list: supabaseProcedure.input(blockedUserListSchema).query(({ ctx, input }) => listBlockedUsers(ctx.supabaseAccessToken!, input)) }),
  }),
});

export type AppRouter = typeof appRouter;
