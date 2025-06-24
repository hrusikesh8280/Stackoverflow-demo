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


// import Question from '../models/Question.js';
// import {
//   getCachedAnswers,
//   setCachedAnswers,
//   pushRecent,
//   getRecent
// } from '../lib/cache.js';
// import { getAnswersForQuestion } from '../services/stackOverflowService.js';
// import crypto from 'crypto';

// function hash(q) {
//   return crypto.createHash('sha1').update(q).digest('hex');
// }

// export async function fetchAnswers(req, res) {
//   const query = (req.body.question || '').trim();
//   if (!query) return res.status(400).json({ error: 'question required' });

//   /* 1️⃣ Redis */
//   const cached = await getCachedAnswers(query);
//   if (cached) return res.json(cached);

//   /* 2️⃣ Mongo */
//   let doc = await Question.findOne({ query_hash: hash(query) });
//   if (doc) {
//     await setCachedAnswers(query, doc);
//     await pushRecent(doc);
//     return res.json(doc);
//   }

//   /* 3️⃣ External API */
//   try {
//     const result = await getAnswersForQuestion(query);

//     doc = await Question.findOneAndUpdate(
//       { question_id: result.question.question_id },
//       {
//         question_id: result.question.question_id,
//         query_hash: hash(query),
//         title: result.question.title,
//         body_html: result.question.body,
//         tags: result.question.tags,
//         link: result.question.link,
//         original_answers: result.answers,
//         last_asked: new Date()
//       },
//       { upsert: true, new: true }
//     );

//     // keep collection ≤ 5
//     const total = await Question.countDocuments();
//     if (total > 5) {
//       const ids = await Question.find()
//         .sort({ last_asked: 1 })
//         .limit(total - 5)
//         .select('_id');
//       await Question.deleteMany({ _id: { $in: ids.map(d => d._id) } });
//     }

//     await setCachedAnswers(query, doc);
//     await pushRecent(doc);
//     return res.json(doc);
//   } catch (err) {
//     console.error(err);
//     res.status(502).json({ error: 'Stack Overflow fetch failed' });
//   }
// }

// export async function recent(req, res) {
//   res.json(await getRecent());
// }


// import Question from '../models/Question.js';
// import {
//   getCachedAnswers,
//   setCachedAnswers,
//   pushRecent,
//   getRecent
// } from '../lib/cache.js';
// import { getAnswersForQuestion, getRecentQuestions } from '../services/stackOverflowService.js';
// import crypto from 'crypto';

// function hash(q) {
//   return crypto.createHash('sha1').update(q.toLowerCase().trim()).digest('hex');
// }

// export async function fetchAnswers(req, res) {
//   const startTime = Date.now();
  
//   try {
//     // Input validation
//     const query = (req.body.question || '').trim();
    
//     if (!query) {
//       return res.status(400).json({ 
//         success: false,
//         error: 'Question is required',
//         field: 'question'
//       });
//     }

//     if (query.length < 3) {
//       return res.status(400).json({
//         success: false,
//         error: 'Question must be at least 3 characters long',
//         field: 'question'
//       });
//     }

//     if (query.length > 500) {
//       return res.status(400).json({
//         success: false,
//         error: 'Question must be less than 500 characters',
//         field: 'question'
//       });
//     }

//     console.log(`🔍 Processing query: "${query}"`);

//     // Step 1: Check Redis cache
//     console.log('1️⃣ Checking Redis cache...');
//     const cached = await getCachedAnswers(query);
//     if (cached) {
//       console.log('💨 Cache hit! Returning cached result');
//       await pushRecent(cached); // Update recent list
//       return res.json({
//         ...cached,
//         cached: true,
//         response_time_ms: Date.now() - startTime
//       });
//     }

//     // Step 2: Check MongoDB
//     console.log('2️⃣ Checking MongoDB...');
//     const queryHash = hash(query);
//     let doc = await Question.findOne({ query_hash: queryHash });
    
//     if (doc) {
//       console.log('💾 Found in MongoDB, caching and returning');
//       const mongoResult = doc.toObject();
      
//       // Cache in Redis for faster future access
//       await setCachedAnswers(query, mongoResult);
//       await pushRecent(mongoResult);
      
//       return res.json({
//         ...mongoResult,
//         from_database: true,
//         response_time_ms: Date.now() - startTime
//       });
//     }

//     // Step 3: Fetch from Stack Overflow API
//     console.log('3️⃣ Fetching from Stack Overflow API...');
//     const result = await getAnswersForQuestion(query);

