import { Router } from 'express';
import {
  holdSeats,
  simulatePayment,
  releaseHold,
  getMyBookings,
  cancelBooking,
} from '../controllers/booking.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { validateBody } from '../middlewares/validate.middleware';
import { holdSeatsSchema, simulatePaymentSchema } from '../validators';

const router = Router();
router.post('/shows/:id/hold', authenticate, validateBody(holdSeatsSchema), holdSeats);
router.post('/bookings/:id/simulate-payment', authenticate, validateBody(simulatePaymentSchema), simulatePayment);
router.post('/bookings/:id/release', authenticate, releaseHold);
router.post('/bookings/:id/cancel', authenticate, cancelBooking);

// Customer bookings list (only own bookings)
router.get('/bookings/my', authenticate, getMyBookings);

export default router;
