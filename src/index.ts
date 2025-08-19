import cors from 'cors';
import express, { Express, Request, Response } from 'express';
import { createRequire } from 'module';
import { expressiumRoute, loggerUtil, startServer, createServer } from '../expressium/index.js';
import { appRoute } from './routes/index.js';

const require = createRequire(import.meta.url);

const helmet = require('helmet');

const buildServer = async (): Promise<void> => {
  try {
    const app = express();

    app.use(cors());
    app.use(helmet({ contentSecurityPolicy: { directives: { upgradeInsecureRequests: null } } }));
    app.use(express.json());
    appRoute.buildRoutes();
    app.use('/api', expressiumRoute.router);

    app.use(
      (
        _req: Request, 
        res: Response
      ): void => {
        res
          .status(404)
          .json(
            {
              message: 'Route not found.',
              suggestion: 'Please check the URL and HTTP method to ensure they are correct.'
            }
          );
      }
    );

    const serverInstance = await createServer(app);
    
    startServer(serverInstance as Express);
  } catch (error: unknown) {
    loggerUtil.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
};

buildServer();
