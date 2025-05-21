import { IQueryData } from "./index.js";

export interface IResponseData {
  timestamp: string;
  status: boolean;
  statusCode: number;
  method: string;
  path: string;
  query: Record<string, any>;
  headers: Record<string, any>;
  body: any;
  message: string;
  suggestion: string;
}

export interface IGetHealthResponseData {
  timestamp: string;
  status: boolean;
  statusCode: number;
  method: string;
  path: string;
  query: Record<string, any>;
  headers: Record<string, any>;
  body: any;
  data: {
    cpuUsage: {
      name: string;
      value: string;
    };
    memoryUsage: {
      name: string;
      value: string;
    };
  };
}

export interface ICreateQueryResponseData {
  timestamp: string;
  status: boolean;
  statusCode: number;
  method: string;
  path: string;
  query: Record<string, any>;
  headers: Record<string, any>;
  body: any;
  data: unknown;
}

export interface IGetQueryDataMapResponseData {
  timestamp: string;
  status: boolean;
  statusCode: number;
  method: string;
  path: string;
  query: Record<string, any>;
  headers: Record<string, any>;
  body: any;
  data: Record<string, IQueryData.ISuccessQueryData | IQueryData.IErrorQueryData>;
}
