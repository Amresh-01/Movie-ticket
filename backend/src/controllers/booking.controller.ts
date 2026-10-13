import { Response } from 'express';
import { BookingService } from '../services/booking.service';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/ApiResponse';

export const holdSeats = asyncHandler<AuthenticatedRequest>(async (req: AuthenticatedRequest, res: Response) => {
  const { id: showId } = req.params;
  const { seatIds } = req.body;
  const userId = req.user!.userId;

  const result = await BookingService.holdSeats({
    showId,
    userId,
    seatIds,
  });

  res.status(201).json(
    new ApiResponse(201, result, 'Seats held successfully for 5 minutes')
  );
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

  res.json(new ApiResponse(200, result, 'Payment simulation completed'));
});

export const releaseHold = asyncHandler<AuthenticatedRequest>(async (req: AuthenticatedRequest, res: Response) => {
  const { id: bookingId } = req.params;
  const userId = req.user!.userId;

  const result = await BookingService.releaseHold(bookingId, userId);

  res.json(new ApiResponse(200, result, 'Seat hold released successfully'));
});

export const getMyBookings = asyncHandler<AuthenticatedRequest>(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.userId;

  const bookings = await BookingService.getUserBookings(userId);

  res.json(new ApiResponse(200, { bookings }, 'User bookings retrieved successfully'));
});
