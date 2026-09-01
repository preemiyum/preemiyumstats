function norm(s) {
  return String(s || "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/\b(the|rugby|league|football|club|fc)\b/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function sameTeam(a, b) {
  const na = norm(a);
  const nb = norm(b);
  if (!na || !nb) return false;
  return na === nb || na.includes(nb) || nb.includes(na);
}

let lastSrRequestAt = 0;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function srFetch(url, key) {
  // Sportradar trial keys default to 1 query per second.
  // Keep a safety buffer so sequential requests do not trip the 429 limit.
  const minGapMs = 1150;
  const elapsed = Date.now() - lastSrRequestAt;
  if (elapsed < minGapMs) {
    await sleep(minGapMs - elapsed);
  }

  for (let attempt = 0; attempt < 4; attempt++) {
    lastSrRequestAt = Date.now();

    const r = await fetch(url, {
      headers: { "x-api-key": key, accept: "application/json" },
      cache: "no-store",
    });

    const text = await r.text();

    if (r.status === 429) {
      const retryAfterHeader = Number(r.headers.get("retry-after"));
      const waitMs = Number.isFinite(retryAfterHeader) && retryAfterHeader > 0
        ? retryAfterHeader * 1000
        : 1200 * (attempt + 1);

      if (attempt < 3) {
        await sleep(waitMs);
        continue;
      }
    }

    if (!r.ok) {
      throw new Error(`Sportradar ${r.status}: ${text.slice(0, 300)}`);
    }

    try {
      return JSON.parse(text);
    } catch {
      throw new Error("Sportradar returned non-JSON data.");
    }
  }

  throw new Error("Sportradar rate limit persisted after retries.");
}

function getSummaries(data) {
  if (Array.isArray(data?.summaries)) return data.summaries;
  if (Array.isArray(data?.sport_event_summaries)) return data.sport_event_summaries;
  if (Array.isArray(data)) return data;
  return [];
}

function competitorsOf(summary) {
  return summary?.sport_event?.competitors || summary?.competitors || [];
}

function eventStatus(summary) {
  return summary?.sport_event_status || summary?.status || {};
}

function completed(summary) {
  const s = eventStatus(summary);
  const status = String(s.status || s.match_status || "").toLowerCase();
  return ["closed", "ended", "complete", "completed"].some(x => status.includes(x)) ||
    Boolean(s.winner_id);
}

function resultFor(summary, competitorId) {
  const status = eventStatus(summary);
  if (!completed(summary)) return null;
  if (status.winner_id) return status.winner_id === competitorId ? "W" : "L";
  const competitors = competitorsOf(summary);
  const me = competitors.find(c => c.id === competitorId);
  if (!me) return null;
  const qual = me.qualifier;
  const hs = Number(status.home_score);
  const as = Number(status.away_score);
  if (!Number.isFinite(hs) || !Number.isFinite(as)) return null;
  const my = qual === "home" ? hs : as;
  const opp = qual === "home" ? as : hs;
  if (my > opp) return "W";
  if (my < opp) return "L";
  return "D";
}

function recentRecord(summaries, competitorId, max = 5) {
  const out = [];
  for (const s of summaries) {
    const r = resultFor(s, competitorId);
    if (!r) continue;
    const ev = s.sport_event || {};
    const comps = competitorsOf(s);
    const opponent = comps.find(c => c.id !== competitorId);
    const status = eventStatus(s);
    out.push({
      result: r,
      opponent: opponent?.name || "Unknown",
      startTime: ev.start_time || null,
      homeScore: status.home_score ?? null,
      awayScore: status.away_score ?? null,
    });
    if (out.length >= max) break;
  }
  return out;
}

function clamp(n, min, max) { return Math.max(min, Math.min(max, n)); }

function recordSummary(games) {
  const wins = games.filter(g => g.result === "W").length;
  const losses = games.filter(g => g.result === "L").length;
  const draws = games.filter(g => g.result === "D").length;
  const denom = wins + losses + draws;
  return {
    wins, losses, draws,
    winRate: denom ? wins / denom : 0,
    label: `${wins}-${losses}${draws ? `-${draws}` : ""}`,
  };
}


function lineupCompetitors(data) {
  if (Array.isArray(data?.competitors)) return data.competitors;
  if (Array.isArray(data?.lineups)) return data.lineups;
  if (Array.isArray(data?.sport_event?.competitors)) return data.sport_event.competitors;
  return [];
}

function playersOfLineup(comp) {
  if (Array.isArray(comp?.players)) return comp.players;
  if (Array.isArray(comp?.player)) return comp.player;
  if (Array.isArray(comp?.lineup?.players)) return comp.lineup.players;
  return [];
}

function lineupSummary(data, competitorId, fallbackName) {
  const comps = lineupCompetitors(data);
  const comp =
    comps.find(c => c.id === competitorId) ||
    comps.find(c => sameTeam(c.name, fallbackName)) ||
    null;

  const players = playersOfLineup(comp).map(p => ({
    id: p.id || null,
    name: p.name || `${p.first_name || ""} ${p.last_name || ""}`.trim() || "Unknown",
    jerseyNumber: p.jersey_number ?? null,
    position: p.type || p.position || null,
    starter: p.starter === true,
    played: p.played === true,
  }));

  return {
    team: comp?.name || fallbackName,
    totalNamed: players.length,
    startersNamed: players.filter(p => p.starter).length,
    positionsNamed: players.filter(p => p.position).length,
    players,
  };
}

function hasLineupCoverage(match) {
  const props =
    match?.sport_event?.coverage?.sport_event_properties ||
    match?.sport_event?.coverage?.properties ||
    [];
  if (Array.isArray(props)) {
    const p = props.find(x => x.type === "lineups");
    if (p) return p.value === true || String(p.value).toLowerCase() === "true";
  }
  if (props && typeof props === "object") {
    if ("lineups" in props) return Boolean(props.lineups);
  }
  return null;
}

module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    res.statusCode = 405;
    return res.end("Method Not Allowed");
  }

  const key = process.env.SPORTRADAR_API_KEY;
  const access = process.env.SPORTRADAR_ACCESS_LEVEL || "trial";

  if (!key) {
    res.statusCode = 500;

    // Research Projection V0.1
    // This is deliberately conservative and untrained. It starts with the
    // no-vig market probability as a strong prior, then applies small capped
    // adjustments from recent form and H2H. It is a research screen, not a
    // validated predictive model.
    let projection = null;
    let projectionGate = "PENDING";

    if (
      Number.isFinite(marketFairProb) &&
      marketFairProb > 0 &&
      marketFairProb < 1 &&
      selectedRec &&
      opponentRec
    ) {
      const selectedGames = selectedRec.wins + selectedRec.losses + selectedRec.draws;
      const opponentGames = opponentRec.wins + opponentRec.losses + opponentRec.draws;

      if (selectedGames >= 3 && opponentGames >= 3) {
        const formDiff = selectedRec.winRate - opponentRec.winRate;
        let h2hDiff = 0;
        const h2hGamesCount = h2hRec.wins + h2hRec.losses + h2hRec.draws;
        if (h2hGamesCount >= 3) h2hDiff = h2hRec.winRate - 0.5;

        // Maximum form adjustment: ±8 percentage points.
        const formAdj = clamp(formDiff * 0.10, -0.08, 0.08);
        // Maximum H2H adjustment: ±3 percentage points.
        const h2hAdj = clamp(h2hDiff * 0.06, -0.03, 0.03);

        const modelProbability = clamp(marketFairProb + formAdj + h2hAdj, 0.03, 0.97);
        const modelEdge = modelProbability - marketFairProb;

        if (modelEdge >= 0.04 && formGate !== "FAIL") projectionGate = "PASS";
        else if (modelEdge <= -0.03 || formGate === "FAIL") projectionGate = "FAIL";
        else projectionGate = "WATCH";

        projection = {
          version: "Research Projection V0.1",
          validated: false,
          marketFairProbability: marketFairProb,
          modelProbability,
          modelEdge,
          formAdjustment: formAdj,
          h2hAdjustment: h2hAdj,
          note:
            "This projection is a conservative research heuristic anchored to the no-vig market. It has not yet been backtested or validated and must not independently qualify an Official Play."
        };
      }
    }

    return res.json({
      error: "SPORTRADAR_API_KEY is not configured in Vercel.",
      setup: "Add SPORTRADAR_API_KEY as a Secret Production environment variable."
    });
  }

  const sport = String(req.query.sport || "").toLowerCase();
  const home = String(req.query.home || "");
  const away = String(req.query.away || "");
  const selection = String(req.query.selection || "");
  const date = String(req.query.date || "").slice(0, 10);
  const marketFairProb = Number(req.query.marketFairProb);

  if (!["nrl", "nrlw", "afl"].includes(sport)) {
    res.statusCode = 400;
    return res.json({ error: "Phase 2B deep context currently supports NRL, NRLW and AFL." });
  }
  if (!home || !away || !date) {
    res.statusCode = 400;
    return res.json({ error: "home, away and date are required." });
  }

  const base =
    sport === "afl"
      ? `https://api.sportradar.com/australianrules/${access}/v3/en`
      : `https://api.sportradar.com/rugby-league/${access}/v3/en`;

  try {
    const day = await srFetch(`${base}/schedules/${date}/summaries.json`, key);
    const daySummaries = getSummaries(day);

    const match = daySummaries.find(s => {
      const comps = competitorsOf(s);
      const names = comps.map(c => c.name);
      return names.some(n => sameTeam(n, home)) && names.some(n => sameTeam(n, away));
    });

    if (!match) {
      res.statusCode = 404;
      return res.json({
        error: `Could not match ${away} @ ${home} in Sportradar's ${date} schedule.`,
        hint: "Trial coverage may be limited or team naming may differ."
      });
    }

    const comps = competitorsOf(match);
    const homeComp = comps.find(c => c.qualifier === "home") || comps.find(c => sameTeam(c.name, home));
    const awayComp = comps.find(c => c.qualifier === "away") || comps.find(c => sameTeam(c.name, away));

    if (!homeComp?.id || !awayComp?.id) {
      throw new Error("Matched event but could not resolve Sportradar competitor IDs.");
    }

    // Trial access is 1 QPS, so these calls must remain sequential.
    const homeHistoryRaw = await srFetch(
      `${base}/competitors/${encodeURIComponent(homeComp.id)}/summaries.json`,
      key
    );
    const awayHistoryRaw = await srFetch(
      `${base}/competitors/${encodeURIComponent(awayComp.id)}/summaries.json`,
      key
    );
    const h2hRaw = await srFetch(
      `${base}/competitors/${encodeURIComponent(homeComp.id)}/versus/${encodeURIComponent(awayComp.id)}/summaries.json`,
      key
    );

    // Current event lineups / named squads. Sportradar documents this feed for
    // Rugby and Australian Rules where lineup coverage is available.
    let lineupRaw = null;
    let lineupError = null;
    const matchedEventId = match?.sport_event?.id || null;
    if (matchedEventId) {
      try {
        lineupRaw = await srFetch(
          `${base}/sport_events/${encodeURIComponent(matchedEventId)}/lineups.json`,
          key
        );
      } catch (e) {
        // Lineups may not yet be published or may not be available on trial coverage.
        lineupError = e?.message || String(e);
      }
    }

    const homeHistory = recentRecord(getSummaries(homeHistoryRaw), homeComp.id, 5);
    const awayHistory = recentRecord(getSummaries(awayHistoryRaw), awayComp.id, 5);
    const h2hGames = recentRecord(getSummaries(h2hRaw), sameTeam(selection, home) ? homeComp.id : awayComp.id, 5);

    const homeRec = recordSummary(homeHistory);
    const awayRec = recordSummary(awayHistory);
    const selectedIsHome = sameTeam(selection, home);
    const selectedIsAway = sameTeam(selection, away);
    const selectedRec = selectedIsHome ? homeRec : selectedIsAway ? awayRec : null;
    const opponentRec = selectedIsHome ? awayRec : selectedIsAway ? homeRec : null;
    const h2hRec = recordSummary(h2hGames);

    let formGate = "PENDING";
    let formScore = null;
    if (selectedRec && opponentRec && (selectedRec.wins + selectedRec.losses + selectedRec.draws) >= 3) {
      formScore = selectedRec.winRate - opponentRec.winRate;
      if (selectedRec.winRate >= 0.60 && formScore >= 0.20) formGate = "PASS";
      else if (selectedRec.winRate <= 0.20 && formScore <= -0.20) formGate = "FAIL";
      else formGate = "WATCH";
    }


    const lineupCoverage = hasLineupCoverage(match);
    const homeLineup = lineupRaw
      ? lineupSummary(lineupRaw, homeComp.id, homeComp.name)
      : { team: homeComp.name, totalNamed: 0, startersNamed: 0, positionsNamed: 0, players: [] };
    const awayLineup = lineupRaw
      ? lineupSummary(lineupRaw, awayComp.id, awayComp.name)
      : { team: awayComp.name, totalNamed: 0, startersNamed: 0, positionsNamed: 0, players: [] };

    // This gate reflects published team selections / lineup availability.
    // It is NOT a medical injury feed.
    let availabilityGate = "PENDING";
    if (lineupRaw && homeLineup.totalNamed >= 10 && awayLineup.totalNamed >= 10) {
      availabilityGate = "PASS";
    } else if (lineupCoverage === false) {
      availabilityGate = "PENDING";
    }

    let matchupGate = "PENDING";
    if ((h2hRec.wins + h2hRec.losses + h2hRec.draws) >= 3) {
      if (h2hRec.winRate >= 0.60) matchupGate = "PASS";
      else if (h2hRec.winRate <= 0.20) matchupGate = "FAIL";
      else matchupGate = "WATCH";
    }

    return res.json({
      provider: "Sportradar",
      phase: "2B",
      sport,
      matchedEventId: match?.sport_event?.id || null,
      lineupCoverage,
      lineups: { home: homeLineup, away: awayLineup, error: lineupError },
      home: { id: homeComp.id, name: homeComp.name, recent: homeHistory, record: homeRec },
      away: { id: awayComp.id, name: awayComp.name, recent: awayHistory, record: awayRec },
      selectedTeam: selection,
      projection,
      selectedRecord: selectedRec,
      opponentRecord: opponentRec,
      h2h: { recent: h2hGames, record: h2hRec },
      gates: {
        form: formGate,
        matchup: matchupGate,
        roleMinutes: "PENDING",
        injuriesTeamNews: availabilityGate,
        projection: projectionGate,
        lineMovement: "PENDING",
      },
      note:
        "Form and H2H are deterministic first-pass gates. The team-news gate reflects published lineups/named squads only; it is not a medical injury diagnosis or a complete injury-news feed. These checks are not sufficient by themselves for an Official Play."
    });
  } catch (err) {
    console.error(err);
    res.statusCode = 500;
    return res.json({ error: err?.message || "Sportradar context error." });
  }
};
