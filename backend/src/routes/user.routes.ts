import { Router } from 'express';
import { getUsers, getUserById, deactivateUser, updateMe } from '../controllers/user.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/', getUsers);
router.patch('/me', updateMe);
router.get('/:id', getUserById);
router.patch('/:id/deactivate', deactivateUser);

export default router;
