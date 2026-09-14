// Auto-scheduler for the league stage.
//
// Rules:
//  - 8 teams, 6 matches each, 3 teams per match, 2 matches per day, 8 days.
//  - No team plays twice in one day.
//  - Rest days spread evenly: with 8 teams resting 2-per-day over 8 days,
//    every team rests exactly 2 days (16 rest-slots / 8 teams = 2 each).
//    This is achieved by resting adjacent pairs of a fixed 8-cycle of teams,
//    which is a 2-regular graph on 8 vertices (every team touches exactly
//    two rest-pairs).
//  - Match trios are chosen via backtracking search to avoid repeating the
//    exact same trio of teams across the 16 matches whenever possible.

function combinationsOfThree(arr: number[]): number[][] {
  const out: number[][] = [];
  for (let i = 0; i < arr.length; i++) {
    for (let j = i + 1; j < arr.length; j++) {
      for (let k = j + 1; k < arr.length; k++) {
        out.push([arr[i], arr[j], arr[k]]);
      }
    }
  }
  return out;
}

function allSplitsOfSix(six: number[]): [number[], number[]][] {
  const splits: [number[], number[]][] = [];
  const trios = combinationsOfThree(six);
  const seen = new Set<string>();
  for (const trioA of trios) {
    const remaining = six.filter((t) => !trioA.includes(t));
    const key = [...trioA].sort((a, b) => a - b).join(',') + '|' + [...remaining].sort((a, b) => a - b).join(',');
    const altKey = [...remaining].sort((a, b) => a - b).join(',') + '|' + [...trioA].sort((a, b) => a - b).join(',');
    if (seen.has(key) || seen.has(altKey)) continue;
    seen.add(key);
    splits.push([trioA, remaining]);
  }
  return splits;
}

function shuffle<T>(arr: T[], rng: () => number): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function trioSig(trio: number[]): string {
  return [...trio].sort((a, b) => a - b).join('-');
}

function mulberry32(seed: number): () => number {
  let a = seed;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface ScheduledMatch {
  day: number;
  matchNumber: number;
  teams: number[];
}

export function generateLeagueSchedule(teamIds: number[], seed = 42): ScheduledMatch[] {
  if (teamIds.length !== 8) {
    throw new Error('League scheduler requires exactly 8 teams');
  }
  const rng = mulberry32(seed);
  const days = 8;

  const restPairs: number[][] = [];
  for (let d = 0; d < days; d++) {
    restPairs.push([teamIds[d], teamIds[(d + 1) % 8]]);
  }

  const usedTrios = new Set<string>();
  const result: ({ matchNumber: number; teams: number[] }[] | null)[] = new Array(days).fill(null);

  function backtrack(day: number): boolean {
    if (day === days) return true;
    const resting = new Set(restPairs[day]);
    const playing = teamIds.filter((t) => !resting.has(t));
    const splits = shuffle(allSplitsOfSix(playing), rng);

    const scored = splits
      .map((split) => {
        const [a, b] = split;
        const repeats = (usedTrios.has(trioSig(a)) ? 1 : 0) + (usedTrios.has(trioSig(b)) ? 1 : 0);
        return { split, repeats };
      })
      .sort((x, y) => x.repeats - y.repeats);

    for (const { split } of scored) {
      const [a, b] = split;
      const sigA = trioSig(a);
      const sigB = trioSig(b);
      const addedA = !usedTrios.has(sigA);
      const addedB = !usedTrios.has(sigB);
      usedTrios.add(sigA);
      usedTrios.add(sigB);
      result[day] = [
        { matchNumber: 1, teams: a },
        { matchNumber: 2, teams: b },
      ];
      if (backtrack(day + 1)) return true;
      if (addedA) usedTrios.delete(sigA);
      if (addedB) usedTrios.delete(sigB);
      result[day] = null;
    }
    return false;
  }

  const ok = backtrack(0);
  if (!ok) {
    throw new Error('Failed to generate a valid league schedule');
  }

  const matches: ScheduledMatch[] = [];
  for (let day = 0; day < days; day++) {
    for (const m of result[day]!) {
      matches.push({ day: day + 1, matchNumber: m.matchNumber, teams: m.teams });
    }
  }
  return matches;
}
