/**
 * ## IRouteMap
 * 
 * Interface defining the structure of route configuration objects.
 * 
 * @description This interface specifies the required and optional properties for
 * configuring API routes in the application. It serves as a contract for creating
 * consistent route definitions that can be processed by the route generation system.
 * 
 * Each property plays a specific role:
 * 
 * - method: Defines the HTTP method (GET, POST, etc.)
 * - version: Specifies the API version for URL construction
 * - url: Defines the endpoint path (excluding version prefix)
 * - serviceHandler: References the function containing the endpoint's business logic
 * - requiresAuthorization: Controls whether authentication is required
 * - roleList: Specifies permitted user roles for authorization
 * - middlewareHandlerList: Defines additional processing middleware
 * 
 * This structure enables declarative route definitions that are both maintainable
 * and self-documenting.
 */
export interface IRouteMap {
  method: string,
  version: string,
  url: string,
  serviceHandler: Function,
  requiresAuthorization?: boolean
  roleList?: string[],
  middlewareHandlerList?: Function[],
};
