import { Request } from 'express';
import { isObjectType, isString } from 'remeda';
import { query_gateway_queries, PrismaClient } from '@prisma/client/storage/client.js';
import OracleDB from 'oracledb';
import { QueryTypes, Sequelize, Transaction } from 'sequelize';
import { cryptographyUtil, loggerUtil } from '../../expressium/index.js';
import { IReqBody, IResponse, IResponseData } from './interfaces/index.js';

const prisma = new PrismaClient();

const processQuery = async (queryGatewayQuery: query_gateway_queries): Promise<[string, any]> => {
  const {
    name,
    databases_id,
    sql,
    variable_map,
    replacement_map
  } = queryGatewayQuery;

  let sequelizeInstance: Sequelize | undefined;

  try {
    const database = await prisma.databases.findUnique({ where: { id: databases_id } });
    
    if (!database) {
      return [
        name,
        {
          message: 'The query data creation process encountered a technical issue.',
          suggestion: 'Please try again later or contact support if the issue persists.'
        }
      ];
    }

    let currentSql = sql

    switch (database.database_type) {
      case 'MySQL':
        if (variable_map) {
          const variableDeclaration = Object
            .entries(variable_map)
            .reduce(
              (accumulator: string, [key, value]: [string, any]): string => {
                accumulator += `SET @${ key } = ${ isString(value) ? "'" : '' }${ value }${ isString(value) ? "'" : '' }; `;

                return accumulator;
              },
              ``
            );

          currentSql = variableDeclaration + currentSql;
        }

        sequelizeInstance = new Sequelize(
          {
            host: cryptographyUtil.decryptFromAes256Cbc(
              process.env.DATABASES_HOST_ENCRYPTION_KEY as string, 
              process.env.DATABASES_HOST_IV_STRING as string, 
              new TextDecoder().decode(database.host as Uint8Array<ArrayBufferLike>)
            ),
            port: database.port ? database.port : undefined,
            database: cryptographyUtil.decryptFromAes256Cbc(
              process.env.DATABASES_DATABASE_ENCRYPTION_KEY as string, 
              process.env.DATABASES_DATABASE_IV_STRING as string, 
              new TextDecoder().decode(database.database as Uint8Array<ArrayBufferLike>)
            ),
            username: cryptographyUtil.decryptFromAes256Cbc(
              process.env.DATABASES_USERNAME_ENCRYPTION_KEY as string,
              process.env.DATABASES_USERNAME_IV_STRING as string,
              new TextDecoder().decode(database.username as Uint8Array<ArrayBufferLike>)
            ),
            password: cryptographyUtil.decryptFromAes256Cbc(
              process.env.DATABASES_PASSWORD_ENCRYPTION_KEY as string, 
              process.env.DATABASES_PASSWORD_IV_STRING as string, 
              new TextDecoder().decode(database.password as Uint8Array<ArrayBufferLike>)
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
                new TextDecoder().decode(database.connect_string as Uint8Array<ArrayBufferLike>)
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
        if (variable_map) {
          const variableDeclaration = Object
            .entries(variable_map)
            .reduce(
              (accumulator: string, [key, value]: [string, { dataType: string, value: any }]): string => {
                if (isObjectType(value) && isString(value.dataType)) {
                  accumulator += `DECLARE @${ key } ${ value.dataType } = ${ isString(value.value) ? "'" : '' }${ value.value }${ isString(value.value) ? "'" : '' }; `;
                }

                return accumulator;
              },
              ``
            );

          currentSql = variableDeclaration + currentSql;
        }

        sequelizeInstance = new Sequelize(
          {
            host: cryptographyUtil.decryptFromAes256Cbc(
              process.env.DATABASES_HOST_ENCRYPTION_KEY as string, 
              process.env.DATABASES_HOST_IV_STRING as string, 
              new TextDecoder().decode(database.host as Uint8Array<ArrayBufferLike>)
            ),
            port: database.port ? database.port : undefined,
            database: cryptographyUtil.decryptFromAes256Cbc(
              process.env.DATABASES_DATABASE_ENCRYPTION_KEY as string, 
              process.env.DATABASES_DATABASE_IV_STRING as string, 
              new TextDecoder().decode(database.database as Uint8Array<ArrayBufferLike>)
            ),
            username: cryptographyUtil.decryptFromAes256Cbc(
              process.env.DATABASES_USERNAME_ENCRYPTION_KEY as string,
              process.env.DATABASES_USERNAME_IV_STRING as string,
              new TextDecoder().decode(database.username as Uint8Array<ArrayBufferLike>)
            ),
            password: cryptographyUtil.decryptFromAes256Cbc(
              process.env.DATABASES_PASSWORD_ENCRYPTION_KEY as string, 
              process.env.DATABASES_PASSWORD_IV_STRING as string, 
              new TextDecoder().decode(database.password as Uint8Array<ArrayBufferLike>)
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
        break;
    }

    const transaction: Transaction = await sequelizeInstance.transaction();

    try {
      const queryResult = await sequelizeInstance.query<Promise<object[]>>(
        sql, 
        { 
          type: QueryTypes.SELECT,
          replacements: replacement_map ?? undefined,
          transaction
        }
      );

      await transaction.commit();

      return [name, queryResult];
    } catch (error: unknown) {
      try { await transaction.rollback(); } catch {}

      throw error;
    }
  } catch (error: unknown) {
    loggerUtil.error(error instanceof Error ? error.message : String(error));

    return [
      name,
      {
        message: 'The query data creation process encountered a technical issue.',
        suggestion: 'Please try again later or contact support if the issue persists.'
      }
    ];
  } finally {
    try { await sequelizeInstance?.close(); } catch {}
  }
};

export const createQueryData = async (req: Request): Promise<IResponse.IResponse<IResponseData.ICreateQueryDataResponseData | IResponseData.IResponseData>> => {
  const reqBodyFilterMap = (req.body as IReqBody.ICreateQueryDataReqBody | undefined)?.filterMap;
  
  const queryGatewayQueryList = await prisma.query_gateway_queries.findMany(
    {
      where: isObjectType(reqBodyFilterMap) 
        ? Object.fromEntries(
            Object
              .entries(reqBodyFilterMap)
              .map(
                ([key, value]: [string, any]): [string, Record<string, any>] => {
                  return [key, { [Array.isArray(value) ? 'in' : 'equals']: value }];
                }
              )
          ) 
        : undefined
    }
  );
  
  const queryDataEntryList = await Promise.all(queryGatewayQueryList.map(processQuery));

  return {
    status: 200,
    data: { data: Object.fromEntries(queryDataEntryList) }
  };
};
