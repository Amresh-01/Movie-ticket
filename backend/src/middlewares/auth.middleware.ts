import { Request, Response, NextFunction } from 'express';
import { Role } from '@prisma/client';
import { verifyToken, TokenPayload } from '../utils/jwt';

export interface AuthenticatedRequest extends Request {
  user?: TokenPayload;
}

export const authenticate = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      error: {
        message: 'Authentication token required',
        code: 'UNAUTHORIZED',
      },
    });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = verifyToken(token);
    req.user = payload;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      error: {
        message: 'Invalid or expired authentication token',
        code: 'TOKEN_INVALID',
      },
    });
  }
};

export const requireRole = (role: Role) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: {
          message: 'Authentication required',
          code: 'UNAUTHORIZED',
        },
      });
      return;
    }

    if (req.user.role !== role) {
      res.status(403).json({
        success: false,
        error: {
          message: 'Forbidden: Insufficient privileges',
          code: 'FORBIDDEN',
        },
      });
      return;
    }

    next();
  };
};

export const requireAdmin = requireRole(Role.ADMIN);
