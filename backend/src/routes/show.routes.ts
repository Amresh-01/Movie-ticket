import { Router } from 'express';
import {
  getShowById,
  getShowSeats,
  createShow,
  getShowOccupancy,
} from '../controllers/show.controller';
import { authenticate, requireAdmin } from '../middlewares/auth.middleware';
import { validateBody } from '../middlewares/validate.middleware';
import { createShowSchema } from '../validators';

const router = Router();

// Public / Authenticated read routes
router.get('/:id', getShowById);
// getShowSeats parses req.user if auth token present, but accessible publicly too
router.get('/:id/seats', (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authenticate(req, res, next);
  }
  next();
}, getShowSeats);

// Admin-only show creation & occupancy routes
router.post('/', authenticate, requireAdmin, validateBody(createShowSchema), createShow);
router.get('/:id/occupancy', authenticate, requireAdmin, getShowOccupancy);

export default router;
