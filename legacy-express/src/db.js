const fs = require('fs');
const path = require('path');
const { generateLeagueSchedule } = require('./scheduler');

const DATA_DIR = path.join(__dirname, '..', 'data');
const DATA_FILE = path.join(DATA_DIR, 'tournament.json');

const SEED_TEAMS = [
  { id: 1, name: 'Eldo x Rado', color: 'Red', emoji: '🔴', players: [{ id: 1, name: 'Sangeeth' }, { id: 2, name: 'Vishnu EK' }] },
  { id: 2, name: 'Fight Club', color: 'Blue', emoji: '🔵', players: [{ id: 3, name: 'Musthafa' }, { id: 4, name: 'Adarsh KT' }] },
  { id: 3, name: 'Death Dealers', color: 'Green', emoji: '🟢', players: [{ id: 5, name: 'Sinan' }, { id: 6, name: 'Safvan' }] },
  { id: 4, name: 'Doodle Army', color: 'Yellow', emoji: '🟡', players: [{ id: 7, name: 'Vishnu Shaji' }, { id: 8, name: 'Cheriyan' }] },
  { id: 5, name: 'Double Barrel', color: 'Purple', emoji: '🟣', players: [{ id: 9, name: 'Shimal' }, { id: 10, name: 'Praveen' }] },
  { id: 6, name: 'Deadly Duo', color: 'Orange', emoji: '🟠', players: [{ id: 11, name: 'Savad' }, { id: 12, name: 'Nishan' }] },
  { id: 7, name: 'Nexus Avengers', color: 'Black', emoji: '⚫', players: [{ id: 13, name: 'Abhishek' }, { id: 14, name: 'Nikhil' }] },
  { id: 8, name: '2 Kings', color: 'Brown', emoji: '🟤', players: [{ id: 15, name: 'Jyodish' }, { id: 16, name: 'Ajmal' }] },
];

function buildInitialState() {
  const teamIds = SEED_TEAMS.map((t) => t.id);
  const schedule = generateLeagueSchedule(teamIds);
  let matchId = 1;
  const matches = schedule.map((m) => ({
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

let state = null;

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

function load() {
  ensureDataDir();
  if (fs.existsSync(DATA_FILE)) {
    try {
      state = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
      return state;
    } catch (err) {
      console.error('Failed to parse tournament.json, reseeding.', err);
    }
  }
  state = buildInitialState();
  save();
  return state;
}

function save() {
  ensureDataDir();
  fs.writeFileSync(DATA_FILE, JSON.stringify(state, null, 2), 'utf8');
}

function getState() {
  if (!state) load();
  return state;
}

function resetTournament() {
  state = buildInitialState();
  save();
  return state;
}

module.exports = { load, save, getState, resetTournament, SEED_TEAMS };
