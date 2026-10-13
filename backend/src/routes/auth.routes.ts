import { Router } from 'express';
import { register, login, getMe } from '../controllers/auth.controller';
import { validateBody } from '../middlewares/validate.middleware';
import { authenticate } from '../middlewares/auth.middleware';
import { registerSchema, loginSchema } from '../validators';

const router = Router();

router.post('/register', validateBody(registerSchema), register);
router.post('/login', validateBody(loginSchema), login);
router.get('/me', authenticate, getMe);

export default router;
