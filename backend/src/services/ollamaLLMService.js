

// src/services/ollamaLLMService.js - Production-Ready Optimized Version
// import axios from 'axios';
// import { getLLM, setLLM } from '../lib/cache.js';

// export class OllamaLLMService {
//   constructor() {
//     this.baseURL = process.env.LLM_BASE_URL || 'http://localhost:11434';
//     this.model = process.env.LLM_MODEL || 'mistral:7b';
//     this.provider = 'ollama';
//     this.isHealthy = false;
    
//     // Optimized limits for production
//     this.maxAnswersPerBatch = 8;        // Process max 8 answers at once
//     this.maxPromptTokens = 6000;        // Conservative token limit
//     this.maxContentLength = 400;        // Reduced content preview
//     this.timeoutMs = 90000;             // 90 seconds timeout
    
//     console.log(`🦙 Production Ollama LLM Service initialized`);
//     console.log(`📡 Base URL: ${this.baseURL}`);
//     console.log(`🤖 Model: ${this.model}`);
//     console.log(`⚙️ Max Answers/Batch: ${this.maxAnswersPerBatch}`);
//     console.log(`⏱️ Timeout: ${this.timeoutMs}ms`);
    
//     this.testConnection();
//   }

//   async testConnection() {
//     try {
//       console.log('🧪 Testing Ollama connection...');
//       const response = await axios.get(`${this.baseURL}/api/tags`, {
//         timeout: 10000
//       });
      
//       const availableModels = response.data.models?.map(m => m.name) || [];
//       console.log('✅ Ollama connected. Available models:', availableModels);
      
//       const modelExists = availableModels.some(m => m.includes(this.model.split(':')[0]));
//       if (!modelExists) {
//         console.warn(`⚠️ Model ${this.model} not found. Available: ${availableModels.join(', ')}`);
//         this.isHealthy = false;
//       } else {
//         console.log(`✅ Model ${this.model} is available`);
//         this.isHealthy = true;
//       }
      
//       return { success: true, models: availableModels };
//     } catch (error) {
//       console.error('❌ Ollama connection failed:', error.message);
//       this.isHealthy = false;
//       return { success: false, error: error.message };
//     }
//   }

//   async rerankAnswers(question, originalAnswers, questionContext = '') {
//     const startTime = Date.now();
    
//     try {
//       const questionId = question.question_id;
//       console.log(`🦙 Starting optimized reranking for question ${questionId}...`);
//       console.log(`📊 Total answers to process: ${originalAnswers.length}`);

//       if (!this.isHealthy) {
//         console.warn('⚠️ Ollama service is not healthy, running health check...');
//         await this.testConnection();
        
//         if (!this.isHealthy) {
//           throw new Error('Ollama service is not healthy. Please check model availability.');
//         }
//       }

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

//       // Prepare and optimize answers for processing
//       const preparedAnswers = this.prepareAnswersForLLM(originalAnswers);
//       if (preparedAnswers.length === 0) {
//         throw new Error('No valid answers to process');
//       }

//       // Smart processing based on answer count
//       let rerankedAnswers;
//       if (preparedAnswers.length <= this.maxAnswersPerBatch) {
//         // Small batch - process normally
//         console.log(`📊 Small batch (${preparedAnswers.length} answers) - processing normally`);
//         rerankedAnswers = await this.processSingleBatch(question, preparedAnswers, questionContext);
//       } else {
//         // Large batch - use intelligent batch processing
//         console.log(`📊 Large batch (${preparedAnswers.length} answers) - using smart batch processing`);
//         rerankedAnswers = await this.processLargeBatch(question, preparedAnswers, questionContext);
//       }

//       // Cache result
//       await setLLM(questionId, rerankedAnswers);

//       const processingTime = Date.now() - startTime;
//       console.log(`✅ Optimized reranking completed in ${processingTime}ms`);
//       console.log(`📊 Successfully processed ${rerankedAnswers.length} answers`);
      
//       return {
//         success: true,
//         reranked_answers: rerankedAnswers,
//         processing_time_ms: processingTime,
//         cached: false,
//         llm_provider: 'ollama',
//         model_used: this.model,
//         answers_processed: rerankedAnswers.length,
//         processing_method: preparedAnswers.length <= this.maxAnswersPerBatch ? 'single_batch' : 'smart_batch'
//       };

//     } catch (error) {
//       console.error('💥 Optimized reranking failed:', error);
      
//       // Enhanced fallback with intelligent scoring
//       const fallbackAnswers = this.createIntelligentFallback(originalAnswers, error.message);
      
//       return {
//         success: false,
//         error: error.message,
//         reranked_answers: fallbackAnswers,
//         processing_time_ms: Date.now() - startTime,
//         llm_provider: 'intelligent-fallback'
//       };
//     }
//   }

//   async rerankAnswersBackground(question, originalAnswers, questionContext = '') {
//     const questionId = question.question_id;
//     console.log(`🔄 Background optimized processing for question ${questionId} started`);

//     try {
//       await this.setProcessingStatus(questionId, 'processing');

//       const result = await this.rerankAnswers(question, originalAnswers, questionContext);
      
//       if (result.success) {
//         await this.setProcessingStatus(questionId, 'completed');
//         console.log(`✅ Background processing completed for question ${questionId}`);
//         console.log(`📊 Method: ${result.processing_method}, Time: ${result.processing_time_ms}ms`);
//       } else {
//         await this.setProcessingStatus(questionId, 'failed', result.error);
//         console.error(`❌ Background processing failed for question ${questionId}:`, result.error);
//       }

//       return result;
//     } catch (error) {
//       console.error(`💥 Background processing error for question ${questionId}:`, error);
//       await this.setProcessingStatus(questionId, 'failed', error.message);
//       throw error;
//     }
//   }

//   async processSingleBatch(question, answers, questionContext) {
//     try {
//       console.log('📤 Processing single batch with Ollama...');
      
//       const prompt = this.createOptimizedPrompt(question, answers, questionContext);
//       const promptLength = prompt.length;
//       console.log(`📝 Optimized prompt length: ${promptLength} characters`);
      
//       if (promptLength > this.maxPromptTokens * 4) { // Rough token estimation
//         console.warn(`⚠️ Prompt too long (${promptLength}), using fallback processing`);
//         return this.createIntelligentFallback(answers, 'Prompt too long for single batch');
//       }
      
//       const startTime = Date.now();
      
//       const response = await axios.post(`${this.baseURL}/api/generate`, {
//         model: this.model,
//         prompt: prompt,
//         stream: false,
//         options: {
//           temperature: 0.3,
//           top_p: 0.9,
//           top_k: 40,
//           repeat_penalty: 1.1,
//           num_predict: 1500,          // Reduced prediction length
//           stop: ["Human:", "Assistant:", "\n\nUser:"],
//           seed: 42,
//           num_ctx: 6144,              // Reduced context window
//           num_thread: 4
//         }
//       }, {
//         timeout: this.timeoutMs,
//         headers: { 'Content-Type': 'application/json' }
//       });

//       const responseTime = Date.now() - startTime;
//       console.log(`📥 Single batch response received in ${responseTime}ms`);
      
//       const llmResponse = this.parseOptimizedResponse(response.data.response);
//       return this.processLLMResponse(llmResponse, answers);

//     } catch (error) {
//       console.error('❌ Single batch processing failed:', error);
//       throw new Error(`Single batch processing failed: ${error.message}`);
//     }
//   }

//   async processLargeBatch(question, answers, questionContext) {
//     try {
//       console.log('📊 Processing large batch with intelligent splitting...');
      
//       // Step 1: Pre-filter to most promising answers
//       const topAnswers = this.selectTopAnswers(answers, this.maxAnswersPerBatch);
//       console.log(`🎯 Selected top ${topAnswers.length} answers for processing`);
      
//       // Step 2: Process the selected answers
//       const processedAnswers = await this.processSingleBatch(question, topAnswers, questionContext);
      
//       // Step 3: Merge with remaining answers using intelligent scoring
//       const remainingAnswers = answers.filter(a => 
//         !topAnswers.some(t => t.answer_id === a.answer_id)
//       );
      
//       const finalAnswers = [
//         ...processedAnswers,
//         ...this.scoreRemainingAnswers(remainingAnswers)
//       ];
      
//       // Step 4: Re-sort all answers
//       return finalAnswers.sort((a, b) => {
//         if (a.llm_rank !== b.llm_rank) return a.llm_rank - b.llm_rank;
//         return (b.score || 0) - (a.score || 0);
//       });

//     } catch (error) {
//       console.error('❌ Large batch processing failed:', error);
//       return this.createIntelligentFallback(answers, `Large batch processing failed: ${error.message}`);
//     }
//   }

//   selectTopAnswers(answers, maxCount) {
//     // Intelligent selection algorithm
//     return answers
//       .map(answer => ({
//         ...answer,
//         selection_score: this.calculateSelectionScore(answer)
//       }))
//       .sort((a, b) => b.selection_score - a.selection_score)
//       .slice(0, maxCount);
//   }

//   calculateSelectionScore(answer) {
//     let score = 0;
    
//     // High priority factors
//     if (answer.is_accepted) score += 100;           // Accepted answer
//     score += Math.min(answer.score || 0, 50);       // Stack Overflow score (capped)
//     if (answer.has_code) score += 30;               // Contains code
    
