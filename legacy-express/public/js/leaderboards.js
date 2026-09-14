function rankRows(rows, columns) {
  if (!rows.length) return `<tr><td colspan="${columns}" class="muted">No data yet.</td></tr>`;
  return rows
    .map((r, i) => {
      const cells = [];
      cells.push(`<td>${i + 1}</td>`);
      if (r.playerName) {
        cells.push(`<td>${escapeHtml(r.playerName)}</td>`);
        cells.push(`<td>${teamBadge({ name: r.teamName, color: r.color, emoji: r.emoji })}</td>`);
      } else {
        cells.push(`<td>${teamBadge({ name: r.teamName, color: r.color, emoji: r.emoji })}</td>`);
      }
      cells.push(`<td><strong>${r.kills !== undefined ? r.kills : r.deaths}</strong></td>`);
      return `<tr>${cells.join('')}</tr>`;
    })
    .join('');
}

async function loadLeaderboards() {
  const stage = document.getElementById('stage-select').value;
  try {
    const [kills, deaths] = await Promise.all([
      api(`/leaderboard/kills?stage=${stage}`),
      api(`/leaderboard/deaths?stage=${stage}`),
    ]);
    document.getElementById('kills-team-body').innerHTML = rankRows(kills.byTeam, 3);
    document.getElementById('kills-player-body').innerHTML = rankRows(kills.byPlayer, 4);
    document.getElementById('deaths-team-body').innerHTML = rankRows(deaths.byTeam, 3);
    document.getElementById('deaths-player-body').innerHTML = rankRows(deaths.byPlayer, 4);
  } catch (err) {
    console.error(err);
  }
}

document.getElementById('stage-select').addEventListener('change', loadLeaderboards);
loadLeaderboards();
setInterval(loadLeaderboards, 15000);
