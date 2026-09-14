const express = require('express');
const db = require('./db');
const config = require('./config');
const points = require('./points');

const router = express.Router();

function requireAdmin(req, res, next) {
  if (req.session && req.session.isAdmin) return next();
  return res.status(401).json({ error: 'Admin login required' });
}

function findMatch(state, id) {
  return state.matches.find((m) => m.id === Number(id));
}

function playerTeam(state, playerId) {
  return state.teams.find((t) => t.players.some((p) => p.id === playerId));
}

function serializeMatch(state, match) {
  return {
    ...match,
    teams: match.teams.map((mt) => {
      const team = state.teams.find((t) => t.id === mt.teamId);
      return {
        ...mt,
        teamName: team ? team.name : 'Unknown',
        color: team ? team.color : null,
        emoji: team ? team.emoji : null,
      };
    }),
    players: match.players.map((ps) => {
      const team = playerTeam(state, ps.playerId);
      const player = team ? team.players.find((p) => p.id === ps.playerId) : null;
      return {
        ...ps,
        playerName: player ? player.name : 'Unknown',
        teamId: team ? team.id : null,
      };
    }),
  };
}

// ---------- Public read endpoints ----------

router.get('/teams', (req, res) => {
  const state = db.getState();
  res.json(state.teams);
});

router.get('/matches', (req, res) => {
  const state = db.getState();
  const { stage } = req.query;
  let matches = state.matches;
  if (stage) matches = matches.filter((m) => m.stage === stage);
  matches = matches
    .slice()
    .sort((a, b) => a.stage.localeCompare(b.stage) || a.day - b.day || a.matchNumber - b.matchNumber);
  res.json(matches.map((m) => serializeMatch(state, m)));
});

router.get('/matches/:id', (req, res) => {
  const state = db.getState();
  const match = findMatch(state, req.params.id);
  if (!match) return res.status(404).json({ error: 'Match not found' });
  res.json(serializeMatch(state, match));
});

router.get('/points-table', (req, res) => {
  const state = db.getState();
  res.json({
    table: points.buildPointsTable(state),
    league: state.league,
  });
});

router.get('/leaderboard/kills', (req, res) => {
  const state = db.getState();
  const stage = req.query.stage || 'league';
  res.json(points.buildKillsLeaderboard(state, stage));
});

router.get('/leaderboard/deaths', (req, res) => {
  const state = db.getState();
  const stage = req.query.stage || 'league';
  res.json(points.buildDeathsLeaderboard(state, stage));
});

router.get('/league-state', (req, res) => {
  const state = db.getState();
  res.json(state.league);
});

// ---------- Admin auth ----------

router.post('/admin/login', (req, res) => {
  const { username, password } = req.body || {};
  if (username === config.admin.username && password === config.admin.password) {
    req.session.isAdmin = true;
    return res.json({ ok: true });
  }
  return res.status(401).json({ error: 'Invalid credentials' });
});

