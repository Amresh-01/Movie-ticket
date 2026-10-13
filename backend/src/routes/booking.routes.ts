import { Router } from 'express';
import {
  holdSeats,
  simulatePayment,
  releaseHold,
  getMyBookings,
} from '../controllers/booking.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { validateBody } from '../middlewares/validate.middleware';
import { holdSeatsSchema, simulatePaymentSchema } from '../validators';

const router = Router();

// Hold seats for a show (1 to 6 seats)
router.post('/shows/:id/hold', authenticate, validateBody(holdSeatsSchema), holdSeats);

// Simulate payment for a held booking (SUCCESS or FAILED)
router.post('/bookings/:id/simulate-payment', authenticate, validateBody(simulatePaymentSchema), simulatePayment);

// Release an active hold voluntarily
router.post('/bookings/:id/release', authenticate, releaseHold);

// Customer bookings list (only own bookings)
router.get('/bookings/my', authenticate, getMyBookings);

export default router;
