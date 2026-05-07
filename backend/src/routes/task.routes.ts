import { Router } from 'express';
import {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
  updateTaskStatus,
  addComment,
} from '../controllers/task.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/', getTasks);
router.post('/', createTask);
router.put('/:id', updateTask);
router.delete('/:id', deleteTask);
router.patch('/:id/status', updateTaskStatus);
router.post('/:id/comments', addComment);

export default router;
