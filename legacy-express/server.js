const express = require('express');
const session = require('express-session');
const path = require('path');
const config = require('./src/config');
const db = require('./src/db');
const apiRoutes = require('./src/routes');

db.load();

const app = express();
app.use(express.json());
app.use(
  session({
    secret: config.sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 * 12 }, // 12 hours
  })
);

app.use('/api', apiRoutes);

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin', 'dashboard.html'));
});

app.use(express.static(path.join(__dirname, 'public')));

app.listen(config.port, () => {
  console.log(`Mini Militia Season 2 tournament manager running at http://localhost:${config.port}`);
  console.log(`Admin login: ${config.admin.username} / ${config.admin.password}`);
});
