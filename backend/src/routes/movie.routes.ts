import { Router } from 'express';
import {
  getMovies,
  getMovieById,
  createMovie,
  updateMovie,
  deleteMovie,
} from '../controllers/movie.controller';
import { authenticate, requireAdmin } from '../middlewares/auth.middleware';
import { validateBody } from '../middlewares/validate.middleware';
import { createMovieSchema, updateMovieSchema } from '../validators';

const router = Router();

// Public endpoints
router.get('/', getMovies);
router.get('/:id', getMovieById);

// Admin-only endpoints
router.post('/', authenticate, requireAdmin, validateBody(createMovieSchema), createMovie);
router.put('/:id', authenticate, requireAdmin, validateBody(updateMovieSchema), updateMovie);
router.delete('/:id', authenticate, requireAdmin, deleteMovie);

export default router;