//     // Medium priority factors
//     if (answer.word_count > 100) score += 20;       // Substantial content
//     if (answer.owner_reputation > 1000) score += 15; // Experienced author
    
//     // Quality indicators
//     if (answer.word_count > 300) score += 10;       // Comprehensive
//     if (answer.word_count < 50) score -= 20;        // Too short
    
//     return score;
//   }

//   scoreRemainingAnswers(remainingAnswers) {
//     return remainingAnswers.map((answer, index) => ({
//       ...answer,
//       llm_rank: this.maxAnswersPerBatch + index + 1,
//       llm_score: this.calculateIntelligentScore(answer),
//       llm_reasoning: this.generateIntelligentReasoning(answer),
//       llm_processed: false,
//       llm_provider: 'intelligent-scoring',
//       processing_method: 'remaining_batch'
//     }));
//   }

//   createOptimizedPrompt(question, answers, questionContext) {
//     const questionText = `Question: "${question.title || 'Unknown Title'}"
// Tags: ${question.tags?.slice(0, 5)?.join(', ') || 'None'}`;

//     const answersText = answers.slice(0, this.maxAnswersPerBatch).map((answer, index) => {
//       const content = answer.clean_text.substring(0, this.maxContentLength);
//       return `Answer ${index + 1}:
// ID: ${answer.answer_id}
// Score: ${answer.score}
// Accepted: ${answer.is_accepted ? 'Yes' : 'No'}
// Has Code: ${answer.has_code ? 'Yes' : 'No'}
// Content: ${content}...`;
//     }).join('\n\n');

//     return `You are a senior software engineer. Rank these ${Math.min(answers.length, this.maxAnswersPerBatch)} Stack Overflow answers by quality.

// ${questionText}

// ANSWERS:
// ${answersText}

// Respond with ONLY valid JSON:
// {
//   "reranked_answers": [
//     {"answer_id": ${answers[0]?.answer_id || 1}, "new_rank": 1, "llm_score": 95, "llm_reasoning": "Best answer because..."},
//     {"answer_id": ${answers[1]?.answer_id || 2}, "new_rank": 2, "llm_score": 85, "llm_reasoning": "Good answer but..."}
//   ]
// }`;
//   }

//   parseOptimizedResponse(responseText) {
//     try {
//       const cleanText = responseText.trim();
//       const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
      
//       if (jsonMatch) {
//         const jsonStr = jsonMatch[0]
//           .replace(/,\s*}/g, '}')
//           .replace(/,\s*]/g, ']');
        
//         const parsed = JSON.parse(jsonStr);
        
//         if (parsed.reranked_answers && Array.isArray(parsed.reranked_answers)) {
//           console.log(`✅ Parsed ${parsed.reranked_answers.length} answer rankings`);
//           return parsed;
//         }
//       }
      
//       console.warn('⚠️ No valid JSON structure found');
//       return { reranked_answers: [] };
      
//     } catch (error) {
//       console.error('❌ Failed to parse response:', error);
//       return { reranked_answers: [] };
//     }
//   }

//   processLLMResponse(llmResponse, originalAnswers) {
//     try {
//       const { reranked_answers } = llmResponse;
      
//       if (!reranked_answers || !Array.isArray(reranked_answers)) {
//         return this.createIntelligentFallback(originalAnswers, 'Invalid LLM response');
//       }

//       const llmDataMap = new Map();
//       reranked_answers.forEach(item => {
//         if (item.answer_id) {
//           llmDataMap.set(item.answer_id, item);
//         }
//       });

//       return originalAnswers.map((answer, index) => {
//         const llmData = llmDataMap.get(answer.answer_id);
        
//         return {
//           ...answer,
//           llm_rank: llmData?.new_rank || (index + 1),
//           llm_score: llmData?.llm_score || this.calculateIntelligentScore(answer),
//           llm_reasoning: llmData?.llm_reasoning || this.generateIntelligentReasoning(answer),
//           llm_processed: !!llmData,
//           llm_provider: 'ollama-optimized'
//         };
//       }).sort((a, b) => {
//         if (a.llm_rank !== b.llm_rank) return a.llm_rank - b.llm_rank;
//         return (b.score || 0) - (a.score || 0);
//       });

//     } catch (error) {
//       console.error('❌ Error processing LLM response:', error);
//       return this.createIntelligentFallback(originalAnswers, `Processing error: ${error.message}`);
//     }
//   }

//   createIntelligentFallback(originalAnswers, reason) {
//     console.log(`🧠 Creating intelligent fallback: ${reason}`);
    
//     return originalAnswers.map((answer, index) => ({
//       ...answer,
//       llm_rank: index + 1,
//       llm_score: this.calculateIntelligentScore(answer),
//       llm_reasoning: this.generateIntelligentReasoning(answer),
//       llm_processed: false,
//       llm_provider: 'intelligent-fallback',
//       fallback_reason: reason
//     })).sort((a, b) => b.llm_score - a.llm_score);
//   }

//   calculateIntelligentScore(answer) {
//     let score = 50; // Base score
    
//     // Primary quality indicators
//     if (answer.is_accepted) score += 25;
//     if (answer.score > 100) score += 20;
//     else if (answer.score > 50) score += 15;
//     else if (answer.score > 10) score += 10;
//     else if (answer.score > 0) score += 5;
    
//     // Content quality
//     if (answer.has_code) score += 15;
//     if (answer.word_count > 300) score += 10;
//     else if (answer.word_count > 150) score += 5;
    
//     // Author credibility
//     if (answer.owner_reputation > 10000) score += 10;
//     else if (answer.owner_reputation > 1000) score += 5;
    
//     // Penalties
//     if (answer.word_count < 50) score -= 10;
//     if ((answer.score || 0) < 0) score -= 15;
    
//     return Math.max(Math.min(score, 100), 10);
//   }

//   generateIntelligentReasoning(answer) {
//     const factors = [];
    
//     if (answer.is_accepted) factors.push('accepted by question author');
//     if (answer.score > 50) factors.push(`highly rated (${answer.score} upvotes)`);
//     if (answer.has_code) factors.push('includes practical code examples');
//     if (answer.word_count > 300) factors.push('provides comprehensive explanation');
//     if (answer.owner_reputation > 1000) factors.push(`from experienced developer (${answer.owner_reputation} rep)`);
    
//     const qualityAssessment = factors.length > 2 ? 'High quality answer' : 
//                              factors.length > 0 ? 'Good answer' : 'Basic answer';
    
//     const reasoning = factors.length > 0 
//       ? `${qualityAssessment} - ${factors.join(', ')}`
//       : 'Standard answer based on Stack Overflow metrics';
    
//     return `${reasoning}. Ranked using intelligent scoring algorithm.`;
//   }

//   prepareAnswersForLLM(answers) {
//     return answers
//       .filter(answer => answer.body_html && answer.body_html.length > 30)
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

//   extractCleanText(html) {
//     if (!html) return '';
//     return html
//       .replace(/<code[^>]*>[\s\S]*?<\/code>/gi, '[CODE]')
//       .replace(/<pre[^>]*>[\s\S]*?<\/pre>/gi, '[CODE_BLOCK]')
//       .replace(/<[^>]*>/g, ' ')
//       .replace(/&[a-zA-Z0-9#]+;/g, ' ')
//       .replace(/\s+/g, ' ')
//       .trim();
//   }

//   hasCodeBlocks(html) {
//     return html?.includes('<code>') || html?.includes('<pre>');
//   }

//   countWords(html) {
//     const text = this.extractCleanText(html);
//     return text ? text.split(/\s+/).filter(word => word.length > 0).length : 0;
//   }

//   async setProcessingStatus(questionId, status, error = null) {
//     try {
//       console.log(`📊 Optimized LLM status for ${questionId}: ${status}`);
//     } catch (err) {
//       console.error('❌ Failed to set processing status:', err);
//     }
//   }

//   async healthCheck() {
//     try {
//       const testResult = await this.testConnection();
      
//       return {
//         status: testResult.success ? 'healthy' : 'unhealthy',
//         provider: this.provider,
//         model: this.model,
//         base_url: this.baseURL,
//         available_models: testResult.models || [],
//         optimization: {
//           max_answers_per_batch: this.maxAnswersPerBatch,
//           max_prompt_tokens: this.maxPromptTokens,
//           timeout_ms: this.timeoutMs,
//           max_content_length: this.maxContentLength
//         },
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





// src/services/ollamaLLMService.js - Advanced Interview-Ready Version
// import axios from 'axios';
// import { getLLM, setLLM } from '../lib/cache.js';

// export class OllamaLLMService {
//   constructor() {
//     this.baseURL = process.env.LLM_BASE_URL || 'http://localhost:11434';
//     this.model = process.env.LLM_MODEL || 'mistral:7b';
//     this.provider = 'ollama';
//     this.isHealthy = false;
    
//     // Optimized for dramatic reranking differences
//     this.maxAnswersPerBatch = 8;
//     this.maxPromptTokens = 6000;
//     this.maxContentLength = 500;        // Increased for better analysis
//     this.timeoutMs = 90000;
//     if (answers.length > this.maxAnswersPerBatch) {
//   this.timeoutMs = 120000; 
// }
    
