import { Request, Response, NextFunction, RequestHandler } from 'express';

type AsyncHandler<Req = Request> = (
  req: Req,
  res: Response,
  next: NextFunction
) => Promise<any>;

export const asyncHandler = <Req = Request>(fn: AsyncHandler<Req>): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req as unknown as Req, res, next)).catch((err) => next(err));
  };
};

export default asyncHandler;
