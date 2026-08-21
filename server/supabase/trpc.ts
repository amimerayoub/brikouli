import { TRPCError, initTRPC } from "@trpc/server";
import superjson from "superjson";
import type { TrpcContext } from "../_core/context";
import { verifyActor } from "../services/supabase";

const t = initTRPC.context<TrpcContext>().create({ transformer: superjson });

export const supabaseRouter = t.router;
export const supabaseProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.supabaseAccessToken) throw new TRPCError({ code: "UNAUTHORIZED", message: "يلزم تسجيل الدخول للوصول إلى هذه الخدمة." });
  const actor = await verifyActor(ctx.supabaseAccessToken);
  if (!actor.success) throw new TRPCError({ code: actor.code === "FORBIDDEN" ? "FORBIDDEN" : "UNAUTHORIZED", message: actor.message });
  return next({ ctx: { ...ctx, supabaseActor: actor.data } });
});