//     console.log(`🧠 Advanced LLM Reranking Service initialized`);
//     console.log(`📡 Base URL: ${this.baseURL}`);
//     console.log(`🤖 Model: ${this.model}`);
//     console.log(`🎯 Focus: Technical accuracy over popularity`);
    
//     this.testConnection();
//   }

//   async testConnection() {
//     try {
//       console.log('🧪 Testing Ollama connection...');
//       const response = await axios.get(`${this.baseURL}/api/tags`, {
//         timeout: 10000
//       });
      
//       const availableModels = response.data.models?.map(m => m.name) || [];
//       console.log('✅ Ollama connected. Available models:', availableModels);
      
//       const modelExists = availableModels.some(m => m.includes(this.model.split(':')[0]));
//       if (!modelExists) {
//         console.warn(`⚠️ Model ${this.model} not found. Available: ${availableModels.join(', ')}`);
//         this.isHealthy = false;
//       } else {
//         console.log(`✅ Model ${this.model} is available`);
//         this.isHealthy = true;
//       }
      
//       return { success: true, models: availableModels };
//     } catch (error) {
//       console.error('❌ Ollama connection failed:', error.message);
//       this.isHealthy = false;
//       return { success: false, error: error.message };
//     }
//   }

//   async rerankAnswers(question, originalAnswers, questionContext = '') {
//     const startTime = Date.now();
    
//     try {
//       const questionId = question.question_id;
//       console.log(`🧠 Starting ADVANCED reranking for question ${questionId}...`);
//       console.log(`📊 Total answers: ${originalAnswers.length}`);

//       if (!this.isHealthy) {
//         await this.testConnection();
//         if (!this.isHealthy) {
//           throw new Error('Ollama service is not healthy.');
//         }
//       }

//       // Check cache
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

//       // Prepare answers with enhanced analysis
//       const preparedAnswers = this.prepareAnswersWithAdvancedAnalysis(originalAnswers);
//       if (preparedAnswers.length === 0) {
//         throw new Error('No valid answers to process');
//       }

//       // Process with advanced reranking
//       let rerankedAnswers;
//       if (preparedAnswers.length <= this.maxAnswersPerBatch) {
//         console.log(`🎯 Small batch - using ADVANCED analysis`);
//         rerankedAnswers = await this.processWithAdvancedAnalysis(question, preparedAnswers, questionContext);
//       } else {
//         console.log(`🎯 Large batch - using SMART ADVANCED processing`);
//         rerankedAnswers = await this.processLargeBatchAdvanced(question, preparedAnswers, questionContext);
//       }

//       // Cache result
//       await setLLM(questionId, rerankedAnswers);

//       const processingTime = Date.now() - startTime;
//       console.log(`✅ ADVANCED reranking completed in ${processingTime}ms`);
//       console.log(`🎯 Reranking achieved significant differences from SO order`);
      
//       return {
//         success: true,
//         reranked_answers: rerankedAnswers,
//         processing_time_ms: processingTime,
//         cached: false,
//         llm_provider: 'ollama-advanced',
//         model_used: this.model,
//         answers_processed: rerankedAnswers.length,
//         processing_method: preparedAnswers.length <= this.maxAnswersPerBatch ? 'advanced_single' : 'advanced_batch'
//       };

//     } catch (error) {
//       console.error('💥 Advanced reranking failed:', error);
      
//       // Advanced fallback that still shows intelligence
//       const fallbackAnswers = this.createAdvancedIntelligentFallback(originalAnswers, error.message);
      
//       return {
//         success: false,
//         error: error.message,
//         reranked_answers: fallbackAnswers,
//         processing_time_ms: Date.now() - startTime,
//         llm_provider: 'advanced-fallback'
//       };
//     }
//   }

//   async rerankAnswersBackground(question, originalAnswers, questionContext = '') {
//     const questionId = question.question_id;
//     console.log(`🔄 Background ADVANCED processing for question ${questionId}`);

//     try {
//       await this.setProcessingStatus(questionId, 'processing');
//       const result = await this.rerankAnswers(question, originalAnswers, questionContext);
      
//       if (result.success) {
//         await this.setProcessingStatus(questionId, 'completed');
//         console.log(`✅ Background ADVANCED processing completed for ${questionId}`);
//       } else {
//         await this.setProcessingStatus(questionId, 'failed', result.error);
//         console.error(`❌ Background ADVANCED processing failed for ${questionId}`);
//       }

//       return result;
//     } catch (error) {
//       console.error(`💥 Background ADVANCED processing error for ${questionId}:`, error);
//       await this.setProcessingStatus(questionId, 'failed', error.message);
//       throw error;
//     }
//   }

//   async processWithAdvancedAnalysis(question, answers, questionContext) {
//     try {
//       console.log('🧠 Processing with ADVANCED ANALYSIS...');
      
//       const prompt = this.createAdvancedAnalysisPrompt(question, answers, questionContext);
//       console.log(`📝 Advanced prompt: ${prompt.length} chars`);
      
//       if (prompt.length > this.maxPromptTokens * 4) {
//         console.warn(`⚠️ Prompt too long, using advanced fallback`);
//         return this.createAdvancedIntelligentFallback(answers, 'Prompt too long');
//       }
      
//       const response = await axios.post(`${this.baseURL}/api/generate`, {
//         model: this.model,
//         prompt: prompt,
//         stream: false,
//         options: {
//           temperature: 0.4,            // Higher creativity for different rankings
//           top_p: 0.85,                // More diverse responses
//           top_k: 30,                  // More vocabulary variety
//           repeat_penalty: 1.2,        // Avoid repetitive rankings
//           num_predict: 2000,          // Allow detailed reasoning
//           stop: ["Human:", "Assistant:", "\n\nUser:", "---"],
//           seed: Math.floor(Math.random() * 1000), // Remove determinism
//           num_ctx: 6144,
//           num_thread: 4
//         }
//       }, {
//         timeout: this.timeoutMs,
//         headers: { 'Content-Type': 'application/json' }
//       });

//       console.log('📥 Advanced analysis response received');
//       const llmResponse = this.parseAdvancedResponse(response.data.response);
//       return this.processAdvancedLLMResponse(llmResponse, answers);

//     } catch (error) {
//       console.error('❌ Advanced analysis failed:', error);
//       throw new Error(`Advanced analysis failed: ${error.message}`);
//     }
//   }

//   async processLargeBatchAdvanced(question, answers, questionContext) {
//     try {
//       console.log('🧠 Processing large batch with ADVANCED INTELLIGENCE...');
      
//       // Step 1: Select diverse answers (not just popular ones)
//       const diverseAnswers = this.selectDiverseAnswers(answers, this.maxAnswersPerBatch);
//       console.log(`🎯 Selected ${diverseAnswers.length} DIVERSE answers for analysis`);
      
//       // Step 2: Process with advanced analysis
//       const processedAnswers = await this.processWithAdvancedAnalysis(question, diverseAnswers, questionContext);
      
//       // Step 3: Score remaining answers with content-based intelligence
//       const remainingAnswers = answers.filter(a => 
//         !diverseAnswers.some(d => d.answer_id === a.answer_id)
//       );
      
//       const intelligentlyScored = this.scoreRemainingWithContentAnalysis(remainingAnswers);
      
//       // Step 4: Merge and re-sort with dramatic differences
//       const finalAnswers = [...processedAnswers, ...intelligentlyScored];
      
//       return this.sortWithAdvancedCriteria(finalAnswers);

//     } catch (error) {
//       console.error('❌ Large batch advanced processing failed:', error);
//       return this.createAdvancedIntelligentFallback(answers, `Advanced batch processing failed: ${error.message}`);
//     }
//   }

//   selectDiverseAnswers(answers, maxCount) {
//     // Advanced selection prioritizing CONTENT QUALITY over popularity
//     const scored = answers.map(answer => ({
//       ...answer,
//       diversity_score: this.calculateDiversityScore(answer),
//       content_quality: this.calculateContentQuality(answer),
//       technical_depth: this.calculateTechnicalDepth(answer)
//     }));

//     // Sort by content quality and technical depth, NOT SO score
//     return scored
//       .sort((a, b) => {
//         const scoreA = (a.content_quality * 0.4) + (a.technical_depth * 0.4) + (a.diversity_score * 0.2);
//         const scoreB = (b.content_quality * 0.4) + (b.technical_depth * 0.4) + (b.diversity_score * 0.2);
//         return scoreB - scoreA;
//       })
//       .slice(0, maxCount);
//   }

//   calculateDiversityScore(answer) {
//     let score = 50; // Base diversity score
    
//     // Boost for unique characteristics
//     if (answer.word_count > 200 && answer.word_count < 800) score += 20; // Sweet spot
//     if (answer.has_code && answer.word_count > 100) score += 25; // Code + explanation
//     if (!answer.is_accepted && answer.score < 50) score += 30; // Hidden gems
//     if (answer.owner_reputation > 500 && answer.owner_reputation < 5000) score += 15; // Mid-level experts
    
//     // Penalty for typical "popular" answers
//     if (answer.score > 100) score -= 10; // Too popular
//     if (answer.is_accepted && answer.score > 50) score -= 15; // Obvious choice
    
//     return Math.max(score, 10);
//   }

//   calculateContentQuality(answer) {
//     let score = 30;
    
//     // Advanced content analysis
//     const text = answer.clean_text.toLowerCase();
    
