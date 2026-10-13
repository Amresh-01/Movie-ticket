import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { Role } from '@prisma/client';
import prisma from '../utils/db';
import { signToken } from '../utils/jwt';
import { asyncHandler, AppError } from '../utils/asyncHandler';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';

export const register = asyncHandler(async (req: Request, res: Response) => {
  const { email, password, name } = req.body;

  const existingUser = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });

  if (existingUser) {
    throw new AppError('An account with this email already exists', 409, 'EMAIL_ALREADY_EXISTS');
  }

  const passwordHash = await bcrypt.hash(password, 12);

  // Enforce CUSTOMER role - admin can only be seeded
  const user = await prisma.user.create({
    data: {
      name,
      email: email.toLowerCase(),
      passwordHash,
      role: Role.CUSTOMER,
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
    },
  });

  const token = signToken({
    userId: user.id,
    email: user.email,
    role: user.role,
  });

  res.status(201).json({
    success: true,
    data: {
      user,
      token,
    },
  });
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });

  if (!user) {
    throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
  }

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
  }

  const token = signToken({
    userId: user.id,
    email: user.email,
    role: user.role,
  });

  res.json({
    success: true,
    data: {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        createdAt: user.createdAt,
      },
      token,
    },
  });
});

export const getMe = asyncHandler<AuthenticatedRequest>(async (req: AuthenticatedRequest, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user?.userId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
    },
  });

  if (!user) {
    throw new AppError('User profile not found', 404, 'USER_NOT_FOUND');
  }

  res.json({
    success: true,
    data: { user },
  });
});
