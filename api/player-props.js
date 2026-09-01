const SPORT_MAP = {
  afl: "aussierules_afl",
  nrl: "rugbyleague_nrl",
  nrlw: "rugbyleague_nrlw",
  nba: "basketball_nba",
  wnba: "basketball_wnba",
};

const BOOKS = [
  "sportsbet",
  "ladbrokes_au",
  "neds",
  "tab",
  "betr_au",
  "pointsbetau",
  "unibet",
];

const MARKETS = {
  afl: [
    "player_disposals",
    "player_goal_scorer_anytime",
    "player_goals_scored_over",
    "player_marks_over",
    "player_tackles_over",
  ],
  nrl: [
    "player_try_scorer_anytime",
    "player_try_scorer_over",
  ],
  nrlw: [
    "player_try_scorer_anytime",
    "player_try_scorer_over",
  ],
  nba: [
    "player_points",
    "player_rebounds",
    "player_assists",
    "player_points_rebounds_assists",
  ],
  wnba: [
    "player_points",
    "player_rebounds",
    "player_assists",
    "player_points_rebounds_assists",
  ],
};

function implied(price) {
  return price > 1 ? 1 / price : 0;
}

function noVigTwoWay(over, under) {
  const a = implied(over);
  const b = implied(under);
  const s = a + b;
  return s ? [a / s, b / s] : [0, 0];
}

function marketLabel(key) {
  const labels = {
    player_disposals: "Disposals",
    player_goal_scorer_anytime: "Anytime Goal Scorer",
    player_goals_scored_over: "Goals",
    player_marks_over: "Marks",
    player_tackles_over: "Tackles",
    player_try_scorer_anytime: "Anytime Try Scorer",
    player_try_scorer_over: "Tries",
    player_points: "Points",
    player_rebounds: "Rebounds",
    player_assists: "Assists",
    player_points_rebounds_assists: "Points + Rebounds + Assists",
  };
  return labels[key] || key;
}

function playerName(o) {
  return o.description || o.player || o.name || "Unknown";
}

module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    res.statusCode = 405;
    return res.end("Method Not Allowed");
  }

  const key = process.env.THE_ODDS_API_KEY;
  if (!key) {
    res.statusCode = 500;
    return res.json({ error: "THE_ODDS_API_KEY is not configured." });
  }

  const sport = String(req.query.sport || "").toLowerCase();
  const eventId = String(req.query.eventId || "");
  const sportKey = SPORT_MAP[sport];
  const markets = MARKETS[sport];

  if (!sportKey || !markets || !eventId) {
    res.statusCode = 400;
    return res.json({ error: "Valid sport and eventId are required." });
  }

  const url = new URL(
    `https://api.the-odds-api.com/v4/sports/${sportKey}/events/${encodeURIComponent(eventId)}/odds`
  );
  url.searchParams.set("apiKey", key);
  url.searchParams.set("regions", "au");
  url.searchParams.set("markets", markets.join(","));
  url.searchParams.set("oddsFormat", "decimal");
  url.searchParams.set("dateFormat", "iso");
  url.searchParams.set("bookmakers", BOOKS.join(","));

  try {
    const r = await fetch(url.toString(), { cache: "no-store" });
    const remaining = r.headers.get("x-requests-remaining");
    const used = r.headers.get("x-requests-used");
    const last = r.headers.get("x-requests-last");

    const text = await r.text();
    if (!r.ok) {
      res.statusCode = r.status;
      return res.json({
        error: text || `The Odds API returned ${r.status}`,
        hint:
          r.status === 422 || r.status === 401
            ? "Your current Odds API plan or this event/bookmaker combination may not include these player-prop markets."
            : null,
      });
    }

    const event = JSON.parse(text);
    const grouped = new Map();

    for (const book of event.bookmakers || []) {
      for (const market of book.markets || []) {
        for (const o of market.outcomes || []) {
          const player = playerName(o);
          const point = o.point ?? null;
          const side = String(o.name || "").toLowerCase();

          // For scorer markets, the outcome name can itself be the player.
          const inferredPlayer =
            o.description ||
            (market.key.includes("scorer") ? o.name : player);

          const id = `${market.key}|${inferredPlayer}|${point ?? "na"}`;
          if (!grouped.has(id)) {
            grouped.set(id, {
              marketKey: market.key,
              market: marketLabel(market.key),
              player: inferredPlayer,
              point,
              offers: [],
            });
          }

          grouped.get(id).offers.push({
            book: book.title,
            bookKey: book.key,
            side: market.key.includes("scorer") ? "yes" : side,
            price: o.price,
            point,
            updated: book.last_update,
          });
        }
      }
    }

    const rows = [];

    for (const g of grouped.values()) {
      const overs = g.offers.filter(x => x.side === "over");
      const unders = g.offers.filter(x => x.side === "under");
      const yes = g.offers.filter(x => x.side === "yes");

      const bestOver = overs.length ? overs.reduce((a,b) => b.price > a.price ? b : a) : null;
      const bestUnder = unders.length ? unders.reduce((a,b) => b.price > a.price ? b : a) : null;
      const bestYes = yes.length ? yes.reduce((a,b) => b.price > a.price ? b : a) : null;

      let fairOver = null;
      let priceEV = null;

      // Compute no-vig fair probability from books that quote both sides at same point.
      const paired = [];
      for (const b of new Set(g.offers.map(x => x.bookKey))) {
        const bo = overs.find(x => x.bookKey === b);
        const bu = unders.find(x => x.bookKey === b);
        if (bo && bu) {
          const [p] = noVigTwoWay(bo.price, bu.price);
          paired.push(p);
        }
      }

      if (paired.length) {
        fairOver = paired.reduce((a,b) => a+b, 0) / paired.length;
        if (bestOver) priceEV = fairOver * bestOver.price - 1;
      }

      let status = "MARKET ONLY";
      let score = 45;
      if (fairOver != null && bestOver) {
        score += Math.max(-15, Math.min(20, priceEV * 250));
        score += Math.min(10, paired.length * 2);
        score = Math.max(0, Math.min(100, Math.round(score)));

        if (priceEV >= 0.03 && paired.length >= 3) status = "PROP WATCH";
        else if (priceEV <= -0.02) status = "PASS";
        else status = "WATCH";
      }

      rows.push({
        ...g,
        bestOver,
        bestUnder,
        bestYes,
        fairOver,
        priceEV,
        books: new Set(g.offers.map(x => x.bookKey)).size,
        pairedBooks: paired.length,
        score,
        status,
      });
    }

    rows.sort((a,b) => {
      const av = a.priceEV ?? -999;
      const bv = b.priceEV ?? -999;
      return bv - av || b.books - a.books;
    });

    res.setHeader("Cache-Control", "s-maxage=20, stale-while-revalidate=40");
    return res.json({
      phase: "3A",
      sport,
      eventId,
      homeTeam: event.home_team,
      awayTeam: event.away_team,
      commenceTime: event.commence_time,
      marketsRequested: markets,
      generatedAt: new Date().toISOString(),
      requestsRemaining: remaining,
      requestsUsed: used,
      requestsLast: last,
      rows,
      note:
        "Player prop odds are a market screen only until player history, role/minutes, team news and matchup context are attached.",
    });
  } catch (err) {
    console.error(err);
    res.statusCode = 500;
    return res.json({ error: err?.message || "Player prop feed error." });
  }
};