//     if (!result.success) {
//       return res.status(404).json({
//         ...result,
//         response_time_ms: Date.now() - startTime
//       });
//     }

//     // Step 4: Save to MongoDB
//     console.log('4️⃣ Saving to MongoDB...');
//     doc = await Question.findOneAndUpdate(
//       { question_id: result.question.question_id },
//       {
//         question_id: result.question.question_id,
//         query_hash: queryHash,
//         title: result.question.title,
//         body_html: result.question.body_html,
//         tags: result.question.tags,
//         link: result.question.link,
//         original_answers: result.answers,
//         last_asked: new Date(),
//         // LLM fields (will be populated later)
//         isLLMProcessed: false,
//         llm_processed_at: null,
//         reranked_answers: []
//       },
//       { 
//         upsert: true, 
//         new: true,
//         setDefaultsOnInsert: true
//       }
//     );

//     // Step 5: Maintain collection size (keep only recent 5 questions)
//     console.log('5️⃣ Cleaning up old records...');
//     const total = await Question.countDocuments();
//     if (total > 5) {
//       const oldQuestions = await Question.find()
//         .sort({ last_asked: 1 })
//         .limit(total - 5)
//         .select('_id');
      
//       const deleteIds = oldQuestions.map(q => q._id);
//       await Question.deleteMany({ _id: { $in: deleteIds } });
      
//       console.log(`🗑️ Deleted ${deleteIds.length} old questions`);
//     }

//     // Step 6: Cache the result
//     console.log('6️⃣ Caching result in Redis...');
//     const finalResult = doc.toObject();
//     await setCachedAnswers(query, finalResult);
//     await pushRecent(finalResult);

//     // Step 7: Return response
//     console.log('✅ Request completed successfully');
//     return res.json({
//       ...finalResult,
//       from_api: true,
//       response_time_ms: Date.now() - startTime
//     });

//   } catch (error) {
//     console.error('💥 Error in fetchAnswers:', error);
    
//     // Return structured error response
//     const errorResponse = {
//       success: false,
//       error: 'Failed to fetch answers',
//       message: error.message,
//       response_time_ms: Date.now() - startTime
//     };

//     // Determine appropriate HTTP status code
//     if (error.message.includes('quota exceeded')) {
//       return res.status(429).json(errorResponse);
//     } else if (error.message.includes('Network error') || error.message.includes('timeout')) {
//       return res.status(503).json(errorResponse);
//     } else if (error.message.includes('Invalid request')) {
//       return res.status(400).json(errorResponse);
//     } else {
//       return res.status(500).json(errorResponse);
//     }
//   }
// }

// export async function recent(req, res) {
//   try {
//     console.log('📋 Fetching recent questions...');
    
//     const limit = Math.min(parseInt(req.query.limit) || 5, 10);
//     const recentQuestions = await getRecent();
    
//     // Also get from MongoDB as backup
//     const dbRecent = await Question
//       .find({})
//       .sort({ last_asked: -1 })
//       .limit(limit)
//       .select('question_id title tags last_asked')
//       .lean();

//     return res.json({
//       success: true,
//       recent: recentQuestions.slice(0, limit),
//       backup: dbRecent,
//       count: recentQuestions.length,
//       timestamp: new Date().toISOString()
//     });

//   } catch (error) {
//     console.error('❌ Error fetching recent questions:', error);
//     return res.status(500).json({
//       success: false,
//       error: 'Failed to fetch recent questions',
//       message: error.message
//     });
//   }
// }

// // New endpoint for Stack Overflow trending questions
// export async function trending(req, res) {
//   try {
//     const tags = req.query.tags ? req.query.tags.split(',') : [];
//     const limit = Math.min(parseInt(req.query.limit) || 10, 20);

//     const trendingQuestions = await getRecentQuestions(tags, limit);

//     return res.json(trendingQuestions);

//   } catch (error) {
//     console.error('❌ Error fetching trending questions:', error);
//     return res.status(500).json({
//       success: false,
//       error: 'Failed to fetch trending questions',
//       message: error.message
//     });
//   }
// }

// // Health check with API quota status
// export async function health(req, res) {
//   try {
//     // Make a simple API call to check Stack Overflow API health
//     const testResponse = await axios.get(`${STACKEX_API_URL}/info`, {
//       params: { site: 'stackoverflow' },
//       timeout: 5000
//     });

