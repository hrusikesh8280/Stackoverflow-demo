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

import OpenAI from 'openai';
import { getLLM, setLLM } from '../lib/cache.js';

export class LLMService {
  constructor() {
    try {
      // Check if API key exists
      if (!process.env.OPENAI_API_KEY) {
        console.error('⚠️ OPENAI_API_KEY not found in environment variables');
        throw new Error('OpenAI API key is required');
      }

      // Initialize OpenAI client
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
      });
      
      this.model = 'gpt-4o'; // Using GPT-4 Omni
      console.log('🤖 LLM Service initialized with OpenAI GPT-4');
    } catch (error) {
      console.error('💥 Failed to initialize LLM Service:', error.message);
      throw error;
    }
  }

  // Test function to verify LLM service works
  async testConnection() {
    try {
      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [{ role: "user", content: "Say 'Hello World'" }],
        max_tokens: 10,
        temperature: 0
      });

      console.log('✅ LLM connection test successful');
      return { success: true, response: response.choices[0].message.content };
    } catch (error) {
      console.error('❌ LLM connection test failed:', error.message);
      return { success: false, error: error.message };
    }
  }

  // Main function to rerank answers
  async rerankAnswers(question, originalAnswers, questionContext = '') {
    const startTime = Date.now();
    
    try {
      console.log(`🤖 Starting LLM reranking for ${originalAnswers.length} answers...`);

      // Check cache first
      const questionId = question.question_id;
      const cachedResult = await getLLM(questionId);
      
      if (cachedResult) {
        console.log('💨 LLM cache hit! Returning cached reranked answers');
        return {
          success: true,
          reranked_answers: cachedResult.reranked_answers,
          processing_time_ms: Date.now() - startTime,
          cached: true,
          llm_provider: 'openai-cached'
        };
      }

      // Prepare answers for LLM processing
      const answersForProcessing = this.prepareAnswersForLLM(originalAnswers);
      
      if (answersForProcessing.length === 0) {
        console.log('⚠️ No valid answers to process');
        return {
          success: false,
          error: 'No valid answers to rerank',
          reranked_answers: originalAnswers,
          processing_time_ms: Date.now() - startTime
        };
      }

      // Get reranking from OpenAI
      const rerankedAnswers = await this.processWithOpenAI(
        question, 
        answersForProcessing, 
        questionContext
      );

      // Cache the result
      await setLLM(questionId, rerankedAnswers);

      console.log(`✅ LLM reranking completed in ${Date.now() - startTime}ms`);
      
      return {
        success: true,
        reranked_answers: rerankedAnswers,
        processing_time_ms: Date.now() - startTime,
        cached: false,
        llm_provider: 'openai',
        model_used: this.model
      };

    } catch (error) {
      console.error('💥 LLM reranking failed:', error);
      
      return {
        success: false,
        error: error.message,
        reranked_answers: originalAnswers, // Fallback to original order
        processing_time_ms: Date.now() - startTime,
        llm_provider: 'fallback'
      };
    }
  }

  // Prepare answers for LLM processing
  prepareAnswersForLLM(answers) {
    return answers
      .filter(answer => answer.body_html && answer.body_html.length > 50)
      .map((answer, index) => ({
        original_index: index,
        answer_id: answer.answer_id,
        score: answer.score || 0,
        is_accepted: answer.is_accepted || false,
        clean_text: this.extractCleanText(answer.body_html),
        has_code: answer.has_code || false,
        word_count: answer.word_count || 0,
        owner_reputation: answer.owner?.reputation || 0,
        quality_score: answer.quality_score || 0
      }));
  }

  // Extract clean text from HTML
  extractCleanText(html) {
    if (!html) return '';
    
    return html
      .replace(/<code[^>]*>[\s\S]*?<\/code>/gi, '[CODE_BLOCK]')
      .replace(/<pre[^>]*>[\s\S]*?<\/pre>/gi, '[CODE_BLOCK]')
      .replace(/<[^>]*>/g, ' ')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, ' ')
      .trim();
  }

  // Simplified OpenAI processing for initial testing
  async processWithOpenAI(question, answers, questionContext) {
    try {
      console.log('📤 Sending request to OpenAI...');
      
      // Simple reranking prompt
      const prompt = `Question: ${question.title}

Please rank these ${answers.length} answers from best to worst based on relevance and quality:

${answers.map((answer, index) => 
  `Answer ${index + 1} (ID: ${answer.answer_id}): ${answer.clean_text.substring(0, 200)}...`
).join('\n\n')}

Return JSON with this format:
{
  "reranked_answers": [
    {"answer_id": 123, "new_rank": 1, "llm_score": 95, "llm_reasoning": "Clear and complete answer"}
  ]
}`;

      const completion = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: "system",
            content: "You are a technical expert. Rank Stack Overflow answers by quality and relevance. Return valid JSON only."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 1000,
        response_format: { type: "json_object" }
      });

      const responseText = completion.choices[0].message.content;
      console.log('📥 Received response from OpenAI');
      
      const llmResponse = JSON.parse(responseText);
      return this.processLLMResponse(llmResponse, answers);

    } catch (error) {
      console.error('❌ OpenAI API error:', error);
      throw new Error(`OpenAI API error: ${error.message}`);
    }
  }

  // Process LLM response and merge with original data
  processLLMResponse(llmResponse, originalAnswers) {
    try {
      const { reranked_answers } = llmResponse;
      
      if (!reranked_answers || !Array.isArray(reranked_answers)) {
        throw new Error('Invalid LLM response format');
      }

      // Create a map for easy lookup
      const llmDataMap = new Map();
      reranked_answers.forEach(item => {
        llmDataMap.set(item.answer_id, item);
      });

      // Merge LLM data with original answers
      const mergedAnswers = originalAnswers.map(answer => {
        const llmData = llmDataMap.get(answer.answer_id);
        
        return {
          ...answer,
          llm_rank: llmData?.new_rank || 999,
          llm_score: llmData?.llm_score || 0,
          llm_reasoning: llmData?.llm_reasoning || 'No analysis available'
        };
      });

      // Sort by LLM rank
      const sortedAnswers = mergedAnswers.sort((a, b) => {
        if (a.llm_rank !== b.llm_rank) {
          return a.llm_rank - b.llm_rank;
        }
        return (b.score || 0) - (a.score || 0);
      });

      console.log('📊 Reranked order:', sortedAnswers.map(a => ({
        id: a.answer_id,
        llm_rank: a.llm_rank,
        llm_score: a.llm_score
      })));

      return sortedAnswers;

    } catch (error) {
      console.error('❌ Error processing LLM response:', error);
      throw new Error('Failed to process LLM reranking response');
    }
  }

  // Health check for LLM service
  async healthCheck() {
    try {
      const testResult = await this.testConnection();
      
      return {
        status: testResult.success ? 'healthy' : 'unhealthy',
        provider: 'openai',
        model: this.model,
        test_response: testResult.response || testResult.error
      };

    } catch (error) {
      return {
        status: 'unhealthy',
        provider: 'openai',
        error: error.message
      };
    }
  }
}