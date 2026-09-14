async function loadFinals() {
  const content = document.getElementById('content');
  try {
    const [league, matches] = await Promise.all([api('/league-state'), api('/matches?stage=finals')]);

    if (!league.complete) {
      content.innerHTML = `<div class="card">
        <h2>Finals not started yet</h2>
        <p class="muted">The Finals will appear here once the league stage is complete and the top 3 teams have been determined.</p>
      </div>`;
      return;
    }

    const teams = await api('/teams');
    const qualified = league.qualifiedTeamIds
      .map((id) => teams.find((t) => t.id === id))
      .filter(Boolean);

    const qualifiedHtml = qualified
      .map((t, i) => `<div class="row" style="margin-bottom:6px">${teamBadge(t, { size: 'lg' })} <span class="muted small">Qualified ${ordinal(i + 1)}</span></div>`)
      .join('');

    let matchesHtml = '<p class="muted">No Finals matches have been entered yet.</p>';
    if (matches.length) {
      matchesHtml = matches
        .map((m) => {
          const sorted = m.status === 'completed' ? m.teams.slice().sort((a, b) => a.placement - b.placement) : m.teams;
          const rows = sorted
            .map((t) => {
              const badge = teamBadge({ name: t.teamName, color: t.color, emoji: t.emoji });
              return m.status === 'completed'
                ? `<div class="row between" style="margin-top:6px">${badge}<span class="muted small">${ordinal(t.placement)} · ${t.kills} kills · ${t.points} pts</span></div>`
                : `<div style="margin-top:6px">${badge}</div>`;
            })
            .join('');
          const pill = m.status === 'completed' ? '<span class="pill completed">Completed</span>' : '<span class="pill upcoming">Upcoming</span>';
          return `<div class="match-card">
            <div class="match-head"><span>Finals Match ${m.matchNumber}</span>${pill}</div>
            ${rows}
          </div>`;
        })
        .join('');
    }

    content.innerHTML = `
      <div class="card">
        <h2>🏆 Qualified Teams</h2>
        ${qualifiedHtml}
      </div>
      <div class="card">
        <h2>Finals Matches</h2>
        ${matchesHtml}
      </div>`;
  } catch (err) {
    content.innerHTML = `<div class="card status-msg error">${escapeHtml(err.message)}</div>`;
  }
}

loadFinals();
setInterval(loadFinals, 15000);
