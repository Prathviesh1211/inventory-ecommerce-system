import app from './app.js';
import { connectDatabase } from './config/database.js';
import { env } from './config/env.js';
import { connectRedis } from './config/redis.js';

async function startServer() {
  await connectDatabase();
  await connectRedis();
  app.listen(env.port, () => {
    console.log(`API listening on http://localhost:${env.port}`);
  });
}

startServer().catch((error) => {
  console.error('Failed to start API:', error.message);
  process.exit(1);
});
