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

function combinationsOfThree(arr) {
  const out = [];
  for (let i = 0; i < arr.length; i++) {
    for (let j = i + 1; j < arr.length; j++) {
      for (let k = j + 1; k < arr.length; k++) {
        out.push([arr[i], arr[j], arr[k]]);
      }
    }
  }
  return out;
}

// Given 6 team ids, return all ways to split them into two unordered trios
// (10 possible splits for 6 items).
function allSplitsOfSix(six) {
  const splits = [];
  const trios = combinationsOfThree(six);
  const seen = new Set();
  for (const trioA of trios) {
    const remaining = six.filter((t) => !trioA.includes(t));
    const key = [...trioA].sort().join(',') + '|' + [...remaining].sort().join(',');
    const altKey = [...remaining].sort().join(',') + '|' + [...trioA].sort().join(',');
    if (seen.has(key) || seen.has(altKey)) continue;
    seen.add(key);
    splits.push([trioA, remaining]);
  }
  return splits;
}

function shuffle(arr, rng) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function trioSig(trio) {
  return [...trio].sort((a, b) => a - b).join('-');
}

// Simple deterministic-ish PRNG so results are reproducible per seed.
function mulberry32(seed) {
  let a = seed;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Generate the 16-match / 8-day league schedule.
 * @param {number[]} teamIds - exactly 8 team ids, in a fixed order.
 * @param {number} [seed] - RNG seed for shuffling trio choices.
 * @returns {Array<{day:number, matchNumber:number, teams:number[]}>}
 */
function generateLeagueSchedule(teamIds, seed = 42) {
  if (teamIds.length !== 8) {
    throw new Error('League scheduler requires exactly 8 teams');
  }
  const rng = mulberry32(seed);
  const days = 8;

  // Rest pairs: adjacent pairs on the fixed 8-cycle -> each team rests
  // exactly twice, evenly distributed.
  const restPairs = [];
  for (let d = 0; d < days; d++) {
    restPairs.push([teamIds[d], teamIds[(d + 1) % 8]]);
  }

  const usedTrios = new Set();
  const result = new Array(days);

  function backtrack(day) {
    if (day === days) return true;
    const resting = new Set(restPairs[day]);
    const playing = teamIds.filter((t) => !resting.has(t));
    const splits = shuffle(allSplitsOfSix(playing), rng);

    // Prefer splits where neither trio has been used before; fall back to
    // splits with the fewest repeats if none are perfectly fresh.
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

  const matches = [];
  for (let day = 0; day < days; day++) {
    for (const m of result[day]) {
      matches.push({
        day: day + 1,
        matchNumber: m.matchNumber,
        teams: m.teams,
      });
    }
  }
  return matches;
}

module.exports = { generateLeagueSchedule, allSplitsOfSix, trioSig };
