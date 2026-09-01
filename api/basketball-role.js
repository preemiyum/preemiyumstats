let lastSr = 0;
function sleep(ms){ return new Promise(r => setTimeout(r, ms)); }

async function srFetch(url, key) {
  const gap = 1150;
  const wait = gap - (Date.now() - lastSr);
  if (wait > 0) await sleep(wait);

  for (let attempt=0; attempt<4; attempt++) {
    lastSr = Date.now();
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

    if (!r.ok) throw new Error(`Sportradar ${r.status}: ${text.slice(0,400)}`);
    return JSON.parse(text);
  }
  throw new Error("Sportradar rate limit persisted.");
}

function norm(s) {
  return String(s || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[’'`.,-]/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function sameName(a,b){
  const aa=norm(a).split(" ").filter(Boolean);
  const bb=norm(b).split(" ").filter(Boolean);
  if(!aa.length||!bb.length)return false;
  if(aa.length===bb.length && aa.every(x=>bb.includes(x))) return true;
  const af=aa[0], al=aa[aa.length-1], bf=bb[0], bl=bb[bb.length-1];
  return (af===bf&&al===bl)||(af===bl&&al===bf);
}

function teamMatches(team, wanted) {
  const n = norm(wanted);
  const candidates = [
    team?.name,
    team?.market,
    `${team?.market || ""} ${team?.name || ""}`,
    team?.alias,
  ].map(norm);
  return candidates.some(x => x && (x === n || x.includes(n) || n.includes(x)));
}

function playersFromProfile(profile){
  if(Array.isArray(profile?.players)) return profile.players;
  if(Array.isArray(profile?.roster)) return profile.roster;
  return [];
}

function playerRecords(stats){
  if(Array.isArray(stats?.players)) return stats.players;
  if(Array.isArray(stats?.player_records)) return stats.player_records;
  if(Array.isArray(stats?.team?.players)) return stats.team.players;
  return [];
}

function extractStatsRecord(stats, player){
  const records = playerRecords(stats);
  return records.find(p => sameName(
    p.full_name || p.name || `${p.first_name||""} ${p.last_name||""}`.trim(),
    player
  )) || null;
}

function findInjury(data, player){
  const teams = data?.teams || data?.league?.teams || [];
  for(const t of teams || []){
    for(const p of t?.players || []){
      if(sameName(p.full_name || p.name || `${p.first_name||""} ${p.last_name||""}`.trim(), player)){
        const injuries = p.injuries || (p.injury ? [p.injury] : []);
        return {
          team: `${t.market||""} ${t.name||""}`.trim(),
          injuries: injuries.map(i => ({
            status: i.status || null,
            description: i.desc || i.description || null,
            comment: i.comment || null,
            updateDate: i.update_date || null,
          }))
        };
      }
    }
  }
  return null;
}

function injuryGate(info){
  if(!info || !info.injuries?.length) return "PASS";
  const text = info.injuries.map(i => `${i.status||""} ${i.description||""} ${i.comment||""}`).join(" ").toLowerCase();
  if(/\bout\b|inactive|doubtful|suspended/.test(text)) return "FAIL";
  if(/questionable|day to day|probable|game time|gtd/.test(text)) return "WATCH";
  return "WATCH";
}

function roleGate(avgMin, starterShare, injury){
  if(injury === "FAIL") return "FAIL";
  if(Number.isFinite(avgMin) && avgMin >= 28 && starterShare >= 0.50) return "PASS";
  if(Number.isFinite(avgMin) && avgMin >= 20) return "WATCH";
  return "PENDING";
}

module.exports = async function handler(req,res){
  if(req.method !== "GET"){
    res.statusCode=405; return res.end("Method Not Allowed");
  }

  const key = process.env.SPORTRADAR_API_KEY;
  const access = process.env.SPORTRADAR_ACCESS_LEVEL || "trial";
  if(!key){
    res.statusCode=500;
    return res.json({error:"SPORTRADAR_API_KEY is not configured."});
  }

  const league = String(req.query.league||"").toLowerCase();
  const player = String(req.query.player||"");
  const home = String(req.query.home||"");
  const away = String(req.query.away||"");
  const date = String(req.query.date||"").slice(0,10);

  if(!["nba","wnba"].includes(league)){
    res.statusCode=400;
    return res.json({error:"Basketball role module supports NBA and WNBA."});
  }

  const [y,m,d] = date.split("-").map(Number);
  if(!y||!m||!d||!player){
    res.statusCode=400;
    return res.json({error:"league, player, home, away and date are required."});
  }

  const base=`https://api.sportradar.com/${league}/${access}/v8/en`;

  try{
    const schedule = await srFetch(
      `${base}/games/${y}/${String(m).padStart(2,"0")}/${String(d).padStart(2,"0")}/schedule.json`,
      key
    );
    const games = schedule?.games || [];
    const game = games.find(g =>
      (teamMatches(g.home, home) && teamMatches(g.away, away)) ||
      (teamMatches(g.home, away) && teamMatches(g.away, home))
    );

    if(!game){
      res.statusCode=404;
      return res.json({error:`Could not match ${away} @ ${home} in Sportradar ${league.toUpperCase()} schedule.`});
    }

    const teams=[game.home,game.away].filter(Boolean);
    let matchedPlayer=null;
    let matchedTeam=null;

    for(const team of teams){
      const profile=await srFetch(`${base}/teams/${team.id}/profile.json`,key);
      const found=playersFromProfile(profile).find(p=>sameName(
        p.full_name||p.name||`${p.first_name||""} ${p.last_name||""}`.trim(),
        player
      ));
      if(found){
        matchedPlayer=found;
        matchedTeam=team;
        break;
      }
    }

    if(!matchedPlayer || !matchedTeam){
      res.statusCode=404;
      return res.json({error:`Could not match ${player} to either current ${league.toUpperCase()} roster.`});
    }

    const seasonYear=game?.season?.year;
    const seasonType=game?.season?.type || "REG";

    let statRecord=null;
    if(seasonYear){
      const stats=await srFetch(
        `${base}/seasons/${seasonYear}/${seasonType}/teams/${matchedTeam.id}/statistics.json`,
        key
      );
      statRecord=extractStatsRecord(stats,player);
    }

    const injuries=await srFetch(`${base}/league/injuries.json`,key);
    const injuryInfo=findInjury(injuries,player);
    const injuryStatus=injuryGate(injuryInfo);

    const total=statRecord?.total || statRecord?.statistics?.total || {};
    const average=statRecord?.average || statRecord?.statistics?.average || {};

    const avgMinutes=Number(average.minutes);
    const gamesPlayed=Number(total.games_played);
    const gamesStarted=Number(total.games_started);
    const starterShare=Number.isFinite(gamesPlayed)&&gamesPlayed>0&&Number.isFinite(gamesStarted)
      ? gamesStarted/gamesPlayed : null;

    const usagePct=Number(total.usage_pct ?? statRecord?.statistics?.total?.usage_pct);

    const gate=roleGate(
      Number.isFinite(avgMinutes)?avgMinutes:null,
      starterShare ?? 0,
      injuryStatus
    );

    return res.json({
      phase:"3D",
      provider:"Sportradar Basketball v8",
      league,
      gameId:game.id,
      player:{
        id:matchedPlayer.id,
        name:matchedPlayer.full_name||matchedPlayer.name||player,
        position:matchedPlayer.primary_position||matchedPlayer.position||null,
        status:matchedPlayer.status||null,
        team:`${matchedTeam.market||""} ${matchedTeam.name||""}`.trim(),
      },
      season:{
        year:seasonYear||null,
        type:seasonType||null,
      },
      metrics:{
        avgMinutes:Number.isFinite(avgMinutes)?avgMinutes:null,
        usagePct:Number.isFinite(usagePct)?usagePct:null,
        gamesPlayed:Number.isFinite(gamesPlayed)?gamesPlayed:null,
        gamesStarted:Number.isFinite(gamesStarted)?gamesStarted:null,
        starterShare,
        points:Number(average.points) || null,
        rebounds:Number(average.rebounds) || null,
        assists:Number(average.assists) || null,
      },
      injury:{
        gate:injuryStatus,
        info:injuryInfo,
      },
      roleGate:gate,
      note:
        "NBA/WNBA role research uses current roster membership, seasonal average minutes, starts, usage percentage and active injury data. Injury feeds are not live and questionable players can still sit; re-check close to game time."
    });
  }catch(err){
    console.error(err);
    res.statusCode=500;
    return res.json({error:err?.message||"Basketball role research failed."});
  }
};
