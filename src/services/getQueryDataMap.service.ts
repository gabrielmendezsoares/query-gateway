import { NextFunction, Request, Response } from 'express';
import momentTimezone from 'moment-timezone';
import OracleDB from 'oracledb';
import { QueryTypes, Sequelize, Transaction } from 'sequelize';
import { PrismaClient } from '@prisma/client/storage/client.js';
import { cryptographyUtil } from '../../expressium/src/index.js';
import { IQuery, IQueryData, IReqBody, IResponse, IResponseData } from './interfaces/index.js';

const prisma = new PrismaClient();

const extractParameter = <T>(
  req: Request, 
  serviceName: string, 
  parameterName: keyof IQuery.IQuery, 
  defaultValue: T | null
): T | undefined => {
  if (
    Object.isObject(req.body as unknown) 
    && Object.isObject((req.body as IReqBody.IGetQueryDataMapReqBody).globalReplacementMap) 
    && (req.body as IReqBody.IGetQueryDataMapReqBody).globalReplacementMap[parameterName] !== undefined
  ) {
    return (req.body as IReqBody.IGetQueryDataMapReqBody).globalReplacementMap[parameterName] as T;
  }
  
  if (
    Object.isObject(req.body as unknown) 
    && Object.isObject((req.body as any)[serviceName]) 
    && (req.body as any)[serviceName][parameterName] !== undefined
  ) {
    return (req.body as any)[serviceName][parameterName] as T;
  }
  
  return defaultValue !== null ? defaultValue as T : undefined;
};

