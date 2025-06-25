// import axios from 'axios';

// export async function rerankWithLLM(question, answers) {
//   // If already <2 answers just return as-is
//   if (answers.length < 2) return answers;

//   const provider = process.env.LLM_PROVIDER || 'ollama';
//   const model    = process.env.LLM_MODEL    || 'mistral:7b';

//   // ✂ keep body short (Ollama 4k ctx)
//   const trimmed = answers.map(a => ({
//     id: a.answer_id,
//     score: a.score,
//     text: (a.body_html || '').replace(/<[^>]+>/g,'').slice(0, 800)
//   }));

//   const systemPrompt = `
// You are a Stack Overflow expert.
// Return ONLY a JSON array of answer_id ranked best → worst for the question below.
// `;

//   const userPrompt = `
// Question title:
// "${question.title}"

// Answers:
// ${JSON.stringify(trimmed, null, 2)}
// `;

//   let response;
//   if (provider === 'openai') {
//     try {
//   resp = await axios.post(
//     'https://api.openai.com/v1/chat/completions',
//     { /* ... */ },
//     { headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
//       timeout: 15_000 }
//   );
// } catch (err) {
//   console.error('OpenAI error →', err.response?.data || err.message);
//   throw err;                     // bubbles up to controller
// }
//   }

//   // ---- Ollama ----
//   response = await axios.post(
//     'http://localhost:11434/v1/chat/completions', 
//     {
//       model,
//       messages: [
//         { role: 'system', content: systemPrompt.trim() },
//         { role: 'user',   content: userPrompt.trim() }
//       ]
//     }
//   );
//   return reorder(answers, response.data.choices[0].message.content);
// }


// // helper: map JSON id list back to objects
// function reorder(original, content) {
//   let order;
//   try { order = JSON.parse(content); } catch { order = []; }

//   const ranked = order
//     .map(id => original.find(a => a.answer_id === id))
//     .filter(Boolean);

//   // append any answers the model ignored
//   original.forEach(a => {
//     if (!ranked.find(r => r.answer_id === a.answer_id)) ranked.push(a);
//   });
//   return ranked;
// }
// services/llmService.js - Smart Environment Detection



// // ====== Enhanced LLM Service with Better Error Handling ======
// import OpenAI from 'openai';
// import { getLLM, setLLM } from '../lib/cache.js';

// export class LLMService {
//   constructor() {
//     try {
//       // Check if API key exists
//       if (!process.env.OPENAI_API_KEY) {
//         console.error('⚠️ OPENAI_API_KEY not found in environment variables');
//         throw new Error('OpenAI API key is required');
//       }

//       // Initialize OpenAI client
//       this.openai = new OpenAI({
//         apiKey: process.env.OPENAI_API_KEY
//       });
      
//       this.model = 'gpt-4o'; // Using GPT-4 Omni
//       console.log('🤖 LLM Service initialized with OpenAI GPT-4');
//     } catch (error) {
//       console.error('💥 Failed to initialize LLM Service:', error.message);
//       throw error;
//     }
//   }

//   // Test function to verify LLM service works
//   async testConnection() {
//     try {
//       console.log('🧪 Testing OpenAI connection...');
//       const response = await this.openai.chat.completions.create({
//         model: this.model,
//         messages: [{ role: "user", content: "Say 'Hello World'" }],
//         max_tokens: 10,
//         temperature: 0
//       });

//       console.log('✅ LLM connection test successful');
//       return { success: true, response: response.choices[0].message.content };
//     } catch (error) {
//       console.error('❌ LLM connection test failed:', error.message);
//       return { success: false, error: error.message };
//     }
//   }

//   // Main function to rerank answers
//   async rerankAnswers(question, originalAnswers, questionContext = '') {
//     const startTime = Date.now();
    
//     try {
//       console.log(`🤖 Starting LLM reranking for ${originalAnswers.length} answers...`);

