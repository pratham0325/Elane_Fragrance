import express, { Application } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import { env, isProd } from './config/env';
import { apiLimiter } from './middleware/rateLimiter.middleware';
import { notFoundHandler, errorHandler } from './middleware/error.middleware';
import routes from './routes';

export function createApp(): Application {
  const app = express();

  app.disable('x-powered-by');
  app.set('trust proxy', 1);

  app.use(helmet());
  app.use(
    cors({
      origin: env.CLIENT_URL,
      credentials: true
    })
  );
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));
  app.use(morgan(isProd ? 'combined' : 'dev'));
  app.use('/api', apiLimiter);

  app.get('/api/health', (_req, res) => {
    res.json({ success: true, message: 'ÉLANÉ API healthy', data: { uptime: process.uptime() } });
  });

  app.use('/api', routes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
