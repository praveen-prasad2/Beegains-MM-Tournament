function renderMatchCard(match) {
  const statusPill = match.status === 'completed'
    ? '<span class="pill completed">Completed</span>'
    : '<span class="pill upcoming">Upcoming</span>';
  const stagePill = match.stage === 'finals' ? '<span class="pill finals">Finals</span>' : '';
  const label = match.stage === 'league'
    ? `Day ${match.day} · Match ${match.matchNumber}`
    : `Finals Match ${match.matchNumber}`;

  const teamsSorted = match.status === 'completed'
    ? match.teams.slice().sort((a, b) => a.placement - b.placement)
    : match.teams;

  const teamsHtml = teamsSorted
    .map((t, i) => {
      const badge = teamBadge({ name: t.teamName, color: t.color, emoji: t.emoji });
      if (match.status === 'completed') {
        return `<span>${badge} <span class="muted small">${ordinal(t.placement)} · ${t.kills} kills · ${t.points} pts</span></span>`;
      }
      return i > 0 ? `<span class="vs">vs</span> ${badge}` : badge;
    })
    .join(match.status === 'completed' ? '<br/>' : ' ');

  const dateStr = match.date ? escapeHtml(match.date) : '';

  return `<div class="match-card">
    <div class="match-head">
      <span>${label} ${dateStr ? '· ' + dateStr : ''}</span>
      <span>${stagePill} ${statusPill}</span>
    </div>
    <div class="match-teams">${teamsHtml}</div>
    ${match.notes ? `<div class="result-line">${escapeHtml(match.notes)}</div>` : ''}
  </div>`;
}

async function loadSchedule() {
  const leagueEl = document.getElementById('league-matches');
  const finalsSection = document.getElementById('finals-section');
  const finalsEl = document.getElementById('finals-matches');
  try {
    const matches = await api('/matches');
    const league = matches.filter((m) => m.stage === 'league');
    const finals = matches.filter((m) => m.stage === 'finals');

    leagueEl.innerHTML = league.map(renderMatchCard).join('') || '<p class="muted">No league schedule yet.</p>';

    if (finals.length) {
      finalsSection.style.display = '';
      finalsEl.innerHTML = finals.map(renderMatchCard).join('');
    } else {
      finalsSection.style.display = 'none';
    }
  } catch (err) {
    leagueEl.innerHTML = `<p class="status-msg error">${escapeHtml(err.message)}</p>`;
  }
}

loadSchedule();
setInterval(loadSchedule, 15000);