//       // Validate inputs
//       if (!question || !question.question_id) {
//         throw new Error('Invalid question object - missing question_id');
//       }

//       if (!originalAnswers || originalAnswers.length === 0) {
//         console.log('⚠️ No answers to rerank');
//         return {
//           success: false,
//           error: 'No answers to rerank',
//           reranked_answers: [],
//           processing_time_ms: Date.now() - startTime,
//           llm_provider: 'no-answers'
//         };
//       }

//       // Check cache first
//       const questionId = question.question_id;
//       console.log(`🔍 Checking LLM cache for question ${questionId}...`);
      
//       try {
//         const cachedResult = await getLLM(questionId);
        
//         if (cachedResult) {
//           console.log('💨 LLM cache hit! Returning cached reranked answers');
//           return {
//             success: true,
//             reranked_answers: cachedResult.reranked_answers,
//             processing_time_ms: Date.now() - startTime,
//             cached: true,
//             llm_provider: 'openai-cached'
//           };
//         }
//       } catch (cacheError) {
//         console.warn('⚠️ Cache read error:', cacheError.message);
//       }

//       // Prepare answers for LLM processing
//       console.log('📝 Preparing answers for LLM processing...');
//       const answersForProcessing = this.prepareAnswersForLLM(originalAnswers);
      
//       if (answersForProcessing.length === 0) {
//         console.log('⚠️ No valid answers to process after filtering');
//         return {
//           success: false,
//           error: 'No valid answers to rerank after filtering',
//           reranked_answers: originalAnswers,
//           processing_time_ms: Date.now() - startTime,
//           llm_provider: 'no-valid-answers'
//         };
//       }

//       console.log(`✅ Prepared ${answersForProcessing.length} answers for LLM processing`);

//       // Get reranking from OpenAI
//       const rerankedAnswers = await this.processWithOpenAI(
//         question, 
//         answersForProcessing, 
//         questionContext
//       );

//       // Cache the result
//       try {
//         await setLLM(questionId, rerankedAnswers);
//         console.log('💾 LLM result cached successfully');
//       } catch (cacheError) {
//         console.warn('⚠️ Cache write error:', cacheError.message);
//       }

//       console.log(`✅ LLM reranking completed in ${Date.now() - startTime}ms`);
      
//       return {
//         success: true,
//         reranked_answers: rerankedAnswers,
//         processing_time_ms: Date.now() - startTime,
//         cached: false,
//         llm_provider: 'openai',
//         model_used: this.model
//       };

//     } catch (error) {
//       console.error('💥 LLM reranking failed:', error);
//       console.error('Error details:', {
//         message: error.message,
//         stack: error.stack,
//         questionId: question?.question_id,
//         answersCount: originalAnswers?.length
//       });
      
//       return {
//         success: false,
//         error: error.message,
//         reranked_answers: originalAnswers, // Fallback to original order
//         processing_time_ms: Date.now() - startTime,
//         llm_provider: 'fallback'
//       };
//     }
//   }

//   // Prepare answers for LLM processing
//   prepareAnswersForLLM(answers) {
//     console.log(`🔧 Filtering ${answers.length} answers...`);
    
//     const filtered = answers
//       .filter(answer => {
//         const hasBody = answer.body_html && answer.body_html.length > 50;
//         const notDeleted = !answer.body_html?.includes('[deleted]');
//         return hasBody && notDeleted;
//       })
//       .map((answer, index) => ({
//         original_index: index,
//         answer_id: answer.answer_id,
//         score: answer.score || 0,
//         is_accepted: answer.is_accepted || false,
//         clean_text: this.extractCleanText(answer.body_html),
//         has_code: this.hasCodeBlocks(answer.body_html),
//         word_count: this.countWords(answer.body_html),
//         owner_reputation: answer.owner?.reputation || 0,
//         quality_score: answer.quality_score || 0
//       }));

//     console.log(`✅ Filtered to ${filtered.length} valid answers`);
//     return filtered;
//   }

