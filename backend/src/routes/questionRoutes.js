import express from 'express';
import { fetchAnswers, getLLMStatus, getRefreshedAnswers, health, recent, trending } from '../controllers/questionController.js';

const router = express.Router();

router.post('/', fetchAnswers);
router.get('/recent', recent);
router.get('/trending', trending);
router.post('/refresh', getRefreshedAnswers);
router.get('/llm-status/:questionId', getLLMStatus);
router.get('/health', health)
// router.post('/rerank', rerank);
// router.get('/comparison/:question_id', getComparison);


export default router;