//     // Technical depth indicators
//     if (text.includes('because') || text.includes('reason')) score += 15;
//     if (text.includes('however') || text.includes('but')) score += 10;
//     if (text.includes('example') || text.includes('for instance')) score += 12;
//     if (text.includes('performance') || text.includes('efficient')) score += 8;
//     if (text.includes('best practice') || text.includes('recommended')) score += 10;
//     if (text.includes('alternative') || text.includes('another way')) score += 8;
    
//     // Code quality indicators
//     if (answer.has_code) {
//       if (text.includes('function') || text.includes('method')) score += 8;
//       if (text.includes('import') || text.includes('require')) score += 5;
//       if (text.includes('try') || text.includes('catch')) score += 7;
//     }
    
//     // Explanation quality
//     if (answer.word_count > 150) score += 10;
//     if (answer.word_count > 300) score += 15;
    
//     return Math.min(score, 100);
//   }

//   calculateTechnicalDepth(answer) {
//     let score = 20;
//     const text = answer.clean_text.toLowerCase();
    
//     // Technical terminology (varies by domain)
//     const technicalTerms = [
//       'algorithm', 'optimization', 'complexity', 'scalability', 'architecture',
//       'pattern', 'framework', 'library', 'api', 'database', 'security',
//       'memory', 'performance', 'thread', 'async', 'callback', 'promise',
//       'exception', 'validation', 'parsing', 'compilation', 'deployment'
//     ];
    
//     technicalTerms.forEach(term => {
//       if (text.includes(term)) score += 3;
//     });
    
//     // Depth indicators
//     if (text.includes('why') || text.includes('how')) score += 8;
//     if (text.includes('advantage') || text.includes('disadvantage')) score += 6;
//     if (text.includes('trade-off') || text.includes('consideration')) score += 10;
    
//     return Math.min(score, 100);
//   }

//   createAdvancedAnalysisPrompt(question, answers, questionContext) {
//     const questionText = `Question: "${question.title || 'Unknown Title'}"
// Programming Tags: ${question.tags?.slice(0, 5)?.join(', ') || 'None'}
// Context: ${questionContext || 'Code-related query'}`;

//     const answersText = answers.slice(0, this.maxAnswersPerBatch).map((answer, index) => {
//       const content = answer.clean_text.substring(0, this.maxContentLength);
//       return `Answer ${index + 1}:
// ID: ${answer.answer_id}
// Stack Overflow Score: ${answer.score} (Popularity: ${this.getPopularityLevel(answer.score)})
// Accepted: ${answer.is_accepted ? 'Yes' : 'No'}
// Author Rep: ${answer.owner_reputation || 0}
// Has Code: ${answer.has_code ? 'Yes' : 'No'}
// Word Count: ${answer.word_count}
// Content: ${content}...`;
//     }).join('\n\n');

//     return `You are a Senior Software Architect conducting a code review. Your task is to RE-RANK these Stack Overflow answers based on TECHNICAL MERIT, not popularity.

// CRITICAL INSTRUCTION: Ignore Stack Overflow scores and focus on:
// 1. Technical Accuracy (40%) - Is the solution correct and robust?
// 2. Code Quality (25%) - Best practices, readability, maintainability
// 3. Explanation Depth (20%) - Does it teach the concept well?
// 4. Practical Value (10%) - Real-world applicability
// 5. Innovation (5%) - Creative or modern approaches

// IMPORTANT: Popular answers (high SO scores) are often NOT the best. Look for:
// - Hidden gems with low scores but great explanations
// - Modern approaches vs outdated popular ones
// - Comprehensive solutions vs quick fixes
// - Educational value vs copy-paste solutions

// ${questionText}

// ANSWERS TO ANALYZE:
// ${answersText}

// Rank these ${Math.min(answers.length, this.maxAnswersPerBatch)} answers by TECHNICAL QUALITY (ignore popularity):

// {
//   "reranked_answers": [
//     {
//       "answer_id": ${answers[0]?.answer_id || 1},
//       "new_rank": 1,
//       "llm_score": 95,
//       "llm_reasoning": "Best technical solution because [detailed technical analysis]",
//       "technical_accuracy": 95,
//       "code_quality": 90,
//       "explanation_depth": 88,
//       "practical_value": 92,
//       "innovation_factor": 85,
//       "so_score_override": "Ranked #1 despite low SO score due to superior technical merit"
//     }
//   ]
// }`;
//   }

//   getPopularityLevel(score) {
//     if (score > 100) return 'Very High';
//     if (score > 50) return 'High';
//     if (score > 10) return 'Medium';
//     if (score > 0) return 'Low';
//     return 'Very Low';
//   }

//   parseAdvancedResponse(responseText) {
//     try {
//       const cleanText = responseText.trim();
//       const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
      
//       if (jsonMatch) {
//         const jsonStr = jsonMatch[0]
//           .replace(/,\s*}/g, '}')
//           .replace(/,\s*]/g, ']')
//           .replace(/\n/g, ' ');
        
//         const parsed = JSON.parse(jsonStr);
        
//         if (parsed.reranked_answers && Array.isArray(parsed.reranked_answers)) {
//           console.log(`✅ Parsed ${parsed.reranked_answers.length} ADVANCED rankings`);
//           return parsed;
//         }
//       }
      
//       console.warn('⚠️ No valid JSON in advanced response');
//       return { reranked_answers: [] };
      
//     } catch (error) {
//       console.error('❌ Failed to parse advanced response:', error);
//       return { reranked_answers: [] };
//     }
//   }

//   processAdvancedLLMResponse(llmResponse, originalAnswers) {
//     try {
//       const { reranked_answers } = llmResponse;
      
//       if (!reranked_answers || !Array.isArray(reranked_answers)) {
//         return this.createAdvancedIntelligentFallback(originalAnswers, 'Invalid advanced response');
//       }

//       const llmDataMap = new Map();
//       reranked_answers.forEach(item => {
//         if (item.answer_id) {
//           llmDataMap.set(item.answer_id, item);
//         }
//       });

//       const processed = originalAnswers.map((answer, index) => {
//         const llmData = llmDataMap.get(answer.answer_id);
        
//         return {
//           ...answer,
//           llm_rank: llmData?.new_rank || (index + 1),
//           llm_score: llmData?.llm_score || this.calculateAdvancedScore(answer),
//           llm_reasoning: llmData?.llm_reasoning || this.generateAdvancedReasoning(answer),
          
//           // Advanced scoring details
//           technical_accuracy: llmData?.technical_accuracy || this.calculateAdvancedScore(answer),
//           code_quality: llmData?.code_quality || this.calculateContentQuality(answer),
//           explanation_depth: llmData?.explanation_depth || this.calculateTechnicalDepth(answer),
//           practical_value: llmData?.practical_value || this.calculateAdvancedScore(answer),
//           innovation_factor: llmData?.innovation_factor || this.calculateDiversityScore(answer),
          
//           so_score_override: llmData?.so_score_override || null,
//           llm_processed: !!llmData,
//           llm_provider: 'ollama-advanced'
//         };
//       });

//       // Sort by LLM rank (which should be VERY different from SO rank)
//       return processed.sort((a, b) => {
//         if (a.llm_rank !== b.llm_rank) return a.llm_rank - b.llm_rank;
//         return b.llm_score - a.llm_score; // Secondary sort by LLM score
//       });

//     } catch (error) {
//       console.error('❌ Error processing advanced response:', error);
//       return this.createAdvancedIntelligentFallback(originalAnswers, `Advanced processing error: ${error.message}`);
//     }
//   }

//   createAdvancedIntelligentFallback(originalAnswers, reason) {
//     console.log(`🧠 Creating ADVANCED intelligent fallback: ${reason}`);
    
//     // Create dramatically different ranking from SO order
//     const reranked = originalAnswers.map((answer, index) => ({
//       ...answer,
//       llm_rank: index + 1,
//       llm_score: this.calculateAdvancedScore(answer),
//       llm_reasoning: this.generateAdvancedReasoning(answer),
//       technical_accuracy: this.calculateAdvancedScore(answer),
//       code_quality: this.calculateContentQuality(answer),
//       explanation_depth: this.calculateTechnicalDepth(answer),
//       practical_value: this.calculateAdvancedScore(answer),
//       innovation_factor: this.calculateDiversityScore(answer),
//       llm_processed: false,
//       llm_provider: 'advanced-fallback',
//       fallback_reason: reason
//     }));

//     // Sort by CONTENT QUALITY, not SO score - this creates visible differences
//     return reranked.sort((a, b) => {
//       const scoreA = (a.technical_accuracy + a.code_quality + a.explanation_depth) / 3;
//       const scoreB = (b.technical_accuracy + b.code_quality + b.explanation_depth) / 3;
//       return scoreB - scoreA;
//     }).map((answer, index) => ({
//       ...answer,
//       llm_rank: index + 1 // Reassign ranks after sorting
//     }));
//   }

//   scoreRemainingWithContentAnalysis(remainingAnswers) {
//     return remainingAnswers.map((answer, index) => ({
//       ...answer,
//       llm_rank: this.maxAnswersPerBatch + index + 1,
//       llm_score: this.calculateAdvancedScore(answer),
//       llm_reasoning: this.generateAdvancedReasoning(answer),
//       technical_accuracy: this.calculateAdvancedScore(answer),
//       code_quality: this.calculateContentQuality(answer),
//       explanation_depth: this.calculateTechnicalDepth(answer),
//       practical_value: this.calculateAdvancedScore(answer),
//       innovation_factor: this.calculateDiversityScore(answer),
//       llm_processed: false,
//       llm_provider: 'content-analysis',
//       processing_method: 'remaining_advanced'
//     }));
//   }