//   // Extract clean text from HTML
//   extractCleanText(html) {
//     if (!html) return '';
    
//     return html
//       .replace(/<code[^>]*>[\s\S]*?<\/code>/gi, '[CODE_BLOCK]')
//       .replace(/<pre[^>]*>[\s\S]*?<\/pre>/gi, '[CODE_BLOCK]')
//       .replace(/<[^>]*>/g, ' ')
//       .replace(/&lt;/g, '<')
//       .replace(/&gt;/g, '>')
//       .replace(/&amp;/g, '&')
//       .replace(/&quot;/g, '"')
//       .replace(/&#39;/g, "'")
//       .replace(/\s+/g, ' ')
//       .trim();
//   }

//   // Helper functions
//   hasCodeBlocks(html) {
//     if (!html) return false;
//     return html.includes('<code>') || html.includes('<pre>') || html.includes('```');
//   }

//   countWords(html) {
//     if (!html) return 0;
//     const text = this.extractCleanText(html);
//     return text ? text.split(/\s+/).length : 0;
//   }

//   // Enhanced OpenAI processing with better error handling
//   async processWithOpenAI(question, answers, questionContext) {
//     try {
//       console.log('📤 Sending request to OpenAI...');
//       console.log(`📊 Processing ${answers.length} answers for question: "${question.title?.substring(0, 50)}..."`);
      
//       // Create a more robust prompt
//       const prompt = this.createEnhancedPrompt(question, answers, questionContext);
      
//       console.log('🔄 Making OpenAI API call...');
//       const completion = await this.openai.chat.completions.create({
//         model: this.model,
//         messages: [
//           {
//             role: "system",
//             content: `You are an expert technical evaluator for Stack Overflow answers. 

// Your task is to rerank answers based on:
// 1. Relevance to the specific question (40%)
// 2. Technical accuracy (25%) 
// 3. Completeness of solution (20%)
// 4. Code quality and examples (10%)
// 5. Clarity and helpfulness (5%)

// You MUST respond with valid JSON in this exact format:
// {
//   "reranked_answers": [
//     {
//       "answer_id": 12345,
//       "new_rank": 1,
//       "llm_score": 95,
//       "llm_reasoning": "Comprehensive answer with working code example"
//     }
//   ]
// }

// Do NOT include any other text outside the JSON.`
//           },
//           {
//             role: "user",
//             content: prompt
//           }
//         ],
//         temperature: 0.2, // Lower temperature for more consistent results
//         max_tokens: 2000, // Increased token limit
//         response_format: { type: "json_object" }
//       });

//       const responseText = completion.choices[0].message.content;
//       console.log('📥 Received response from OpenAI');
//       console.log('📄 Response preview:', responseText.substring(0, 200) + '...');
      
//       // Parse and validate JSON response
//       let llmResponse;
//       try {
//         llmResponse = JSON.parse(responseText);
//       } catch (parseError) {
//         console.error('❌ Failed to parse OpenAI JSON response:', parseError);
//         console.error('Raw response:', responseText);
//         throw new Error('OpenAI returned invalid JSON');
//       }

//       // Process and merge with original data
//       return this.processLLMResponse(llmResponse, answers);

//     } catch (error) {
//       console.error('❌ OpenAI API error:', error);
      
//       // Enhanced error handling with specific messages
//       if (error.status === 401) {
//         throw new Error('OpenAI API key is invalid or expired');
//       } else if (error.status === 429) {
//         throw new Error('OpenAI rate limit exceeded. Please try again later.');
//       } else if (error.status === 500) {
//         throw new Error('OpenAI service is temporarily unavailable');
//       } else if (error.code === 'ENOTFOUND') {
//         throw new Error('Network error: Cannot reach OpenAI API');
//       } else if (error.code === 'ETIMEDOUT') {
//         throw new Error('OpenAI API request timed out');
//       } else {
//         throw new Error(`OpenAI API error: ${error.message}`);
//       }
//     }
//   }

