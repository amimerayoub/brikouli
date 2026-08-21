/** Shared domain vocabulary for future API implementation. */
export type GigCategory = "retail" | "food" | "delivery" | "events";
export type GigSummary = { id: string; title: string; category: GigCategory; distanceLabel: string; paymentLabel: string; durationLabel: string; isUrgent: boolean };
