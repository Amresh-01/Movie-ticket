import { Request, Response } from 'express';
import prisma from '../utils/db';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/ApiError';
import { ApiResponse } from '../utils/ApiResponse';
import { uploadBufferOnCloudinary } from '../utils/cloudinary';

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

  res.json(new ApiResponse(200, { movies }, 'Movies retrieved successfully'));
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
    throw new ApiError(404, 'Movie not found', [], 'MOVIE_NOT_FOUND');
  }

  res.json(new ApiResponse(200, { movie }, 'Movie retrieved successfully'));
});

export const createMovie = asyncHandler(async (req: Request, res: Response) => {
  const { title, description, durationMin, posterUrl } = req.body;
  let finalPosterUrl = posterUrl || null;

  // If a file was uploaded via multipart/form-data, upload to Cloudinary
  if (req.file) {
    const uploadResult = await uploadBufferOnCloudinary(req.file.buffer, 'movies');
    if (uploadResult?.secure_url) {
      finalPosterUrl = uploadResult.secure_url;
    }
  }

  const movie = await prisma.movie.create({
    data: {
      title,
      description,
      durationMin: typeof durationMin === 'string' ? parseInt(durationMin, 10) : durationMin,
      posterUrl: finalPosterUrl,
    },
  });

  res.status(201).json(new ApiResponse(201, { movie }, 'Movie created successfully'));
});

export const updateMovie = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { title, description, durationMin, posterUrl, isActive } = req.body;

  const existingMovie = await prisma.movie.findUnique({
    where: { id },
  });

  if (!existingMovie) {
    throw new ApiError(404, 'Movie not found', [], 'MOVIE_NOT_FOUND');
  }

  let finalPosterUrl = posterUrl;
  if (req.file) {
    const uploadResult = await uploadBufferOnCloudinary(req.file.buffer, 'movies');
    if (uploadResult?.secure_url) {
      finalPosterUrl = uploadResult.secure_url;
    }
  }

  const updatedMovie = await prisma.movie.update({
    where: { id },
    data: {
      ...(title !== undefined && { title }),
      ...(description !== undefined && { description }),
      ...(durationMin !== undefined && {
        durationMin: typeof durationMin === 'string' ? parseInt(durationMin, 10) : durationMin,
      }),
      ...(finalPosterUrl !== undefined && { posterUrl: finalPosterUrl || null }),
      ...(isActive !== undefined && {
        isActive: typeof isActive === 'string' ? isActive === 'true' : isActive,
      }),
    },
  });

  res.json(new ApiResponse(200, { movie: updatedMovie }, 'Movie updated successfully'));
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
    throw new ApiError(
      400,
      'Cannot delete movie with active confirmed bookings',
      [],
      'MOVIE_HAS_CONFIRMED_BOOKINGS'
    );
  }

  // Soft delete if shows exist, or direct delete if no shows exist
  const showCount = await prisma.show.count({ where: { movieId: id } });

  if (showCount > 0) {
    await prisma.movie.update({
      where: { id },
      data: { isActive: false },
    });
    res.json(
      new ApiResponse(
        200,
        { message: 'Movie marked as inactive because existing shows are scheduled' },
        'Movie deactivated successfully'
      )
    );
    return;
  }

  await prisma.movie.delete({
    where: { id },
  });

  res.json(new ApiResponse(200, { message: 'Movie deleted successfully' }, 'Movie deleted successfully'));
});
