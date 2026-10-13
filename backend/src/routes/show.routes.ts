import { Router } from 'express';
import {
  getShowById,
  getShowSeats,
  createShow,
  getShowOccupancy,
  deleteShow,
} from '../controllers/show.controller';
import { authenticate, requireAdmin } from '../middlewares/auth.middleware';
import { validateBody } from '../middlewares/validate.middleware';
import { createShowSchema } from '../validators';

const router = Router();

router.get('/:id', getShowById);
router.get('/:id/seats', (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authenticate(req, res, next);
  }
  next();
}, getShowSeats);

router.post('/', authenticate, requireAdmin, validateBody(createShowSchema), createShow);
router.delete('/:id', authenticate, requireAdmin, deleteShow);
router.get('/:id/occupancy', authenticate, requireAdmin, getShowOccupancy);

export default router;
