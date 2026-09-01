const SPORT_MAP = {
  afl: "aussierules_afl",
  nrl: "rugbyleague_nrl",
  nrlw: "rugbyleague_nrlw",
  nba: "basketball_nba",
  wnba: "basketball_wnba",
};

// AU bookmaker keys documented by The Odds API.
const BOOKS = [
  "sportsbet",
  "ladbrokes_au",
  "neds",
  "tab",
  "betfair_ex_au",
  "bet365_au",
  "unibet",
  "betr_au",
];

function implied(decimal) {
  return decimal > 1 ? 1 / decimal : 0;
}

function noVigTwoWay(a, b) {
  const ia = implied(a);
  const ib = implied(b);
  const sum = ia + ib;
  if (!sum) return [0, 0];
  return [ia / sum, ib / sum];
}

function median(values) {
  if (!values.length) return 0;
  const s = [...values].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

function trimmedMean(values) {
  if (!values.length) return 0;
  const s = [...values].sort((a, b) => a - b);
  // With 5+ books, remove one extreme at each end.
  const t = s.length >= 5 ? s.slice(1, -1) : s;
  return t.reduce((a, b) => a + b, 0) / t.length;
}

function round(n, dp = 4) {
  const m = 10 ** dp;
  return Math.round(n * m) / m;
}

module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    res.statusCode = 405;
    return res.end("Method Not Allowed");
  }

  const key = process.env.THE_ODDS_API_KEY;
  if (!key) {
    res.statusCode = 500;
    return res.json({ error: "THE_ODDS_API_KEY is not configured in Vercel." });
  }

  const requestedSport = String(req.query.sport || "nrl").toLowerCase();
  const sportKey = SPORT_MAP[requestedSport] || SPORT_MAP.nrl;

  // Phase 2A intentionally requests only H2H to conserve API credits.
  const url = new URL(`https://api.the-odds-api.com/v4/sports/${sportKey}/odds`);
  url.searchParams.set("apiKey", key);
  url.searchParams.set("regions", "au");
  url.searchParams.set("markets", "h2h");
  url.searchParams.set("oddsFormat", "decimal");
  url.searchParams.set("dateFormat", "iso");
  url.searchParams.set("bookmakers", BOOKS.join(","));

  try {
    const r = await fetch(url.toString(), { cache: "no-store" });
    const remaining = r.headers.get("x-requests-remaining");
    const used = r.headers.get("x-requests-used");

    if (!r.ok) {
      const body = await r.text();
      res.statusCode = r.status;
      return res.json({ error: body || `Odds API error ${r.status}` });
    }

    const events = await r.json();
    const rows = [];

    for (const event of events) {
      const bookMarkets = [];

      for (const book of event.bookmakers || []) {
        const market = (book.markets || []).find((m) => m.key === "h2h");
        if (!market || market.outcomes.length !== 2) continue;

        const [p1, p2] = noVigTwoWay(
          market.outcomes[0].price,
          market.outcomes[1].price
        );

        bookMarkets.push({
          key: book.key,
          book: book.title,
          updated: book.last_update,
          outcomes: [
            {
              name: market.outcomes[0].name,
              price: market.outcomes[0].price,
              fairProb: p1,
            },
            {
              name: market.outcomes[1].name,
              price: market.outcomes[1].price,
              fairProb: p2,
            },
          ],
        });
      }

      if (!bookMarkets.length) continue;

      const names = [
        ...new Set(bookMarkets.flatMap((b) => b.outcomes.map((o) => o.name))),
      ];

      for (const name of names) {
        const offers = [];
        const fairProbs = [];

        for (const b of bookMarkets) {
          const o = b.outcomes.find((x) => x.name === name);
          if (!o) continue;
          offers.push({
            book: b.book,
            bookKey: b.key,
            price: o.price,
            updated: b.updated,
          });
          fairProbs.push(o.fairProb);
        }

        if (offers.length < 2) continue;

        offers.sort((a, b) => b.price - a.price);

        const consensusFairProb = trimmedMean(fairProbs);
        const rawBest = offers[0];
        const secondBest = offers[1] || offers[0];
        const medPrice = median(offers.map((o) => o.price));

        // A single bookmaker price materially above the rest is treated as an
        // outlier rather than an automatic "edge".
        const bestPriceOutlier =
          offers.length >= 3 &&
          rawBest.price > secondBest.price * 1.08 &&
          rawBest.price > medPrice * 1.10;

        const verifiedBest = bestPriceOutlier ? secondBest : rawBest;

        const marketEV = consensusFairProb * verifiedBest.price - 1;
        const rawBestEV = consensusFairProb * rawBest.price - 1;

        // Probability dispersion = disagreement across bookmakers after vig removal.
        const maxP = Math.max(...fairProbs);
        const minP = Math.min(...fairProbs);
        const probDispersion = maxP - minP;

        const longshot = consensusFairProb < 0.20;
        const veryLongshot = consensusFairProb < 0.12;

        // Price-only research quality score. This is deliberately conservative.
        let score = 45;

        // Value contribution, capped so price discrepancies cannot dominate.
        score += Math.max(-15, Math.min(20, marketEV * 250));

        // Market depth.
        score += Math.min(10, offers.length * 2);

        // Consensus stability.
        if (probDispersion <= 0.02) score += 10;
        else if (probDispersion <= 0.04) score += 6;
        else if (probDispersion <= 0.07) score += 2;
        else score -= 8;

        // Penalise suspicious outliers and longshots until Phase 2B context exists.
        if (bestPriceOutlier) score -= 18;
        if (longshot) score -= 8;
        if (veryLongshot) score -= 8;

        score = Math.max(0, Math.min(100, Math.round(score)));

        let status = "PASS";
        const qualityGate =
          offers.length >= 4 &&
          !bestPriceOutlier &&
          probDispersion <= 0.06;

        if (
          qualityGate &&
          !longshot &&
          marketEV >= 0.025 &&
          score >= 70
        ) {
          status = "VALUE CANDIDATE";
        } else if (
          marketEV > 0 &&
          score >= 55
        ) {
          status = "WATCH";
        }

        const flags = [];
        if (bestPriceOutlier) flags.push("BEST_PRICE_OUTLIER");
        if (longshot) flags.push("LONGSHOT");
        if (offers.length < 4) flags.push("LOW_BOOK_DEPTH");
        if (probDispersion > 0.06) flags.push("BOOK_DISAGREEMENT");

        rows.push({
          sport: requestedSport,
          sportKey,
          eventId: event.id,
          commenceTime: event.commence_time,
          homeTeam: event.home_team,
          awayTeam: event.away_team,
          selection: name,
          status,
          score,
          consensusFairProb: round(consensusFairProb),
          probabilityDispersion: round(probDispersion),
          marketEV: round(marketEV),
          rawBestEV: round(rawBestEV),
          medianPrice: round(medPrice, 2),
          bestPrice: verifiedBest.price,
          bestBook: verifiedBest.book,
          rawBestPrice: rawBest.price,
          rawBestBook: rawBest.book,
          bestPriceOutlier,
          books: offers.length,
          flags,
          offers,
          researchGate: {
            priceQuality: qualityGate ? "PASS" : "FAIL",
            form: "PENDING",
            roleMinutes: "PENDING",
            injuriesTeamNews: "PENDING",
            matchup: "PENDING",
            projection: "PENDING",
            lineMovement: "PENDING",
          },
        });
      }
    }

    // Highest score first, but VALUE CANDIDATE outranks WATCH/PASS.
    const rank = { "VALUE CANDIDATE": 3, WATCH: 2, PASS: 1 };
    rows.sort((a, b) => {
      if (rank[b.status] !== rank[a.status]) return rank[b.status] - rank[a.status];
      return b.score - a.score;
    });

    res.setHeader("Cache-Control", "s-maxage=30, stale-while-revalidate=60");
    return res.json({
      phase: "2A",
      sport: requestedSport,
      sportKey,
      generatedAt: new Date().toISOString(),
      requestsRemaining: remaining,
      requestsUsed: used,
      rows,
      methodology: {
        note:
          "Phase 2A is price-quality screening only. It cannot approve an Official Play.",
        gatesRequiredForOfficial:
          "form, role/minutes, injuries/team news, matchup, projection, line movement",
      },
    });
  } catch (err) {
    console.error(err);
    res.statusCode = 500;
    return res.json({ error: err?.message || "Unknown server error" });
  }
};
