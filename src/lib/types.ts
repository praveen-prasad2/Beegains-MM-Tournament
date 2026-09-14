export type TeamColor = 'Red' | 'Blue' | 'Green' | 'Yellow' | 'Purple' | 'Orange' | 'Black' | 'Brown';

export interface Player {
  id: number;
  name: string;
}

export interface Team {
  id: number;
  name: string;
  color: TeamColor;
  players: Player[];
}

export type Stage = 'league' | 'finals';
export type MatchStatus = 'scheduled' | 'completed';

export interface MatchTeamResult {
  teamId: number;
  placement: 1 | 2 | 3 | null;
  kills: number;
  points: number;
}

export interface PlayerMatchStat {
  playerId: number;
  kills: number;
  deaths: number;
}

export interface Match {
  id: number;
  stage: Stage;
  day: number;
  matchNumber: number;
  status: MatchStatus;
  date: string | null;
  notes: string;
  teams: MatchTeamResult[];
  players: PlayerMatchStat[];
}

export interface AuditEntry {
  id: number;
  matchId: number;
  timestamp: string;
  before: Match;
  after: Match;
}

export interface LeagueState {
  complete: boolean;
  qualifiedTeamIds: number[];
}

export interface TournamentState {
  teams: Team[];
  matches: Match[];
  audit: AuditEntry[];
  league: LeagueState;
  nextIds: { match: number; audit: number };
}

// ---- Derived / view types ----

export interface PointsTableRow {
  teamId: number;
  teamName: string;
  color: TeamColor;
  matchesPlayed: number;
  firsts: number;
  seconds: number;
  thirds: number;
  totalKills: number;
  totalDeaths: number;
  totalPoints: number;
  rank: number;
}

export interface TeamKillsRow {
  teamId: number;
  teamName: string;
  color: TeamColor;
  kills: number;
}

export interface PlayerKillsRow {
  playerId: number;
  playerName: string;
  teamId: number;
  teamName: string;
  color: TeamColor;
  kills: number;
}

export interface TeamDeathsRow {
  teamId: number;
  teamName: string;
  color: TeamColor;
  deaths: number;
}

export interface PlayerDeathsRow {
  playerId: number;
  playerName: string;
  teamId: number;
  teamName: string;
  color: TeamColor;
  deaths: number;
}

export interface SerializedMatchTeam extends MatchTeamResult {
  teamName: string;
  color: TeamColor | null;
}

export interface SerializedPlayerStat extends PlayerMatchStat {
  playerName: string;
  teamId: number | null;
}

export interface SerializedMatch extends Omit<Match, 'teams' | 'players'> {
  teams: SerializedMatchTeam[];
  players: SerializedPlayerStat[];
}
