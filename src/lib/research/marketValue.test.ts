import { describe, expect, it } from "vitest";
import { deriveH2HCandidates, type OddsEvent } from "./marketValue";

describe("deriveH2HCandidates", () => {
  it("finds the best price and compares it to no-vig consensus", () => {
    const event: OddsEvent = {
      id: "g1",
      sport_key: "basketball_wnba",
      sport_title: "WNBA",
      commence_time: "2026-09-02T10:00:00Z",
      home_team: "Home",
      away_team: "Away",
      bookmakers: [
        { key: "a", title: "A", last_update: "", markets: [{ key: "h2h", outcomes: [{ name: "Home", price: 1.8 }, { name: "Away", price: 2.1 }] }] },
        { key: "b", title: "B", last_update: "", markets: [{ key: "h2h", outcomes: [{ name: "Home", price: 1.85 }, { name: "Away", price: 2.0 }] }] },
        { key: "c", title: "C", last_update: "", markets: [{ key: "h2h", outcomes: [{ name: "Home", price: 1.9 }, { name: "Away", price: 1.95 }] }] },
        { key: "d", title: "D", last_update: "", markets: [{ key: "h2h", outcomes: [{ name: "Home", price: 2.0 }, { name: "Away", price: 1.85 }] }] },
      ],
    };
    const home = deriveH2HCandidates(event).find((x) => x.selection === "Home");
    expect(home?.bestPrice).toBe(2.0);
    expect(home?.bestBook).toBe("D");
    expect(home?.booksUsed).toBe(3);
    expect(home?.fairProbability).toBeGreaterThan(0);
  });
});