//   // Create enhanced prompt
//   createEnhancedPrompt(question, answers, questionContext) {
//     const questionText = `Question: "${question.title || 'Unknown Title'}"
// Tags: ${question.tags?.join(', ') || 'None'}
// Context: ${questionContext || 'None'}`;

//     const answersText = answers.map((answer, index) => {
//       const preview = answer.clean_text.substring(0, 300);
//       return `Answer ${index + 1}:
// ID: ${answer.answer_id}
// Score: ${answer.score}
// Accepted: ${answer.is_accepted ? 'Yes' : 'No'}
// Has Code: ${answer.has_code ? 'Yes' : 'No'}
// Owner Rep: ${answer.owner_reputation}
// Content: ${preview}${answer.clean_text.length > 300 ? '...' : ''}
// ---`;
//     }).join('\n');

//     return `${questionText}

// Please rank these ${answers.length} Stack Overflow answers from most helpful to least helpful.

// ${answersText}

// Return JSON with reranked_answers array containing answer_id, new_rank (1=best), llm_score (0-100), and llm_reasoning for each answer.`;
//   }

//   // Enhanced LLM response processing
//   processLLMResponse(llmResponse, originalAnswers) {
//     try {
//       console.log('🔧 Processing LLM response...');
      
//       const { reranked_answers } = llmResponse;
      
//       if (!reranked_answers || !Array.isArray(reranked_answers)) {
//         console.error('❌ Invalid LLM response structure:', llmResponse);
//         throw new Error('LLM response missing reranked_answers array');
//       }

//       console.log(`📊 LLM ranked ${reranked_answers.length} answers`);

//       // Create a map for easy lookup
//       const llmDataMap = new Map();
//       reranked_answers.forEach(item => {
//         llmDataMap.set(item.answer_id, item);
//       });

//       // Merge LLM data with original answers
//       const mergedAnswers = originalAnswers.map((answer, index) => {
//         const llmData = llmDataMap.get(answer.answer_id);
        
//         return {
//           ...answer,
//           llm_rank: llmData?.new_rank || (index + 1), // Fallback to original order
//           llm_score: llmData?.llm_score || 50, // Neutral score fallback
//           llm_reasoning: llmData?.llm_reasoning || 'No AI analysis available'
//         };
//       });

//       // Sort by LLM rank
//       const sortedAnswers = mergedAnswers.sort((a, b) => {
//         if (a.llm_rank !== b.llm_rank) {
//           return a.llm_rank - b.llm_rank;
//         }
//         return (b.score || 0) - (a.score || 0); // Fallback to Stack Overflow score
//       });

//       console.log('📊 Final reranked order:', sortedAnswers.map(a => ({
//         id: a.answer_id,
//         original_rank: originalAnswers.findIndex(orig => orig.answer_id === a.answer_id) + 1,
//         llm_rank: a.llm_rank,
//         llm_score: a.llm_score
//       })));

//       return sortedAnswers;

//     } catch (error) {
//       console.error('❌ Error processing LLM response:', error);
//       console.error('LLM Response:', llmResponse);
//       throw new Error(`Failed to process LLM response: ${error.message}`);
//     }
//   }

//   // Enhanced health check
//   async healthCheck() {
//     try {
//       console.log('🏥 Running LLM health check...');
//       const testResult = await this.testConnection();
      
//       return {
//         status: testResult.success ? 'healthy' : 'unhealthy',
//         provider: 'openai',
//         model: this.model,
//         test_response: testResult.response || testResult.error,
//         timestamp: new Date().toISOString()
//       };

//     } catch (error) {
//       console.error('❌ Health check failed:', error);
//       return {
//         status: 'unhealthy',
//         provider: 'openai',
//         error: error.message,
//         timestamp: new Date().toISOString()
//       };
//     }
//   }
// }

