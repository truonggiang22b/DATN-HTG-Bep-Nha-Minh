import { Router } from 'express';
import { login, logout, getMe, refreshToken } from './auth.controller';
import { authMiddleware } from '../../middlewares/authMiddleware';

export const authRouter = Router();

authRouter.post('/login', login);
authRouter.post('/logout', logout);
authRouter.post('/refresh', refreshToken);   // ← mới: không cần auth vì dùng refreshToken
authRouter.get('/me', authMiddleware, getMe);
