const SPORT_MAP = {
  afl: "aussierules_afl",
  nrl: "rugbyleague_nrl",
  nrlw: "rugbyleague_nrlw",
  nba: "basketball_nba",
  wnba: "basketball_wnba",
};

const BOOKS = [
  "sportsbet",
  "ladbrokes",
  "neds",
  "tab",
  "betfair_ex_au",
  "bet365_au",
  "unibet",
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

  const sportKey = SPORT_MAP[String(req.query.sport || "nrl").toLowerCase()] || SPORT_MAP.nrl;
  const regions = "au";
  const markets = "h2h,spreads,totals";
  const bookmakers = BOOKS.join(",");

  const url = new URL(`https://api.the-odds-api.com/v4/sports/${sportKey}/odds`);
  url.searchParams.set("apiKey", key);
  url.searchParams.set("regions", regions);
  url.searchParams.set("markets", markets);
  url.searchParams.set("oddsFormat", "decimal");
  url.searchParams.set("dateFormat", "iso");
  url.searchParams.set("bookmakers", bookmakers);

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
      const h2hBooks = [];

      for (const book of event.bookmakers || []) {
        const market = (book.markets || []).find(m => m.key === "h2h");
        if (!market || market.outcomes.length < 2) continue;

        const out = market.outcomes;
        // Head-to-head can occasionally include draw. For v1, only calculate
        // consensus EV when it is a standard two-way market.
        if (out.length !== 2) continue;

        const [p1, p2] = noVigTwoWay(out[0].price, out[1].price);
        h2hBooks.push({
          book: book.title,
          key: book.key,
          updated: book.last_update,
          outcomes: [
            { name: out[0].name, price: out[0].price, fairProb: p1 },
            { name: out[1].name, price: out[1].price, fairProb: p2 },
          ],
        });
      }

      if (!h2hBooks.length) continue;

      const names = [...new Set(h2hBooks.flatMap(b => b.outcomes.map(o => o.name)))];
      for (const name of names) {
        const offers = [];
        const fairProbs = [];

        for (const b of h2hBooks) {
          const o = b.outcomes.find(x => x.name === name);
          if (!o) continue;
          offers.push({ book: b.book, bookKey: b.key, price: o.price, updated: b.updated });
          fairProbs.push(o.fairProb);
        }

        if (!offers.length || !fairProbs.length) continue;

        const consensusFairProb = fairProbs.reduce((a, b) => a + b, 0) / fairProbs.length;
        const best = offers.reduce((a, b) => (b.price > a.price ? b : a));
        const marketEV = consensusFairProb * best.price - 1;

        let score = 50 + marketEV * 300;
        score += Math.min(10, offers.length);
        score = Math.max(0, Math.min(100, Math.round(score)));

        let status = "PASS";
        if (score >= 75 && marketEV > 0.025 && offers.length >= 3) status = "OFFICIAL CANDIDATE";
        else if (score >= 60 && marketEV > 0) status = "WATCH";

        rows.push({
          sport: sportKey,
          eventId: event.id,
          commenceTime: event.commence_time,
          homeTeam: event.home_team,
          awayTeam: event.away_team,
          selection: name,
          bestPrice: best.price,
          bestBook: best.book,
          fairProbability: consensusFairProb,
          marketEV,
          books: offers.length,
          score,
          status,
          offers: offers.sort((a,b) => b.price - a.price),
        });
      }
    }

    rows.sort((a, b) => b.score - a.score);

    res.setHeader("Cache-Control", "s-maxage=30, stale-while-revalidate=60");
    return res.json({
      sport: sportKey,
      generatedAt: new Date().toISOString(),
      requestsRemaining: remaining,
      requestsUsed: used,
      rows,
    });
  } catch (err) {
    console.error(err);
    res.statusCode = 500;
    return res.json({ error: err?.message || "Unknown server error" });
  }
};
