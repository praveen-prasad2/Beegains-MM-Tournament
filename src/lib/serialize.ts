import type { Match, TournamentState } from './types';

export function findMatch(state: TournamentState, id: number): Match | undefined {
  return state.matches.find((m) => m.id === id);
}

export function playerTeam(state: TournamentState, playerId: number) {
  return state.teams.find((t) => t.players.some((p) => p.id === playerId));
}

export function serializeMatch(state: TournamentState, match: Match) {
  return {
    ...match,
    teams: match.teams.map((mt) => {
      const team = state.teams.find((t) => t.id === mt.teamId);
      return {
        ...mt,
        teamName: team ? team.name : 'Unknown',
        color: team ? team.color : null,
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