// // ====== Enhanced Controller with Better Error Handling ======
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
//       await pushRecent(cached);
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
//       console.log('💾 Found in MongoDB');
      
//       // Check if LLM processing is needed
//       if (!doc.isLLMProcessed && doc.original_answers && doc.original_answers.length > 0) {
//         console.log('🤖 Running LLM reranking on existing data...');
        
//         try {
//           const llmResult = await llmService.rerankAnswers(
//             {
//               question_id: doc.question_id,
//               title: doc.title,
//               body_html: doc.body_html,
//               tags: doc.tags
//             },
//             doc.original_answers
//           );

//           if (llmResult.success) {
//             // Update document with LLM results
//             doc.reranked_answers = llmResult.reranked_answers;
//             doc.isLLMProcessed = true;
//             doc.llm_processed_at = new Date();
//             doc.llm_provider = llmResult.llm_provider;
//             doc.llm_processing_time = llmResult.processing_time_ms;
            
//             await doc.save();
//             console.log('✅ Updated MongoDB with LLM results');
//           } else {
//             console.warn('⚠️ LLM processing failed for cached data:', llmResult.error);
//           }
//         } catch (llmError) {
//           console.error('💥 LLM processing error for cached data:', llmError.message);
//         }
//       }
      
//       const mongoResult = doc.toObject();
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

//     // Step 4: Process with LLM
//     console.log('4️⃣ Processing with LLM...');
//     let llmResult = { success: false, reranked_answers: [] };
    
//     if (result.answers && result.answers.length > 0) {
//       try {
//         llmResult = await llmService.rerankAnswers(
//           result.question,
//           result.answers,
//           `Search query: ${query}`
//         );
        
//         console.log('🎯 LLM Result:', {
//           success: llmResult.success,
//           provider: llmResult.llm_provider,
//           processing_time: llmResult.processing_time_ms,
//           answers_count: llmResult.reranked_answers?.length || 0
//         });
        
//       } catch (llmError) {
//         console.error('💥 LLM processing failed:', llmError.message);
//         llmResult = {
//           success: false,
//           error: llmError.message,
//           reranked_answers: result.answers, // Use original answers as fallback
//           llm_provider: 'failed'
//         };
//       }
//     }

//     // Step 5: Save to MongoDB
//     console.log('5️⃣ Saving to MongoDB...');
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
//         reranked_answers: llmResult.success ? llmResult.reranked_answers : [],
//         last_asked: new Date(),
//         // LLM fields
//         isLLMProcessed: llmResult.success,
//         llm_processed_at: llmResult.success ? new Date() : null,
//         llm_provider: llmResult.llm_provider || null,
//         llm_processing_time: llmResult.processing_time_ms || null
//       },
//       { 
//         upsert: true, 
//         new: true,
//         setDefaultsOnInsert: true
//       }
//     );

//     // Step 6: Maintain collection size (keep only recent 5 questions)
//     console.log('6️⃣ Cleaning up old records...');
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

//     // Step 7: Cache the result
//     console.log('7️⃣ Caching result in Redis...');
//     const finalResult = doc.toObject();
//     await setCachedAnswers(query, finalResult);
//     await pushRecent(finalResult);

//     // Step 8: Return response
//     console.log('✅ Request completed successfully');
//     return res.json({
//       ...finalResult,
//       from_api: true,
//       llm_processing: llmResult.success ? {
//         provider: llmResult.llm_provider,
//         processing_time_ms: llmResult.processing_time_ms,
//         cached: llmResult.cached || false
//       } : {
//         error: llmResult.error || 'LLM processing failed',
//         provider: llmResult.llm_provider || 'failed'
//       },
//       response_time_ms: Date.now() - startTime
//     });

//   } catch (error) {
//     console.error('💥 Error in fetchAnswers:', error);
    
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

