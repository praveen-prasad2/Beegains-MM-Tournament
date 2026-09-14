const config = require('./config');

function placementPoints(placement) {
  return config.points.placement[placement] || 0;
}

function computeMatchPoints(teamKills, placement) {
  return placementPoints(placement) + teamKills * config.points.perKill;
}

// League points table: one row per team, derived from completed league matches.
function buildPointsTable(state) {
  const rows = new Map();
  for (const team of state.teams) {
    rows.set(team.id, {
      teamId: team.id,
      teamName: team.name,
      color: team.color,
      emoji: team.emoji,
      matchesPlayed: 0,
      firsts: 0,
      seconds: 0,
      thirds: 0,
      totalKills: 0,
      totalPoints: 0,
    });
  }

  for (const match of state.matches) {
    if (match.stage !== 'league' || match.status !== 'completed') continue;
    for (const mt of match.teams) {
      const row = rows.get(mt.teamId);
      if (!row) continue;
      row.matchesPlayed += 1;
      if (mt.placement === 1) row.firsts += 1;
      else if (mt.placement === 2) row.seconds += 1;
      else if (mt.placement === 3) row.thirds += 1;
      row.totalKills += mt.kills;
      row.totalPoints += mt.points;
    }
  }

  const sorted = [...rows.values()].sort((a, b) => {
    if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
    if (b.totalKills !== a.totalKills) return b.totalKills - a.totalKills;
    return a.teamName.localeCompare(b.teamName);
  });
  sorted.forEach((row, idx) => {
    row.rank = idx + 1;
  });
  return sorted;
}

function buildKillsLeaderboard(state, stage = 'league') {
  const teamKills = new Map();
  const playerKills = new Map();

  for (const team of state.teams) {
    teamKills.set(team.id, { teamId: team.id, teamName: team.name, color: team.color, emoji: team.emoji, kills: 0 });
    for (const p of team.players) {
      playerKills.set(p.id, { playerId: p.id, playerName: p.name, teamId: team.id, teamName: team.name, color: team.color, emoji: team.emoji, kills: 0 });
    }
  }

  for (const match of state.matches) {
    if (match.status !== 'completed') continue;
    if (stage !== 'all' && match.stage !== stage) continue;
    for (const mt of match.teams) {
      const row = teamKills.get(mt.teamId);
      if (row) row.kills += mt.kills;
    }
    for (const ps of match.players) {
      const row = playerKills.get(ps.playerId);
      if (row) row.kills += ps.kills;
    }
  }

  return {
    byTeam: [...teamKills.values()].sort((a, b) => b.kills - a.kills),
    byPlayer: [...playerKills.values()].sort((a, b) => b.kills - a.kills),
  };
}

function buildDeathsLeaderboard(state, stage = 'league') {
  const teamDeaths = new Map();
  const playerDeaths = new Map();

  for (const team of state.teams) {
    teamDeaths.set(team.id, { teamId: team.id, teamName: team.name, color: team.color, emoji: team.emoji, deaths: 0 });
    for (const p of team.players) {
      playerDeaths.set(p.id, { playerId: p.id, playerName: p.name, teamId: team.id, teamName: team.name, color: team.color, emoji: team.emoji, deaths: 0 });
    }
  }

  for (const match of state.matches) {
    if (match.status !== 'completed') continue;
    if (stage !== 'all' && match.stage !== stage) continue;
    for (const ps of match.players) {
      const row = playerDeaths.get(ps.playerId);
      if (row) row.deaths += ps.deaths;
      const team = state.teams.find((t) => t.players.some((p) => p.id === ps.playerId));
      if (team) {
        const trow = teamDeaths.get(team.id);
        if (trow) trow.deaths += ps.deaths;
      }
    }
  }

  return {
    byTeam: [...teamDeaths.values()].sort((a, b) => b.deaths - a.deaths),
    byPlayer: [...playerDeaths.values()].sort((a, b) => b.deaths - a.deaths),
  };
}

module.exports = {
  placementPoints,
  computeMatchPoints,
  buildPointsTable,
  buildKillsLeaderboard,
  buildDeathsLeaderboard,
};
