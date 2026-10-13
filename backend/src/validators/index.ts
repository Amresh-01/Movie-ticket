import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const createMovieSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  durationMin: z.number().int().positive('Duration must be a positive integer in minutes'),
  posterUrl: z.string().url('Invalid URL format').optional().or(z.literal('')),
});

export const updateMovieSchema = createMovieSchema.partial();

export const createShowSchema = z.object({
  movieId: z.string().uuid('Invalid movie ID'),
  screenId: z.string().uuid('Invalid screen ID'),
  startTime: z.string().datetime('startTime must be an ISO 8601 date string'),
  price: z.number().positive('Price must be greater than zero'),
});

export const holdSeatsSchema = z.object({
  seatIds: z
    .array(z.string().uuid('Each seatId must be a valid UUID'))
    .min(1, 'Must select at least 1 seat')
    .max(6, 'Cannot select more than 6 seats in a single booking'),
});

export const simulatePaymentSchema = z.object({
  status: z.enum(['SUCCESS', 'FAILED'], {
    errorMap: () => ({ message: "Status must be either 'SUCCESS' or 'FAILED'" }),
  }),
});