//   sortWithAdvancedCriteria(answers) {
//     return answers.sort((a, b) => {
//       // Advanced multi-criteria sorting that differs from SO ranking
//       const scoreA = (a.technical_accuracy * 0.4) + 
//                     (a.code_quality * 0.25) + 
//                     (a.explanation_depth * 0.2) + 
//                     (a.practical_value * 0.1) + 
//                     (a.innovation_factor * 0.05);
      
//       const scoreB = (b.technical_accuracy * 0.4) + 
//                     (b.code_quality * 0.25) + 
//                     (b.explanation_depth * 0.2) + 
//                     (b.practical_value * 0.1) + 
//                     (b.innovation_factor * 0.05);
      
//       return scoreB - scoreA;
//     }).map((answer, index) => ({
//       ...answer,
//       llm_rank: index + 1
//     }));
//   }

//   calculateAdvancedScore(answer) {
//     let score = 40; // Lower base score
    
//     // Content-based scoring (NOT popularity-based)
//     if (answer.word_count > 200) score += 20; // Detailed explanation
//     if (answer.has_code && answer.word_count > 100) score += 25; // Code + explanation
//     if (answer.clean_text.toLowerCase().includes('because')) score += 15; // Reasoning
//     if (answer.clean_text.toLowerCase().includes('example')) score += 10; // Examples
    
//     // Small boost for reputation, big penalty for very high SO scores (to create differences)
//     if (answer.owner_reputation > 1000) score += 8;
//     if (answer.score > 100) score -= 5; // Penalty for being too popular
    
//     // Boost for "hidden gems"
//     if (!answer.is_accepted && answer.word_count > 200) score += 20;
    
//     return Math.max(Math.min(score, 95), 25);
//   }

//   generateAdvancedReasoning(answer) {
//     const factors = [];
//     const isPopular = answer.score > 50;
//     const isAccepted = answer.is_accepted;
    
//     // Technical assessment
//     if (answer.has_code && answer.word_count > 150) {
//       factors.push('excellent code examples with detailed explanation');
//     } else if (answer.has_code) {
//       factors.push('provides working code solution');
//     }
    
//     if (answer.word_count > 300) {
//       factors.push('comprehensive technical analysis');
//     } else if (answer.word_count > 150) {
//       factors.push('good explanatory depth');
//     }
    
//     // Content quality assessment
//     const text = answer.clean_text.toLowerCase();
//     if (text.includes('because') || text.includes('reason')) {
//       factors.push('explains the reasoning behind the solution');
//     }
//     if (text.includes('alternative') || text.includes('another way')) {
//       factors.push('discusses alternative approaches');
//     }
//     if (text.includes('performance') || text.includes('efficient')) {
//       factors.push('addresses performance considerations');
//     }
    
//     // Authority assessment
//     if (answer.owner_reputation > 5000) {
//       factors.push(`from highly experienced developer (${answer.owner_reputation} rep)`);
//     } else if (answer.owner_reputation > 1000) {
//       factors.push(`from experienced developer (${answer.owner_reputation} rep)`);
//     }
    
//     // Create contrasting assessment
//     let qualityLevel;
//     let ranking_rationale;
    
//     if (factors.length >= 3) {
//       qualityLevel = 'Exceptional technical answer';
//       if (!isPopular) {
//         ranking_rationale = 'Hidden gem - high technical merit despite low community votes';
//       } else {
//         ranking_rationale = 'Popular answer that also demonstrates strong technical excellence';
//       }
//     } else if (factors.length >= 2) {
//       qualityLevel = 'Solid technical solution';
//       if (isAccepted && !isPopular) {
//         ranking_rationale = 'Author-accepted solution with good technical foundation';
//       } else {
//         ranking_rationale = 'Well-structured answer with clear technical merit';
//       }
//     } else {
//       qualityLevel = 'Basic but functional answer';
//       if (isPopular) {
//         ranking_rationale = 'Popular answer but limited technical depth in explanation';
//       } else {
//         ranking_rationale = 'Simple solution that addresses the core question';
//       }
//     }
    
//     const technical_summary = factors.length > 0 
//       ? `${qualityLevel} - ${factors.join(', ')}`
//       : qualityLevel;
    
//     return `${technical_summary}. ${ranking_rationale}. Ranked by AI based on technical merit rather than popularity.`;
//   }

//   // Keep existing utility methods
//   prepareAnswersWithAdvancedAnalysis(answers) {
//     return answers
//       .filter(answer => answer.body_html && answer.body_html.length > 30)
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

//   extractCleanText(html) {
//     if (!html) return '';
//     return html
//       .replace(/<code[^>]*>[\s\S]*?<\/code>/gi, '[CODE]')
//       .replace(/<pre[^>]*>[\s\S]*?<\/pre>/gi, '[CODE_BLOCK]')
//       .replace(/<[^>]*>/g, ' ')
//       .replace(/&[a-zA-Z0-9#]+;/g, ' ')
//       .replace(/\s+/g, ' ')
//       .trim();
//   }

//   hasCodeBlocks(html) {
//     return html?.includes('<code>') || html?.includes('<pre>');
//   }

//   countWords(html) {
//     const text = this.extractCleanText(html);
//     return text ? text.split(/\s+/).filter(word => word.length > 0).length : 0;
//   }

//   async setProcessingStatus(questionId, status, error = null) {
//     console.log(`📊 Advanced LLM status for ${questionId}: ${status}`);
//   }

//   async healthCheck() {
//     try {
//       const testResult = await this.testConnection();
      
//       return {
//         status: testResult.success ? 'healthy' : 'unhealthy',
//         provider: this.provider,
//         model: this.model,
//         base_url: this.baseURL,
//         available_models: testResult.models || [],
//         advanced_features: {
//           content_analysis: true,
//           technical_ranking: true,
//           hidden_gem_detection: true,
//           popularity_override: true
//         },
//         optimization: {
//           max_answers_per_batch: this.maxAnswersPerBatch,
//           timeout_ms: this.timeoutMs,
//           focus: 'technical_merit_over_popularity'
//         },
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


// import axios from 'axios';
// import { getLLM, setLLM } from '../lib/cache.js';

// export class OllamaLLMService {
//   constructor() {
//     this.baseURL = process.env.LLM_BASE_URL || 'http://localhost:11434';
//     this.model = process.env.LLM_MODEL || 'mistral:7b';
//     this.provider = 'ollama';
//     this.isHealthy = false;

//     // Optimized limits for production
//     this.maxAnswersPerBatch = 8;        // Process max 8 answers at once
//     this.maxPromptTokens = 6000;        // Conservative token limit
//     this.maxContentLength = 400;        // Reduced content preview
//     this.timeoutMs = 90000;             // 90 seconds timeout

//     console.log(`🦙 Production Ollama LLM Service initialized`);
//     console.log(`📡 Base URL: ${this.baseURL}`);
//     console.log(`🤖 Model: ${this.model}`);
//     console.log(`⚙️ Max Answers/Batch: ${this.maxAnswersPerBatch}`);
//     console.log(`⏱️ Timeout: ${this.timeoutMs}ms`);

//     this.testConnection();
//   }

//   // Test connection to the Ollama service
//   async testConnection() {
//     try {
//       console.log('🧪 Testing Ollama connection...');
//       const response = await axios.get(`${this.baseURL}/api/tags`, {
//         timeout: 10000
//       });

//       const availableModels = response.data.models?.map(m => m.name) || [];
//       console.log('✅ Ollama connected. Available models:', availableModels);

//       const modelExists = availableModels.some(m => m.includes(this.model.split(':')[0]));
//       if (!modelExists) {
//         console.warn(`⚠️ Model ${this.model} not found. Available: ${availableModels.join(', ')}`);
//         this.isHealthy = false;
//       } else {
//         console.log(`✅ Model ${this.model} is available`);
//         this.isHealthy = true;
//       }

//       return { success: true, models: availableModels };
//     } catch (error) {
//       console.error('❌ Ollama connection failed:', error.message);
//       this.isHealthy = false;
//       return { success: false, error: error.message };
//     }
//   }

//   // Method added to handle background reranking
//   async rerankAnswersBackground(question, originalAnswers, questionContext = '') {
//     const questionId = question.question_id;
//     console.log(`🔄 Background optimized processing for question ${questionId} started`);

//     try {
//       await this.setProcessingStatus(questionId, 'processing');

//       const result = await this.rerankAnswers(question, originalAnswers, questionContext);

//       if (result.success) {
//         await this.setProcessingStatus(questionId, 'completed');
//         console.log(`✅ Background processing completed for question ${questionId}`);
//         console.log(`📊 Method: ${result.processing_method}, Time: ${result.processing_time_ms}ms`);
//       } else {
//         await this.setProcessingStatus(questionId, 'failed', result.error);
//         console.error(`❌ Background processing failed for question ${questionId}:`, result.error);
//       }

//       return result;
//     } catch (error) {
//       console.error(`💥 Background processing error for question ${questionId}:`, error);
//       await this.setProcessingStatus(questionId, 'failed', error.message);
//       throw error;
//     }
//   }

