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


function stripHtml(html) {
  return String(html || "")
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&#39;/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/\s+/g, " ")
    .trim();
}

async function publicText(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const r = await fetch(url, {
      headers: {
        "user-agent": "Mozilla/5.0 (compatible; PreemiyumResearch/1.0)",
        accept: "text/html,application/xhtml+xml",
      },
      redirect: "follow",
      cache: "no-store",
      signal: controller.signal,
    });
    const text = await r.text();
    if (!r.ok) throw new Error(`Official source ${r.status}`);
    return text;
  } finally {
    clearTimeout(timer);
  }
}

function absoluteUrl(base, href) {
  try { return new URL(href, base).toString(); }
  catch { return null; }
}

function unique(arr) {
  return [...new Set(arr.filter(Boolean))];
}

function discoverLinks(html, base, regex) {
  const out = [];
  const hrefRe = /href=["']([^"']+)["']/gi;
  let m;
  while ((m = hrefRe.exec(html))) {
    const href = m[1];
    if (regex.test(href)) out.push(absoluteUrl(base, href));
    regex.lastIndex = 0;
  }
  return unique(out);
}

function escRe(s) {
  return String(s || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function looseNamePattern(name) {
  const parts = nameTokens(name).map(escRe);
  return parts.length ? parts.join("[\\s'’\\-]+") : "";
}

function looseTeamPattern(name) {
  const parts = nameTokens(name).map(escRe);
  return parts.length ? parts.join("\\s+") : "";
}

function officialNrlRoleFromText(text, player, team) {
  const p = looseNamePattern(player);
  const t = looseTeamPattern(team);
  if (!p || !t) return null;

  const starter = new RegExp(
    `(?:fullback|winger|centre|five\\s*eighth|halfback|prop|hooker|2nd\\s*row|second\\s*row|lock)\\s+for\\s+${t}\\s+is\\s+number\\s+(?:[1-9]|1[0-3])\\s+${p}`,
    "i"
  );
  const bench = new RegExp(
    `interchange\\s+for\\s+${t}\\s+is\\s+number\\s+(?:1[4-7])\\s+${p}`,
    "i"
  );
  const reserve = new RegExp(
    `(?:replacement|reserve)\\s+for\\s+${t}\\s+is\\s+number\\s+(?:1[8-9]|2[0-9])\\s+${p}`,
    "i"
  );

  if (starter.test(text)) return { gate: "PASS", detail: "Official NRL team list shows the player in the starting 13." };
  if (bench.test(text)) return { gate: "WATCH", detail: "Official NRL team list shows the player on the interchange bench." };
  if (reserve.test(text)) return { gate: "PENDING", detail: "Official NRL team list shows the player among reserves/replacements, not a confirmed starter." };

  const playerOnly = new RegExp(`\\b${p}\\b`, "i");
  if (playerOnly.test(text)) return { gate: "WATCH", detail: "Player is named on the official NRL page, but starting status could not be parsed confidently." };
  return null;
}


function isoDateOnly(value) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

function firstThursdayOfMarch(year) {
  const d = new Date(Date.UTC(year, 2, 1));
  while (d.getUTCDay() !== 4) d.setUTCDate(d.getUTCDate() + 1);
  return d;
}

function estimateNrlRound(eventDateValue) {
  const eventDate = isoDateOnly(eventDateValue);
  if (!eventDate) return null;
  const first = firstThursdayOfMarch(eventDate.getUTCFullYear());
  const diffDays = Math.floor((eventDate - first) / 86400000);
  return Math.max(1, Math.min(30, Math.floor(diffDays / 7) + 1));
}

function tuesdayOfEventWeek(eventDateValue) {
  const d = isoDateOnly(eventDateValue);
  if (!d) return null;
  const copy = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = copy.getUTCDay(); // Sun=0
  const delta = day >= 2 ? day - 2 : day + 5;
  copy.setUTCDate(copy.getUTCDate() - delta);
  return copy;
}

function yyyyMmDdPath(d) {
  if (!d) return null;
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}/${m}/${day}`;
}

function directNrlTeamListCandidates(eventDateValue, sport) {
  if (sport !== "nrl" && sport !== "nrlw") return [];
  const eventDate = isoDateOnly(eventDateValue);
  if (!eventDate) return [];

  const round = estimateNrlRound(eventDate);
  const tue = tuesdayOfEventWeek(eventDate);
  if (!round || !tue) return [];

  const dates = [0, -1, 1].map(offset => {
    const d = new Date(tue);
    d.setUTCDate(d.getUTCDate() + offset);
    return d;
  });

  const slug = sport === "nrlw" ? "nrlw-team-lists-round" : "nrl-team-lists-round";
  return unique(dates.map(d =>
    `https://www.nrl.com/news/${yyyyMmDdPath(d)}/${slug}-${round}/`
  ));
}

