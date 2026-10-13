import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.routes';
import movieRoutes from './routes/movie.routes';
import showRoutes from './routes/show.routes';
import bookingRoutes from './routes/booking.routes';
import { AppError } from './utils/asyncHandler';

export const createApp = () => {
  const app = express();

  app.use(cors());
  app.use(express.json());

  // Health check endpoint
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({
      success: true,
      data: {
        status: 'UP',
        timestamp: new Date().toISOString(),
      },
    });
  });

  // API Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/movies', movieRoutes);
  app.use('/api/shows', showRoutes);
  app.use('/api', bookingRoutes);

  // Centralized Error Handler
  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    if (err instanceof AppError) {
      res.status(err.statusCode).json({
        success: false,
        error: {
          message: err.message,
          code: err.code,
        },
      });
      return;
    }

    console.error('Unhandled Server Error:', err);
    res.status(500).json({
      success: false,
      error: {
        message: 'Internal Server Error',
        code: 'INTERNAL_ERROR',
      },
    });
  });

  return app;
};

export default createApp;