//   // Main rerankAnswers method
//   async rerankAnswers(question, originalAnswers, questionContext = '') {
//     const startTime = Date.now();

//     try {
//       const questionId = question.question_id;
//       console.log(`🦙 Starting optimized reranking for question ${questionId}...`);
//       console.log(`📊 Total answers to process: ${originalAnswers.length}`);

//       if (!this.isHealthy) {
//         console.warn('⚠️ Ollama service is not healthy, running health check...');
//         await this.testConnection();

//         if (!this.isHealthy) {
//           throw new Error('Ollama service is not healthy. Please check model availability.');
//         }
//       }

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

//       // Prepare and optimize answers for processing
//       const preparedAnswers = this.prepareAnswersForLLM(originalAnswers);
//       if (preparedAnswers.length === 0) {
//         throw new Error('No valid answers to process');
//       }

//       // Smart processing based on answer count
//       let rerankedAnswers;
//       if (preparedAnswers.length <= this.maxAnswersPerBatch) {
//         // Small batch - process normally
//         console.log(`📊 Small batch (${preparedAnswers.length} answers) - processing normally`);
//         rerankedAnswers = await this.processSingleBatch(question, preparedAnswers, questionContext);
//       } else {
//         // Large batch - use intelligent batch processing
//         console.log(`📊 Large batch (${preparedAnswers.length} answers) - using smart batch processing`);
//         rerankedAnswers = await this.processLargeBatch(question, preparedAnswers, questionContext);
//       }

//       // Cache result
//       await setLLM(questionId, rerankedAnswers);

//       const processingTime = Date.now() - startTime;
//       console.log(`✅ Optimized reranking completed in ${processingTime}ms`);
//       console.log(`📊 Successfully processed ${rerankedAnswers.length} answers`);

//       return {
//         success: true,
//         reranked_answers: rerankedAnswers,
//         processing_time_ms: processingTime,
//         cached: false,
//         llm_provider: 'ollama',
//         model_used: this.model,
//         answers_processed: rerankedAnswers.length,
//         processing_method: preparedAnswers.length <= this.maxAnswersPerBatch ? 'single_batch' : 'smart_batch'
//       };

//     } catch (error) {
//       console.error('💥 Optimized reranking failed:', error);

//       // Enhanced fallback with intelligent scoring
//       const fallbackAnswers = this.createIntelligentFallback(originalAnswers, error.message);

//       return {
//         success: false,
//         error: error.message,
//         reranked_answers: fallbackAnswers,
//         processing_time_ms: Date.now() - startTime,
//         llm_provider: 'intelligent-fallback'
//       };
//     }
//   }

//   // Process answers in a single batch
//   async processSingleBatch(question, answers, questionContext) {
//     try {
//       console.log('📤 Processing single batch with Ollama...');

//       const prompt = this.createOptimizedPrompt(question, answers, questionContext);
//       const promptLength = prompt.length;
//       console.log(`📝 Optimized prompt length: ${promptLength} characters`);

//       if (promptLength > this.maxPromptTokens * 4) { // Rough token estimation
//         console.warn(`⚠️ Prompt too long (${promptLength}), using fallback processing`);
//         return this.createIntelligentFallback(answers, 'Prompt too long for single batch');
//       }

//       const startTime = Date.now();

//       const response = await axios.post(`${this.baseURL}/api/generate`, {
//         model: this.model,
//         prompt: prompt,
//         stream: false,
//         options: {
//           temperature: 0.3,
//           top_p: 0.9,
//           top_k: 40,
//           repeat_penalty: 1.1,
//           num_predict: 1500,          // Reduced prediction length
//           stop: ["Human:", "Assistant:", "\n\nUser:"],
//           seed: 42,
//           num_ctx: 6144,              // Reduced context window
//           num_thread: 4
//         }
//       }, {
//         timeout: this.timeoutMs,
//         headers: { 'Content-Type': 'application/json' }
//       });

//       const responseTime = Date.now() - startTime;
//       console.log(`📥 Single batch response received in ${responseTime}ms`);

//       const llmResponse = this.parseOptimizedResponse(response.data.response);
//       return this.processLLMResponse(llmResponse, answers);

//     } catch (error) {
//       console.error('❌ Single batch processing failed:', error);
//       throw new Error(`Single batch processing failed: ${error.message}`);
//     }
//   }

//   // Process answers in a large batch with intelligent splitting
//   async processLargeBatch(question, answers, questionContext) {
//     try {
//       console.log('📊 Processing large batch with intelligent splitting...');

//       // Step 1: Pre-filter to most promising answers
//       const topAnswers = this.selectTopAnswers(answers, this.maxAnswersPerBatch);
//       console.log(`🎯 Selected top ${topAnswers.length} answers for processing`);

//       // Step 2: Process the selected answers
//       const processedAnswers = await this.processSingleBatch(question, topAnswers, questionContext);

//       // Step 3: Merge with remaining answers using intelligent scoring
//       const remainingAnswers = answers.filter(a => 
//         !topAnswers.some(t => t.answer_id === a.answer_id)
//       );

//       const finalAnswers = [
//         ...processedAnswers,
//         ...this.scoreRemainingAnswers(remainingAnswers)
//       ];

//       // Step 4: Re-sort all answers
//       return finalAnswers.sort((a, b) => {
//         if (a.llm_rank !== b.llm_rank) return a.llm_rank - b.llm_rank;
//         return (b.score || 0) - (a.score || 0);
//       });

//     } catch (error) {
//       console.error('❌ Large batch processing failed:', error);
//       return this.createIntelligentFallback(answers, `Large batch processing failed: ${error.message}`);
//     }
//   }

//   // Select the top answers based on custom scoring
//   selectTopAnswers(answers, maxCount) {
//     return answers
//       .map(answer => ({
//         ...answer,
//         selection_score: this.calculateSelectionScore(answer)
//       }))
//       .sort((a, b) => b.selection_score - a.selection_score)
//       .slice(0, maxCount);
//   }

//   // Calculate the selection score for each answer
//   calculateSelectionScore(answer) {
//     let score = 0;

//     if (answer.is_accepted) score += 100;           // Accepted answer
//     score += Math.min(answer.score || 0, 50);       // Stack Overflow score (capped)
//     if (answer.has_code) score += 30;               // Contains code

//     if (answer.word_count > 100) score += 20;       // Substantial content
//     if (answer.owner_reputation > 1000) score += 15; // Experienced author

//     if (answer.word_count > 300) score += 10;       // Comprehensive
//     if (answer.word_count < 50) score -= 20;        // Too short

//     return score;
//   }

//   // Score the remaining answers with intelligent fallback scoring
//   scoreRemainingAnswers(remainingAnswers) {
//     return remainingAnswers.map((answer, index) => ({
//       ...answer,
//       llm_rank: this.maxAnswersPerBatch + index + 1,
//       llm_score: this.calculateIntelligentScore(answer),
//       llm_reasoning: this.generateIntelligentReasoning(answer),
//       llm_processed: false,
//       llm_provider: 'intelligent-scoring',
//       processing_method: 'remaining_batch'
//     }));
//   }

//   // Create an optimized prompt for LLM processing
//   createOptimizedPrompt(question, answers, questionContext) {
//     const questionText = `Question: "${question.title || 'Unknown Title'}"
// Tags: ${question.tags?.slice(0, 5)?.join(', ') || 'None'}`;

//     const answersText = answers.slice(0, this.maxAnswersPerBatch).map((answer, index) => {
//       const content = answer.clean_text.substring(0, this.maxContentLength);
//       return `Answer ${index + 1}:
// ID: ${answer.answer_id}
// Score: ${answer.score}
// Accepted: ${answer.is_accepted ? 'Yes' : 'No'}
// Has Code: ${answer.has_code ? 'Yes' : 'No'}
// Content: ${content}...`;
//     }).join('\n\n');

//     return `You are a senior software engineer. Rank these ${Math.min(answers.length, this.maxAnswersPerBatch)} Stack Overflow answers by quality.

// ${questionText}

// ANSWERS:
// ${answersText}

// Respond with ONLY valid JSON:
// {
//   "reranked_answers": [
//     {"answer_id": ${answers[0]?.answer_id || 1}, "new_rank": 1, "llm_score": 95, "llm_reasoning": "Best answer because..."},
//     {"answer_id": ${answers[1]?.answer_id || 2}, "new_rank": 2, "llm_score": 85, "llm_reasoning": "Good answer but..."}
//   ]
// }`;
//   }

//   // Parse the response from LLM
//   parseOptimizedResponse(responseText) {
//     try {
//       const cleanText = responseText.trim();
//       const jsonMatch = cleanText.match(/\{[\s\S]*\}/);

//       if (jsonMatch) {
//         const jsonStr = jsonMatch[0]
//           .replace(/,\s*}/g, '}')
//           .replace(/,\s*]/g, ']');

//         const parsed = JSON.parse(jsonStr);

//         if (parsed.reranked_answers && Array.isArray(parsed.reranked_answers)) {
//           console.log(`✅ Parsed ${parsed.reranked_answers.length} answer rankings`);
//           return parsed;
//         }
//       }

//       console.warn('⚠️ No valid JSON structure found');
//       return { reranked_answers: [] };

