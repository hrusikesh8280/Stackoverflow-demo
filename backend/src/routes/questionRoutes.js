import { Router } from 'express';
const router = Router();

/*  POST /api/answers
    body: { question: "..." }
    (temporary stub) */
router.post('/', async (req, res) => {
  res.json({ original: [], reranked: [] });
});

export default router;
