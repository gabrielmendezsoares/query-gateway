export interface ISuccessQueryData {
  timestamp: string;
  status: true;
  id: number;
  name: string;
  groupName?: string;
  databasesId: number;
  sql: string;
  variableMap?: JSON;
  replacementMap?: JSON;
  isQueryActive: boolean;
  createdAt: string;
  updatedAt: string;
  data: unknown;
}

export interface IErrorQueryData {
  timestamp: string;
  status: false;
  id: number;
  name: string;
  groupName?: string;
  databasesId: number;
  sql: string;
  variableMap?: JSON;
  replacementMap?: JSON;
  isQueryActive: boolean;
  createdAt: string;
  updatedAt: string;
  message: string;
  suggestion: string;
}
