



// -===================================================================================== =====================/////

// src/controllers/questionController.js
// import Question from '../models/Question.js';
// import {
//   getCachedAnswers,
//   setCachedAnswers,
//   pushRecent,
//   getRecent
// } from '../lib/cache.js';
// import { getAnswersForQuestion, getRecentQuestions } from '../services/stackOverflowService.js';

// import { OllamaLLMService } from '../services/ollamaLLMService.js';
// import crypto from 'crypto';
// import axios from 'axios';

// const STACKEX_API_URL = 'https://api.stackexchange.com/2.3';


// const llmService = new OllamaLLMService();

// function hash(q) {
//   return crypto.createHash('sha1').update(q.toLowerCase().trim()).digest('hex');
// }

// export async function fetchAnswers(req, res) {
//   const startTime = Date.now();
  
//   try {
//     const query = (req.body.question || '').trim();
    
//     // Input validation
//     if (!query) {
//       return res.status(400).json({ 
//         success: false,
//         error: 'Question is required',
//         field: 'question'
//       });
//     }

//     if (query.length < 3 || query.length > 500) {
//       return res.status(400).json({
//         success: false,
//         error: 'Question must be between 3 and 500 characters',
//         field: 'question'
//       });
//     }

//     console.log(`processing query: "${query}"`);

//     // OPTIMIZED FLOW: Fast Response Strategy
    
//     // Step 1: Check Redis (fastest - 5ms)
//     console.log('redis cache check...');
//     const cached = await getCachedAnswers(query);
//     if (cached) {
//       console.log('cache hit! Returning immediately');
//       await pushRecent(cached);
//       return res.json({
//         ...cached,
//         cached: true,
//         response_time_ms: Date.now() - startTime
//       });
//     }

//     // Step 2: Check MongoDB (fast - 100ms)
//     console.log('mongoDB check...');
//     const queryHash = hash(query);
//     let doc = await Question.findOne({ query_hash: queryHash });
    
//     if (doc) {
//       console.log('found in MongoDB');
      
//       // Return immediately, process LLM in background if needed
//       const mongoResult = doc.toObject();
      
//       // Background LLM processing if not done
//       if (!doc.isLLMProcessed && doc.original_answers && doc.original_answers.length > 0) {
//         console.log('triggering background ');
        
//         // Don't await - process in background
//         llmService.rerankAnswersBackground(
//           {
//             question_id: doc.question_id,
//             title: doc.title,
//             body_html: doc.body_html,
//             tags: doc.tags
//           },
//           doc.original_answers
//         ).then(async (llmResult) => {
//           if (llmResult.success) {
//             // Update MongoDB
//             await Question.findByIdAndUpdate(doc._id, {
//               reranked_answers: llmResult.reranked_answers,
//               isLLMProcessed: true,
//               llm_processed_at: new Date(),
//               llm_provider: llmResult.llm_provider,
//               llm_processing_time: llmResult.processing_time_ms
//             });
            
//             // Update Redis cache
//             const updatedDoc = await Question.findById(doc._id);
//             await setCachedAnswers(query, updatedDoc.toObject());
            
//             console.log('background LLM processing completed');
//           }
//         }).catch(error => {
//           console.error('background LLM processing failed:', error);
//         });
//       }
      
//       await setCachedAnswers(query, mongoResult);
//       await pushRecent(mongoResult);
      
//       return res.json({
//         ...mongoResult,
//         from_database: true,
//         response_time_ms: Date.now() - startTime
//       });
//     }

//     // Step 3: Fetch from Stack Overflow API (slow - 2 seconds)
//     console.log('stack Overflow API call...');
//     const result = await getAnswersForQuestion(query);

//     if (!result.success) {
//       return res.status(404).json({
//         ...result,
//         response_time_ms: Date.now() - startTime
//       });
//     }

//     // Step 4: Save to MongoDB FIRST (fast response)
//     console.log('saving to MongoDB...');
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
//         reranked_answers: [], // Will be filled by background job
//         last_asked: new Date(),
//         isLLMProcessed: false, // Will be updated by background job
//         llm_processed_at: null,
//         llm_provider: null,
//         llm_processing_time: null
//       },
//       { 
//         upsert: true, 
//         new: true,
//         setDefaultsOnInsert: true
//       }
//     );

//     // Step 5: Clean up old records (keep only recent 5)
//     console.log('cleanup...');
//     const total = await Question.countDocuments();
//     if (total > 5) {
//       const oldQuestions = await Question.find()
//         .sort({ last_asked: 1 })
//         .limit(total - 5)
//         .select('_id');
      
