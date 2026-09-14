async function loadPointsTable() {
  const body = document.getElementById('table-body');
  const banner = document.getElementById('zone-banner');
  try {
    const { table, league } = await api('/points-table');
    if (league.complete) {
      const names = table
        .filter((r) => league.qualifiedTeamIds.includes(r.teamId))
        .map((r) => `${r.emoji} ${r.teamName}`)
        .join(', ');
      banner.innerHTML = `<div class="zone-banner">🏆 League stage complete — Finals Zone qualifiers: ${escapeHtml(names)}</div>`;
    } else {
      banner.innerHTML = '';
    }

    if (table.every((r) => r.matchesPlayed === 0)) {
      body.innerHTML = '<tr><td colspan="8" class="muted">No league matches played yet. Check the Schedule tab for upcoming fixtures.</td></tr>';
      return;
    }

    body.innerHTML = table
      .map((r, idx) => {
        const qualZone = idx < 3;
        return `<tr class="${qualZone ? 'qualified' : ''}">
          <td>${r.rank}</td>
          <td>${teamBadge({ name: r.teamName, color: r.color, emoji: r.emoji })}</td>
          <td>${r.matchesPlayed}</td>
          <td>${r.firsts}</td>
          <td>${r.seconds}</td>
          <td>${r.thirds}</td>
          <td>${r.totalKills}</td>
          <td><strong>${r.totalPoints}</strong></td>
        </tr>`;
      })
      .join('');
  } catch (err) {
    body.innerHTML = `<tr><td colspan="8" class="status-msg error">${escapeHtml(err.message)}</td></tr>`;
  }
}

loadPointsTable();
setInterval(loadPointsTable, 15000);
