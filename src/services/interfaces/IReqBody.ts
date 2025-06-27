import { IQuery } from "./index.js"

export interface ICreateQueryReqBody {
  databaseName: string;
  sql: string;
}

export interface IGetQueryDataMapReqBody {
  filterMap: Record<keyof IQuery.IQuery, any>;
  globalReplacementMap: IQuery.IQuery;
}
