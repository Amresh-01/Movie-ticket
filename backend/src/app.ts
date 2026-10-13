import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.routes';
import movieRoutes from './routes/movie.routes';
import showRoutes from './routes/show.routes';
import bookingRoutes from './routes/booking.routes';
import { ApiError } from './utils/ApiError';
import { ApiResponse } from './utils/ApiResponse';

export const createApp = () => {
  const app = express();

  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Health check endpoint
  app.get('/api/health', (req: Request, res: Response) => {
    res.json(
      new ApiResponse(
        200,
        {
          status: 'UP',
          timestamp: new Date().toISOString(),
        },
        'Health check passed'
      )
    );
  });

  // API Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/movies', movieRoutes);
  app.use('/api/shows', showRoutes);
  app.use('/api', bookingRoutes);

  // Centralized Error Handler
  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    if (err instanceof ApiError) {
      res.status(err.statusCode).json({
        statusCode: err.statusCode,
        success: false,
        message: err.message,
        errors: err.errors,
        code: err.code,
        data: null,
      });
      return;
    }

    console.error('Unhandled Server Error:', err);
    res.status(500).json({
      statusCode: 500,
      success: false,
      message: err?.message || 'Internal Server Error',
      errors: [],
      code: 'INTERNAL_ERROR',
      data: null,
    });
  });

  return app;
};

export default createApp;
