import { BookingStatus, PaymentStatus } from '@prisma/client';
import prisma from '../utils/db';
import { AppError } from '../utils/asyncHandler';

const HOLD_DURATION_MINUTES = 5;

export interface HoldSeatsParams {
  showId: string;
  userId: string;
  seatIds: string[];
}

export interface SimulatePaymentParams {
  bookingId: string;
  userId: string;
  paymentStatus: 'SUCCESS' | 'FAILED';
}

export class BookingService {
  /**
   * Atomically holds 1 to 6 seats for a show for 5 minutes.
   * Uses PostgreSQL pessimistic row locking (FOR UPDATE) in deterministic seat ID order
   * to guarantee zero race conditions and eliminate deadlock.
   */
  static async holdSeats({ showId, userId, seatIds }: HoldSeatsParams) {
    if (seatIds.length < 1 || seatIds.length > 6) {
      throw new AppError('You can hold between 1 and 6 seats', 400, 'INVALID_SEAT_COUNT');
    }

    // Sort seat IDs deterministically to prevent deadlock
    const sortedSeatIds = [...new Set(seatIds)].sort();
    if (sortedSeatIds.length !== seatIds.length) {
      throw new AppError('Duplicate seat IDs provided', 400, 'DUPLICATE_SEATS');
    }

    const show = await prisma.show.findUnique({
      where: { id: showId },
      include: { movie: true },
    });

    if (!show) {
      throw new AppError('Show not found', 404, 'SHOW_NOT_FOUND');
    }

    if (new Date() >= show.startTime) {
      throw new AppError('Cannot book seats for a show that has already started', 400, 'SHOW_ALREADY_STARTED');
    }

    // Execute atomic hold transaction
    return await prisma.$transaction(
      async (tx) => {
        const now = new Date();
        const holdExpiresAt = new Date(now.getTime() + HOLD_DURATION_MINUTES * 60000);

        // Pessimistic Row Lock with deterministic ordering
        // Fetch matching ShowSeats and lock rows
        const lockedShowSeats: Array<{
          id: string;
          showId: string;
          seatId: string;
          heldByUserId: string | null;
          heldUntil: Date | null;
          bookingId: string | null;
        }> = await tx.$queryRaw`
          SELECT "id", "showId", "seatId", "heldByUserId", "heldUntil", "bookingId"
          FROM "ShowSeat"
          WHERE "showId" = ${showId}
            AND "seatId" = ANY(${sortedSeatIds}::text[])
          ORDER BY "seatId" ASC
          FOR UPDATE
        `;

        if (lockedShowSeats.length !== sortedSeatIds.length) {
          throw new AppError('One or more selected seats do not exist for this show', 404, 'SEAT_NOT_FOUND');
        }

        // Verify each seat availability
        for (const seat of lockedShowSeats) {
          const isHeld = seat.heldUntil && seat.heldUntil > now;
          const isConfirmed = seat.bookingId !== null;

          if (isConfirmed) {
            throw new AppError('One or more selected seats are already booked', 409, 'SEAT_ALREADY_BOOKED');
          }

          if (isHeld && seat.heldByUserId !== userId) {
            throw new AppError('One or more selected seats are currently held by another user', 409, 'SEAT_CURRENTLY_HELD');
          }
        }

        // Calculate total amount
        const totalAmount = Number(show.price) * sortedSeatIds.length;

        // Create PENDING booking with hold expiration
        const booking = await tx.booking.create({
          data: {
            userId,
            showId,
            totalAmount,
            status: BookingStatus.PENDING,
            holdExpiresAt,
          },
        });

        // Update ShowSeat records with hold state and link bookingId
        const showSeatIds = lockedShowSeats.map((s) => s.id);
        await tx.showSeat.updateMany({
          where: { id: { in: showSeatIds } },
          data: {
            heldByUserId: userId,
            heldUntil: holdExpiresAt,
            bookingId: booking.id,
          },
        });

        return {
          bookingId: booking.id,
          showId: show.id,
          movieTitle: show.movie.title,
          totalAmount,
          seatCount: sortedSeatIds.length,
          holdExpiresAt,
          expiresInSeconds: HOLD_DURATION_MINUTES * 60,
        };
      },
      {
        timeout: 10000, // 10s transaction timeout
      }
    );
  }

