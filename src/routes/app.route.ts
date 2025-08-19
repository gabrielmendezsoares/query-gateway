import { expressiumRoute, loggerUtil } from '../../expressium/index.js';
import { createQueryDataController, getHealthController } from '../controllers/index.js';

export const buildRoutes = (): void => {
  try {
    expressiumRoute.generateRoute(
      'post',
      '/v1/create/query-data',
      [],
      createQueryDataController.createQueryData,
      true
    );

    expressiumRoute.generateRoute(
      'get',
      '/v1/get/health',
      [],
      getHealthController.getHealth,
      true
    );
  } catch (error: unknown) {
    loggerUtil.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
};