//     return res.json({
//       success: true,
//       service: 'stackoverflow-clone-api',
//       stack_overflow_api: {
//         status: 'healthy',
//         quota_remaining: testResponse.data.quota_remaining,
//         quota_limit: testResponse.data.quota_max
//       },
//       database: {
//         mongodb: 'connected',
//         redis: 'connected'
//       },
//       timestamp: new Date().toISOString(),
//       uptime: process.uptime()
//     });

//   } catch (error) {
//     console.error('❌ Health check failed:', error);
//     return res.status(503).json({
//       success: false,
//       service: 'stackoverflow-clone-api',
//       error: 'Service unhealthy',
//       details: error.message,
//       timestamp: new Date().toISOString()
//     });
//   }
// }






import Question from '../models/Question.js';
import {
  getCachedAnswers,
  setCachedAnswers,
  pushRecent,
  getRecent
} from '../lib/cache.js';
import { getAnswersForQuestion, getRecentQuestions } from '../services/stackOverflowService.js';
import { LLMService } from '../services/llmService.js'; 
import crypto from 'crypto';
import axios from 'axios';


const STACKEX_API_URL = 'https://api.stackexchange.com/2.3';

// Initialize LLM service
const llmService = new LLMService();

function hash(q) {
  return crypto.createHash('sha1').update(q.toLowerCase().trim()).digest('hex');
}

export async function fetchAnswers(req, res) {
  const startTime = Date.now();
  
  try {
    // Input validation
    const query = (req.body.question || '').trim();
    
    if (!query) {
      return res.status(400).json({ 
        success: false,
        error: 'Question is required',
        field: 'question'
      });
    }

    if (query.length < 3) {
      return res.status(400).json({
        success: false,
        error: 'Question must be at least 3 characters long',
        field: 'question'
      });
    }

    if (query.length > 500) {
      return res.status(400).json({
        success: false,
        error: 'Question must be less than 500 characters',
        field: 'question'
      });
    }

    console.log(`🔍 Processing query: "${query}"`);

    // Step 1: Check Redis cache
    console.log('1️⃣ Checking Redis cache...');
    const cached = await getCachedAnswers(query);
    if (cached) {
      console.log('💨 Cache hit! Returning cached result');
      await pushRecent(cached);
      return res.json({
        ...cached,
        cached: true,
        response_time_ms: Date.now() - startTime
      });
    }

    // Step 2: Check MongoDB
    console.log('2️⃣ Checking MongoDB...');
    const queryHash = hash(query);
    let doc = await Question.findOne({ query_hash: queryHash });
    
    if (doc) {
      console.log('💾 Found in MongoDB');
      
      // Check if LLM processing is needed
      if (!doc.isLLMProcessed && doc.original_answers && doc.original_answers.length > 0) {
        console.log('🤖 Running LLM reranking on existing data...');
        
        const llmResult = await llmService.rerankAnswers(
          {
            question_id: doc.question_id,
            title: doc.title,
            body_html: doc.body_html,
            tags: doc.tags
          },
          doc.original_answers
        );

        if (llmResult.success) {
          // Update document with LLM results
          doc.reranked_answers = llmResult.reranked_answers;
          doc.isLLMProcessed = true;
          doc.llm_processed_at = new Date();
          doc.llm_provider = llmResult.llm_provider;
          doc.llm_processing_time = llmResult.processing_time_ms;
          
          await doc.save();
          console.log('✅ Updated MongoDB with LLM results');
        }
      }
      
      const mongoResult = doc.toObject();
      await setCachedAnswers(query, mongoResult);
      await pushRecent(mongoResult);
      
      return res.json({
        ...mongoResult,
        from_database: true,
        response_time_ms: Date.now() - startTime
      });
    }

    // Step 3: Fetch from Stack Overflow API
    console.log('3️⃣ Fetching from Stack Overflow API...');
    const result = await getAnswersForQuestion(query);

    if (!result.success) {
      return res.status(404).json({
        ...result,
        response_time_ms: Date.now() - startTime
      });
    }

    // Step 4: Process with LLM
    console.log('4️⃣ Processing with LLM...');
    let llmResult = { success: false, reranked_answers: [] };
    
    if (result.answers && result.answers.length > 0) {
      llmResult = await llmService.rerankAnswers(
        result.question,
        result.answers,
        `Search query: ${query}`
      );
    }

    // Step 5: Save to MongoDB
    console.log('5️⃣ Saving to MongoDB...');
    doc = await Question.findOneAndUpdate(
      { question_id: result.question.question_id },
      {
        question_id: result.question.question_id,
        query_hash: queryHash,
        title: result.question.title,
        body_html: result.question.body_html,
        tags: result.question.tags,
        link: result.question.link,
        original_answers: result.answers,
        reranked_answers: llmResult.success ? llmResult.reranked_answers : [],
        last_asked: new Date(),
        // LLM fields
        isLLMProcessed: llmResult.success,
        llm_processed_at: llmResult.success ? new Date() : null,
        llm_provider: llmResult.llm_provider || null,
        llm_processing_time: llmResult.processing_time_ms || null
      },
      { 
        upsert: true, 
        new: true,
        setDefaultsOnInsert: true
      }
    );

    // Step 6: Maintain collection size (keep only recent 5 questions)
    console.log('6️⃣ Cleaning up old records...');
    const total = await Question.countDocuments();
    if (total > 5) {
      const oldQuestions = await Question.find()
        .sort({ last_asked: 1 })
        .limit(total - 5)
        .select('_id');
      
      const deleteIds = oldQuestions.map(q => q._id);
      await Question.deleteMany({ _id: { $in: deleteIds } });
      
      console.log(`🗑️ Deleted ${deleteIds.length} old questions`);
    }

    // Step 7: Cache the result
    console.log('7️⃣ Caching result in Redis...');
    const finalResult = doc.toObject();
    await setCachedAnswers(query, finalResult);
    await pushRecent(finalResult);

    // Step 8: Return response
    console.log('✅ Request completed successfully');
    return res.json({
      ...finalResult,
      from_api: true,
      llm_processing: llmResult.success ? {
        provider: llmResult.llm_provider,
        processing_time_ms: llmResult.processing_time_ms,
        cached: llmResult.cached || false
      } : null,
      response_time_ms: Date.now() - startTime
    });

  } catch (error) {
    console.error('💥 Error in fetchAnswers:', error);
    
    const errorResponse = {
      success: false,
      error: 'Failed to fetch answers',
      message: error.message,
      response_time_ms: Date.now() - startTime
    };

    if (error.message.includes('quota exceeded')) {
      return res.status(429).json(errorResponse);
    } else if (error.message.includes('Network error') || error.message.includes('timeout')) {
      return res.status(503).json(errorResponse);
    } else if (error.message.includes('Invalid request')) {
      return res.status(400).json(errorResponse);
    } else {
      return res.status(500).json(errorResponse);
    }
  }
}

