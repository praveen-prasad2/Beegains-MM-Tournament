(async function redirectIfLoggedIn() {
  try {
    const session = await api('/admin/session');
    if (session.isAdmin) window.location.href = '/admin';
  } catch (err) {
    // ignore
  }
})();

document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const msg = document.getElementById('msg');
  msg.textContent = '';
  msg.className = 'status-msg';
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;
  try {
    await api('/admin/login', { method: 'POST', body: JSON.stringify({ username, password }) });
    window.location.href = '/admin';
  } catch (err) {
    msg.textContent = err.message;
    msg.className = 'status-msg error';
  }
});