//       await Question.deleteMany({ 
//         _id: { $in: oldQuestions.map(q => q._id) } 
//       });
      
//       console.log(`deleted ${total - 5} old questions`);
//     }

//     // Step 6: Cache and return IMMEDIATELY
//     console.log('caching and returning...');
//     const immediateResult = doc.toObject();
//     await setCachedAnswers(query, immediateResult);
//     await pushRecent(immediateResult);

//     // Step 7: Process with LLM in BACKGROUND (don't await)
//     console.log('starting background LLM processing...');
//     llmService.rerankAnswersBackground(
//       result.question,
//       result.answers,
//       `Search query: ${query}`
//     ).then(async (llmResult) => {
//       if (llmResult.success) {
//         // Update MongoDB
//         await Question.findByIdAndUpdate(doc._id, {
//           reranked_answers: llmResult.reranked_answers,
//           isLLMProcessed: true,
//           llm_processed_at: new Date(),
//           llm_provider: llmResult.llm_provider,
//           llm_processing_time: llmResult.processing_time_ms
//         });
        
//         // Update Redis cache
//         const updatedDoc = await Question.findById(doc._id);
//         await setCachedAnswers(query, updatedDoc.toObject());
        
//         console.log('background LLM processing completed');
//       }
//     }).catch(error => {
//       console.error('background LLM processing failed:', error);
//     });

//     // Return immediately without waiting for LLM
//     console.log('returning immediate response');
//     return res.json({
//       ...immediateResult,
//       from_api: true,
//       llm_processing: {
//         status: 'processing_in_background',
//         message: 'AI reranking will be available shortly',
//         estimated_completion: '10-20 seconds'
//       },
//       response_time_ms: Date.now() - startTime
//     });

//   } catch (error) {
//     console.error('error in fetchAnswers:', error);
    
//     const errorResponse = {
//       success: false,
//       error: 'Failed to fetch answers',
//       message: error.message,
//       response_time_ms: Date.now() - startTime
//     };

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


// export async function getLLMStatus(req, res) {
//   try {
//     const { questionId } = req.params;
    
//     // Check if question exists and LLM processing status
//     const question = await Question.findOne({ question_id: questionId });
    
//     if (!question) {
//       return res.status(404).json({
//         success: false,
//         error: 'Question not found'
//       });
//     }

//     return res.json({
//       success: true,
//       question_id: questionId,
//       llm_processed: question.isLLMProcessed,
//       llm_provider: question.llm_provider,
//       processing_time_ms: question.llm_processing_time,
//       processed_at: question.llm_processed_at,
//       has_reranked_answers: question.reranked_answers && question.reranked_answers.length > 0,
//       status: question.isLLMProcessed ? 'completed' : 'processing'
//     });

//   } catch (error) {
//     console.error('error checking LLM status:', error);
//     return res.status(500).json({
//       success: false,
//       error: 'Failed to check LLM status',
//       message: error.message
//     });
//   }
// }


// export async function getRefreshedAnswers(req, res) {
//   try {
//     const query = (req.body.question || '').trim();
    
//     if (!query) {
//       return res.status(400).json({
//         success: false,
//         error: 'Question is required'
//       });
//     }

//     console.log(`🔄 Refreshing answers for: "${query}"`);

//     // Check MongoDB for latest version
//     const queryHash = hash(query);
//     const doc = await Question.findOne({ query_hash: queryHash });
    
//     if (!doc) {
//       return res.status(404).json({
//         success: false,
//         error: 'Question not found'
//       });
//     }

//     const result = doc.toObject();
    
//     // Update cache with latest version
//     await setCachedAnswers(query, result);
    
//     return res.json({
//       ...result,
//       refreshed: true,
//       timestamp: new Date().toISOString()
//     });

//   } catch (error) {
//     console.error('❌ Error refreshing answers:', error);
//     return res.status(500).json({
//       success: false,
//       error: 'Failed to refresh answers',
//       message: error.message
//     });
//   }
// }


// export async function recent(req, res) {
//   try {
//     console.log('fetching recent questions...');
    
//     const limit = Math.min(parseInt(req.query.limit) || 5, 10);
//     const recentQuestions = await getRecent();
    
//     const dbRecent = await Question
//       .find({})
//       .sort({ last_asked: -1 })
//       .limit(limit)
//       .select('question_id title tags last_asked isLLMProcessed')
//       .lean();

//     return res.json({
//       success: true,
//       recent: recentQuestions.slice(0, limit),
//       backup: dbRecent,
//       count: recentQuestions.length,
//       timestamp: new Date().toISOString()
//     });