router.post('/admin/logout', (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

router.get('/admin/session', (req, res) => {
  res.json({ isAdmin: !!(req.session && req.session.isAdmin) });
});

// ---------- Admin: schedule management ----------

router.put('/admin/matches/:id/schedule', requireAdmin, (req, res) => {
  const state = db.getState();
  const match = findMatch(state, req.params.id);
  if (!match) return res.status(404).json({ error: 'Match not found' });
  const { day, matchNumber, teamIds, date, notes } = req.body || {};

  if (Array.isArray(teamIds)) {
    if (teamIds.length !== 3) return res.status(400).json({ error: 'A match needs exactly 3 teams' });
    const validIds = new Set(state.teams.map((t) => t.id));
    if (!teamIds.every((id) => validIds.has(Number(id)))) {
      return res.status(400).json({ error: 'Unknown team id in match' });
    }
    match.teams = teamIds.map((teamId) => {
      const existing = match.teams.find((mt) => mt.teamId === Number(teamId));
      return existing || { teamId: Number(teamId), placement: null, kills: 0, points: 0 };
    });
  }
  if (day !== undefined) match.day = Number(day);
  if (matchNumber !== undefined) match.matchNumber = Number(matchNumber);
  if (date !== undefined) match.date = date;
  if (notes !== undefined) match.notes = notes;

  db.save();
  res.json(serializeMatch(state, match));
});

// ---------- Admin: result entry ----------

router.post('/admin/matches/:id/result', requireAdmin, (req, res) => {
  const state = db.getState();
  const match = findMatch(state, req.params.id);
  if (!match) return res.status(404).json({ error: 'Match not found' });

  const { teams, players, notes, date } = req.body || {};
  if (!Array.isArray(teams) || teams.length !== 3) {
    return res.status(400).json({ error: 'Result must include placements for exactly 3 teams' });
  }
  const placements = teams.map((t) => Number(t.placement));
  const validPlacementSet = new Set([1, 2, 3]);
  if (!placements.every((p) => validPlacementSet.has(p)) || new Set(placements).size !== 3) {
    return res.status(400).json({ error: 'Placements must be a unique permutation of 1, 2, 3' });
  }
  const matchTeamIds = new Set(match.teams.map((mt) => mt.teamId));
  if (!teams.every((t) => matchTeamIds.has(Number(t.teamId)))) {
    return res.status(400).json({ error: 'Submitted teams do not match the scheduled teams for this match' });
  }

  const before = JSON.parse(JSON.stringify(match));

  const playersByTeam = new Map();
  for (const mt of match.teams) playersByTeam.set(mt.teamId, []);
  const playerList = Array.isArray(players) ? players : [];
  for (const ps of playerList) {
    const team = playerTeam(state, Number(ps.playerId));
    if (!team || !matchTeamIds.has(team.id)) continue;
    playersByTeam.get(team.id).push({
      playerId: Number(ps.playerId),
      kills: Math.max(0, Number(ps.kills) || 0),
      deaths: ps.deaths === undefined || ps.deaths === null ? 1 : Math.max(0, Number(ps.deaths) || 0),
    });
  }

  match.teams = match.teams.map((mt) => {
    const resultEntry = teams.find((t) => Number(t.teamId) === mt.teamId);
    const placement = Number(resultEntry.placement);
    const teamPlayers = playersByTeam.get(mt.teamId) || [];
    const kills = teamPlayers.reduce((sum, p) => sum + p.kills, 0);
    const pts = points.computeMatchPoints(kills, placement);
    return { teamId: mt.teamId, placement, kills, points: pts };
  });
  match.players = [...playersByTeam.values()].flat();
  match.status = 'completed';
  if (notes !== undefined) match.notes = notes;
  if (date !== undefined) match.date = date;

  const auditId = state.nextIds.audit++;
  state.audit.push({
    id: auditId,
    matchId: match.id,
    timestamp: new Date().toISOString(),
    before,
    after: JSON.parse(JSON.stringify(match)),
  });

  db.save();
  res.json(serializeMatch(state, match));
});

router.get('/admin/matches/:id/audit', requireAdmin, (req, res) => {
  const state = db.getState();
  const history = state.audit.filter((a) => a.matchId === Number(req.params.id));
  res.json(history);
});

// ---------- Admin: league completion & finals ----------

router.post('/admin/league/complete', requireAdmin, (req, res) => {
  const state = db.getState();
  const incomplete = state.matches.some((m) => m.stage === 'league' && m.status !== 'completed');
  if (incomplete && !(req.body && req.body.force)) {
    return res.status(400).json({ error: 'Not all league matches are completed yet', incomplete: true });
  }
  const table = points.buildPointsTable(state);
  const qualifiedTeamIds = table.slice(0, 3).map((r) => r.teamId);
  state.league.complete = true;
  state.league.qualifiedTeamIds = qualifiedTeamIds;
  db.save();
  res.json(state.league);
});

router.post('/admin/league/reopen', requireAdmin, (req, res) => {
  const state = db.getState();
  state.league.complete = false;
  state.league.qualifiedTeamIds = [];
  db.save();
  res.json(state.league);
});

router.post('/admin/finals/matches', requireAdmin, (req, res) => {
  const state = db.getState();
  if (!state.league.complete || state.league.qualifiedTeamIds.length !== 3) {
    return res.status(400).json({ error: 'League stage must be completed with 3 qualified teams first' });
  }
  const finalsMatches = state.matches.filter((m) => m.stage === 'finals');
  const matchNumber = finalsMatches.length + 1;
  const match = {
    id: state.nextIds.match++,
    stage: 'finals',
    day: 1,
    matchNumber,
    status: 'scheduled',
    date: (req.body && req.body.date) || null,
    notes: (req.body && req.body.notes) || '',
    teams: state.league.qualifiedTeamIds.map((teamId) => ({ teamId, placement: null, kills: 0, points: 0 })),
    players: [],
  };
  state.matches.push(match);
  db.save();
  res.json(serializeMatch(state, match));
});

router.delete('/admin/finals/matches/:id', requireAdmin, (req, res) => {
  const state = db.getState();
  const match = findMatch(state, req.params.id);
  if (!match || match.stage !== 'finals') return res.status(404).json({ error: 'Finals match not found' });
  if (match.status === 'completed') {
    return res.status(400).json({ error: 'Cannot delete a completed match; edit its result instead' });
  }
  state.matches = state.matches.filter((m) => m.id !== match.id);
  db.save();
  res.json({ ok: true });
});

// ---------- Admin: data reset ----------

router.post('/admin/reset', requireAdmin, (req, res) => {
  if (!req.body || req.body.confirm !== 'RESET') {
    return res.status(400).json({ error: 'Confirmation required: send { confirm: "RESET" }' });
  }
  db.resetTournament();
  res.json({ ok: true });
});

module.exports = router;
