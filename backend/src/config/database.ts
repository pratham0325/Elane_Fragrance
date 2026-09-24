import mongoose from 'mongoose';
import { env } from './env';
import { logger } from './logger';

const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 3000;

export async function connectDatabase(attempt = 1): Promise<void> {
  try {
    mongoose.set('strictQuery', true);
    await mongoose.connect(env.MONGODB_URI);
    logger.info(`MongoDB connected → ${mongoose.connection.host}/${mongoose.connection.name}`);
  } catch (err) {
    logger.error({ err }, `MongoDB connection failed (attempt ${attempt}/${MAX_RETRIES})`);
    if (attempt >= MAX_RETRIES) {
      logger.error('Exceeded max MongoDB connection retries. Exiting.');
      process.exit(1);
    }
    await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
    return connectDatabase(attempt + 1);
  }
}

mongoose.connection.on('disconnected', () => {
  logger.warn('MongoDB disconnected');
});

export async function disconnectDatabase(): Promise<void> {
  await mongoose.disconnect();
}
