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
 * - API version validation
 * - Route path construction with version prefixing
 * - Authorization middleware application
 * - Role-based access control
 * - Custom middleware integration
 * - Controller wrapping for service handlers
 * 
 * The function builds routes following the pattern /<version>/<url> and applies
 * middleware in the correct sequence based on configuration.
 * 
 * @param routeMap - Complete route configuration object with the following properties:
 * @param routeMap.method - HTTP method (get, post, put, delete, etc.).
 * @param routeMap.version - API version identifier (e.g., 'v1', 'v2').
 * @param routeMap.url - Endpoint path excluding version prefix.
 * @param routeMap.serviceHandler - Business logic function.
 * @param routeMap.requiresAuthorization - Whether authorization is required (default: true).
 * @param routeMap.roleList - User roles allowed to access this route.
 * @param routeMap.middlewareHandlerList - Additional middleware functions.
 */
export const generateRoute = (
  { 
    method, 
    version,
    url,
    serviceHandler, 
    requiresAuthorization = true,
    roleList,
    middlewareHandlerList = [], 
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

    (router as any)[method](`/${ version }/${ url }`, getAuthorization, ...middlewareHandlerList, appController.generateController(serviceHandler));
  } else {
    (router as any)[method](`/${ version }/${ url }`, ...middlewareHandlerList, appController.generateController(serviceHandler));
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