const processQueryData = async (
  query: IQuery.IQuery,
  req: Request,
  timestamp: string
): Promise<[string, IQueryData.ISuccessQueryData | IQueryData.IErrorQueryData]> => {
  const {
    id,
    name,
    group_name,
    databases_id,
    sql,
    variable_map,
    replacement_map,
    is_query_active,
    created_at,
    updated_at
  } = query;

  const parameterMap = { 
    sql: sql,
    variableMap: extractParameter<JSON | undefined>(req, name, 'variable_map', variable_map),
    replacementMap: extractParameter<JSON | undefined>(req, name, 'replacement_map', replacement_map)
  };

  let sequelizeInstance: Sequelize | undefined;

  try {
    const database = await prisma.databases.findUnique({ where: { id: databases_id } });
    
    if (!database) {
      return [
        name,
        {
          timestamp, 
          status: false,
          id,
          name,
          groupName: group_name !== null ? group_name : undefined,
          databasesId: databases_id,
          sql: parameterMap.sql,
          variableMap: parameterMap.variableMap,
          replacementMap: parameterMap.replacementMap,
          isQueryActive: is_query_active,
          createdAt: created_at,
          updatedAt: updated_at,
          message: 'Unexpected error occurred while processing the data.',
          suggestion: 'Please try again later. If this issue persists, contact our support team for assistance.'
        }
      ];
    }

    switch (database.database_type) {
      case 'MySQL':
        if (parameterMap.variableMap) {
          const variableDeclaration = Object
            .entries(parameterMap.variableMap)
            .reduce(
              (accumulator: string, [key, value]: [string, any]): string => {
                accumulator += `SET @${ key } = ${ Object.isString(value) ? "'" : '' }${ value }${ Object.isString(value) ? "'" : '' }; `;

                return accumulator;
              },
              ``
            );

          parameterMap.sql = variableDeclaration + parameterMap.sql;
        }

        sequelizeInstance = new Sequelize(
          {
            host: cryptographyUtil.decryptFromAes256Cbc(
              process.env.DATABASES_HOST_ENCRYPTION_KEY as string, 
              process.env.DATABASES_HOST_IV_STRING as string, 
              new TextDecoder().decode(database.host as Uint8Array)
            ),
            port: database.port ? database.port : undefined,
            database: cryptographyUtil.decryptFromAes256Cbc(
              process.env.DATABASES_DATABASE_ENCRYPTION_KEY as string, 
              process.env.DATABASES_DATABASE_IV_STRING as string, 
              new TextDecoder().decode(database.database as Uint8Array)
            ),
            username: cryptographyUtil.decryptFromAes256Cbc(
              process.env.DATABASES_USERNAME_ENCRYPTION_KEY as string,
              process.env.DATABASES_USERNAME_IV_STRING as string,
              new TextDecoder().decode(database.username as Uint8Array)
            ),
            password: cryptographyUtil.decryptFromAes256Cbc(
              process.env.DATABASES_PASSWORD_ENCRYPTION_KEY as string, 
              process.env.DATABASES_PASSWORD_IV_STRING as string, 
              new TextDecoder().decode(database.password as Uint8Array)
            ),
            dialect: 'mysql',
            dialectOptions: { 
              options: { 
                encrypt: false,
                requestTimeout: 30_000
              }
            },
            define: { freezeTableName: true }
          }
        );

        break;

      case 'Oracle':
        sequelizeInstance = new Sequelize(
          {
            port: database.port ? database.port : undefined,
            username: cryptographyUtil.decryptFromAes256Cbc(
              process.env.DATABASES_USERNAME_ENCRYPTION_KEY as string, 
              process.env.DATABASES_USERNAME_IV_STRING as string, 
              new TextDecoder().decode(database.username)
            ),
            password: cryptographyUtil.decryptFromAes256Cbc(
              process.env.DATABASES_PASSWORD_ENCRYPTION_KEY as string, 
              process.env.DATABASES_PASSWORD_IV_STRING as string, 
              new TextDecoder().decode(database.password)
            ),
            dialect: 'oracle',
            dialectModule: OracleDB,
            dialectOptions: {
              connectString: cryptographyUtil.decryptFromAes256Cbc(
                process.env.DATABASES_CONNECT_STRING_ENCRYPTION_KEY as string, 
                process.env.DATABASES_CONNECT_STRING_IV_STRING as string, 
                new TextDecoder().decode(database.connect_string as Uint8Array)
              ),
              options: { 
                encrypt: false,
                requestTimeout: 30_000
              }
            },
            define: { freezeTableName: true }
          }
        );

        break;

      case 'SQL Server':
        if (parameterMap.variableMap) {
          const variableDeclaration = Object
            .entries(parameterMap.variableMap)
            .reduce(
              (accumulator: string, [key, value]: [string, { dataType: string, value: any }]): string => {
                if (Object.isObject(value) && Object.isString(value.dataType)) {
                  accumulator += `DECLARE @${ key } ${ value.dataType } = ${ Object.isString(value.value) ? "'" : '' }${ value.value }${ Object.isString(value.value) ? "'" : '' }; `;
                }

                return accumulator;
              },
              ``
            );

          parameterMap.sql = variableDeclaration + parameterMap.sql;
        }

        sequelizeInstance = new Sequelize(
          {
            host: cryptographyUtil.decryptFromAes256Cbc(
              process.env.DATABASES_HOST_ENCRYPTION_KEY as string, 
              process.env.DATABASES_HOST_IV_STRING as string, 
              new TextDecoder().decode(database.host as Uint8Array)
            ),
            port: database.port ? database.port : undefined,
            database: cryptographyUtil.decryptFromAes256Cbc(
              process.env.DATABASES_DATABASE_ENCRYPTION_KEY as string, 
              process.env.DATABASES_DATABASE_IV_STRING as string, 
              new TextDecoder().decode(database.database as Uint8Array)
            ),
            username: cryptographyUtil.decryptFromAes256Cbc(
              process.env.DATABASES_USERNAME_ENCRYPTION_KEY as string,
              process.env.DATABASES_USERNAME_IV_STRING as string,
              new TextDecoder().decode(database.username as Uint8Array)
            ),
            password: cryptographyUtil.decryptFromAes256Cbc(
              process.env.DATABASES_PASSWORD_ENCRYPTION_KEY as string, 
              process.env.DATABASES_PASSWORD_IV_STRING as string, 
              new TextDecoder().decode(database.password as Uint8Array)
            ),
            dialect: 'mssql',
            dialectOptions: { 
              options: { 
                encrypt: false,
                requestTimeout: 30_000
              }
            },
            define: { freezeTableName: true }
          }
        );

        break;
    
      default:
        return [
          name,
          {
            timestamp,
            status: false,
            id,
            name,
            groupName: group_name !== null ? group_name : undefined,
            databasesId: databases_id,
            sql: parameterMap.sql,
            variableMap: parameterMap.variableMap,
            replacementMap: parameterMap.replacementMap,
            isQueryActive: is_query_active,
            createdAt: created_at,
            updatedAt: updated_at,
            message: 'Unexpected error occurred while processing the data.',
            suggestion: 'Please try again later. If this issue persists, contact our support team for assistance.'
          }
        ];
    }
    
    const transaction: Transaction = await sequelizeInstance.transaction();

    try {
      const queryResult = await sequelizeInstance.query<Promise<object[]>>(
        parameterMap.sql, 
        { 
          type: QueryTypes.SELECT,
          replacements: parameterMap.replacementMap as Record<string, any> | undefined,
          transaction
        }
      );

      await transaction.commit();

      return [
        name, 
        {
          timestamp,
          status: true,
          id,
          name,
          groupName: group_name !== null ? group_name : undefined,
          databasesId: databases_id,
          sql: parameterMap.sql,
          variableMap: parameterMap.variableMap,
          replacementMap: parameterMap.replacementMap,
          isQueryActive: is_query_active,
          createdAt: created_at,
          updatedAt: updated_at,
          data: queryResult
        }
      ];
    } catch (error: unknown) {
      try { await transaction.rollback(); } catch (error: unknown) {}

      throw error;
    }
  } catch (error: unknown) {
    console.log(`Error | Timestamp: ${ timestamp } | Path: src/services/getQueryDataMap.service.ts | processQueryData | Error: ${ error instanceof Error ? error.message : String(error) }`);

    return [
      name,
      {
        timestamp,
        status: false,
        id,
        name,
        groupName: group_name !== null ? group_name : undefined,
        databasesId: databases_id,
        sql: parameterMap.sql,
        variableMap: parameterMap.variableMap,
        replacementMap: parameterMap.replacementMap,
        isQueryActive: is_query_active,
        createdAt: created_at,
        updatedAt: updated_at,
        message: 'Unexpected error occurred while processing the data.',
        suggestion: 'Please try again later. If this issue persists, contact our support team for assistance.'
      }
    ];
  } finally {
    try { await sequelizeInstance?.close(); } catch (error: unknown) {}
  }
};