//   } catch (error) {
//     console.error('error fetching recent questions:', error);
//     return res.status(500).json({
//       success: false,
//       error: 'Failed to fetch recent questions',
//       message: error.message
//     });
//   }
// }

// export async function trending(req, res) {
//   try {
//     const tags = req.query.tags ? req.query.tags.split(',') : [];
//     const limit = Math.min(parseInt(req.query.limit) || 10, 20);

//     const trendingQuestions = await getRecentQuestions(tags, limit);
//     return res.json(trendingQuestions);

//   } catch (error) {
//     console.error('error fetching trending questions:', error);
//     return res.status(500).json({
//       success: false,
//       error: 'Failed to fetch trending questions',
//       message: error.message
//     });
//   }
// }

// export async function health(req, res) {
//   try {
//     // Check Stack Overflow API
//     const testResponse = await axios.get(`${STACKEX_API_URL}/info`, {
//       params: { site: 'stackoverflow' },
//       timeout: 5000
//     });

//     // Check LLM service
//     const llmHealth = await llmService.healthCheck();

//     return res.json({
//       success: true,
//       service: 'stackoverflow-clone-api',
//       stack_overflow_api: {
//         status: 'healthy',
//         quota_remaining: testResponse.data.quota_remaining,
//         quota_limit: testResponse.data.quota_max
//       },
//       llm_service: llmHealth,
//       database: {
//         mongodb: 'connected',
//         redis: 'connected'
//       },
//       timestamp: new Date().toISOString(),
//       uptime: process.uptime()
//     });

//   } catch (error) {
//     console.error('health check failed:', error);
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
import { OllamaLLMService } from '../services/ollamaLLMService.js';
import crypto from 'crypto';
import axios from 'axios';

const STACKEX_API_URL = 'https://api.stackexchange.com/2.3';

// Initialize LLM service
const llmService = new OllamaLLMService();

function hash(q) {
  return crypto.createHash('sha1').update(q.toLowerCase().trim()).digest('hex');
}

