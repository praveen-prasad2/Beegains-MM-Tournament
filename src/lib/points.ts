import { config } from './config';
import type {
  PlayerDeathsRow,
  PlayerKillsRow,
  PointsTableRow,
  Stage,
  TeamDeathsRow,
  TeamKillsRow,
  TournamentState,
} from './types';

export function placementPoints(placement: number | null): number {
  if (!placement) return 0;
  return config.points.placement[placement] || 0;
}

export function computeMatchPoints(teamKills: number, placement: number): number {
  return placementPoints(placement) + teamKills * config.points.perKill;
}

export function buildPointsTable(state: TournamentState): PointsTableRow[] {
  const rows = new Map<number, PointsTableRow>();
  const teamByPlayer = new Map<number, number>();
  for (const team of state.teams) {
    rows.set(team.id, {
      teamId: team.id,
      teamName: team.name,
      color: team.color,
      matchesPlayed: 0,
      firsts: 0,
      seconds: 0,
      thirds: 0,
      totalKills: 0,
      totalDeaths: 0,
      totalPoints: 0,
      rank: 0,
    });
    for (const p of team.players) teamByPlayer.set(p.id, team.id);
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
    for (const ps of match.players) {
      const teamId = teamByPlayer.get(ps.playerId);
      const row = teamId !== undefined ? rows.get(teamId) : undefined;
      if (row) row.totalDeaths += ps.deaths;
    }
  }

  // Rank by total points; ties are broken by fewest deaths (not kills).
  const sorted = [...rows.values()].sort((a, b) => {
    if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
    if (a.totalDeaths !== b.totalDeaths) return a.totalDeaths - b.totalDeaths;
    return a.teamName.localeCompare(b.teamName);
  });
  sorted.forEach((row, idx) => {
    row.rank = idx + 1;
  });
  return sorted;
}

function stageMatches(state: TournamentState, stage: Stage | 'all') {
  return state.matches.filter((m) => m.status === 'completed' && (stage === 'all' || m.stage === stage));
}

export function buildKillsLeaderboard(state: TournamentState, stage: Stage | 'all' = 'league') {
  const teamKills = new Map<number, TeamKillsRow>();
  const playerKills = new Map<number, PlayerKillsRow>();

  for (const team of state.teams) {
    teamKills.set(team.id, { teamId: team.id, teamName: team.name, color: team.color, kills: 0 });
    for (const p of team.players) {
      playerKills.set(p.id, { playerId: p.id, playerName: p.name, teamId: team.id, teamName: team.name, color: team.color, kills: 0 });
    }
  }

  for (const match of stageMatches(state, stage)) {
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

export function buildDeathsLeaderboard(state: TournamentState, stage: Stage | 'all' = 'league') {
  const teamDeaths = new Map<number, TeamDeathsRow>();
  const playerDeaths = new Map<number, PlayerDeathsRow>();
  const teamByPlayer = new Map<number, number>();

  for (const team of state.teams) {
    teamDeaths.set(team.id, { teamId: team.id, teamName: team.name, color: team.color, deaths: 0 });
    for (const p of team.players) {
      playerDeaths.set(p.id, { playerId: p.id, playerName: p.name, teamId: team.id, teamName: team.name, color: team.color, deaths: 0 });
      teamByPlayer.set(p.id, team.id);
    }
  }

  for (const match of stageMatches(state, stage)) {
    for (const ps of match.players) {
      const row = playerDeaths.get(ps.playerId);
      if (row) row.deaths += ps.deaths;
      const teamId = teamByPlayer.get(ps.playerId);
      if (teamId !== undefined) {
        const trow = teamDeaths.get(teamId);
        if (trow) trow.deaths += ps.deaths;
      }
    }
  }

  return {
    byTeam: [...teamDeaths.values()].sort((a, b) => b.deaths - a.deaths),
    byPlayer: [...playerDeaths.values()].sort((a, b) => b.deaths - a.deaths),
  };
}
