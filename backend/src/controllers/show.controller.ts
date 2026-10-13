import { Request, Response } from 'express';
import prisma from '../utils/db';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/ApiError';
import { ApiResponse } from '../utils/ApiResponse';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';

// 15-minute cleaning and buffer period between shows
const CLEANING_BUFFER_MINUTES = 15;

export const getShowById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const show = await prisma.show.findUnique({
    where: { id },
    include: {
      movie: true,
      screen: true,
    },
  });

  if (!show) {
    throw new ApiError(404, 'Show not found', [], 'SHOW_NOT_FOUND');
  }

  res.json(new ApiResponse(200, { show }, 'Show details retrieved successfully'));
});

export const getShowSeats = asyncHandler<AuthenticatedRequest>(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const currentUserId = req.user?.userId;
  const now = new Date();

  const show = await prisma.show.findUnique({
    where: { id },
    include: {
      movie: true,
      showSeats: {
        include: {
          seat: true,
          booking: {
            select: {
              id: true,
              status: true,
              userId: true,
            },
          },
        },
        orderBy: [
          { seat: { row: 'asc' } },
          { seat: { number: 'asc' } },
        ],
      },
    },
  });

  if (!show) {
    throw new ApiError(404, 'Show not found', [], 'SHOW_NOT_FOUND');
  }

  const seats = show.showSeats.map((item) => {
    let status: 'AVAILABLE' | 'HELD' | 'HELD_BY_YOU' | 'BOOKED' = 'AVAILABLE';
    let holdExpiresInSeconds: number | null = null;

    if (item.booking && item.booking.status === 'CONFIRMED') {
      status = 'BOOKED';
    } else if (item.heldUntil && item.heldUntil > now) {
      if (currentUserId && item.heldByUserId === currentUserId) {
        status = 'HELD_BY_YOU';
      } else {
        status = 'HELD';
      }
      holdExpiresInSeconds = Math.max(0, Math.floor((item.heldUntil.getTime() - now.getTime()) / 1000));
    }

    return {
      showSeatId: item.id,
      seatId: item.seatId,
      row: item.seat.row,
      number: item.seat.number,
      status,
      holdExpiresInSeconds,
    };
  });

  res.json(
    new ApiResponse(
      200,
      {
        show: {
          id: show.id,
          movieId: show.movieId,
          movieTitle: show.movie.title,
          startTime: show.startTime,
          endTime: show.endTime,
          price: show.price,
        },
        seats,
      },
      'Seats retrieved successfully'
    )
  );
});

export const createShow = asyncHandler(async (req: Request, res: Response) => {
  const { movieId, screenId, startTime, price } = req.body;

  const movie = await prisma.movie.findUnique({
    where: { id: movieId },
  });

  if (!movie || !movie.isActive) {
    throw new ApiError(404, 'Active movie not found', [], 'MOVIE_NOT_FOUND');
  }

  const screen = await prisma.screen.findUnique({
    where: { id: screenId },
    include: {
      seats: true,
    },
  });

  if (!screen) {
    throw new ApiError(404, 'Screen not found', [], 'SCREEN_NOT_FOUND');
  }

  const startDateTime = new Date(startTime);
  const totalDurationMinutes = movie.durationMin + CLEANING_BUFFER_MINUTES;
  const endDateTime = new Date(startDateTime.getTime() + totalDurationMinutes * 60000);

  // Overlap Detection on the same screen:
  const overlappingShow = await prisma.show.findFirst({
    where: {
      screenId,
      startTime: {
        lt: endDateTime,
      },
      endTime: {
        gt: startDateTime,
      },
    },
    include: {
      movie: {
        select: { title: true },
      },
    },
  });

  if (overlappingShow) {
    throw new ApiError(
      409,
      `Show overlaps with existing show for '${overlappingShow.movie.title}' from ${overlappingShow.startTime.toISOString()} to ${overlappingShow.endTime.toISOString()}`,
      [],
      'SHOW_SCHEDULE_CONFLICT'
    );
  }

  // Create the show and immediately initialize 80 ShowSeats
  const createdShow = await prisma.$transaction(async (tx) => {
    const show = await tx.show.create({
      data: {
        movieId,
        screenId,
        startTime: startDateTime,
        endTime: endDateTime,
        price,
      },
    });

    await tx.showSeat.createMany({
      data: screen.seats.map((seat) => ({
        showId: show.id,
        seatId: seat.id,
      })),
    });

    return show;
  });

  res.status(201).json(new ApiResponse(201, { show: createdShow }, 'Show created successfully with 80 seats'));
});

export const getShowOccupancy = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const now = new Date();

  const show = await prisma.show.findUnique({
    where: { id },
    include: {
      movie: true,
      showSeats: {
        include: {
          booking: true,
        },
      },
    },
  });

  if (!show) {
    throw new ApiError(404, 'Show not found', [], 'SHOW_NOT_FOUND');
  }

  let bookedCount = 0;
  let heldCount = 0;
  let availableCount = 0;

  for (const seat of show.showSeats) {
    if (seat.booking?.status === 'CONFIRMED') {
      bookedCount++;
    } else if (seat.heldUntil && seat.heldUntil > now) {
      heldCount++;
    } else {
      availableCount++;
    }
  }

  const totalSeats = show.showSeats.length;
  const occupancyRate = totalSeats > 0 ? ((bookedCount / totalSeats) * 100).toFixed(1) + '%' : '0%';
  const totalRevenue = Number(show.price) * bookedCount;

  res.json(
    new ApiResponse(
      200,
      {
        showId: show.id,
        movieTitle: show.movie.title,
        startTime: show.startTime,
        endTime: show.endTime,
        ticketPrice: show.price,
        totalSeats,
        bookedCount,
        heldCount,
        availableCount,
        occupancyRate,
        totalRevenue,
      },
      'Occupancy report generated successfully'
    )
  );
});

export const deleteShow = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const show = await prisma.show.findUnique({
    where: { id },
    include: {
      bookings: {
        where: {
          status: 'CONFIRMED',
        },
      },
    },
  });

  if (!show) {
    throw new ApiError(404, 'Show not found', [], 'SHOW_NOT_FOUND');
  }

  if (show.bookings.length > 0) {
    throw new ApiError(
      400,
      'A show that already has confirmed bookings cannot be deleted',
      [],
      'SHOW_HAS_CONFIRMED_BOOKINGS'
    );
  }

  await prisma.show.delete({
    where: { id },
  });

  res.json(new ApiResponse(200, { message: 'Show deleted successfully' }, 'Show deleted successfully'));
});
