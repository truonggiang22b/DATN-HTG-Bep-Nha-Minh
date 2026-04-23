import { Router } from 'express';
import { login, logout, getMe } from './auth.controller';
import { authMiddleware } from '../../middlewares/authMiddleware';

export const authRouter = Router();

authRouter.post('/login', login);
authRouter.post('/logout', logout);
authRouter.get('/me', authMiddleware, getMe);