export const getQueryDataMap = async (
  req: Request, 
  _res: Response, 
  _next: NextFunction, 
  timestamp: string
): Promise<IResponse.IResponse<IResponseData.IGetQueryDataMapResponseData | IResponseData.IResponseData>> => {
  try {  
    const queryList = await prisma.queries.findMany(
      {
        where: Object.isObject(req.body?.filterMap) 
          ? Object.fromEntries(
              Object
                .entries(req.body?.filterMap)
                .map(
                  ([key, value]: [string, any]): [string, Record<string, any>] => {
                    return [key, { [Array.isArray(value) ? 'in' : 'equals']: value }];
                  }
                )
            ) 
          : undefined
      }
    );
    
    const queryDataEntryList = await Promise.all(
      queryList.map(
        (query: unknown): Promise<[string, IQueryData.ISuccessQueryData | IQueryData.IErrorQueryData]> => {
          return processQueryData(query as IQuery.IQuery, req, momentTimezone().utc().format('DD-MM-YYYY HH:mm:ss'));
        }
      )
    );
  
    const queryDataMap = Object.fromEntries(queryDataEntryList);
  
    return {
      status: 200,
      data: {
        timestamp,
        status: true,
        statusCode: 200,
        method: req.method,
        path: req.originalUrl || req.url,
        query: req.query,
        headers: req.headers,
        body: req.body,
        data: queryDataMap
      }
    };
  } catch (error: unknown) {
    console.log(`Error | Timestamp: ${ timestamp } | Path: src/services/getQueryDataMap.service.ts | Location: getQueryDataMap | Error: ${ error instanceof Error ? error.message : String(error) }`);

    return {
      status: 500,
      data: {
        timestamp,
        status: false,
        statusCode: 500,
        method: req.method,
        path: req.originalUrl || req.url,
        query: req.query,
        headers: req.headers,
        body: req.body,
        message: 'Something went wrong.',
        suggestion: 'Please try again later. If this issue persists, contact our support team for assistance.'
      }
    };
  }
};
