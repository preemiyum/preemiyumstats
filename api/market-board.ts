const SPORTS: Record<string, string> = {
  AFL: "aussierules_afl",
  NRL: "rugbyleague_nrl",
  NRLW: "rugbyleague_nrlw",
  NBA: "basketball_nba",
  WNBA: "basketball_wnba",
};

const BOOKMAKERS = [
  "sportsbet",
  "ladbrokes_au",
  "neds",
  "tab",
  "betfair_ex_au",
  "bet365_au",
  "unibet",
].join(",");

function safeSport(value: unknown) {
  const sport = String(value ?? "AFL").toUpperCase();
  return SPORTS[sport] ? sport : "AFL";
}

export default async function handler(req: any, res: any) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.THE_ODDS_API_KEY;
  if (!apiKey) {
    return res.status(503).json({
      error: "Live odds feed not configured",
      code: "ODDS_NOT_CONFIGURED",
    });
  }

  const sport = safeSport(req.query.sport);
  const sportKey = SPORTS[sport];
  const markets = "h2h,spreads,totals";
  const url = new URL(`https://api.the-odds-api.com/v4/sports/${sportKey}/odds`);
  url.searchParams.set("apiKey", apiKey);
  url.searchParams.set("regions", "au");
  url.searchParams.set("markets", markets);
  url.searchParams.set("bookmakers", BOOKMAKERS);
  url.searchParams.set("oddsFormat", "decimal");
  url.searchParams.set("dateFormat", "iso");

  try {
    const upstream = await fetch(url.toString(), {
      headers: { Accept: "application/json" },
    });

    const text = await upstream.text();
    let body: unknown;
    try {
      body = JSON.parse(text);
    } catch {
      body = { error: text || "Invalid upstream response" };
    }

    if (!upstream.ok) {
      return res.status(upstream.status).json({
        error: "Odds provider request failed",
        providerStatus: upstream.status,
        detail: body,
      });
    }

    res.setHeader("Cache-Control", "s-maxage=20, stale-while-revalidate=40");
    return res.status(200).json({
      sport,
      sportKey,
      fetchedAt: new Date().toISOString(),
      quota: {
        remaining: upstream.headers.get("x-requests-remaining"),
        used: upstream.headers.get("x-requests-used"),
        last: upstream.headers.get("x-requests-last"),
      },
      events: body,
    });
  } catch (error) {
    return res.status(502).json({
      error: "Unable to reach odds provider",
      detail: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
