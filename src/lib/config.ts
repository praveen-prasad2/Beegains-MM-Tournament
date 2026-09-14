export const config = {
  admin: {
    username: process.env.ADMIN_USERNAME || 'admin',
    password: process.env.ADMIN_PASSWORD || 'militia2025',
  },
  sessionSecret: process.env.SESSION_SECRET || 'mini-militia-season2-secret',
  points: {
    placement: { 1: 10, 2: 5, 3: 3 } as Record<number, number>,
    perKill: 1,
  },
};
