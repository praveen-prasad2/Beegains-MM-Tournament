import { getDb } from './mongodb';
import { generateLeagueSchedule, type ForcedDay1 } from './scheduler';
import type { Match, Team, TournamentState } from './types';

const COLLECTION = 'tournamentState';
const DOC_ID = 'season2';

export const SEED_TEAMS: Team[] = [
  { id: 1, name: 'Eldo x Rado', color: 'Red', players: [{ id: 1, name: 'Sangeeth' }, { id: 2, name: 'Vishnu EK' }] },
  { id: 2, name: 'Fight Club', color: 'Blue', players: [{ id: 3, name: 'Musthafa' }, { id: 4, name: 'Adarsh KT' }] },
  { id: 3, name: 'Death Dealers', color: 'Green', players: [{ id: 5, name: 'Sinan' }, { id: 6, name: 'Safvan' }] },
  { id: 4, name: 'Doodle Army', color: 'Yellow', players: [{ id: 7, name: 'Vishnu Shaji' }, { id: 8, name: 'Cheriyan' }] },
  { id: 5, name: 'Double Barrel', color: 'Purple', players: [{ id: 9, name: 'Shimal' }, { id: 10, name: 'Praveen' }] },
  { id: 6, name: 'Deadly Duo', color: 'Orange', players: [{ id: 11, name: 'Savad' }, { id: 12, name: 'Nishan' }] },
  { id: 7, name: 'Nexus Avengers', color: 'Black', players: [{ id: 13, name: 'Abhishek' }, { id: 14, name: 'Nikhil' }] },
  { id: 8, name: '2 Kings', color: 'Brown', players: [{ id: 15, name: 'Jyodish' }, { id: 16, name: 'Ajmal' }] },
];

// Day 1 fixtures are pinned to what was already announced:
//   Match 1: Eldo x Rado vs Fight Club vs Deadly Duo
//   Match 2: Double Barrel vs Nexus Avengers vs 2 Kings
//   Resting: Death Dealers, Doodle Army
const DAY1_FIXED: ForcedDay1 = {
  restPair: [3, 4],
  trios: [
    [1, 2, 6],
    [5, 7, 8],
  ],
};

function buildInitialState(): TournamentState {
  const teamIds = SEED_TEAMS.map((t) => t.id);
  const schedule = generateLeagueSchedule(teamIds, 42, DAY1_FIXED);
  let matchId = 1;
  const matches: Match[] = schedule.map((m) => ({
    id: matchId++,
    stage: 'league',
    day: m.day,
    matchNumber: m.matchNumber,
    status: 'scheduled',
    date: null,
    notes: '',
    teams: m.teams.map((teamId) => ({ teamId, placement: null, kills: 0, points: 0 })),
    players: [],
  }));

  return {
    teams: SEED_TEAMS,
    matches,
    audit: [],
    league: { complete: false, qualifiedTeamIds: [] },
    nextIds: { match: matchId, audit: 1 },
  };
}

async function collection() {
  const db = await getDb();
  return db.collection<TournamentState & { _id: string }>(COLLECTION);
}

export async function loadState(): Promise<TournamentState> {
  const col = await collection();
  const doc = await col.findOne({ _id: DOC_ID });
  if (doc) {
    const { teams, matches, audit, league, nextIds } = doc;
    return { teams, matches, audit, league, nextIds };
  }
  const initial = buildInitialState();
  await saveState(initial);
  return initial;
}

export async function saveState(state: TournamentState): Promise<void> {
  const col = await collection();
  await col.updateOne({ _id: DOC_ID }, { $set: state }, { upsert: true });
}

export async function resetState(): Promise<TournamentState> {
  const initial = buildInitialState();
  await saveState(initial);
  return initial;
}
