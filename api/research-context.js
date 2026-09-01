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

async function srFetch(url, key) {
  const r = await fetch(url, {
    headers: { "x-api-key": key, accept: "application/json" },
    cache: "no-store",
  });
  const text = await r.text();
  if (!r.ok) {
    throw new Error(`Sportradar ${r.status}: ${text.slice(0, 300)}`);
  }
  try {
    return JSON.parse(text);
  } catch {
    throw new Error("Sportradar returned non-JSON data.");
  }
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

module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    res.statusCode = 405;
    return res.end("Method Not Allowed");
  }

  const key = process.env.SPORTRADAR_API_KEY;
  const access = process.env.SPORTRADAR_ACCESS_LEVEL || "trial";

  if (!key) {
    res.statusCode = 500;
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

    const [homeHistoryRaw, awayHistoryRaw, h2hRaw] = await Promise.all([
      srFetch(`${base}/competitors/${encodeURIComponent(homeComp.id)}/summaries.json`, key),
      srFetch(`${base}/competitors/${encodeURIComponent(awayComp.id)}/summaries.json`, key),
      srFetch(`${base}/competitors/${encodeURIComponent(homeComp.id)}/versus/${encodeURIComponent(awayComp.id)}/summaries.json`, key),
    ]);

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
      home: { id: homeComp.id, name: homeComp.name, recent: homeHistory, record: homeRec },
      away: { id: awayComp.id, name: awayComp.name, recent: awayHistory, record: awayRec },
      selectedTeam: selection,
      selectedRecord: selectedRec,
      opponentRecord: opponentRec,
      h2h: { recent: h2hGames, record: h2hRec },
      gates: {
        form: formGate,
        matchup: matchupGate,
        roleMinutes: "PENDING",
        injuriesTeamNews: "PENDING",
        projection: "PENDING",
        lineMovement: "PENDING",
      },
      note:
        "Form and H2H are deterministic first-pass gates from recent completed matches. They are not sufficient by themselves for an Official Play."
    });
  } catch (err) {
    console.error(err);
    res.statusCode = 500;
    return res.json({ error: err?.message || "Sportradar context error." });
  }
};