export async function fetchAnswers(req, res) {
  const startTime = Date.now();
  
  try {
    const query = (req.body.question || '').trim();
    
    // Input validation
    if (!query) {
      return res.status(400).json({ 
        success: false,
        error: 'Question is required',
        field: 'question'
      });
    }

    if (query.length < 3 || query.length > 500) {
      return res.status(400).json({
        success: false,
        error: 'Question must be between 3 and 500 characters',
        field: 'question'
      });
    }

    console.log(`processing query: "${query}"`);

    // SUPER FAST RESPONSE STRATEGY
    
    // Step 1: Check Redis (fastest - 5ms)
    console.log('redis cache check...');
    const cached = await getCachedAnswers(query);
    if (cached) {
      console.log('cache hit! Returning immediately');
      await pushRecent(cached);
      return res.json({
        ...cached,
        cached: true,
        response_time_ms: Date.now() - startTime
      });
    }

    // Step 2: Check MongoDB (fast - 50ms)
    console.log('mongoDB check...');
    const queryHash = hash(query);
    let doc = await Question.findOne({ query_hash: queryHash });
    
    if (doc) {
      console.log('found in MongoDB - returning immediately');
      
      const mongoResult = doc.toObject();
      
     
      if (!doc.isLLMProcessed && doc.original_answers && doc.original_answers.length > 0) {
        console.log('starting background LLM processing (non-blocking)...');
        
        processLLMInBackground(doc, query);
      }
      
      await setCachedAnswers(query, mongoResult);
      await pushRecent(mongoResult);
      
      return res.json({
        ...mongoResult,
        from_database: true,
        response_time_ms: Date.now() - startTime,
        llm_status: doc.isLLMProcessed ? 'completed' : 'processing'
      });
    }

    console.log('stack Overflow API call...');
    const result = await getAnswersForQuestion(query);

    if (!result.success) {
      return res.status(404).json({
        ...result,
        response_time_ms: Date.now() - startTime
      });
    }

    console.log('saving to MongoDB...');
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
        reranked_answers: [], 
        last_asked: new Date(),
        isLLMProcessed: false,
        llm_processed_at: null,
        llm_provider: null,
        llm_processing_time: null
      },
      { 
        upsert: true, 
        new: true,
        setDefaultsOnInsert: true
      }
    );

    cleanupOldRecords();

    
    console.log('caching and returning immediately...');
    const immediateResult = doc.toObject();
    await setCachedAnswers(query, immediateResult);
    await pushRecent(immediateResult);

    
    console.log('starting background LLM processing...');
    processLLMInBackground(doc, query);

    console.log(`returning immediate response in ${Date.now() - startTime}ms`);
    return res.json({
      ...immediateResult,
      from_api: true,
      llm_processing: {
        status: 'processing_in_background',
        message: 'AI reranking will be available shortly',
        estimated_completion: '10-30 seconds'
      },
      response_time_ms: Date.now() - startTime
    });

  } catch (error) {
    console.error('error in fetchAnswers:', error);
    
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

async function processLLMInBackground(doc, query) {
  setImmediate(async () => {
    try {
      console.log(`background LLM processing started for question ${doc.question_id}`);
      
      const llmResult = await llmService.rerankAnswers(
        {
          question_id: doc.question_id,
          title: doc.title,
          body_html: doc.body_html,
          tags: doc.tags
        },
        doc.original_answers,
        `Search query: ${query}`
      );
      
      if (llmResult.success && llmResult.reranked_answers) {
        await Question.findByIdAndUpdate(doc._id, {
          reranked_answers: llmResult.reranked_answers,
          isLLMProcessed: true,
          llm_processed_at: new Date(),
          llm_provider: llmResult.llm_provider,
          llm_processing_time: llmResult.processing_time_ms
        });
        
        const updatedDoc = await Question.findById(doc._id);
        if (updatedDoc) {
          await setCachedAnswers(query, updatedDoc.toObject());
        }
        
        console.log(`background LLM processing completed for ${doc.question_id} in ${llmResult.processing_time_ms}ms`);
      } else {
        console.error(`background LLM processing failed for ${doc.question_id}:`, llmResult.error);
        
        await Question.findByIdAndUpdate(doc._id, {
          isLLMProcessed: true, 
          llm_processed_at: new Date(),
          llm_provider: 'failed',
          llm_processing_time: llmResult.processing_time_ms,
          llm_error: llmResult.error
        });
      }
      
    } catch (error) {
      console.error(`background LLM processing error for ${doc.question_id}:`, error);
      
      try {
        await Question.findByIdAndUpdate(doc._id, {
          isLLMProcessed: true,
          llm_processed_at: new Date(),
          llm_provider: 'failed',
          llm_error: error.message
        });
      } catch (dbError) {
        console.error('failed to update database with error status:', dbError);
      }
    }
  });
}

async function cleanupOldRecords() {
  setImmediate(async () => {
    try {
      const total = await Question.countDocuments();
      if (total > 5) {
        const oldQuestions = await Question.find()
          .sort({ last_asked: 1 })
          .limit(total - 5)
          .select('_id');
        
        await Question.deleteMany({ 
          _id: { $in: oldQuestions.map(q => q._id) } 
        });
        
        console.log(`cleaned up ${total - 5} old questions`);
      }
    } catch (error) {
      console.error('cleanup error:', error);
    }
  });
}

export async function getLLMStatus(req, res) {
  try {
    const { questionId } = req.params;
    
    const question = await Question.findOne({ question_id: questionId });
    
    if (!question) {
      return res.status(404).json({
        success: false,
        error: 'Question not found'
      });
    }

    return res.json({
      success: true,
      question_id: questionId,
      llm_processed: question.isLLMProcessed,
      llm_provider: question.llm_provider,
      processing_time_ms: question.llm_processing_time,
      processed_at: question.llm_processed_at,
      has_reranked_answers: question.reranked_answers && question.reranked_answers.length > 0,
      status: question.isLLMProcessed ? 'completed' : 'processing',
      error: question.llm_error || null
    });

  } catch (error) {
    console.error('error checking LLM status:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to check LLM status',
      message: error.message
    });
  }
}

export async function getRefreshedAnswers(req, res) {
  try {
    const query = (req.body.question || '').trim();
    
    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Question is required'
      });
    }

    console.log(`refreshing answers for: "${query}"`);

    const queryHash = hash(query);
    const doc = await Question.findOne({ query_hash: queryHash });
    
    if (!doc) {
      return res.status(404).json({
        success: false,
        error: 'Question not found'
      });
    }

    const result = doc.toObject();
    
    await setCachedAnswers(query, result);
    
    return res.json({
      ...result,
      refreshed: true,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('error refreshing answers:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to refresh answers',
      message: error.message
    });
  }
}

export async function recent(req, res) {
  try {
    console.log('fetching recent questions...');
    
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
    console.error('error fetching recent questions:', error);
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
    console.error('error fetching trending questions:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch trending questions',
      message: error.message
    });
  }
}

export async function health(req, res) {
  try {
    const testResponse = await axios.get(`${STACKEX_API_URL}/info`, {
      params: { site: 'stackoverflow' },
      timeout: 5000
    });

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
    console.error('health check failed:', error);
    return res.status(503).json({
      success: false,
      service: 'stackoverflow-clone-api',
      error: 'Service unhealthy',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
}