import { NextFunction, Request, Response } from 'express';
import { generateRoute, router, IRouteMap, dateTimeFormatterUtil } from '../../expressium/src/index.js';
import { appService, createQueryService, getQueryDataMapService } from "../services/index.js";

export const buildRoutes = (): void => {
  try {
    generateRoute(
      {
       method: 'get',
        version: 'v1',
        url: 'get/health',
        serviceHandler: appService.getHealth,
        requiresAuthorization: true
      } as IRouteMap.IRouteMap
    );

    generateRoute(
      {
        method: 'post',
        version: 'v1',
        url: 'create/query',
        serviceHandler: createQueryService.createQuery,
        requiresAuthorization: true
      } as IRouteMap.IRouteMap
    );

    generateRoute(
      {
        method: 'post',
        version: 'v1',
        url: 'get/query-data-map',
        serviceHandler: getQueryDataMapService.getQueryDataMap,
        requiresAuthorization: true
      } as IRouteMap.IRouteMap
    );

    router.use(
      (
        req: Request, 
        res: Response, 
        _next: NextFunction
      ): void => {
        res
          .status(404)
          .json(
            {
              timestamp: dateTimeFormatterUtil.formatAsDayMonthYearHoursMinutesSeconds(dateTimeFormatterUtil.getLocalDate()),
              status: false,
              statusCode: 404,
              method: req.method,
              path: req.originalUrl || req.url,
              query: req.query,
              headers: req.headers,
              body: req.body,
              message: 'Route not found.',
              suggestion: 'Please check the URL and HTTP method to ensure they are correct.'
            }
          );
      }
    );
  } catch (error: unknown) {
    console.log(`Route | Timestamp: ${ dateTimeFormatterUtil.formatAsDayMonthYearHoursMinutesSeconds(dateTimeFormatterUtil.getLocalDate()) } | Name: buildRoutes | Error: ${ error instanceof Error ? error.message : String(error) }`);
    process.exit(1);
  }
};
