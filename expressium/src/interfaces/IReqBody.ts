/**
 * ## IReqBody
 * 
 * Base interface for HTTP request body objects throughout the application.
 * 
 * @description This empty interface serves as a marker type and foundation for request body
 * type definitions. Specific endpoint request types should extend this interface to ensure
 * consistency while adding their unique properties.
 * 
 * While currently empty, using this as a base type enables:
 * 
 * - Clear identification of request body objects
 * - Type consistency across controllers and services
 * - Future extension with common request properties if needed
 */
export interface IReqBody {}
