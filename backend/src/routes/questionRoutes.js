import express from 'express';
import { fetchAnswers, recent } from '../controllers/questionController.js';

const router = express.Router();

router.post('/', fetchAnswers);
router.get('/recent', recent);


export default router;
