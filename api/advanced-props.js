const SPORT_MAP = {
  nrl: "rugbyleague_nrl",
  nrlw: "rugbyleague_nrlw",
  nba: "basketball_nba",
  wnba: "basketball_wnba",
};

function lower(s) {
  return String(s || "").toLowerCase();
}

function classifyMarket(key) {
  const k = lower(key);
  if (k.includes("run") && (k.includes("metre") || k.includes("meter"))) return "Run metres";
  if (k.includes("tackle_break")) return "Tackle breaks";
  if (k.includes("linebreak") || k.includes("line_break")) return "Line breaks";
  if (k.includes("tackle") && !k.includes("break")) return "Tackles";
  if (k.includes("try")) return "Tries";
  if (k.includes("points_rebounds_assists")) return "Points + Rebounds + Assists";
  if (k.includes("points")) return "Points";
  if (k.includes("rebounds")) return "Rebounds";
  if (k.includes("assists")) return "Assists";
  if (k.includes("three")) return "3PT";
  if (k.includes("blocks")) return "Blocks";
  if (k.includes("steals")) return "Steals";
  return key;
}

function teamTokens(s) {
  const stop = new Set(["the","rugby","league","football","club","fc"]);
  return lower(s)
    .replace(/[’'`.,-]/g, " ")
    .split(/\s+/)
    .filter(x => x.length >= 4 && !stop.has(x));
}

function eventMatches(text, home, away) {
  const t = lower(text);
  const homeParts = teamTokens(home);
  const awayParts = teamTokens(away);

  if (!homeParts.length || !awayParts.length) return true;

  // Require at least one meaningful token from each team.
  const hHit = homeParts.some(x => t.includes(x));
  const aHit = awayParts.some(x => t.includes(x));
  return hHit && aHit;
}


function looksLikeProp(x) {
  if (!x || typeof x !== "object") return false;
  const hasPlayer = Boolean(x.player_name || x.player || x.player_canonical || x.player_slug);
  const hasMarket = Boolean(x.market_key || x.market);
  const hasPrice = Number.isFinite(Number(x.odds ?? x.price ?? x.best_price));
  return hasPlayer && hasMarket && hasPrice;
}

function flattenPropObjects(obj, eventContext = {}, out = [], seen = new Set()) {
  if (!obj || typeof obj !== "object") return out;
  if (seen.has(obj)) return out;
  seen.add(obj);

  if (Array.isArray(obj)) {
    for (const item of obj) flattenPropObjects(item, eventContext, out, seen);
    return out;
  }

  const nextContext = {
    event:
      obj.event ||
      obj.event_name ||
      obj.matchup ||
      obj.name ||
      eventContext.event ||
      "",
    eventId:
      obj.event_id ||
      obj.id ||
      eventContext.eventId ||
      null,
    commenceTime:
      obj.commence_time ||
      obj.start_time ||
      eventContext.commenceTime ||
      null,
  };

  if (looksLikeProp(obj)) {
    out.push({
      ...obj,
      __event: nextContext.event,
      __eventId: nextContext.eventId,
      __commenceTime: nextContext.commenceTime,
    });
  }

  for (const value of Object.values(obj)) {
    if (value && typeof value === "object") {
      flattenPropObjects(value, nextContext, out, seen);
    }
  }
  return out;
}

function normalizePropRow(x, sport, sportKey) {
  return {
    id: x.id || null,
    sport: x.sport || sport.toUpperCase(),
    sportKey: x.sport_key || sportKey,
    event: x.event || x.__event || "",
    eventId: x.event_id || x.__eventId || null,
    player: x.player_name || x.player || x.player_canonical || x.player_slug || "",
    marketKey: x.market_key || x.market || "",
    market: classifyMarket(x.market_key || x.market || ""),
    line: x.line ?? x.point ?? null,
    side: x.side || x.selection || null,
    odds: Number(x.odds ?? x.price ?? x.best_price),
    bookmaker: x.bookmaker || x.book || x.best_book || null,
    evPercentage: Number(x.ev_percentage ?? x.ev ?? x.edge_percentage),
    commenceTime: x.commence_time || x.__commenceTime || null,
    historicalStats: x.historical_stats || x.stats || null,
    raw: {
      player_slug: x.player_slug || null,
    }
  };
}

async function krokFetch(path, key, params = {}) {
  const url = new URL(`https://krokodds.com.au${path}`);
  for (const [k, v] of Object.entries(params)) {
    if (v !== null && v !== undefined && v !== "") url.searchParams.set(k, String(v));
  }

  const r = await fetch(url.toString(), {
    headers: { "X-API-Key": key, accept: "application/json" },
    cache: "no-store",
  });
  const body = await r.text();
  if (!r.ok) {
    const err = new Error(`Krok Odds ${r.status}: ${body.slice(0, 400)}`);
    err.status = r.status;
    throw err;
  }
  return {
    data: JSON.parse(body),
    headers: {
      rateLimitRemaining: headers?.rateLimitRemaining || null,
      creditsRemaining: headers?.creditsRemaining || null,
      sourceMode,
    }
  };
}

module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    res.statusCode = 405;
    return res.end("Method Not Allowed");
  }

  const key = process.env.KROK_ODDS_API_KEY;
  if (!key) {
    res.statusCode = 500;
    return res.json({
      error: "KROK_ODDS_API_KEY is not configured in Vercel.",
      setup: "Create a Krok Odds API key, then add KROK_ODDS_API_KEY as a Secret Production variable."
    });
  }

  const sport = String(req.query.sport || "").toLowerCase();
  const sportKey = SPORT_MAP[sport];
  const home = String(req.query.home || "");
  const away = String(req.query.away || "");

  if (!sportKey) {
    res.statusCode = 400;
    return res.json({ error: "Phase 3C/3D advanced props supports NRL, NRLW, NBA and WNBA." });
  }

  try {
    // First ask for +EV player-prop opportunities.
    const opp = await krokFetch(
      "/api/v1/opportunities/player-props",
      key,
      {
        sport_key: sportKey,
        include_stats: "true",
        min_ev: 0,
        limit: 100,
      }
    );

    const oppRowsRaw = Array.isArray(opp.data?.data) ? opp.data.data : [];
    let rows = oppRowsRaw
      .filter(x => eventMatches(x.event, home, away))
      .map(x => normalizePropRow(x, sport, sportKey));

    let sourceMode = "positive-ev-opportunities";
    let sportRowsReturned = oppRowsRaw.length;
    let sampleEvents = [...new Set(oppRowsRaw.slice(0, 20).map(x => x.event).filter(Boolean))].slice(0, 8);
    let headers = opp.headers;

    // Important: the opportunities endpoint contains only value opportunities.
    // If this matchup has no +EV rows right now, fall back to the full gameday
    // prop snapshots rather than displaying a misleading "no props" message.
    if (!rows.length) {
      const gd = await krokFetch(
        "/api/v1/gameday/props",
        key,
        {
          sport_key: sportKey,
          limit: 200,
        }
      );

      const docs = Array.isArray(gd.data?.data) ? gd.data.data : [];
      const flat = flattenPropObjects(docs);
      const normalized = flat.map(x => normalizePropRow(x, sport, sportKey));

      rows = normalized.filter(x => eventMatches(x.event, home, away));
      sourceMode = "gameday-props-fallback";
      sportRowsReturned = normalized.length;
      sampleEvents = [...new Set(normalized.slice(0, 50).map(x => x.event).filter(Boolean))].slice(0, 8);
      headers = gd.headers;
    }

    // 3C: NRL performance markets only; keep try markets but rank them after performance markets.
    if (sport === "nrl" || sport === "nrlw") {
      const perfRank = (m) => {
        const k = lower(m);
        if (k.includes("run") && (k.includes("metre") || k.includes("meter"))) return 5;
        if (k.includes("tackle_break")) return 4;
        if (k.includes("linebreak") || k.includes("line_break")) return 3;
        if (k.includes("tackle") && !k.includes("break")) return 2;
        if (k.includes("try")) return 1;
        return 0;
      };
      rows.sort((a, b) =>
        perfRank(b.marketKey) - perfRank(a.marketKey) ||
        (b.evPercentage || 0) - (a.evPercentage || 0)
      );
    } else {
      rows.sort((a, b) => (b.evPercentage || 0) - (a.evPercentage || 0));
    }

    return res.json({
      phase: sport === "nba" || sport === "wnba" ? "3D" : "3C",
      provider: "Krok Odds",
      sport,
      home,
      away,
      generatedAt: new Date().toISOString(),
      rateLimitRemaining: headers?.rateLimitRemaining || null,
      creditsRemaining: headers?.creditsRemaining || null,
      sourceMode,
      rows,
      diagnostics: {
        sportRowsReturned,
        matchedRows: rows.length,
        sampleEvents
      },
      note:
        sourceMode === "gameday-props-fallback"
          ? "No positive-EV Krok opportunity matched this event, so the engine fell back to Krok gameday prop snapshots. These are market/research inputs and may not have EV estimates."
          : "Krok Odds provides AU bookmaker player-prop opportunities with EV estimates and optional historical statistics. These are research inputs, not guaranteed-value or Official Play decisions."
    });
  } catch (err) {
    console.error(err);
    res.statusCode = 500;
    return res.json({ error: err?.message || "Krok advanced prop error." });
  }
};