async function officialNrlRoleEvidence({ sport, player, home, away, date }) {
  const homePage = "https://www.nrl.com/";
  const wantsNrlw = sport === "nrlw";
  const linkRegex = wantsNrlw
    ? /\/news\/\d{4}\/\d{2}\/\d{2}\/nrlw-team-lists-round-\d+\/?/i
    : /\/news\/\d{4}\/\d{2}\/\d{2}\/nrl-team-lists-round-\d+\/?/i;

  // Phase 4G.1: try the deterministic current-round article URL first.
  // Example for Round 27, 2026:
  // https://www.nrl.com/news/2026/09/01/nrl-team-lists-round-27/
  let links = directNrlTeamListCandidates(date, sport);

  // If the predictable URL is unavailable, fall back to homepage discovery.
  try {
    const html = await publicText(homePage);
    links = unique([
      ...links,
      ...discoverLinks(html, homePage, linkRegex).slice(0, 8),
    ]);
  } catch {
    // Direct candidates remain available even if homepage discovery fails.
  }
  for (const url of links) {
    try {
      const page = await publicText(url);
      const text = stripHtml(page);
      const n = norm(text);
      const homeN = norm(home);
      const awayN = norm(away);

      // The official article often uses short names (e.g. Sharks / Storm)
      // while the Odds feed can use full names (Cronulla Sutherland Sharks).
      const homeTokens = nameTokens(home);
      const awayTokens = nameTokens(away);
      const homeShort = homeTokens[homeTokens.length - 1] || homeN;
      const awayShort = awayTokens[awayTokens.length - 1] || awayN;
      const homeMatched = n.includes(homeN) || n.includes(homeShort);
      const awayMatched = n.includes(awayN) || n.includes(awayShort);
      if (!homeMatched || !awayMatched) continue;

      const a = officialNrlRoleFromText(text, player, home);
      const b = officialNrlRoleFromText(text, player, away);
      const evidence = a || b;
      if (evidence) {
        return {
          provider: "NRL.com",
          sourceType: "official_team_list",
          url,
          checkedAt: new Date().toISOString(),
          ...evidence,
        };
      }
      return {
        provider: "NRL.com",
        sourceType: "official_team_list",
        url,
        checkedAt: new Date().toISOString(),
        gate: "PENDING",
        detail: "Official current-round team-list page was found, but the player could not be confirmed in a release-safe role.",
      };
    } catch {
      continue;
    }
  }
  return {
    provider: "NRL.com",
    sourceType: "official_team_list",
    url: null,
    checkedAt: new Date().toISOString(),
    gate: "PENDING",
    detail: "A matching current official NRL/NRLW team-list page could not be resolved automatically.",
  };
}

