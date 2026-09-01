function norm(s) {
  return String(s || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[’'`]/g, "")
    .replace(/[\-.,]/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function nameTokens(s) {
  return norm(s).split(" ").filter(Boolean);
}

function sameName(a, b) {
  const aa = nameTokens(a);
  const bb = nameTokens(b);
  if (!aa.length || !bb.length) return false;

  if (aa.length === bb.length && aa.every(t => bb.includes(t))) return true;

  if (aa.length >= 2 && bb.length >= 2) {
    const af = aa[0], al = aa[aa.length - 1];
    const bf = bb[0], bl = bb[bb.length - 1];
    if ((af === bf && al === bl) || (af === bl && al === bf)) return true;
  }

  const na = aa.join(" ");
  const nb = bb.join(" ");
  return na === nb || na.includes(nb) || nb.includes(na);
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}
let lastReq = 0;

async function srFetch(url, key) {
  const gap = 1150;
  const wait = gap - (Date.now() - lastReq);
  if (wait > 0) await sleep(wait);

  for (let attempt=0; attempt<4; attempt++) {
    lastReq = Date.now();
    const r = await fetch(url, {
      headers: { "x-api-key": key, accept: "application/json" },
      cache: "no-store",
    });
    const text = await r.text();

    if (r.status === 429 && attempt < 3) {
      const retry = Number(r.headers.get("retry-after"));
      await sleep(Number.isFinite(retry) && retry > 0 ? retry*1000 : 1200*(attempt+1));
      continue;
    }
    if (!r.ok) throw new Error(`Sportradar ${r.status}: ${text.slice(0,300)}`);
    return JSON.parse(text);
  }
  throw new Error("Sportradar rate limit persisted.");
}

function summaries(data) {
  return data?.summaries || data?.sport_event_summaries || [];
}

function walkPlayers(obj, out=[]) {
  if (!obj || typeof obj !== "object") return out;
  if (Array.isArray(obj)) {
    for (const x of obj) walkPlayers(x, out);
    return out;
  }

  const hasName = typeof obj.name === "string";
  const stats = obj.statistics;
  if (hasName && stats && typeof stats === "object") {
    out.push({
      id: obj.id || null,
      name: obj.name,
      stats,
    });
  }

  for (const v of Object.values(obj)) {
    if (v && typeof v === "object") walkPlayers(v, out);
  }
  return out;
}

function metricForMarket(sport, marketKey) {
  const map = {
    player_disposals: "disposals",
    player_goals_scored_over: "goals",
    player_goal_scorer_anytime: "goals",
    player_marks_over: "marks",
    player_tackles_over: "tackles",
    player_try_scorer_anytime: "tries",
    player_try_scorer_over: "tries",
  };
  return map[marketKey] || null;
}

function eventDate(summary) {
  return summary?.sport_event?.start_time || null;
}


function timelineEvents(data) {
  return data?.timeline || data?.events || data?.sport_event_timeline || [];
}

function playerRefs(ev) {
  if (Array.isArray(ev?.players)) return ev.players;
  if (ev?.player) return [ev.player];
  return [];
}

function isTryEvent(ev) {
  const method = String(ev?.method || "").toLowerCase();
  const type = String(ev?.type || "").toLowerCase();
  return method === "try" || type === "try" ||
    (type === "score_change" && method === "try");
}

function scorerMatches(ev, player) {
  return playerRefs(ev).some(p => {
    const ptype = String(p?.type || "").toLowerCase();
    return sameName(p?.name, player) && (!ptype || ptype === "scorer");
  });
}


function lineupPlayers(data) {
  const comps = data?.competitors || data?.lineups || data?.sport_event?.competitors || [];
  const out = [];
  for (const c of comps || []) {
    const players = c?.players || c?.lineup?.players || [];
    for (const p of players || []) {
      out.push({
        teamId: c.id || null,
        teamName: c.name || null,
        id: p.id || null,
        name: p.name || `${p.first_name || ""} ${p.last_name || ""}`.trim(),
      });
    }
  }
  return out;
}

async function confirmPlayerTeamFromLineup(base, key, eventId, teamIds, player) {
  if (!eventId) return null;
  try {
    const data = await srFetch(
      `${base}/sport_events/${encodeURIComponent(eventId)}/lineups.json`,
      key
    );
    const players = lineupPlayers(data);
    const found = players.find(p => sameName(p.name, player));
    if (!found) return null;

    const team = teamIds.find(t => t.id === found.teamId) ||
      teamIds.find(t => sameName(t.name, found.teamName));
    return team || null;
  } catch {
    return null;
  }
}

async function rugbyLeagueTryHistory(base, key, games, teamId, player, limit = 10) {
  const out = [];

  for (const s of games) {
    const eventId = s?.sport_event?.id;
    if (!eventId) continue;

    try {
      const timeline = await srFetch(
        `${base}/sport_events/${encodeURIComponent(eventId)}/timeline.json`,
        key
      );

      const events = timelineEvents(timeline);
      const tries = events.filter(ev => isTryEvent(ev) && scorerMatches(ev, player)).length;

      out.push({
        date: eventDate(s),
        opponent: (() => {
          const cc = s?.sport_event?.competitors || [];
          return cc.find(c => c.id !== teamId)?.name || "Unknown";
        })(),
        value: tries,
      });

      if (out.length >= limit) break;
    } catch (e) {
      // Some historical matches may not have timeline coverage at the user's access level.
      continue;
    }
  }

  return out;
}


function currentRoleFromLineup(data, player) {
  const players = lineupPlayers(data);
  const p = players.find(x => sameName(x.name, player));
  if (!p) return null;

  // Re-read the richer raw player object where possible.
  const comps = data?.competitors || data?.lineups || data?.sport_event?.competitors || [];
  for (const c of comps || []) {
    const pp = c?.players || c?.lineup?.players || [];
    const raw = pp.find(x => sameName(
      x.name || `${x.first_name || ""} ${x.last_name || ""}`.trim(),
      player
    ));
    if (raw) {
      return {
        named: true,
        starter: raw.starter === true,
        position: raw.type || raw.position || null,
        jerseyNumber: raw.jersey_number ?? null,
        teamId: c.id || null,
        teamName: c.name || null,
      };
    }
  }

  return {
    named: true,
    starter: null,
    position: null,
    jerseyNumber: null,
    teamId: p.teamId || null,
    teamName: p.teamName || null,
  };
}

function roleGateFromInfo(info) {
  if (!info) return "PENDING";
  if (info.starter === true) return "PASS";
  if (info.named === true) return "WATCH";
  return "PENDING";
}

function rawImplied(price) {
  return price > 1 ? 1 / price : null;
}

function conservativePropScreen({ historyRate, bestPrice, roleGate, sampleSize }) {
  const implied = rawImplied(bestPrice);
  if (!Number.isFinite(historyRate) || !Number.isFinite(implied)) {
    return {
      status: "PENDING",
      score: null,
      rawImpliedProbability: implied,
      historyEdge: null,
      note: "Insufficient price/history inputs."
    };
  }

  const historyEdge = historyRate - implied;

  // Conservative research score only; not a predictive probability model.
  let score = 50;
  score += Math.max(-30, Math.min(25, historyEdge * 120));
  if (sampleSize >= 10) score += 5;
  else if (sampleSize < 5) score -= 8;

  if (roleGate === "PASS") score += 8;
  else if (roleGate === "WATCH") score -= 2;
  else score -= 8;

  score = Math.max(0, Math.min(100, Math.round(score)));

  let status = "PASS";
  if (
    historyEdge >= 0.08 &&
    sampleSize >= 8 &&
    roleGate === "PASS" &&
    score >= 70
  ) status = "PROP RESEARCH CANDIDATE";
  else if (
    historyEdge >= 0 &&
    sampleSize >= 5 &&
    roleGate !== "PENDING" &&
    score >= 55
  ) status = "WATCH";

  return {
    status,
    score,
    rawImpliedProbability: implied,
    historyEdge,
    note:
      "This compares recent historical hit rate with the raw implied probability of the displayed best price. It is not a no-vig fair-value model and is not an Official Play decision."
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
    return res.json({ error: "SPORTRADAR_API_KEY is not configured." });
  }

  const sport = String(req.query.sport || "").toLowerCase();
  const player = String(req.query.player || "");
  const marketKey = String(req.query.marketKey || "");
  const point = Number(req.query.point);
  const bestPrice = Number(req.query.bestPrice);
  const home = String(req.query.home || "");
  const away = String(req.query.away || "");
  const date = String(req.query.date || "").slice(0,10);

  if (!["afl","nrl","nrlw"].includes(sport)) {
    res.statusCode = 400;
    return res.json({
      error:
        "Phase 3A player-history research currently supports AFL/NRL/NRLW. NBA/WNBA need a basketball statistics feed in the next module."
    });
  }

  const metric = metricForMarket(sport, marketKey);
  if (!metric) {
    res.statusCode = 400;
    return res.json({ error: `No history metric is mapped for ${marketKey}.` });
  }

  const base =
    sport === "afl"
      ? `https://api.sportradar.com/australianrules/${access}/v3/en`
      : `https://api.sportradar.com/rugby-league/${access}/v3/en`;

  try {
    // Resolve team IDs from the event-day schedule.
    const day = await srFetch(`${base}/schedules/${date}/summaries.json`, key);
    const dayS = summaries(day);

    const match = dayS.find(s => {
      const comps = s?.sport_event?.competitors || [];
      const names = comps.map(c => norm(c.name));
      return names.some(n => n.includes(norm(home)) || norm(home).includes(n)) &&
             names.some(n => n.includes(norm(away)) || norm(away).includes(n));
    });

    if (!match) {
      res.statusCode = 404;
      return res.json({ error: "Could not match event in Sportradar schedule." });
    }

    const comps = match?.sport_event?.competitors || [];
    const teamIds = comps.map(c => ({ id:c.id, name:c.name })).filter(x => x.id);

    let currentRole = null;
    let currentLineupError = null;
    try {
      const currentLineup = await srFetch(
        `${base}/sport_events/${encodeURIComponent(match?.sport_event?.id)}/lineups.json`,
        key
      );
      currentRole = currentRoleFromLineup(currentLineup, player);
    } catch (e) {
      currentLineupError = e?.message || String(e);
    }
    const roleMinutesGate = roleGateFromInfo(currentRole);

    let found = [];
    let foundTeam = null;

    // Search both team summaries, sequentially for trial 1-QPS limits.
    for (const team of teamIds) {
      const raw = await srFetch(
        `${base}/competitors/${encodeURIComponent(team.id)}/summaries.json`,
        key
      );

      const games = summaries(raw);
      const rows = [];

      for (const s of games) {
        const players = walkPlayers(s);
        const p = players.find(x => sameName(x.name, player));
        if (!p) continue;

        const value = Number(p.stats?.[metric]);
        if (!Number.isFinite(value)) continue;

        rows.push({
          date: eventDate(s),
          opponent: (() => {
            const cc = s?.sport_event?.competitors || [];
            return cc.find(c => c.id !== team.id)?.name || "Unknown";
          })(),
          value,
        });

        if (rows.length >= 20) break;
      }

      if (rows.length) {
        found = rows;
        foundTeam = team.name;
        break;
      }
    }

    if (!found.length && sport.startsWith("nrl") && metric === "tries") {
      // Rugby League Player Summaries do not expose player `tries` as a match-stat field.
      // Sportradar does expose try scorers in Sport Event Timeline events, so reconstruct
      // player try history from the scoring timeline instead.
      for (const team of teamIds) {
        const raw = await srFetch(
          `${base}/competitors/${encodeURIComponent(team.id)}/summaries.json`,
          key
        );
        const games = summaries(raw).slice(0, 12);

        const timelineRows = await rugbyLeagueTryHistory(
          base,
          key,
          games,
          team.id,
          player,
          10
        );

        const confirmedTeam = await confirmPlayerTeamFromLineup(
          base,
          key,
          match?.sport_event?.id || null,
          teamIds,
          player
        );

        if (
          timelineRows.some(x => x.value > 0) ||
          (confirmedTeam && confirmedTeam.id === team.id)
        ) {
          found = timelineRows;
          foundTeam = team.name;
          break;
        }
      }
    }

    if (!found.length) {
      res.statusCode = 404;
      return res.json({
        error:
          `No ${metric} history was found for ${player} in the current Sportradar feed.`,
        note:
          sport.startsWith("nrl")
            ? "The system also checked historical Sportradar event timelines for named try-scorer events. No reliable player match was found in the available trial coverage."
            : "Player naming or trial coverage may differ."
      });
    }

    const values = found.map(x=>x.value);
    const avg = values.reduce((a,b)=>a+b,0)/values.length;

    const hit = (n) => {
      const g = found.slice(0,n);
      if (!g.length || !Number.isFinite(point)) return null;
      const hits = g.filter(x => x.value > point).length;
      return { hits, games:g.length, rate:hits/g.length };
    };

    const primarySample = hit(Math.min(10, found.length));
    const propScreen = conservativePropScreen({
      historyRate: primarySample?.rate ?? null,
      bestPrice,
      roleGate: roleMinutesGate,
      sampleSize: primarySample?.games ?? 0,
    });

    return res.json({
      phase:"3B",
      provider:"Sportradar",
      sport,
      player,
      team:foundTeam,
      marketKey,
      metric,
      point:Number.isFinite(point) ? point : null,
      average:avg,
      l5:hit(5),
      l10:hit(10),
      l20:hit(20),
      availableGames: found.length,
      recent:found.slice(0,20),
      roleMinutesGate,
      role: currentRole,
      currentLineupError,
      propScreen,
      note:
        sport.startsWith("nrl") && metric === "tries"
          ? "NRL/NRLW try history is reconstructed from Sportradar historical Sport Event Timeline scorer events. The role gate uses current lineup starter/named status where Sportradar has published a lineup. Exact minutes are not available in this feed."
          : "This module measures recent player-stat performance at the current line. The role gate uses current lineup starter/named status where available; exact minutes require a separate source."
    });
  } catch (err) {
    console.error(err);
    res.statusCode = 500;
    return res.json({ error: err?.message || "Player history research failed." });
  }
};
