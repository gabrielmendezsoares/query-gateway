import { query_gateway_queries } from "@prisma/client/storage/index.js";

export interface ICreateQueryDataReqBody { 
  globalReplacementMap?: Record<keyof query_gateway_queries, any>;
  filterMap: Record<keyof query_gateway_queries, any>;
}
