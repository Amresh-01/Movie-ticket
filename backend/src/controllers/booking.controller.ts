import { Response } from 'express';
import { BookingService } from '../services/booking.service';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import { asyncHandler, AppError } from '../utils/asyncHandler';

export const holdSeats = asyncHandler<AuthenticatedRequest>(async (req: AuthenticatedRequest, res: Response) => {
  const { id: showId } = req.params;
  const { seatIds } = req.body;
  const userId = req.user!.userId;

  const result = await BookingService.holdSeats({
    showId,
    userId,
    seatIds,
  });

  res.status(201).json({
    success: true,
    data: result,
  });
});

export const simulatePayment = asyncHandler<AuthenticatedRequest>(async (req: AuthenticatedRequest, res: Response) => {
  const { id: bookingId } = req.params;
  const { status: paymentStatus } = req.body;
  const userId = req.user!.userId;

  const result = await BookingService.simulatePayment({
    bookingId,
    userId,
    paymentStatus,
  });

  res.json({
    success: true,
    data: result,
  });
});

export const releaseHold = asyncHandler<AuthenticatedRequest>(async (req: AuthenticatedRequest, res: Response) => {
  const { id: bookingId } = req.params;
  const userId = req.user!.userId;

  const result = await BookingService.releaseHold(bookingId, userId);

  res.json({
    success: true,
    data: result,
  });
});

export const getMyBookings = asyncHandler<AuthenticatedRequest>(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.userId;

  const bookings = await BookingService.getUserBookings(userId);

  res.json({
    success: true,
    data: { bookings },
  });
});