// ====== Debug Commands ======
/*
To debug your LLM integration, check these:

1. Test OpenAI API key:
   curl -H "Authorization: Bearer YOUR_API_KEY" \
   https://api.openai.com/v1/models

2. Check backend logs when making a request
3. Verify environment variables are loaded:
   console.log('API Key exists:', !!process.env.OPENAI_API_KEY);

4. Test individual LLM call:
   POST http://localhost:4000/api/questions/health
*/





// import axios from 'axios';
// import { getLLM, setLLM } from '../lib/cache.js';

// export class OllamaLLMService {
//   constructor() {
//     this.baseURL = process.env.LLM_BASE_URL || 'http://localhost:11434';
//     this.model = process.env.LLM_MODEL || 'mistral:7b';
//     this.provider = 'ollama';
    
//     console.log(`🦙 Ollama LLM Service initialized`);
//     console.log(`📡 Base URL: ${this.baseURL}`);
//     console.log(`🤖 Model: ${this.model}`);
    
//     // Test connection on startup
//     this.testConnection();
//   }

//   // Test Ollama connection and list available models
//   async testConnection() {
//     try {
//       console.log('🧪 Testing Ollama connection...');
//       const response = await axios.get(`${this.baseURL}/api/tags`, {
//         timeout: 5000
//       });
      
//       const availableModels = response.data.models?.map(m => m.name) || [];
//       console.log('✅ Ollama connected. Available models:', availableModels);
      
//       // Check if our model is available
//       const modelExists = availableModels.some(m => m.includes(this.model.split(':')[0]));
//       if (!modelExists) {
//         console.warn(`⚠️ Model ${this.model} not found. Available: ${availableModels.join(', ')}`);
//       }
      
//       return { success: true, models: availableModels };
//     } catch (error) {
//       console.error('❌ Ollama connection failed:', error.message);
//       return { success: false, error: error.message };
//     }
//   }

//   // Main reranking function with caching
//   async rerankAnswers(question, originalAnswers, questionContext = '') {
//     const startTime = Date.now();
    
//     try {
//       const questionId = question.question_id;
//       console.log(`🦙 Starting Ollama reranking for question ${questionId}...`);

//       // Check cache first
//       const cachedResult = await getLLM(questionId);
//       if (cachedResult) {
//         console.log('💨 LLM cache hit!');
//         return {
//           success: true,
//           reranked_answers: cachedResult.reranked_answers,
//           processing_time_ms: Date.now() - startTime,
//           cached: true,
//           llm_provider: 'ollama-cached'
//         };
//       }

//       // Prepare answers for processing
//       const answersForProcessing = this.prepareAnswersForLLM(originalAnswers);
//       if (answersForProcessing.length === 0) {
//         throw new Error('No valid answers to process');
//       }

//       // Process with Ollama
//       const rerankedAnswers = await this.processWithOllama(
//         question, 
//         answersForProcessing, 
//         questionContext
//       );

//       // Cache result
//       await setLLM(questionId, rerankedAnswers);

//       console.log(`✅ Ollama reranking completed in ${Date.now() - startTime}ms`);
      
//       return {
//         success: true,
//         reranked_answers: rerankedAnswers,
//         processing_time_ms: Date.now() - startTime,
//         cached: false,
//         llm_provider: 'ollama',
//         model_used: this.model
//       };

//     } catch (error) {
//       console.error('💥 Ollama reranking failed:', error);
//       return {
//         success: false,
//         error: error.message,
//         reranked_answers: originalAnswers, // Fallback to original
//         processing_time_ms: Date.now() - startTime,
//         llm_provider: 'fallback'
//       };
//     }
//   }

//   // Background processing for immediate response strategy
//   async rerankAnswersBackground(question, originalAnswers, questionContext = '') {
//     const questionId = question.question_id;
    
//     try {
//       console.log(`🔄 Background LLM processing for question ${questionId}...`);
      
//       // Set processing status
//       await this.setProcessingStatus(questionId, 'processing');
      