  /**
   * Simulates payment for a held booking.
   * Enforces that hold is still active (holdExpiresAt > now) and belongs to the requesting user.
   */
  static async simulatePayment({ bookingId, userId, paymentStatus }: SimulatePaymentParams) {
    return await prisma.$transaction(
      async (tx) => {
        const now = new Date();

        // Lock the booking row
        const booking = await tx.booking.findUnique({
          where: { id: bookingId },
          include: {
            show: {
              include: { movie: true },
            },
            seats: {
              include: { seat: true },
            },
            payment: true,
          },
        });

        if (!booking) {
          throw new AppError('Booking not found', 404, 'BOOKING_NOT_FOUND');
        }

        // Strict authorization: Customers can never touch other customers' bookings
        if (booking.userId !== userId) {
          throw new AppError('Forbidden: Access to this booking is denied', 403, 'FORBIDDEN');
        }

        if (booking.status === BookingStatus.CONFIRMED) {
          throw new AppError('This booking has already been confirmed', 400, 'ALREADY_CONFIRMED');
        }

        // Check if hold has expired
        if (booking.holdExpiresAt <= now || booking.status === BookingStatus.EXPIRED) {
          // Clean up expired hold
          await tx.booking.update({
            where: { id: bookingId },
            data: { status: BookingStatus.EXPIRED },
          });

          await tx.showSeat.updateMany({
            where: { bookingId: booking.id },
            data: {
              heldByUserId: null,
              heldUntil: null,
              bookingId: null,
            },
          });

          throw new AppError('Seat hold has expired. Please select seats again.', 410, 'HOLD_EXPIRED');
        }

        // Payment Simulation: FAILURE
        if (paymentStatus === 'FAILED') {
          // Record failed payment record or update existing
          if (booking.payment) {
            await tx.payment.update({
              where: { id: booking.payment.id },
              data: { status: PaymentStatus.FAILED },
            });
          } else {
            await tx.payment.create({
              data: {
                bookingId: booking.id,
                amount: booking.totalAmount,
                status: PaymentStatus.FAILED,
                transactionRef: `FAILED_${Date.now()}`,
              },
            });
          }

          const remainingSeconds = Math.max(0, Math.floor((booking.holdExpiresAt.getTime() - now.getTime()) / 1000));

          return {
            bookingId: booking.id,
            status: 'PAYMENT_FAILED',
            message: 'Payment simulation failed. Your seat hold remains active so you can retry before it expires.',
            holdExpiresAt: booking.holdExpiresAt,
            remainingSeconds,
          };
        }

        // Payment Simulation: SUCCESS
        // Record payment success
        if (booking.payment) {
          await tx.payment.update({
            where: { id: booking.payment.id },
            data: {
              status: PaymentStatus.SUCCESS,
              transactionRef: `TXN_${Date.now()}`,
            },
          });
        } else {
          await tx.payment.create({
            data: {
              bookingId: booking.id,
              amount: booking.totalAmount,
              status: PaymentStatus.SUCCESS,
              transactionRef: `TXN_${Date.now()}`,
            },
          });
        }

        // Confirm booking
        const confirmedBooking = await tx.booking.update({
          where: { id: booking.id },
          data: { status: BookingStatus.CONFIRMED },
        });

        // Clear heldUntil so seat is permanently booked under bookingId
        await tx.showSeat.updateMany({
          where: { bookingId: booking.id },
          data: { heldUntil: null },
        });

        return {
          bookingId: confirmedBooking.id,
          status: 'CONFIRMED',
          totalAmount: confirmedBooking.totalAmount,
          movieTitle: booking.show.movie.title,
          startTime: booking.show.startTime,
          seats: booking.seats.map((s) => `${s.seat.row}${s.seat.number}`),
          confirmedAt: confirmedBooking.updatedAt,
        };
      },
      {
        timeout: 10000,
      }
    );
  }

  /**
   * Releases an active hold voluntarily before the 5-minute timer expires.
   */
  static async releaseHold(bookingId: string, userId: string) {
    return await prisma.$transaction(async (tx) => {
      const booking = await tx.booking.findUnique({
        where: { id: bookingId },
      });

      if (!booking) {
        throw new AppError('Booking not found', 404, 'BOOKING_NOT_FOUND');
      }

      if (booking.userId !== userId) {
        throw new AppError('Forbidden: Access denied', 403, 'FORBIDDEN');
      }

      if (booking.status === BookingStatus.CONFIRMED) {
        throw new AppError('Cannot release a confirmed booking', 400, 'ALREADY_CONFIRMED');
      }

      await tx.booking.update({
        where: { id: bookingId },
        data: { status: BookingStatus.CANCELLED },
      });

      await tx.showSeat.updateMany({
        where: { bookingId },
        data: {
          heldByUserId: null,
          heldUntil: null,
          bookingId: null,
        },
      });

      return { message: 'Hold successfully released' };
    });
  }

  /**
   * Fetches only the bookings belonging to the requesting user.
   */
  static async getUserBookings(userId: string) {
    const bookings = await prisma.booking.findMany({
      where: { userId },
      include: {
        show: {
          include: {
            movie: true,
            screen: true,
          },
        },
        seats: {
          include: {
            seat: true,
          },
        },
        payment: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return bookings.map((b) => ({
      id: b.id,
      movieTitle: b.show.movie.title,
      screenName: b.show.screen.name,
      startTime: b.show.startTime,
      totalAmount: b.totalAmount,
      status: b.status,
      holdExpiresAt: b.holdExpiresAt,
      seats: b.seats.map((s) => `${s.seat.row}${s.seat.number}`),
      paymentStatus: b.payment?.status || 'NONE',
      createdAt: b.createdAt,
    }));
  }
}
