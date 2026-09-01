const SPORT_MAP = {
  afl: "aussierules_afl",
  nrl: "rugbyleague_nrl",
  nrlw: "rugbyleague_nrlw",
  nba: "basketball_nba",
  wnba: "basketball_wnba",
};

const AU_BOOKS = [
  "sportsbet",
  "ladbrokes_au",
  "neds",
  "tab",
  "betr_au",
  "pointsbetau",
  "unibet",
];

const RESEARCH_BOOKS = [
  "draftkings",
  "fanduel",
  "betmgm",
  "caesars",
  "betonlineag",
  "bovada",
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


async function oddsRequest({ key, sportKey, eventId, markets, regions, bookmakers }) {
  const url = new URL(
    `https://api.the-odds-api.com/v4/sports/${sportKey}/events/${encodeURIComponent(eventId)}/odds`
  );

  url.searchParams.set("apiKey", key);
  url.searchParams.set("regions", regions);
  url.searchParams.set("markets", markets.join(","));
  url.searchParams.set("oddsFormat", "decimal");
  url.searchParams.set("dateFormat", "iso");

  if (bookmakers?.length) {
    url.searchParams.set("bookmakers", bookmakers.join(","));
  }

  const r = await fetch(url.toString(), { cache: "no-store" });
  const text = await r.text();

  let data = null;
  let parseError = null;

  if (r.ok) {
    try {
      data = JSON.parse(text);
    } catch (e) {
      parseError = e?.message || String(e);
    }
  }

  return {
    ok: r.ok && data !== null,
    upstreamOk: r.ok,
    status: r.status,
    text,
    data,
    parseError,
    remaining: r.headers.get("x-requests-remaining"),
    used: r.headers.get("x-requests-used"),
    last: r.headers.get("x-requests-last"),
  };
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

  try {
    let response = await oddsRequest({
      key,
      sportKey,
      eventId,
      markets,
      regions: "au",
      bookmakers: AU_BOOKS,
    });

    if (!response.ok) {
      res.statusCode = response.upstreamOk ? 502 : response.status;
      return res.json({
        error: response.parseError
          ? `The Odds API returned a non-JSON response: ${response.text.slice(0, 250)}`
          : (response.text || `The Odds API returned ${response.status}`),
        hint:
          response.status === 422 || response.status === 401
            ? "Your current Odds API plan or this event/bookmaker combination may not include these player-prop markets."
            : response.parseError
              ? "The upstream provider returned a temporary server response instead of JSON. Retry shortly."
              : null,
      });
    }

    let event = response.data;
    let sourceMode = "AU_EXECUTABLE";
    const auBookmakerCount = event?.bookmakers?.length || 0;

    const auMarketCount = (event?.bookmakers || []).reduce(
      (n, b) => n + (b.markets?.length || 0),
      0
    );

    if (auMarketCount === 0 && (sport === "nba" || sport === "wnba")) {
      const researchResponse = await oddsRequest({
        key,
        sportKey,
        eventId,
        markets,
        regions: "us",
        bookmakers: RESEARCH_BOOKS,
      });

      if (researchResponse.ok && researchResponse.data) {
        event = researchResponse.data;
        response = researchResponse;
        sourceMode = "RESEARCH_ONLY_US";
      }
    }

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
            executableInAU: sourceMode === "AU_EXECUTABLE",
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
        executableInAU: sourceMode === "AU_EXECUTABLE",
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
      requestsRemaining: response.remaining,
      requestsUsed: response.used,
      requestsLast: response.last,
      rows,
      sourceMode,
      auBookmakerCount,
      diagnostics: {
        bookmakersReturned: event?.bookmakers?.map(b => b.title) || [],
        marketCount: (event?.bookmakers || []).reduce(
          (n, b) => n + (b.markets?.length || 0),
          0
        ),
      },
      note:
        sourceMode === "RESEARCH_ONLY_US"
          ? "No Australian player-prop market was returned for this event, so US books are shown for research consensus only. Do not publish these prices as an Australian executable bet."
          : "Player prop odds are a market screen only until player history, role/minutes, team news and matchup context are attached.",
    });
  } catch (err) {
    console.error(err);
    res.statusCode = 500;
    return res.json({ error: err?.message || "Player prop feed error." });
  }
};