//       // Process with Ollama
//       const result = await this.rerankAnswers(question, originalAnswers, questionContext);
      
//       if (result.success) {
//         await this.setProcessingStatus(questionId, 'completed');
//         console.log(`✅ Background LLM processing completed for question ${questionId}`);
//       } else {
//         await this.setProcessingStatus(questionId, 'failed', result.error);
//         console.error(`❌ Background LLM processing failed for question ${questionId}:`, result.error);
//       }
      
//       return result;
//     } catch (error) {
//       console.error(`💥 Background LLM processing error for question ${questionId}:`, error);
//       await this.setProcessingStatus(questionId, 'failed', error.message);
//       throw error;
//     }
//   }

//   // Process with Ollama API
//   async processWithOllama(question, answers, questionContext) {
//     try {
//       console.log('📤 Sending request to Ollama...');
      
//       const prompt = this.createOllamaPrompt(question, answers, questionContext);
      
//       const response = await axios.post(`${this.baseURL}/api/generate`, {
//         model: this.model,
//         prompt: prompt,
//         stream: false,
//         options: {
//           temperature: 0.2,
//           top_p: 0.9,
//           max_tokens: 2000
//         }
//       }, {
//         timeout: 30000 // 30 second timeout
//       });

//       console.log('📥 Received response from Ollama');
      
//       const responseText = response.data.response;
//       console.log('📄 Response preview:', responseText.substring(0, 200) + '...');
      
//       // Parse JSON from response
//       const llmResponse = this.parseOllamaResponse(responseText);
      
//       // Process and merge with original data
//       return this.processLLMResponse(llmResponse, answers);

//     } catch (error) {
//       console.error('❌ Ollama API error:', error);
      
//       if (error.code === 'ECONNREFUSED') {
//         throw new Error('Ollama server is not running. Please start Ollama.');
//       } else if (error.code === 'ETIMEDOUT') {
//         throw new Error('Ollama request timed out. Model might be loading.');
//       } else {
//         throw new Error(`Ollama API error: ${error.message}`);
//       }
//     }
//   }

//   // Create optimized prompt for Ollama
//   createOllamaPrompt(question, answers, questionContext) {
//     const questionText = `Question: "${question.title || 'Unknown Title'}"
// Tags: ${question.tags?.join(', ') || 'None'}
// Context: ${questionContext || 'None'}`;

//     const answersText = answers.map((answer, index) => {
//       const preview = answer.clean_text.substring(0, 300);
//       return `Answer ${index + 1}:
// ID: ${answer.answer_id}
// Score: ${answer.score}
// Accepted: ${answer.is_accepted ? 'Yes' : 'No'}
// Content: ${preview}...`;
//     }).join('\n\n');

//     return `You are a technical expert evaluating Stack Overflow answers. Rank these ${answers.length} answers from best (rank 1) to worst based on relevance, accuracy, and helpfulness.

// ${questionText}

// ANSWERS:
// ${answersText}

// Respond with ONLY valid JSON in this exact format:
// {
//   "reranked_answers": [
//     {"answer_id": ${answers[0]?.answer_id}, "new_rank": 1, "llm_score": 95, "llm_reasoning": "Best answer because..."},
//     {"answer_id": ${answers[1]?.answer_id}, "new_rank": 2, "llm_score": 80, "llm_reasoning": "Good answer but..."}
//   ]
// }

// JSON:`;
//   }

//   // Parse Ollama response (handles extra text)
//   parseOllamaResponse(responseText) {
//     try {
//       // Try to find JSON in the response
//       const jsonMatch = responseText.match(/\{[\s\S]*\}/);
//       if (jsonMatch) {
//         return JSON.parse(jsonMatch[0]);
//       }
      
//       // If no JSON found, try parsing the whole response
//       return JSON.parse(responseText);
//     } catch (error) {
//       console.error('❌ Failed to parse Ollama response:', error);
//       console.error('Raw response:', responseText);
//       throw new Error('Ollama returned invalid JSON');
//     }
//   }

