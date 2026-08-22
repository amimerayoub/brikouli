import type { ApiResult, NotificationItem } from "@shared/brikouli.types";
import { notificationListSchema, notificationReadSchema } from "../schemas/domain";
import { createSupabaseForAccessToken, verifyActor } from "./supabase";

function mapNotification(row: Record<string, unknown>): NotificationItem { return { id: String(row.id), userId: String(row.user_id), type: String(row.type) as NotificationItem["type"], title: String(row.title), message: String(row.message), href: row.href ? String(row.href) : null, metadata: typeof row.metadata === "object" && row.metadata ? row.metadata as Record<string, unknown> : {}, read: Boolean(row.read), readAt: row.read_at ? String(row.read_at) : null, createdAt: String(row.created_at) }; }

export async function listNotifications(accessToken: string, input: unknown): Promise<ApiResult<NotificationItem[]>> {
  const parsed = notificationListSchema.safeParse(input);
  if (!parsed.success) return { success: false, code: "NOTIFICATION_QUERY_INVALID", message: "معايير الإشعارات غير صالحة." };
  const actor = await verifyActor(accessToken); if (!actor.success) return actor;
  const client = createSupabaseForAccessToken(accessToken); if ("success" in client) return client;
  let query = client.from("notifications").select("*").eq("user_id", actor.data.profile.id).order("created_at", { ascending: false }).limit(parsed.data.limit);
  if (parsed.data.unreadOnly) query = query.eq("read", false);
  const { data, error } = await query;
  if (error) return { success: false, code: "NOTIFICATIONS_FAILED", message: "تعذر تحميل الإشعارات." };
  return { success: true, data: (data ?? []).map(row => mapNotification(row as Record<string, unknown>)) };
}

export async function markNotificationsRead(accessToken: string, input: unknown): Promise<ApiResult<{ updated: number }>> {
  const parsed = notificationReadSchema.safeParse(input);
  if (!parsed.success) return { success: false, code: "NOTIFICATION_READ_INVALID", message: "إشعار غير صالح." };
  const actor = await verifyActor(accessToken); if (!actor.success) return actor;
  const client = createSupabaseForAccessToken(accessToken); if ("success" in client) return client;
  let query = client.from("notifications").update({ read: true, read_at: new Date().toISOString() }).eq("user_id", actor.data.profile.id).eq("read", false).select("id");
  if (!parsed.data.all) query = query.in("id", parsed.data.notificationIds);
  const { data, error } = await query;
  if (error) return { success: false, code: "NOTIFICATIONS_READ_FAILED", message: "تعذر تحديث حالة الإشعارات." };
  return { success: true, data: { updated: data?.length ?? 0 } };
}
