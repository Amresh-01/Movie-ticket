import jwt from 'jsonwebtoken';
import { Role } from '@prisma/client';
import { config } from '../config/env';

export interface TokenPayload {
  userId: string;
  email: string;
  role: Role;
}

export const signToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn as any,
  });
};

export const verifyToken = (token: string): TokenPayload => {
  return jwt.verify(token, config.jwtSecret) as TokenPayload;
};
