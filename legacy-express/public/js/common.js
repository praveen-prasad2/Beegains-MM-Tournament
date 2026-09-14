const COLOR_HEX = {
  Red: 'var(--c-red)',
  Blue: 'var(--c-blue)',
  Green: 'var(--c-green)',
  Yellow: 'var(--c-yellow)',
  Purple: 'var(--c-purple)',
  Orange: 'var(--c-orange)',
  Black: 'var(--c-black)',
  Brown: 'var(--c-brown)',
};

async function api(path, opts = {}) {
  const res = await fetch('/api' + path, {
    credentials: 'same-origin',
    headers: opts.body ? { 'Content-Type': 'application/json' } : undefined,
    ...opts,
  });
  const isJson = (res.headers.get('content-type') || '').includes('application/json');
  const data = isJson ? await res.json() : await res.text();
  if (!res.ok) {
    const message = (data && data.error) || `Request failed (${res.status})`;
    throw new Error(message);
  }
  return data;
}

function teamBadge(team, opts = {}) {
  if (!team) return '';
  const dotColor = COLOR_HEX[team.color] || '#888';
  const size = opts.size === 'lg' ? 'font-size:14px;padding:5px 12px 5px 8px;' : '';
  return `<span class="badge" style="${size}"><span class="dot" style="background:${dotColor}"></span>${team.emoji || ''} ${escapeHtml(team.name || team.teamName)}</span>`;
}

function escapeHtml(str) {
  if (str === undefined || str === null) return '';
  return String(str).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

function ordinal(n) {
  if (n === 1) return '1st';
  if (n === 2) return '2nd';
  if (n === 3) return '3rd';
  return n + 'th';
}

function setActiveNav() {
  const page = document.body.dataset.page;
  document.querySelectorAll('nav.tabs a').forEach((a) => {
    if (a.dataset.page === page) a.classList.add('active');
  });
}

document.addEventListener('DOMContentLoaded', setActiveNav);
