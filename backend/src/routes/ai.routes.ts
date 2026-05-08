import { Router } from 'express';
import { getAISubtasks, getAIPriority, getAISummary } from '../controllers/ai.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Unauthenticated test endpoint for debugging
router.get('/test', async (_req, res) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    res.status(500).json({ success: false, message: 'GEMINI_API_KEY is not set in environment' });
    return;
  }
  try {
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const ai = new GoogleGenerativeAI(apiKey);
    const model = ai.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const result = await model.generateContent('Say "OK" in one word.');
    const text = result.response.text();
    res.json({ success: true, message: 'Gemini AI is working!', response: text, keyPrefix: apiKey.substring(0, 8) + '...' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message, keyPrefix: apiKey.substring(0, 8) + '...' });
  }
});

router.use(authenticate);
router.post('/subtasks', getAISubtasks);
router.post('/suggest-priority', getAIPriority);
router.get('/summarize/:taskId', getAISummary);

export default router;
