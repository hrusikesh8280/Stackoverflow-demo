// import { getAnswersForQuestion } from '../services/stackOverflowService.js';
// import { Question } from '../models/Question.js';

// export async function fetchAnswers(req, res) {
//   const { question } = req.body;
  
//   if (!question || typeof question !== 'string' || question.trim().length === 0) {
//     return res.status(400).json({ 
//       success: false,
//       error: 'question is required and must be a non-empty string',
//       message: 'please provide a valid question to search for'
//     });
//   }

//   const cleanQuestion = question.trim();
  
//   try {
//     console.log(`processing question: "${cleanQuestion}"`);
    
//     const startTime = Date.now();
    
//     const result = await getAnswersForQuestion(cleanQuestion);
//         if (!result.success || result.answers.length === 0) {
//       return res.status(404).json({
//         success: false,
//         error: 'no answers found',
//         message: 'we could not find any answers to your question. Please try rephrasing it.'
//       });
//     }
    
//     const processingTime = Date.now() - startTime;

//     // Save to database for caching (as per assignment requirement)
//     try {
//     //   const questionDoc = new Question({
//     //     questionText: cleanQuestion,
//     //     stackOverflowQuestionId: result.question.question_id,
//     //     stackOverflowUrl: result.question.link,
//     //     title: result.question.title,
//     //     tags: result.question.tags,
//     //     originalAnswers: result.answers,
//     //     rerankedAnswers: [], // Will be filled by LLM service
//     //     apiResponseTime: processingTime,
//     //     metadata: {
//     //       stackOverflowApiCalls: 3, // search + question + answers
//     //       totalAnswersFound: result.answers.length
//     //     }
//     //   });

//     //   await questionDoc.save();
//     // console.log('saved question to database:');
     
//     } catch (dbError) {
//       console.warn('failed to save to database:', dbError.message);
//     }

//     console.log(`successfully processed in ${processingTime}ms`);

//     return res.json({ 
//       success: true,
//       data: {
//         question: result.question,
//         original_answers: result.answers,
//         reranked_answers: [], // Will be populated by LLM service
//         metadata: {
//           processing_time_ms: processingTime,
//           api_quota_remaining: result.metadata.api_quota_remaining,
//           search_results_found: result.metadata.total_search_results,
//           answers_found: result.metadata.answers_found,
//           search_query: cleanQuestion
//         }
//       }
//     });
    
//   } catch (error) {
//     console.error(`error processing question "${cleanQuestion}":`, error.message);
    
//     let statusCode = 500;
//     let errorMessage = 'Failed to fetch answers from stack overflow';
    
//     if (error.message.includes('no questions found')) {
//       statusCode = 404;
//       errorMessage = 'no questions found matching your search';
//     } else if (error.message.includes('quota exceeded')) {
//       statusCode = 429;
//       errorMessage = 'API rate limit exceeded. Please try again later.';
//     } else if (error.message.includes('Network error')) {
//       statusCode = 503;
//       errorMessage = 'unable to connect to stack Overflow. please check your internet connection.';
//     }
    
//     return res.status(statusCode).json({ 
//       success: false,
//       error: errorMessage,
//       details: process.env.NODE_ENV === 'development' ? error.message : undefined
//     });
//   }
// }

// Get recent cached questions (assignment requirement)
// export async function getRecentQuestions(req, res) {
//   try {
//     const recentQuestions = await Question.getRecentQuestions();
    
//     return res.json({
//       success: true,
//       data: {
//         recent_questions: recentQuestions,
//         count: recentQuestions.length
//       }
//     });
//   } catch (error) {
//     console.error('Error fetching recent questions:', error);
//     return res.status(500).json({
//       success: false,
//       error: 'Failed to fetch recent questions'
//     });
//   }
// }

// ===========================================================

//Controller (only database + cache logic)

//============================================================


import Question from '../models/Question.js';
import {
  getCachedAnswers,
  setCachedAnswers,
  pushRecent,
  getRecent
} from '../lib/cache.js';
import { getAnswersForQuestion } from '../services/stackOverflowService.js';
import crypto from 'crypto';

function hash(q) {
  return crypto.createHash('sha1').update(q).digest('hex');
}

export async function fetchAnswers(req, res) {
  const query = (req.body.question || '').trim();
  if (!query) return res.status(400).json({ error: 'question required' });

  /* 1️⃣ Redis */
  const cached = await getCachedAnswers(query);
  if (cached) return res.json(cached);

  /* 2️⃣ Mongo */
  let doc = await Question.findOne({ query_hash: hash(query) });
  if (doc) {
    await setCachedAnswers(query, doc);
    await pushRecent(doc);
    return res.json(doc);
  }

  /* 3️⃣ External API */
  try {
    const result = await getAnswersForQuestion(query);

    doc = await Question.findOneAndUpdate(
      { question_id: result.question.question_id },
      {
        question_id: result.question.question_id,
        query_hash: hash(query),
        title: result.question.title,
        body_html: result.question.body,
        tags: result.question.tags,
        link: result.question.link,
        original_answers: result.answers,
        last_asked: new Date()
      },
      { upsert: true, new: true }
    );

    // keep collection ≤ 5
    const total = await Question.countDocuments();
    if (total > 5) {
      const ids = await Question.find()
        .sort({ last_asked: 1 })
        .limit(total - 5)
        .select('_id');
      await Question.deleteMany({ _id: { $in: ids.map(d => d._id) } });
    }

    await setCachedAnswers(query, doc);
    await pushRecent(doc);
    return res.json(doc);
  } catch (err) {
    console.error(err);
    res.status(502).json({ error: 'Stack Overflow fetch failed' });
  }
}

export async function recent(req, res) {
  res.json(await getRecent());
}
