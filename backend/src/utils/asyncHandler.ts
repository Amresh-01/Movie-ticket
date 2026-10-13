import { Request, Response, NextFunction, RequestHandler } from 'express';

type AsyncHandler<Req = Request> = (
  req: Req,
  res: Response,
  next: NextFunction
) => Promise<any>;

export const asyncHandler = <Req = Request>(fn: AsyncHandler<Req>): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req as unknown as Req, res, next)).catch(next);
  };
};

export class AppError extends Error {
  public statusCode: number;
  public code: string;

  constructor(message: string, statusCode = 500, code = 'INTERNAL_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    Error.captureStackTrace(this, this.constructor);
  }
}
