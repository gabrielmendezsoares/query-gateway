import { NextFunction, Request, Response } from 'express';
import OracleDB from 'oracledb';
import { QueryTypes, Sequelize, Transaction } from 'sequelize';
import { PrismaClient } from '@prisma/client/storage/client.js';
import { cryptographyUtil } from '../../expressium/src/index.js';
import { IReqBody, IResponse, IResponseData } from '../interfaces/index.js';

const prisma = new PrismaClient();

export const createQuery = async (
  req: Request, 
  _res: Response, 
  _next: NextFunction, 
  timestamp: string
): Promise<IResponse.IResponse<IResponseData.ICreateQueryResponseData | IResponseData.IResponseData>> => {
  try {  
    const reqBody = req.body;

    if (!Object.isObject(reqBody)) {
      return {
        status: 400,
        data: {
          timestamp,
          status: false,
          statusCode: 400,
          method: req.method,
          path: req.originalUrl || req.url,
          query: req.query,
          headers: req.headers,
          body: req.body,
          message: 'Invalid request format. Request body must be a valid JSON object.',
          suggestion: 'Please check your request format and ensure you are sending a properly structured JSON object.'
        }
      };
    }

    const { 
      databaseName, 
      sql 
    } = reqBody as IReqBody.ICreateQueryReqBody;

    if (!Object.isString(databaseName)) {
      return {
        status: 400,
        data: {
          timestamp,
          status: false,
          statusCode: 400,
          method: req.method,
          path: req.originalUrl || req.url,
          query: req.query,
          headers: req.headers,
          body: req.body,
          message: 'Missing or invalid database name. Database name must be a string.',
          suggestion: 'Please provide a valid database name as a string in your request.'
        }
      };
    }

    if (!Object.isString(sql)) {
      return {
        status: 400,
        data: {
          timestamp,
          status: false,
          statusCode: 400,
          method: req.method,
          path: req.originalUrl || req.url,
          query: req.query,
          headers: req.headers,
          body: req.body,
          message: 'Missing or invalid SQL query. SQL query must be a string.',
          suggestion: 'Please provide a valid SQL query as a string in your request.'
        }
      };
    }
    
    const database = await prisma.databases.findUnique({ where: { name: databaseName } });
    
    if (!database) {
      return {
        status: 404,
        data: {
          timestamp,
          status: false,
          statusCode: 404,
          method: req.method,
          path: req.originalUrl || req.url,
          query: req.query,
          headers: req.headers,
          body: req.body,
          message: `Database with name "${ databaseName }" not found.`,
          suggestion: 'Please verify the database name and ensure it exists in the system.'
        }
      };
    }

    let sequelizeInstance: Sequelize | undefined;

    switch (database.database_type) {
      case 'Oracle':
        sequelizeInstance = new Sequelize(
          {
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
            port: database.port ? database.port : undefined,
            dialect: 'oracle',
            dialectModule: OracleDB,
            dialectOptions: {
              connectString: cryptographyUtil.decryptFromAes256Cbc(
                process.env.DATABASES_CONNECT_STRING_ENCRYPTION_KEY as string, 
                process.env.DATABASES_CONNECT_STRING_IV_STRING as string, 
                new TextDecoder().decode(database.connect_string as Uint8Array)
              ),
              options: { encrypt: false }
            },
            define: { freezeTableName: true }
          }
        );

        break;

      case 'SQL Server':
        sequelizeInstance = new Sequelize(
          {
            host: cryptographyUtil.decryptFromAes256Cbc(
              process.env.DATABASES_HOST_ENCRYPTION_KEY as string, 
              process.env.DATABASES_HOST_IV_STRING as string, 
              new TextDecoder().decode(database.host as Uint8Array)
            ),
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
            port: database.port ? database.port : undefined,
            dialect: 'mssql',
            dialectOptions: { options: { encrypt: false } },
            define: { freezeTableName: true }
          }
        );

        break;
    
      case 'MySQL':
        sequelizeInstance = new Sequelize(
          {
            host: cryptographyUtil.decryptFromAes256Cbc(
              process.env.DATABASES_HOST_ENCRYPTION_KEY as string, 
              process.env.DATABASES_HOST_IV_STRING as string, 
              new TextDecoder().decode(database.host as Uint8Array)
            ),
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
            port: database.port ? database.port : undefined,
            dialect: 'mysql',
            dialectOptions: { options: { encrypt: false } },
            define: { freezeTableName: true }
          }
        );

        break;

      default:
    }
    
    if (!sequelizeInstance) {
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
          message: `Unsupported database type: ${ database.database_type }.`,
          suggestion: 'This operation only supports Oracle, SQL Server, and MySQL databases. Please use a supported database type.'
        }
      };
    }

    const transaction: Transaction = await sequelizeInstance.transaction();

    try {
      const queryResult = await sequelizeInstance.query<Promise<object[]>>(
        sql, 
        { 
          type: QueryTypes.SELECT,
          transaction
        }
      );

      await transaction.commit();

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
          data: queryResult
        }
      };
    } catch (error: unknown) {
      await transaction.rollback();

      throw error;
    }
  } catch (error: unknown) {
    console.log(`Service | Timestamp: ${ timestamp } | Name: createQuery | Error: ${ error instanceof Error ? error.message : String(error) }`);

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