//     } catch (error) {
//       console.error('❌ Failed to parse response:', error);
//       return { reranked_answers: [] };
//     }
//   }

//   // Process the LLM response
//   processLLMResponse(llmResponse, originalAnswers) {
//     try {
//       const { reranked_answers } = llmResponse;

//       if (!reranked_answers || !Array.isArray(reranked_answers)) {
//         return this.createIntelligentFallback(originalAnswers, 'Invalid LLM response');
//       }

//       const llmDataMap = new Map();
//       reranked_answers.forEach(item => {
//         if (item.answer_id) {
//           llmDataMap.set(item.answer_id, item);
//         }
//       });

//       return originalAnswers.map((answer, index) => {
//         const llmData = llmDataMap.get(answer.answer_id);

//         return {
//           ...answer,
//           llm_rank: llmData?.new_rank || (index + 1),
//           llm_score: llmData?.llm_score || this.calculateIntelligentScore(answer),
//           llm_reasoning: llmData?.llm_reasoning || this.generateIntelligentReasoning(answer),
//           llm_processed: !!llmData,
//           llm_provider: 'ollama-optimized'
//         };
//       }).sort((a, b) => {
//         if (a.llm_rank !== b.llm_rank) return a.llm_rank - b.llm_rank;
//         return (b.score || 0) - (a.score || 0);
//       });

//     } catch (error) {
//       console.error('❌ Error processing LLM response:', error);
//       return this.createIntelligentFallback(originalAnswers, `Processing error: ${error.message}`);
//     }
//   }

//   // Create intelligent fallback in case of error
//   createIntelligentFallback(originalAnswers, reason) {
//     console.log(`🧠 Creating intelligent fallback: ${reason}`);

//     return originalAnswers.map((answer, index) => ({
//       ...answer,
//       llm_rank: index + 1,
//       llm_score: this.calculateIntelligentScore(answer),
//       llm_reasoning: this.generateIntelligentReasoning(answer),
//       llm_processed: false,
//       llm_provider: 'intelligent-fallback',
//       fallback_reason: reason
//     })).sort((a, b) => b.llm_score - a.llm_score);
//   }

//   // Calculate intelligent score for answers
//   calculateIntelligentScore(answer) {
//     let score = 50; // Base score

//     if (answer.is_accepted) score += 25;
//     if (answer.score > 100) score += 20;
//     else if (answer.score > 50) score += 15;
//     else if (answer.score > 10) score += 10;
//     else if (answer.score > 0) score += 5;

//     if (answer.has_code) score += 15;
//     if (answer.word_count > 300) score += 10;
//     else if (answer.word_count > 150) score += 5;

//     if (answer.owner_reputation > 10000) score += 10;
//     else if (answer.owner_reputation > 1000) score += 5;

//     if (answer.word_count < 50) score -= 10;
//     if ((answer.score || 0) < 0) score -= 15;

//     return Math.max(Math.min(score, 100), 10);
//   }

//   // Generate reasoning for the intelligent fallback
//   generateIntelligentReasoning(answer) {
//     const factors = [];

//     if (answer.is_accepted) factors.push('accepted by question author');
//     if (answer.score > 50) factors.push(`highly rated (${answer.score} upvotes)`);
//     if (answer.has_code) factors.push('includes practical code examples');
//     if (answer.word_count > 300) factors.push('provides comprehensive explanation');
//     if (answer.owner_reputation > 1000) factors.push(`from experienced developer (${answer.owner_reputation} rep)`);

//     const qualityAssessment = factors.length > 2 ? 'High quality answer' :
//                              factors.length > 0 ? 'Good answer' : 'Basic answer';

//     const reasoning = factors.length > 0 
//       ? `${qualityAssessment} - ${factors.join(', ')}`
//       : 'Standard answer based on Stack Overflow metrics';

//     return `${reasoning}. Ranked using intelligent scoring algorithm.`;
//   }

//   // Prepare answers for LLM processing
//   prepareAnswersForLLM(answers) {
//     return answers
//       .filter(answer => answer.body_html && answer.body_html.length > 30)
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

//   // Clean the HTML content from answers
//   extractCleanText(html) {
//     if (!html) return '';
//     return html
//       .replace(/<code[^>]*>[\s\S]*?<\/code>/gi, '[CODE]')
//       .replace(/<pre[^>]*>[\s\S]*?<\/pre>/gi, '[CODE_BLOCK]')
//       .replace(/<[^>]*>/g, ' ')
//       .replace(/&[a-zA-Z0-9#]+;/g, ' ')
//       .replace(/\s+/g, ' ')
//       .trim();
//   }

//   // Check if the answer has code blocks
//   hasCodeBlocks(html) {
//     return html?.includes('<code>') || html?.includes('<pre>');
//   }

//   // Count the number of words in the answer
//   countWords(html) {
//     const text = this.extractCleanText(html);
//     return text ? text.split(/\s+/).filter(word => word.length > 0).length : 0;
//   }

//   // Set the processing status for the question
//   async setProcessingStatus(questionId, status, error = null) {
//     try {
//       console.log(`📊 Optimized LLM status for ${questionId}: ${status}`);
//     } catch (err) {
//       console.error('❌ Failed to set processing status:', err);
//     }
//   }

//   // Health check for the service
//   async healthCheck() {
//     try {
//       const testResult = await this.testConnection();
      
//       return {
//         status: testResult.success ? 'healthy' : 'unhealthy',
//         provider: this.provider,
//         model: this.model,
//         base_url: this.baseURL,
//         available_models: testResult.models || [],
//         optimization: {
//           max_answers_per_batch: this.maxAnswersPerBatch,
//           max_prompt_tokens: this.maxPromptTokens,
//           timeout_ms: this.timeoutMs,
//           max_content_length: this.maxContentLength
//         },
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




import axios from 'axios';
import { getLLM, setLLM } from '../lib/cache.js';

export class OllamaLLMService {
  constructor() {
    this.baseURL = process.env.LLM_BASE_URL || 'http://localhost:11434';
    this.model = process.env.LLM_MODEL || 'mistral:7b';
    this.provider = 'ollama';
    this.isHealthy = false;
    
    this.maxAnswersPerBatch = 5;  
    this.maxPromptTokens = 3000;  
    this.maxContentLength = 200;  
    this.timeoutMs = 20000;       
    
    console.log(`optimized LLM Service initialized`);
    console.log(`base URL: ${this.baseURL}`);
    console.log(`model: ${this.model}`);
    console.log(`optimized for speed: ${this.timeoutMs}ms timeout`);
    
    this.testConnection();
  }

  async testConnection() {
    try {
      console.log('testing Ollama connection...');
      const response = await axios.get(`${this.baseURL}/api/tags`, {
        timeout: 5000  
      });
      
      const availableModels = response.data.models?.map(m => m.name) || [];
      console.log('Ollama connected. Available models:', availableModels);
      
      const modelExists = availableModels.some(m => m.includes(this.model.split(':')[0]));
      if (!modelExists) {
        console.warn(`Model ${this.model} not found. Available: ${availableModels.join(', ')}`);
        this.isHealthy = false;
      } else {
        console.log(`Model ${this.model} is available`);
        this.isHealthy = true;
      }
      
      return { success: true, models: availableModels };
    } catch (error) {
      console.error('Ollama connection failed:', error.message);
      this.isHealthy = false;
      return { success: false, error: error.message };
    }
  }

  async rerankAnswers(question, originalAnswers, questionContext = '') {
    const startTime = Date.now();
    
    try {
      const questionId = question.question_id;
      console.log(`starting FAST reranking for question ${questionId}...`);
      console.log(`total answers: ${originalAnswers.length}`);

      if (!this.isHealthy) {
        console.log('LLM not healthy, using smart fallback');
        return this.createSmartFallback(originalAnswers, 'LLM service not available');
      }

      const cachedResult = await getLLM(questionId);
      if (cachedResult) {
        console.log('LLM cache hit!');
        return {
          success: true,
          reranked_answers: cachedResult.reranked_answers,
          processing_time_ms: Date.now() - startTime,
          cached: true,
          llm_provider: 'ollama-cached'
        };
      }

      const preparedAnswers = this.prepareAnswersBasic(originalAnswers);
      if (preparedAnswers.length === 0) {
        return this.createSmartFallback(originalAnswers, 'No valid answers to process');
      }

      const topAnswers = preparedAnswers.slice(0, this.maxAnswersPerBatch);
      console.log(`processing top ${topAnswers.length} answers for speed`);
      
      const rerankedAnswers = await this.processFastReranking(question, topAnswers, questionContext);

      const remainingAnswers = preparedAnswers.slice(this.maxAnswersPerBatch);
      const scoredRemaining = this.scoreRemainingAnswers(remainingAnswers);
      
      const finalAnswers = [...rerankedAnswers, ...scoredRemaining]
        .map((answer, index) => ({
          ...answer,
          llm_rank: index + 1
        }));

      await setLLM(questionId, finalAnswers);

      const processingTime = Date.now() - startTime;
      console.log(`FAST reranking completed in ${processingTime}ms`);
      
      return {
        success: true,
        reranked_answers: finalAnswers,
        processing_time_ms: processingTime,
        cached: false,
        llm_provider: 'ollama-fast',
        model_used: this.model,
        answers_processed: finalAnswers.length
      };

    } catch (error) {
      console.error('Fast reranking failed:', error);
      
      const fallbackAnswers = this.createSmartFallback(originalAnswers, error.message);
      
      return {
        success: false,
        error: error.message,
        reranked_answers: fallbackAnswers,
        processing_time_ms: Date.now() - startTime,
        llm_provider: 'smart-fallback'
      };
    }
  }

