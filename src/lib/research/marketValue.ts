export interface OddsOutcome {
  name: string;
  price: number;
  point?: number;
}

export interface OddsMarket {
  key: string;
  outcomes: OddsOutcome[];
}

export interface OddsBookmaker {
  key: string;
  title: string;
  last_update: string;
  markets: OddsMarket[];
}

export interface OddsEvent {
  id: string;
  sport_key: string;
  sport_title: string;
  commence_time: string;
  home_team: string;
  away_team: string;
  bookmakers: OddsBookmaker[];
}

export type CandidateClass = "OFFICIAL CANDIDATE" | "WATCH" | "PASS";

export interface MarketCandidate {
  eventId: string;
  commenceTime: string;
  matchup: string;
  selection: string;
  bestBook: string;
  bestBookKey: string;
  bestPrice: number;
  fairProbability: number;
  fairOdds: number;
  expectedValue: number;
  booksUsed: number;
  score: number;
  classification: CandidateClass;
}

function normalisedProbabilities(outcomes: OddsOutcome[]): Map<string, number> {
  const raw = outcomes
    .filter((o) => Number.isFinite(o.price) && o.price > 1)
    .map((o) => [o.name, 1 / o.price] as const);
  const total = raw.reduce((sum, [, p]) => sum + p, 0);
  if (!total) return new Map();
  return new Map(raw.map(([name, p]) => [name, p / total]));
}

export function deriveH2HCandidates(event: OddsEvent): MarketCandidate[] {
  const books = event.bookmakers
    .map((book) => ({ book, market: book.markets.find((m) => m.key === "h2h") }))
    .filter((row): row is { book: OddsBookmaker; market: OddsMarket } => Boolean(row.market));

  const selectionNames = Array.from(new Set(books.flatMap(({ market }) => market.outcomes.map((o) => o.name))));

  return selectionNames.map((selection) => {
    const quotes = books
      .map(({ book, market }) => {
        const outcome = market.outcomes.find((o) => o.name === selection);
        if (!outcome || !Number.isFinite(outcome.price) || outcome.price <= 1) return null;
        const fair = normalisedProbabilities(market.outcomes).get(selection);
        return fair ? { book, price: outcome.price, fair } : null;
      })
      .filter((x): x is { book: OddsBookmaker; price: number; fair: number } => Boolean(x));

    const best = quotes.reduce((winner, q) => (!winner || q.price > winner.price ? q : winner), null as null | { book: OddsBookmaker; price: number; fair: number });
    const fairQuotes = quotes.filter((q) => q.book.key !== best?.book.key);
    const source = fairQuotes.length >= 2 ? fairQuotes : quotes;
    const fairProbability = source.length ? source.reduce((sum, q) => sum + q.fair, 0) / source.length : 0;
    const bestPrice = best?.price ?? 0;
    const expectedValue = fairProbability && bestPrice ? fairProbability * bestPrice - 1 : -1;

    // This is intentionally a MARKET-VALUE score, not a predictive win model.
    // It rewards positive EV relative to a no-vig consensus and broad bookmaker coverage.
    const coverageScore = Math.min(20, source.length * 4);
    const edgeScore = Math.max(0, Math.min(70, expectedValue * 700));
    const priceQualityScore = bestPrice >= 1.5 ? 10 : 5;
    const score = Math.round(Math.min(100, coverageScore + edgeScore + priceQualityScore));

    let classification: CandidateClass = "PASS";
    if (source.length >= 4 && expectedValue >= 0.03) classification = "OFFICIAL CANDIDATE";
    else if (source.length >= 3 && expectedValue >= 0.01) classification = "WATCH";

    return {
      eventId: event.id,
      commenceTime: event.commence_time,
      matchup: `${event.away_team} @ ${event.home_team}`,
      selection,
      bestBook: best?.book.title ?? "—",
      bestBookKey: best?.book.key ?? "",
      bestPrice,
      fairProbability,
      fairOdds: fairProbability ? 1 / fairProbability : 0,
      expectedValue,
      booksUsed: source.length,
      score,
      classification,
    };
  });
}

export function rankMarketCandidates(events: OddsEvent[]) {
  return events
    .flatMap(deriveH2HCandidates)
    .filter((c) => c.bestPrice > 1)
    .sort((a, b) => b.expectedValue - a.expectedValue || b.score - a.score);
}
