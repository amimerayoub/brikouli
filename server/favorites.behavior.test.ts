import { describe, expect, it } from "vitest";
import { addFavoriteId, removeFavoriteId, removeFavoriteItem } from "../client/src/lib/favorites";

describe("Optimistic favorite state", () => {
  it("adds and removes IDs immediately without duplicate entries", () => {
    expect(addFavoriteId(["a"], "b")).toEqual(["a", "b"]);
    expect(addFavoriteId(["a"], "a")).toEqual(["a"]);
    expect(removeFavoriteId(["a", "b"], "a")).toEqual(["b"]);
  });

  it("removes a saved-card item immediately while preserving unrelated cards for rollback snapshots", () => {
    const previous = [{ id: "a", title: "أ" }, { id: "b", title: "ب" }];
    expect(removeFavoriteItem(previous, "a")).toEqual([{ id: "b", title: "ب" }]);
    expect(previous).toEqual([{ id: "a", title: "أ" }, { id: "b", title: "ب" }]);
  });
});
