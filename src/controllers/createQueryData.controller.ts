import { Request, Response } from 'express';
import { loggerUtil } from '../../expressium/index.js';
import { createQueryDataService } from '../services/index.js';

export const createQueryData = async (
  req: Request, 
  res: Response
): Promise<void> => {
  try {
    const { status, data } = await createQueryDataService.createQueryData(req);
    
    res.status(status).json(data);
  } catch (error: unknown) {
    loggerUtil.error(error instanceof Error ? error.message : String(error));

    res
      .status(500)
      .json(
        { 
          message: 'The query data creation process encountered a technical issue.',
          suggestion: 'Please try again later or contact support if the issue persists.'
        }
      );
  }
};
