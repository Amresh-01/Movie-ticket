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

// Admin-only endpoints (supporting optional poster or avatar image file upload via multer)
router.post(
  '/',
  authenticate,
  requireAdmin,
  (req, res, next) => {
    upload.any()(req, res, (err) => {
      if (err) {
        console.warn('Multer file parsing notice:', err.message);
        // Continue to controller even if file parsing had an unexpected field so movie creation does not fail with 500
      }
      const files = req.files as Express.Multer.File[] | undefined;
      if (files && files.length > 0) {
        req.file = files[0];
      }
      next();
    });
  },
  createMovie
);

router.put(
  '/:id',
  authenticate,
  requireAdmin,
  (req, res, next) => {
    upload.any()(req, res, (err) => {
      if (err) return next(err);
      const files = req.files as Express.Multer.File[] | undefined;
      if (files && files.length > 0) {
        req.file = files[0];
      }
      next();
    });
  },
  updateMovie
);

router.delete('/:id', authenticate, requireAdmin, deleteMovie);

export default router;
