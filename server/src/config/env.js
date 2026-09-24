import 'dotenv/config';

const requiredInProduction = ['MONGODB_URI', 'JWT_SECRET', 'REDIS_URL'];

if (process.env.NODE_ENV === 'production') {
  for (const name of requiredInProduction) {
    if (!process.env[name]) {
      throw new Error(`${name} must be configured in production.`);
    }
  }
}

export const env = {
  port: Number(process.env.PORT) || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  mongoUri: process.env.MONGODB_URI,
  jwtSecret: process.env.JWT_SECRET,
  redisUrl: process.env.REDIS_URL,
};
