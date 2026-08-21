import { describe, expect, it } from "vitest";
import { applicationListSchema, jobSeekerGigQuerySchema, savedGigSchema } from "./domain";

describe("Job Seeker contracts", () => {
  it("defaults a safe discovery query while accepting Arabic search and filters", () => {
    expect(jobSeekerGigQuerySchema.parse({ query: "مقهى", category: "مطاعم", urgentOnly: true, sort: "highest_pay" })).toEqual({
      query: "مقهى",
      category: "مطاعم",
      urgentOnly: true,
      sort: "highest_pay",
      limit: 40,
    });
  });

  it("requires UUID gig identifiers for saved-gig writes", () => {
    expect(savedGigSchema.safeParse({ gigId: "not-a-uuid" }).success).toBe(false);
    expect(savedGigSchema.safeParse({ gigId: "9e1b6a8d-e7cd-4199-858d-1e1d1e76b5a1" }).success).toBe(true);
  });

  it("allows only visible Job Seeker application status tabs", () => {
    expect(applicationListSchema.parse({ status: "accepted" })).toEqual({ status: "accepted" });
    expect(applicationListSchema.safeParse({ status: "withdrawn" }).success).toBe(false);
  });
});
