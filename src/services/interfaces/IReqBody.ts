import { query_gateway_queries } from "@prisma/client/storage/index.js";

export interface ICreateQueryDataReqBody { filterMap: Record<keyof query_gateway_queries, any>; }
