import express from 'express';
import { fetchAnswers, recent, trending } from '../controllers/questionController.js';
import { getComparison, rerank } from '../controllers/llmController.js';

const router = express.Router();

router.post('/', fetchAnswers);
router.get('/recent', recent);
router.get('/trending', trending);
router.post('/rerank', rerank);
router.get('/comparison/:question_id', getComparison);


export default router;
