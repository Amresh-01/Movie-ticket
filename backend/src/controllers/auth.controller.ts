import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { Role } from '@prisma/client';
import prisma from '../utils/db';
import { signToken } from '../utils/jwt';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/ApiError';
import { ApiResponse } from '../utils/ApiResponse';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';

export const register = asyncHandler(async (req: Request, res: Response) => {
  const { email, password, name } = req.body;

  const existingUser = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });

  if (existingUser) {
    throw new ApiError(409, 'An account with this email already exists', [], 'EMAIL_ALREADY_EXISTS');
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

  res.status(201).json(
    new ApiResponse(201, { user, token }, 'User registered successfully')
  );
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });

  if (!user) {
    throw new ApiError(401, 'Invalid email or password', [], 'INVALID_CREDENTIALS');
  }

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    throw new ApiError(401, 'Invalid email or password', [], 'INVALID_CREDENTIALS');
  }

  const token = signToken({
    userId: user.id,
    email: user.email,
    role: user.role,
  });

  res.json(
    new ApiResponse(
      200,
      {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          createdAt: user.createdAt,
        },
        token,
      },
      'User logged in successfully'
    )
  );
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
    throw new ApiError(404, 'User profile not found', [], 'USER_NOT_FOUND');
  }

  res.json(new ApiResponse(200, { user }, 'Profile retrieved successfully'));
});
