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

function eventMatches(text, home, away) {
  const t = lower(text);
  const h = lower(home);
  const a = lower(away);
  if (!h || !a) return true;

  const homeParts = h.split(/\s+/).filter(x => x.length > 3);
  const awayParts = a.split(/\s+/).filter(x => x.length > 3);
  const hHit = homeParts.some(x => t.includes(x));
  const aHit = awayParts.some(x => t.includes(x));
  return hHit && aHit;
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

  const url = new URL("https://krokodds.com.au/api/v1/opportunities/player-props");
  url.searchParams.set("sport", sportKey);
  url.searchParams.set("include_stats", "true");
  url.searchParams.set("min_ev", "0");
  url.searchParams.set("limit", "100");

  try {
    const r = await fetch(url.toString(), {
      headers: { "X-API-Key": key, accept: "application/json" },
      cache: "no-store",
    });

    const body = await r.text();
    if (!r.ok) {
      res.statusCode = r.status;
      return res.json({ error: `Krok Odds ${r.status}: ${body.slice(0, 400)}` });
    }

    const parsed = JSON.parse(body);
    const data = Array.isArray(parsed?.data) ? parsed.data : [];

    const filtered = data.filter(x => eventMatches(x.event, home, away));

    const rows = filtered.map(x => ({
      id: x.id || null,
      sport: x.sport || sport.toUpperCase(),
      sportKey: x.sport_key || sportKey,
      event: x.event || "",
      player: x.player_name || x.player || "",
      marketKey: x.market_key || x.market || "",
      market: classifyMarket(x.market_key || x.market || ""),
      line: x.line ?? null,
      side: x.side || null,
      odds: Number(x.odds),
      bookmaker: x.bookmaker || null,
      evPercentage: Number(x.ev_percentage),
      commenceTime: x.commence_time || null,
      historicalStats: x.historical_stats || null,
      raw: {
        player_slug: x.player_slug || null,
      }
    }));

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
      rateLimitRemaining: r.headers.get("x-ratelimit-remaining"),
      creditsRemaining: r.headers.get("x-credits-remaining"),
      rows,
      note:
        "Krok Odds provides AU bookmaker player-prop opportunities with EV estimates and optional historical statistics. These are research inputs, not guaranteed-value or Official Play decisions."
    });
  } catch (err) {
    console.error(err);
    res.statusCode = 500;
    return res.json({ error: err?.message || "Krok advanced prop error." });
  }
};