async function officialAflRoleEvidence({ player, home, away }) {
  // AFL team articles are less structurally consistent than NRL.com team lists.
  // We therefore use AFL.com.au only as conservative secondary evidence and never
  // promote a player to PASS from page-name presence alone.
  const homePage = "https://www.afl.com.au/";
  try {
    const html = await publicText(homePage);
    const links = discoverLinks(
      html,
      homePage,
      /\/news\/\d+\/[^"']*(?:teams|team-whispers|finals-teams)[^"']*\/?/i
    ).slice(0, 8);

    for (const url of links) {
      try {
        const page = await publicText(url);
        const text = stripHtml(page);
        const n = norm(text);
        if (!n.includes(norm(player))) continue;
        if (!(n.includes(norm(home)) || n.includes(norm(away)))) continue;

        return {
          provider: "AFL.com.au",
          sourceType: "official_team_news",
          url,
          checkedAt: new Date().toISOString(),
          gate: "WATCH",
          detail: "Player is present on an official AFL team/news page, but Phase 4G does not infer a final starting role from article text alone.",
        };
      } catch {
        continue;
      }
    }
  } catch {}

  return {
    provider: "AFL.com.au",
    sourceType: "official_team_news",
    url: null,
    checkedAt: new Date().toISOString(),
    gate: "PENDING",
    detail: "No release-safe official AFL team confirmation was resolved automatically.",
  };
}

async function officialRoleEvidence({ sport, player, home, away, date }) {
  try {
    if (sport === "nrl" || sport === "nrlw") {
      return await officialNrlRoleEvidence({ sport, player, home, away, date });
    }
    if (sport === "afl") {
      return await officialAflRoleEvidence({ player, home, away });
    }
  } catch (e) {
    return {
      provider: sport === "afl" ? "AFL.com.au" : "NRL.com",
      sourceType: "official_team_news",
      url: null,
      checkedAt: new Date().toISOString(),
      gate: "PENDING",
      detail: `Official-source lookup failed safely: ${e?.message || String(e)}`,
    };
  }
  return null;
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


function gateFromHistory(rate, games) {
  if (!Number.isFinite(rate) || !Number.isFinite(games) || games < 5) return "PENDING";
  if (rate >= 0.65) return "PASS";
  if (rate >= 0.50) return "WATCH";
  return "FAIL";
}

function gateFromPrice({ priceEV, books }) {
  if (!Number.isFinite(books) || books < 2) return "INSUFFICIENT";
  if (!Number.isFinite(priceEV)) return "PENDING";
  if (priceEV >= 0.03) return "PASS";
  if (priceEV >= -0.01) return "WATCH";
  return "FAIL";
}

function unifiedPropDecision({
  l5, l10, l20,
  average, point,
  roleGate,
  priceEV,
  books,
  propScreen,
}) {
  const historyGate = gateFromHistory(
    l20?.rate ?? l10?.rate ?? l5?.rate ?? null,
    l20?.games ?? l10?.games ?? l5?.games ?? 0
  );

  const priceGate = gateFromPrice({ priceEV, books });

  let avgVsLine = null;
  if (Number.isFinite(average) && Number.isFinite(point)) {
    avgVsLine = average - point;
  }

  const averageGate =
    avgVsLine == null
      ? "PENDING"
      : avgVsLine >= 1.5
        ? "PASS"
        : avgVsLine >= 0
          ? "WATCH"
          : "FAIL";

  // Mandatory release gates.
  // A prop can never become BET CANDIDATE while role is PENDING or price quality
  // is unverified/insufficient. This deliberately favors no-release over forced bets.
  const mandatoryPending =
    roleGate !== "PASS" ||
    priceGate === "PENDING" ||
    priceGate === "INSUFFICIENT";

  const hardFail =
    roleGate === "FAIL" ||
    priceGate === "FAIL" ||
    historyGate === "FAIL";

  let score = 50;

  // History
  if (historyGate === "PASS") score += 16;
  else if (historyGate === "WATCH") score += 5;
  else if (historyGate === "FAIL") score -= 18;
  else score -= 5;

  // Price
  if (priceGate === "PASS") score += 18;
  else if (priceGate === "WATCH") score += 5;
  else if (priceGate === "FAIL") score -= 20;
  else score -= 10;

  // Role
  if (roleGate === "PASS") score += 14;
  else if (roleGate === "WATCH") score += 3;
  else if (roleGate === "FAIL") score -= 20;
  else score -= 10;

  // Average vs line
  if (averageGate === "PASS") score += 10;
  else if (averageGate === "WATCH") score += 3;
  else if (averageGate === "FAIL") score -= 10;

  // Existing research screen is advisory only.
  if (Number.isFinite(propScreen?.score)) {
    score += Math.max(-8, Math.min(8, (propScreen.score - 50) * 0.16));
  }

  score = Math.max(0, Math.min(100, Math.round(score)));

  let status = "NO BET";
  let releaseLocked = true;

  if (!mandatoryPending && !hardFail && score >= 75) {
    status = "BET CANDIDATE";
    releaseLocked = false;
  } else if (!hardFail && score >= 55) {
    status = "WATCH";
  } else {
    status = "NO BET";
  }

  const reasons = [];
  if (priceGate === "INSUFFICIENT") reasons.push("price not verified across enough bookmakers");
  if (priceGate === "FAIL") reasons.push("current price value failed");
  if (roleGate === "PENDING") reasons.push("current role/lineup not yet confirmed");
  if (roleGate === "WATCH") reasons.push("player is named but starting/role evidence is not strong enough for release");
  if (roleGate === "FAIL") reasons.push("role/injury gate failed");
  if (historyGate === "FAIL") reasons.push("recent historical hit rate is weak");
  if (averageGate === "FAIL") reasons.push("recent average is below the current line");
  if (!reasons.length && status === "WATCH") reasons.push("evidence is mixed or not strong enough for release");

  return {
    status,
    score,
    releaseLocked,
    gates: {
      price: priceGate,
      history: historyGate,
      role: roleGate,
      averageVsLine: averageGate,
    },
    avgVsLine,
    reasons,
    policy:
      "BET CANDIDATE requires a PASS role gate plus verified price evidence. WATCH/PENDING role evidence remains release-locked. This is a research classification, not a guarantee of a winning bet."
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
  const fairOver = Number(req.query.fairOver);
  const priceEV = Number(req.query.priceEV);
  const books = Number(req.query.books);
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
    let roleMinutesGate = roleGateFromInfo(currentRole);
    let officialRoleEvidenceResult = null;

    if (roleMinutesGate !== "PASS") {
      officialRoleEvidenceResult = await officialRoleEvidence({
        sport,
        player,
        home,
        away,
        date,
      });

      // Secondary official evidence may improve PENDING -> WATCH, or for the
      // structured NRL/NRLW starting-13 pattern, -> PASS. It never downgrades
      // an existing Sportradar PASS.
      if (officialRoleEvidenceResult?.gate === "PASS") {
        roleMinutesGate = "PASS";
      } else if (
        officialRoleEvidenceResult?.gate === "WATCH" &&
        roleMinutesGate === "PENDING"
      ) {
        roleMinutesGate = "WATCH";
      }
    }

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

    const unifiedDecision = unifiedPropDecision({
      l5: hit(5),
      l10: hit(10),
      l20: hit(20),
      average: avg,
      point: Number.isFinite(point) ? point : null,
      roleGate: roleMinutesGate,
      priceEV: Number.isFinite(priceEV) ? priceEV : null,
      books: Number.isFinite(books) ? books : null,
      propScreen,
    });

    return res.json({
      phase:"4G.1",
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
      officialRoleEvidence: officialRoleEvidenceResult,
      propScreen,
      marketContext: {
        fairOver: Number.isFinite(fairOver) ? fairOver : null,
        priceEV: Number.isFinite(priceEV) ? priceEV : null,
        books: Number.isFinite(books) ? books : null,
      },
      unifiedDecision,
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
