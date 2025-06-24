// import { getLLM, setLLM } from '../lib/cache.js';
// import Question from '../models/Question.js';
// import { rerankWithLLM } from '../services/llmService.js';

// export async function rerank(req, res) {
//   const { question_id } = req.body;
//   if (!question_id) return res.status(400).json({ error:'question_id required' });

//   const cached = await getLLM(question_id);
//   if (cached) return res.json({ reranked: cached });

//   const doc = await Question.findOne({ question_id });
//   if (!doc) return res.status(404).json({ error:'question not cached' });

//   const reranked = await rerankWithLLM(doc, doc.original_answers);

//   doc.reranked_answers = reranked;
//   doc.isLLMProcessed = true;
//   await doc.save();
//   await setLLM(question_id, reranked);

//   res.json({ reranked });
// }


// import Question from '../models/Question.js';
// import { rerankWithLLM } from '../services/llmService.js';
// import { getLLM, setLLM } from '../lib/cache.js';

// export async function rerank(req, res) {
//   const { question_id } = req.body || {};
//   if (!question_id) return res.status(400).json({ error: 'question_id required' });

//   /* 1️⃣ Redis check */
//   const cached = await getLLM(question_id);
//   if (cached) return res.json({ reranked: cached });

//   /* 2️⃣ Mongo check */
//   const doc = await Question.findOne({ question_id }).lean();
//   if (!doc) return res.status(404).json({ error: 'question not cached' });

//   try {
//     const ranked = await rerankWithLLM(doc, doc.original_answers);

//     /* persist */
//     await Question.updateOne(
//       { question_id },
//       { reranked_answers: ranked, isLLMProcessed: true }
//     );
//     await setLLM(question_id, ranked);

//     return res.json({ reranked: ranked });
//   } catch (err) {
//     console.error('LLM error:', err.message);
//     return res.status(502).json({ error: 'LLM unavailable' });
//   }
// }


// controllers/llmController.js - Fixed implementation
import Question from '../models/Question.js';
import { LLMService } from '../services/llmService.js'; 
import { getLLM, setLLM } from '../lib/cache.js';

export async function rerank(req, res) {
  const { question_id } = req.body || {};
  if (!question_id) return res.status(400).json({ error: 'question_id required' });

  console.log(`🤖 Starting LLM rerank for question ID: ${question_id}`);

  try {
    /* 1️⃣ Check Redis cache first */
    const cached = await getLLM(question_id);
    if (cached) {
      console.log('🎯 Returning cached LLM result');
      return res.json({ 
        success: true,
        reranked: cached.reranked_answers,
        metadata: {
          from_cache: true,
          cached_at: cached.cached_at,
          processing_time: 0
        }
      });
    }

    /* 2️⃣ Get question from MongoDB */
    const doc = await Question.findOne({ question_id }).lean();
    if (!doc) {
      return res.status(404).json({ 
        success: false,
        error: 'Question not found. Please search for the question first.' 
      });
    }

    if (!doc.original_answers || doc.original_answers.length === 0) {
      return res.status(400).json({ 
        success: false,
        error: 'No answers found to rank for this question.' 
      });
    }

    /* 3️⃣ Process with LLM */
    console.log(`🔄 Processing ${doc.original_answers.length} answers with LLM...`);
    const startTime = Date.now();
    
    const ranked = await rerankWithLLM(doc, doc.original_answers);
    const processingTime = Date.now() - startTime;

    /* 4️⃣ Save to MongoDB */
    await Question.updateOne(
      { question_id },
      { 
        reranked_answers: ranked, 
        isLLMProcessed: true,
        llm_processed_at: new Date(),
        llm_provider: process.env.LLM_PROVIDER || 'ollama',
        llm_processing_time: processingTime
      }
    );

    /* 5️⃣ Cache the result */
    await setLLM(question_id, ranked);

    console.log(`✅ LLM reranking completed in ${processingTime}ms`);

    /* 6️⃣ Calculate ranking changes */
    const rankingChanges = calculateRankingChanges(doc.original_answers, ranked);

    return res.json({ 
      success: true,
      reranked: ranked,
      metadata: {
        from_cache: false,
        processing_time: processingTime,
        provider: process.env.LLM_PROVIDER || 'ollama',
        total_answers: ranked.length,
        ranking_changes: rankingChanges
      }
    });

  } catch (err) {
    console.error('❌ LLM error:', err.message);
    return res.status(502).json({ 
      success: false,
      error: 'LLM service unavailable',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
}

// Helper function to analyze ranking changes
function calculateRankingChanges(originalAnswers, rerankedAnswers) {
  const originalOrder = originalAnswers.map(a => a.answer_id);
  const newOrder = rerankedAnswers.map(a => a.answer_id);
  
  let positionChanges = 0;
  const changes = [];
  
  originalOrder.forEach((answerId, originalIndex) => {
    const newIndex = newOrder.indexOf(answerId);
    const change = originalIndex - newIndex;
    
    if (change !== 0) {
      positionChanges++;
      changes.push({
        answer_id: answerId,
        original_position: originalIndex + 1,
        new_position: newIndex + 1,
        change: change > 0 ? `+${change}` : change.toString()
      });
    }
  });

  return {
    total_changes: positionChanges,
    percentage_changed: Math.round((positionChanges / originalOrder.length) * 100),
    significant_reordering: positionChanges > originalOrder.length * 0.4,
    position_changes: changes.slice(0, 5) // Show top 5 changes
  };
}

// Get comparison between original and LLM rankings
export async function getComparison(req, res) {
  const { question_id } = req.params;
  
  try {
    const doc = await Question.findOne({ question_id: parseInt(question_id) });
    if (!doc) {
      return res.status(404).json({ 
        success: false,
        error: 'Question not found' 
      });
    }

    const hasLLMRanking = doc.isLLMProcessed && doc.reranked_answers && doc.reranked_answers.length > 0;

    const response = {
      success: true,
      question: {
        question_id: doc.question_id,
        title: doc.title,
        tags: doc.tags
      },
      has_llm_ranking: hasLLMRanking,
      original_count: doc.original_answers.length,
      reranked_count: hasLLMRanking ? doc.reranked_answers.length : 0,
      llm_metadata: hasLLMRanking ? {
        processed_at: doc.llm_processed_at,
        provider: doc.llm_provider,
        processing_time: doc.llm_processing_time
      } : null
    };

    if (hasLLMRanking) {
      response.comparison = {
        original_top_3: doc.original_answers.slice(0, 3).map((answer, index) => ({
          rank: index + 1,
          answer_id: answer.answer_id,
          score: answer.score,
          is_accepted: answer.is_accepted
        })),
        llm_top_3: doc.reranked_answers.slice(0, 3).map(answer => ({
          rank: answer.llm_rank,
          answer_id: answer.answer_id,
          llm_score: answer.llm_score,
          llm_reasoning: answer.llm_reasoning
        })),
        ranking_analysis: calculateRankingChanges(doc.original_answers, doc.reranked_answers)
      };
    }

    res.json(response);

  } catch (error) {
    console.error('Error getting comparison:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to get ranking comparison' 
    });
  }
}