// Auto-scheduler for the league stage.
//
// Rules:
//  - 8 teams, 6 matches each, 3 teams per match, 2 matches per day, 8 days.
//  - No team plays twice in one day.
//  - Rest days spread evenly: every team rests exactly 2 of the 8 days
//    (16 rest-slots / 8 teams = 2 each).
//  - A team that rests on a given day always plays the very next day — i.e.
//    no team gets two consecutive rest days.
//  - Match trios are chosen via backtracking search to avoid repeating the
//    exact same trio of teams across the 16 matches whenever possible.
//  - Day 1 can optionally be pinned to specific matches (e.g. a fixture the
//    organizers already announced); the rest of the schedule is generated
//    around that fixed day.

function combinationsOfTwo(arr: number[]): [number, number][] {
  const out: [number, number][] = [];
  for (let i = 0; i < arr.length; i++) {
    for (let j = i + 1; j < arr.length; j++) {
      out.push([arr[i], arr[j]]);
    }
  }
  return out;
}

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

export interface ForcedDay1 {
  restPair: [number, number];
  trios: [number[], number[]];
}

// Find a sequence of 8 rest-pairs (one per day) where every team rests
// exactly twice and never on two consecutive days. Day 1 may be pinned.
function findRestPairs(teamIds: number[], rng: () => number, forcedPair?: [number, number]): number[][] {
  const days = 8;
  const restCount = new Map<number, number>(teamIds.map((t) => [t, 0]));
  const lastRestDay = new Map<number, number>(teamIds.map((t) => [t, 0]));
  const pairs: (number[] | null)[] = new Array(days).fill(null);

  function backtrack(day: number): boolean {
    if (day > days) {
      return teamIds.every((t) => restCount.get(t) === 2);
    }

    const eligible = teamIds.filter((t) => (restCount.get(t) || 0) < 2 && lastRestDay.get(t) !== day - 1);
    const candidates =
      day === 1 && forcedPair
        ? [forcedPair]
        : shuffle(combinationsOfTwo(eligible), rng);

    for (const [a, b] of candidates) {
      restCount.set(a, (restCount.get(a) || 0) + 1);
      restCount.set(b, (restCount.get(b) || 0) + 1);
      lastRestDay.set(a, day);
      lastRestDay.set(b, day);
      pairs[day - 1] = [a, b];

      if (backtrack(day + 1)) return true;

      restCount.set(a, (restCount.get(a) || 0) - 1);
      restCount.set(b, (restCount.get(b) || 0) - 1);
      pairs[day - 1] = null;
    }
    return false;
  }

  if (!backtrack(1)) {
    throw new Error('Failed to generate a valid rest-day rotation');
  }
  return pairs as number[][];
}

export function generateLeagueSchedule(teamIds: number[], seed = 42, forcedDay1?: ForcedDay1): ScheduledMatch[] {
  if (teamIds.length !== 8) {
    throw new Error('League scheduler requires exactly 8 teams');
  }
  const rng = mulberry32(seed);
  const days = 8;

  const restPairs = findRestPairs(teamIds, rng, forcedDay1?.restPair);

  const usedTrios = new Set<string>();
  const result: ({ matchNumber: number; teams: number[] }[] | null)[] = new Array(days).fill(null);

  function backtrack(day: number): boolean {
    if (day === days) return true;
    const resting = new Set(restPairs[day]);
    const playing = teamIds.filter((t) => !resting.has(t));

    if (day === 0 && forcedDay1) {
      const [a, b] = forcedDay1.trios;
      result[day] = [
        { matchNumber: 1, teams: a },
        { matchNumber: 2, teams: b },
      ];
      usedTrios.add(trioSig(a));
      usedTrios.add(trioSig(b));
      if (backtrack(day + 1)) return true;
      result[day] = null;
      return false;
    }

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