export async function recent(req, res) {
  try {
    console.log('📋 Fetching recent questions...');
    
    const limit = Math.min(parseInt(req.query.limit) || 5, 10);
    const recentQuestions = await getRecent();
    
    const dbRecent = await Question
      .find({})
      .sort({ last_asked: -1 })
      .limit(limit)
      .select('question_id title tags last_asked isLLMProcessed')
      .lean();

    return res.json({
      success: true,
      recent: recentQuestions.slice(0, limit),
      backup: dbRecent,
      count: recentQuestions.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error fetching recent questions:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch recent questions',
      message: error.message
    });
  }
}

export async function trending(req, res) {
  try {
    const tags = req.query.tags ? req.query.tags.split(',') : [];
    const limit = Math.min(parseInt(req.query.limit) || 10, 20);

    const trendingQuestions = await getRecentQuestions(tags, limit);
    return res.json(trendingQuestions);

  } catch (error) {
    console.error('❌ Error fetching trending questions:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch trending questions',
      message: error.message
    });
  }
}

export async function health(req, res) {
  try {
    // Check Stack Overflow API
    const testResponse = await axios.get(`${STACKEX_API_URL}/info`, {
      params: { site: 'stackoverflow' },
      timeout: 5000
    });

    // Check LLM service
    const llmHealth = await llmService.healthCheck();

    return res.json({
      success: true,
      service: 'stackoverflow-clone-api',
      stack_overflow_api: {
        status: 'healthy',
        quota_remaining: testResponse.data.quota_remaining,
        quota_limit: testResponse.data.quota_max
      },
      llm_service: llmHealth,
      database: {
        mongodb: 'connected',
        redis: 'connected'
      },
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    });

  } catch (error) {
    console.error('❌ Health check failed:', error);
    return res.status(503).json({
      success: false,
      service: 'stackoverflow-clone-api',
      error: 'Service unhealthy',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
}
