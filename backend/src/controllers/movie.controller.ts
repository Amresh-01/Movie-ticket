import { Request, Response } from 'express';
import prisma from '../utils/db';
import { asyncHandler, AppError } from '../utils/asyncHandler';

export const getMovies = asyncHandler(async (req: Request, res: Response) => {
  const movies = await prisma.movie.findMany({
    where: { isActive: true },
    include: {
      shows: {
        where: {
          startTime: {
            gte: new Date(),
          },
        },
        orderBy: {
          startTime: 'asc',
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  res.json({
    success: true,
    data: { movies },
  });
});

export const getMovieById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const movie = await prisma.movie.findUnique({
    where: { id },
    include: {
      shows: {
        where: {
          startTime: {
            gte: new Date(),
          },
        },
        orderBy: {
          startTime: 'asc',
        },
      },
    },
  });

  if (!movie) {
    throw new AppError('Movie not found', 404, 'MOVIE_NOT_FOUND');
  }

  res.json({
    success: true,
    data: { movie },
  });
});

export const createMovie = asyncHandler(async (req: Request, res: Response) => {
  const { title, description, durationMin, posterUrl } = req.body;

  const movie = await prisma.movie.create({
    data: {
      title,
      description,
      durationMin,
      posterUrl: posterUrl || null,
    },
  });

  res.status(201).json({
    success: true,
    data: { movie },
  });
});

export const updateMovie = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { title, description, durationMin, posterUrl, isActive } = req.body;

  const existingMovie = await prisma.movie.findUnique({
    where: { id },
  });

  if (!existingMovie) {
    throw new AppError('Movie not found', 404, 'MOVIE_NOT_FOUND');
  }

  const updatedMovie = await prisma.movie.update({
    where: { id },
    data: {
      ...(title !== undefined && { title }),
      ...(description !== undefined && { description }),
      ...(durationMin !== undefined && { durationMin }),
      ...(posterUrl !== undefined && { posterUrl: posterUrl || null }),
      ...(isActive !== undefined && { isActive }),
    },
  });

  res.json({
    success: true,
    data: { movie: updatedMovie },
  });
});

export const deleteMovie = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  // Check if there are any shows with confirmed bookings
  const showsWithConfirmedBookings = await prisma.show.findMany({
    where: {
      movieId: id,
      bookings: {
        some: {
          status: 'CONFIRMED',
        },
      },
    },
  });

  if (showsWithConfirmedBookings.length > 0) {
    throw new AppError('Cannot delete movie with active confirmed bookings', 400, 'MOVIE_HAS_CONFIRMED_BOOKINGS');
  }

  // Soft delete if shows exist, or direct delete if no shows exist
  const showCount = await prisma.show.count({ where: { movieId: id } });

  if (showCount > 0) {
    await prisma.movie.update({
      where: { id },
      data: { isActive: false },
    });
    res.json({
      success: true,
      data: { message: 'Movie marked as inactive because existing shows are scheduled' },
    });
    return;
  }

  await prisma.movie.delete({
    where: { id },
  });

  res.json({
    success: true,
    data: { message: 'Movie deleted successfully' },
  });
});