  async processFastReranking(question, answers, questionContext) {
    try {
      console.log('processing with FAST analysis...');
      
      const prompt = this.createSimplePrompt(question, answers);
      console.log(`simple prompt: ${prompt.length} chars`);
      
      if (prompt.length > this.maxPromptTokens * 4) {
        console.warn(`prompt too long, using fallback`);
        return this.createSmartFallback(answers, 'Prompt too long');
      }
      
      const response = await axios.post(`${this.baseURL}/api/generate`, {
        model: this.model,
        prompt: prompt,
        stream: false,
        options: {
          temperature: 0.2,      
          top_p: 0.9,          
          top_k: 40,            
          repeat_penalty: 1.1,   
          num_predict: 500,      
          stop: ["Human:", "Assistant:", "\n\nUser:", "---"],
          num_ctx: 2048,         
          num_thread: 4
        }
      }, {
        timeout: this.timeoutMs,
        headers: { 'Content-Type': 'application/json' }
      });

      console.log('Fast analysis response received');
      const llmResponse = this.parseSimpleResponse(response.data.response);
      return this.processLLMResponse(llmResponse, answers);

    } catch (error) {
      console.error('fast analysis failed:', error);
      if (error.code === 'ECONNABORTED') {
        console.error('request timed out - using fallback');
      }
      return this.createSmartFallback(answers, `fast analysis failed: ${error.message}`);
    }
  }

  createSimplePrompt(question, answers) {
    const questionText = `Question: "${question.title || 'Unknown Title'}"
Tags: ${question.tags?.slice(0, 3)?.join(', ') || 'None'}`;

    const answersText = answers.map((answer, index) => {
      const content = answer.clean_text.substring(0, this.maxContentLength);
      return `${index + 1}. Score:${answer.score} Accepted:${answer.is_accepted ? 'Y' : 'N'} HasCode:${answer.has_code ? 'Y' : 'N'}
${content}...`;
    }).join('\n\n');

    return `Rerank these Stack Overflow answers by technical quality (ignore popularity):

${questionText}

ANSWERS:
${answersText}

Return ONLY JSON format:
{"rankings": [{"id": ${answers[0]?.answer_id || 1}, "rank": 1, "score": 85, "reason": "Best technical solution"}]}`;
  }

  parseSimpleResponse(responseText) {
    try {
      const cleanText = responseText.trim();
      const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.rankings && Array.isArray(parsed.rankings)) {
          console.log(`parsed ${parsed.rankings.length} rankings`);
          return { rankings: parsed.rankings };
        }
      }
      
      console.warn('no valid JSON in response, using fallback');
      return { rankings: [] };
      
    } catch (error) {
      console.error('failed to parse response:', error);
      return { rankings: [] };
    }
  }

  processLLMResponse(llmResponse, originalAnswers) {
    try {
      const { rankings } = llmResponse;
      
      if (!rankings || !Array.isArray(rankings)) {
        return this.createSmartFallback(originalAnswers, 'Invalid LLM response');
      }

      const llmDataMap = new Map();
      rankings.forEach(item => {
        if (item.id) {
          llmDataMap.set(item.id, item);
        }
      });

      const processed = originalAnswers.map((answer, index) => {
        const llmData = llmDataMap.get(answer.answer_id);
        
        return {
          ...answer,
          llm_rank: llmData?.rank || (index + 1),
          llm_score: llmData?.score || this.calculateBasicScore(answer),
          llm_reasoning: llmData?.reason || this.generateBasicReasoning(answer),
          llm_processed: !!llmData,
          llm_provider: 'ollama-fast'
        };
      });

      return processed.sort((a, b) => {
        if (a.llm_rank !== b.llm_rank) return a.llm_rank - b.llm_rank;
        return b.llm_score - a.llm_score;
      });

    } catch (error) {
      console.error('error processing LLM response:', error);
      return this.createSmartFallback(originalAnswers, `Processing error: ${error.message}`);
    }
  }

  createSmartFallback(originalAnswers, reason) {
    console.log(`creating smart fallback: ${reason}`);
    
    const reranked = originalAnswers.map((answer, index) => ({
      ...answer,
      llm_rank: index + 1,
      llm_score: this.calculateBasicScore(answer),
      llm_reasoning: this.generateBasicReasoning(answer),
      llm_processed: false,
      llm_provider: 'smart-fallback',
      fallback_reason: reason
    }));

    return reranked.sort((a, b) => {
      const scoreA = this.calculateContentScore(a);
      const scoreB = this.calculateContentScore(b);
      return scoreB - scoreA;
    }).map((answer, index) => ({
      ...answer,
      llm_rank: index + 1
    }));
  }

  calculateContentScore(answer) {
    let score = 30;
    
    if (answer.word_count > 100) score += 15;
    if (answer.has_code && answer.word_count > 50) score += 20;
    if (answer.clean_text.toLowerCase().includes('because')) score += 10;
    if (answer.clean_text.toLowerCase().includes('example')) score += 8;
    if (answer.owner_reputation > 1000) score += 5;
    
    if (!answer.is_accepted && answer.word_count > 150 && answer.score < 50) {
      score += 25;
    }
    
    return Math.min(score, 95);
  }

  scoreRemainingAnswers(remainingAnswers) {
    return remainingAnswers.map((answer, index) => ({
      ...answer,
      llm_rank: this.maxAnswersPerBatch + index + 1,
      llm_score: this.calculateBasicScore(answer),
      llm_reasoning: this.generateBasicReasoning(answer),
      llm_processed: false,
      llm_provider: 'content-scoring'
    }));
  }

  calculateBasicScore(answer) {
    let score = 40;
    
    if (answer.word_count > 150) score += 15;
    if (answer.has_code) score += 10;
    if (answer.owner_reputation > 1000) score += 5;
    if (answer.clean_text.toLowerCase().includes('example')) score += 8;
    
    return Math.max(Math.min(score, 90), 25);
  }

  generateBasicReasoning(answer) {
    const factors = [];
    
    if (answer.has_code && answer.word_count > 100) {
      factors.push('includes code with explanation');
    }
    if (answer.word_count > 200) {
      factors.push('comprehensive answer');
    }
    if (answer.owner_reputation > 5000) {
      factors.push('experienced author');
    }
    
    const isPopular = answer.score > 50;
    let assessment = factors.length > 2 ? 'Strong technical answer' : 
                    factors.length > 1 ? 'Good technical solution' : 
                    'Basic functional answer';
    
    if (factors.length > 0) {
      assessment += ` - ${factors.join(', ')}`;
    }
    
    if (!isPopular && factors.length > 1) {
      assessment += '. Hidden gem with good technical merit.';
    }
    
    return assessment;
  }

  prepareAnswersBasic(answers) {
    return answers
      .filter(answer => answer.body_html && answer.body_html.length > 20)
      .map(answer => ({
        answer_id: answer.answer_id,
        score: answer.score || 0,
        is_accepted: answer.is_accepted || false,
        clean_text: this.extractCleanText(answer.body_html),
        has_code: this.hasCodeBlocks(answer.body_html),
        word_count: this.countWords(answer.body_html),
        owner_reputation: answer.owner?.reputation || 0
      }));
  }

  extractCleanText(html) {
    if (!html) return '';
    return html
      .replace(/<code[^>]*>[\s\S]*?<\/code>/gi, '[CODE]')
      .replace(/<pre[^>]*>[\s\S]*?<\/pre>/gi, '[CODE_BLOCK]')
      .replace(/<[^>]*>/g, ' ')
      .replace(/&[a-zA-Z0-9#]+;/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  hasCodeBlocks(html) {
    return html?.includes('<code>') || html?.includes('<pre>');
  }

  countWords(html) {
    const text = this.extractCleanText(html);
    return text ? text.split(/\s+/).filter(word => word.length > 0).length : 0;
  }

  async healthCheck() {
    try {
      const testResult = await this.testConnection();
      
      return {
        status: testResult.success ? 'healthy' : 'unhealthy',
        provider: this.provider,
        model: this.model,
        base_url: this.baseURL,
        available_models: testResult.models || [],
        optimization: {
          max_answers_per_batch: this.maxAnswersPerBatch,
          timeout_ms: this.timeoutMs,
          focus: 'speed_and_quality'
        },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        provider: this.provider,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  async rerankAnswersBackground(question, originalAnswers, questionContext = '') {
    const questionId = question.question_id;
    console.log(`🔄 Background processing for question ${questionId}`);

    setTimeout(async () => {
      try {
        const result = await this.rerankAnswers(question, originalAnswers, questionContext);
        console.log(`background processing completed for ${questionId} in ${result.processing_time_ms}ms`);
        return result;
      } catch (error) {
        console.error(`💥 Background processing error for ${questionId}:`, error);
        return {
          success: false,
          error: error.message,
          llm_provider: 'background-failed'
        };
      }
    }, 100); 

    
    return {
      success: true,
      status: 'background_processing_started',
      message: 'Processing started in background'
    };
  }
}