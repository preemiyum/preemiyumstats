function norm(s) {
  return String(s || "")
    .toLowerCase()
    .replace(/[.'’\-]/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function sameName(a, b) {
  const na = norm(a);
  const nb = norm(b);
  if (!na || !nb) return false;
  if (na === nb || na.includes(nb) || nb.includes(na)) return true;

  // Sportradar commonly uses "Last, First" while books use "First Last".
  const aa = na.split(" ");
  const bb = nb.split(" ");
  return aa.length >= 2 && bb.length >= 2 &&
    aa[0] === bb[bb.length-1] &&
    aa[aa.length-1] === bb[0];
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

    if (!found.length) {
      res.statusCode = 404;
      return res.json({
        error:
          `No ${metric} history was found for ${player} in the current Sportradar feed.`,
        note:
          sport.startsWith("nrl")
            ? "Rugby League try-scoring history may not be included in the basic player-stat feed for this competition/access level."
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

    return res.json({
      phase:"3A",
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
      recent:found.slice(0,20),
      roleMinutesGate:"PENDING",
      note:
        "This module measures recent player-stat performance at the current line. Role/minutes remains pending until a validated role/minutes source is connected."
    });
  } catch (err) {
    console.error(err);
    res.statusCode = 500;
    return res.json({ error: err?.message || "Player history research failed." });
  }
};
