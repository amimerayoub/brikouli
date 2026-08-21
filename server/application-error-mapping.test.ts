import { describe, expect, it } from "vitest";
import { applicationCreateFailure } from "./services/applications";

describe("application submission error mapping", () => {
  it("keeps duplicate and authorization failures distinct without leaking protected policy details", () => {
    expect(applicationCreateFailure("23505")).toMatchObject({ code: "APPLICATION_EXISTS" });
    expect(applicationCreateFailure("42501")).toEqual({ success: false, code: "APPLICATION_NOT_ALLOWED", message: "لا يمكنك التقدم إلى هذه الفرصة حالياً. تأكد من أنها ما زالت متاحة لحسابك." });
  });
});