//   // Prepare answers for LLM processing
//   prepareAnswersForLLM(answers) {
//     return answers
//       .filter(answer => answer.body_html && answer.body_html.length > 50)
//       .map((answer, index) => ({
//         original_index: index,
//         answer_id: answer.answer_id,
//         score: answer.score || 0,
//         is_accepted: answer.is_accepted || false,
//         clean_text: this.extractCleanText(answer.body_html),
//         has_code: this.hasCodeBlocks(answer.body_html),
//         word_count: this.countWords(answer.body_html),
//         owner_reputation: answer.owner?.reputation || 0
//       }));
//   }

//   // Extract clean text from HTML
//   extractCleanText(html) {
//     if (!html) return '';
//     return html
//       .replace(/<code[^>]*>[\s\S]*?<\/code>/gi, '[CODE]')
//       .replace(/<pre[^>]*>[\s\S]*?<\/pre>/gi, '[CODE_BLOCK]')
//       .replace(/<[^>]*>/g, ' ')
//       .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')
//       .replace(/\s+/g, ' ').trim();
//   }

//   // Check if answer has code blocks
//   hasCodeBlocks(html) {
//     return html?.includes('<code>') || html?.includes('<pre>');
//   }

//   // Count words in HTML content
//   countWords(html) {
//     const text = this.extractCleanText(html);
//     return text ? text.split(/\s+/).length : 0;
//   }

//   // Process LLM response and merge with original data
//   processLLMResponse(llmResponse, originalAnswers) {
//     try {
//       const { reranked_answers } = llmResponse;
      
//       if (!reranked_answers || !Array.isArray(reranked_answers)) {
//         throw new Error('Invalid LLM response structure');
//       }

//       // Create map for quick lookup
//       const llmDataMap = new Map();
//       reranked_answers.forEach(item => {
//         llmDataMap.set(item.answer_id, item);
//       });

//       // Merge original answers with LLM data
//       const mergedAnswers = originalAnswers.map((answer, index) => {
//         const llmData = llmDataMap.get(answer.answer_id);
//         return {
//           ...answer,
//           llm_rank: llmData?.new_rank || (index + 1),
//           llm_score: llmData?.llm_score || 50,
//           llm_reasoning: llmData?.llm_reasoning || 'No AI analysis available'
//         };
//       });

//       // Sort by LLM rank, then by original score
//       return mergedAnswers.sort((a, b) => {
//         if (a.llm_rank !== b.llm_rank) return a.llm_rank - b.llm_rank;
//         return (b.score || 0) - (a.score || 0);
//       });

//     } catch (error) {
//       console.error('❌ Error processing LLM response:', error);
//       throw new Error(`Failed to process LLM response: ${error.message}`);
//     }
//   }

//   // Processing status management
//   async setProcessingStatus(questionId, status, error = null) {
//     try {
//       const statusData = {
//         status,
//         timestamp: new Date().toISOString(),
//         ...(error && { error })
//       };
      
//       // Use Redis to store processing status (you can implement this in cache.js)
//       console.log(`📊 LLM status for ${questionId}: ${status}`);
//       // await redis.setex(`llm:status:${questionId}`, 3600, JSON.stringify(statusData));
//     } catch (err) {
//       console.error('❌ Failed to set processing status:', err);
//     }
//   }

//   // Health check for monitoring
//   async healthCheck() {
//     try {
//       const testResult = await this.testConnection();
      
//       return {
//         status: testResult.success ? 'healthy' : 'unhealthy',
//         provider: this.provider,
//         model: this.model,
//         base_url: this.baseURL,
//         available_models: testResult.models || [],
//         timestamp: new Date().toISOString()
//       };
//     } catch (error) {
//       return {
//         status: 'unhealthy',
//         provider: this.provider,
//         error: error.message,
//         timestamp: new Date().toISOString()
//       };
//     }
//   }
// }