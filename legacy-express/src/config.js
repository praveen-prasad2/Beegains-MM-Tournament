// Basic app configuration. Override via environment variables if desired.
module.exports = {
  port: process.env.PORT || 3000,
  admin: {
    username: process.env.ADMIN_USERNAME || 'admin',
    password: process.env.ADMIN_PASSWORD || 'militia2025',
  },
  sessionSecret: process.env.SESSION_SECRET || 'mini-militia-season2-secret',
  points: {
    placement: { 1: 10, 2: 5, 3: 3 },
    perKill: 1,
  },
};
