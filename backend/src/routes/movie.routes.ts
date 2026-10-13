import { Router } from 'express';
import {
  getMovies,
  getMovieById,
  createMovie,
  updateMovie,
  deleteMovie,
} from '../controllers/movie.controller';
import { authenticate, requireAdmin } from '../middlewares/auth.middleware';
import { upload } from '../middlewares/multer.middleware';

const router = Router();

// Public endpoints
router.get('/', getMovies);
router.get('/:id', getMovieById);

// Admin-only endpoints (supporting optional poster image file upload via multer)
router.post(
  '/',
  authenticate,
  requireAdmin,
  upload.single('poster'),
  createMovie
);

router.put(
  '/:id',
  authenticate,
  requireAdmin,
  upload.single('poster'),
  updateMovie
);

router.delete('/:id', authenticate, requireAdmin, deleteMovie);

export default router;
