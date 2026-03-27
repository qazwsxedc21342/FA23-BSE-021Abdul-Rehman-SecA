import { Router } from 'express';
import { register, login, getMe } from '../controllers/authController.js';
import { authenticate } from '../middlewares/auth.js';
import { validate, registerSchema, loginSchema } from '../validators/schemas.js';

const router = Router();

router.post('/register', validate(registerSchema), register);
router.post('/login',    validate(loginSchema),    login);
router.get('/me',        authenticate,             getMe);

export default router;
