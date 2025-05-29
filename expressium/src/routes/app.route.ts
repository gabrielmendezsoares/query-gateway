import { NextFunction, Request, Response, Router } from 'express';
import { appController } from '../controllers/index.js';
import { IResponse, IResponseData } from '../interfaces/index.js';
import { IRouteMap } from './interfaces/index.js';
import { appMiddleware } from '../middlewares/index.js';
import { appService } from '../services/index.js';
import { dateTimeFormatterUtil } from '../utils/index.js';

const VERSION_REGEX = /^v[0-9]+$/;

/**
 * ## router
 * 
 * Primary Express router for the application's API endpoints.
 * 
 * @description This router instance manages all API routes for the application.
 * It serves as the central registration point for endpoints and is exported
 * for mounting in the main Express application.
 * 
 * The router handles versioned API paths and enforces consistent routing patterns
 * across the application.
 */
export const router = Router();

/**
 * ## generateRoute
 * 
 * Registers a route with the Express router based on configuration.
 * 
 * @description Creates and registers API routes using a standardized configuration object.
 * This function handles:
 * 
 * - HTTP method definition
 * - Version definition
 * - URL path definition
 * - Service handler binding
 * - Authorization handling
 * - Dynamic segment definition
 * - Role-based access control
 * - Middleware handler binding
 * 
 * Middleware ordering is preserved, to ensure that authorization and other
 * middleware functions are executed in the correct sequence before
 * the service handler is invoked.
 * 
 * @param routeMap - Configuration object defining the route.
 * @param routeMap.method - HTTP method (e.g., 'get', 'post', etc.).
 * @param routeMap.version - Version (e.g., 'v1', 'v2', etc.).
 * @param routeMap.url - URL path.
 * @param routeMap.serviceHandler - Business logic function.
 * @param routeMap.requiresAuthorization - Whether authorization is required (default: true).
 * @param routeMap.dynamicSegmentList - List of dynamic segments in the URL.
 * @param routeMap.roleList - List of roles allowed to access the route (optional).
 * @param routeMap.middlewareHandlerList - List of middleware functions to apply to the route (optional).
 */
export const generateRoute = (
  { 
    method, 
    version,
    url,
    serviceHandler, 
    requiresAuthorization = true,
    dynamicSegmentList = [],
    roleList,
    middlewareHandlerList = []
  }: IRouteMap.IRouteMap
): void => {
  if (!VERSION_REGEX.test(version)) {
    console.log(`Server | Timestamp: ${ dateTimeFormatterUtil.formatAsDayMonthYearHoursMinutesSeconds(dateTimeFormatterUtil.getLocalDate()) } | Error: Invalid API version - ${ version }`);

    return;
  }

  if (requiresAuthorization) {
    const getAuthorization = (
      req: Request, 
      res: Response, 
      next: NextFunction
    ): Promise<IResponse.IResponse<IResponseData.IResponseData> | void> => {
      return appMiddleware.getAuthorization(req, res, next, roleList);
    };

    (router as any)[method](`/${ version }/${ url }/${ dynamicSegmentList.map((dynamicSegment: string): string => `:${ dynamicSegment }`).join('/') }`, getAuthorization, ...middlewareHandlerList, appController.generateController(serviceHandler));
  } else {
    (router as any)[method](`/${ version }/${ url }/${ dynamicSegmentList.map((dynamicSegment: string): string => `:${ dynamicSegment }`).join('/') }`, ...middlewareHandlerList, appController.generateController(serviceHandler));
  }
};

generateRoute(
  {
    method: 'get',
    version: 'v1',
    url: 'get/authentication',
    serviceHandler: appService.getAuthentication,
    requiresAuthorization: false
  } as IRouteMap.IRouteMap
);
