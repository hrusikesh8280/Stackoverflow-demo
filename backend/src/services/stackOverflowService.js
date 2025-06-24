// import axios from 'axios';

// const STACKEX_API_URL = 'https://api.stackexchange.com/2.3';

// const apiClient = axios.create({
//   baseURL: STACKEX_API_URL,
//   timeout: 10000,
//   headers: {
//     'Accept-Encoding': 'gzip, deflate',
//     'User-Agent': 'StackOverflow-Clone-Assignment/1.0'
//   }
// });

// export async function getAnswersForQuestion(question) {
//   try {
//     console.log('searching for question:', question);

//     const searchResponse = await apiClient.get('/search/excerpts', {
//       params: {
//         order: 'desc',
//         sort: 'relevance', 
//         q: question,
//         site: 'stackoverflow',
//         pagesize: 10, 
//         filter: 'default'
//       }
//     });

//     console.log('search API response:', {
//       quota_remaining: searchResponse.data.quota_remaining,
//       has_more: searchResponse.data.has_more,
//       total_found: searchResponse.data.items?.length || 0
//     });

//     if (!searchResponse.data.items || searchResponse.data.items.length === 0) {
//       throw new Error('no questions found for your search query');
//     }

//     const questions = searchResponse.data.items.filter(item => 
//       item.item_type === 'question' && item.question_id
//     );

//     if (questions.length === 0) {
//       throw new Error('no questions found in search results');
//     }

//     console.log('found questions:', questions.map(q => ({
//       id: q.question_id,
//       title: q.title,
//       score: q.score,
//       excerpt: q.excerpt?.substring(0, 100) + '...'
//     })));

//     const selectedQuestion = questions[0];
//     const questionId = selectedQuestion.question_id;

//     const questionResponse = await apiClient.get(`/questions/${questionId}`, {
//       params: {
//         site: 'stackoverflow',
//         filter: 'withbody' 
//       }
//     });

//     const questionDetails = questionResponse.data.items[0];

//     const answersResponse = await apiClient.get(`/questions/${questionId}/answers`, {
//       params: {
//         order: 'desc',
//         sort: 'votes', 
//         site: 'stackoverflow',
//         filter: 'withbody', 
//         pagesize: 15 
//       }
//     });

//     console.log('answers found:', {
//       quota_remaining: answersResponse.data.quota_remaining,
//       answers_count: answersResponse.data.items?.length || 0
//     });


//     const answers = answersResponse.data.items.map(answer => ({
//       answer_id: answer.answer_id,
//       question_id: answer.question_id,
//       score: answer.score,
//       is_accepted: answer.is_accepted,
//       body: answer.body,
//       body_markdown: answer.body_markdown,
//       creation_date: answer.creation_date,
//       last_activity_date: answer.last_activity_date,
//       owner: {
//         display_name: answer.owner?.display_name || 'Anonymous',
//         reputation: answer.owner?.reputation || 0,
//         user_id: answer.owner?.user_id,
//         profile_image: answer.owner?.profile_image
//       },
//       // Add computed fields for LLM processing
//       body_text_length: answer.body ? answer.body.length : 0,
//       upvote_score: answer.score || 0
//     }));

//     return {
//       success: true,
//       question: {
//         question_id: questionDetails.question_id,
//         title: questionDetails.title,
//         body: questionDetails.body,
//         score: questionDetails.score,
//         view_count: questionDetails.view_count,
//         answer_count: questionDetails.answer_count,
//         creation_date: questionDetails.creation_date,
//         last_activity_date: questionDetails.last_activity_date,
//         link: questionDetails.link,
//         tags: questionDetails.tags,
//         owner: {
//           display_name: questionDetails.owner?.display_name || 'Anonymous',
//           reputation: questionDetails.owner?.reputation || 0,
//           user_id: questionDetails.owner?.user_id
//         }
//       },
//       answers: answers,
//       metadata: {
//         search_query: question,
//         total_search_results: searchResponse.data.items.length,
//         questions_found: questions.length,
//         answers_found: answers.length,
//         api_quota_remaining: answersResponse.data.quota_remaining,
//         selected_question_id: questionId
//       }
//     };

//   } catch (error) {
//     console.error('stack Overflow API Error:', error.response?.data || error.message);
    
    
//     if (error.response?.status === 400) {
//       const errorDetail = error.response.data?.error_message || 'Bad request parameters';
//       throw new Error(`Stack Overflow API: ${errorDetail}`);
//     } else if (error.response?.status === 403) {
//       throw new Error('API quota exceeded. Please try again later.');
//     } else if (error.response?.status === 404) {
//       throw new Error('Stack Overflow API endpoint not found.');
//     } else if (error.response?.status >= 500) {
//       throw new Error('Stack Overflow API server error. Please try again later.');
//     } else if (error.code === 'ENOTFOUND' || error.code === 'ETIMEDOUT') {
//       throw new Error('Network error: Unable to connect to Stack Overflow API');
//     } else {
//       throw new Error(`Stack Overflow API error: ${error.message}`);
//     }
//   }
// }


// export async function getRecentQuestions(tags = [], limit = 5) {
//   try {
//     const response = await apiClient.get('/questions', {
//       params: {
//         order: 'desc',
//         sort: 'activity',
//         site: 'stackoverflow',
//         pagesize: limit,
//         tagged: tags.join(';'),
//         filter: 'default'
//       }
//     });

//     return response.data.items;
//   } catch (error) {
//     console.error('Error fetching recent questions:', error);
//     throw error;
//   }
// }

import axios from 'axios';

const STACKEX_API_URL = 'https://api.stackexchange.com/2.3';

const apiClient = axios.create({
  baseURL: STACKEX_API_URL,
  timeout: 15000,
  headers: {
    'Accept-Encoding': 'gzip, deflate',
    'User-Agent': 'StackOverflow-Clone-Assignment/1.0'
  }
});

apiClient.interceptors.request.use(
  (config) => {
    console.log(`🔄 Stack Overflow API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  (response) => {
    console.log(`✅ Stack Overflow API Response: ${response.status} - Quota: ${response.data.quota_remaining}`);
    return response;
  },
  (error) => {
    console.error('❌ Response Error:', error.response?.status, error.response?.data);
    return Promise.reject(error);
  }
);

export async function getAnswersForQuestion(question) {
  try {
    console.log('🔍 Searching Stack Overflow for:', question);

    // Input validation
    if (!question || question.trim().length < 3) {
      throw new Error('Question must be at least 3 characters long');
    }

    const trimmedQuestion = question.trim();

    // Step 1: Search for questions
    const searchResponse = await apiClient.get('/search/excerpts', {
      params: {
        order: 'desc',
        sort: 'relevance',
        q: trimmedQuestion,
        site: 'stackoverflow',
        pagesize: 20, // Get more results for better selection
        filter: 'default'
      }
    });

    console.log('📊 Search Results:', {
      quota_remaining: searchResponse.data.quota_remaining,
      items_found: searchResponse.data.items?.length || 0,
      has_more: searchResponse.data.has_more
    });

    // Check if we have results
    if (!searchResponse.data.items || searchResponse.data.items.length === 0) {
      return {
        success: false,
        error: 'No questions found for your search query',
        question: null,
        answers: [],
        metadata: {
          search_query: trimmedQuestion,
          api_quota_remaining: searchResponse.data.quota_remaining,
          timestamp: new Date().toISOString()
        }
      };
    }

    // Filter and sort questions by quality
    const questions = searchResponse.data.items
      .filter(item => 
        item.item_type === 'question' && 
        item.question_id &&
        item.answer_count > 0 // Only questions with answers
      )
      .sort((a, b) => {
        // Prioritize by score, then by answer count
        const scoreA = (a.score || 0) * 2 + (a.answer_count || 0);
        const scoreB = (b.score || 0) * 2 + (b.answer_count || 0);
        return scoreB - scoreA;
      });

    if (questions.length === 0) {
      return {
        success: false,
        error: 'No questions with answers found',
        question: null,
        answers: [],
        metadata: {
          search_query: trimmedQuestion,
          total_questions_found: searchResponse.data.items.length,
          api_quota_remaining: searchResponse.data.quota_remaining,
          timestamp: new Date().toISOString()
        }
      };
    }

    console.log('📝 Best questions found:', questions.slice(0, 3).map(q => ({
      id: q.question_id,
      title: q.title,
      score: q.score,
      answer_count: q.answer_count
    })));

    // Step 2: Get detailed question info
    const selectedQuestion = questions[0];
    const questionId = selectedQuestion.question_id;

    const questionResponse = await apiClient.get(`/questions/${questionId}`, {
      params: {
        site: 'stackoverflow',
        filter: 'withbody'
      }
    });

    if (!questionResponse.data.items || questionResponse.data.items.length === 0) {
      throw new Error('Selected question details not found');
    }

    const questionDetails = questionResponse.data.items[0];

    // Step 3: Get answers for the question
    const answersResponse = await apiClient.get(`/questions/${questionId}/answers`, {
      params: {
        order: 'desc',
        sort: 'votes',
        site: 'stackoverflow',
        filter: 'withbody',
        pagesize: 25 // Get more answers for better variety
      }
    });

    console.log('💬 Answers retrieved:', {
      count: answersResponse.data.items?.length || 0,
      quota_remaining: answersResponse.data.quota_remaining
    });

    // Step 4: Process and enhance answers
    const rawAnswers = answersResponse.data.items || [];
    
    const processedAnswers = rawAnswers
      .filter(answer => 
        answer.body && 
        answer.body.length > 100 && // Filter out very short answers
        !answer.body.includes('[deleted]') // Filter out deleted content
      )
      .map(answer => ({
        answer_id: answer.answer_id,
        question_id: answer.question_id,
        score: answer.score || 0,
        is_accepted: answer.is_accepted || false,
        body_html: answer.body,
        body_markdown: answer.body_markdown || '',
        creation_date: answer.creation_date,
        last_activity_date: answer.last_activity_date,
        last_edit_date: answer.last_edit_date,
        owner: {
          display_name: answer.owner?.display_name || 'Anonymous',
          reputation: answer.owner?.reputation || 0,
          user_id: answer.owner?.user_id,
          profile_image: answer.owner?.profile_image,
          link: answer.owner?.link
        },
        // Additional metadata for UI and potential LLM processing
        word_count: countWords(answer.body),
        has_code: hasCodeBlocks(answer.body),
        quality_score: calculateAnswerQuality(answer)
      }))
      .sort((a, b) => {
        // Sort by accepted first, then by score, then by quality
        if (a.is_accepted && !b.is_accepted) return -1;
        if (!a.is_accepted && b.is_accepted) return 1;
        if (a.score !== b.score) return b.score - a.score;
        return b.quality_score - a.quality_score;
      });

    // Step 5: Return structured response
    return {
      success: true,
      question: {
        question_id: questionDetails.question_id,
        title: questionDetails.title,
        body_html: questionDetails.body,
        body_markdown: questionDetails.body_markdown || '',
        score: questionDetails.score || 0,
        view_count: questionDetails.view_count || 0,
        answer_count: questionDetails.answer_count || 0,
        creation_date: questionDetails.creation_date,
        last_activity_date: questionDetails.last_activity_date,
        link: questionDetails.link,
        tags: questionDetails.tags || [],
        owner: {
          display_name: questionDetails.owner?.display_name || 'Anonymous',
          reputation: questionDetails.owner?.reputation || 0,
          user_id: questionDetails.owner?.user_id,
          profile_image: questionDetails.owner?.profile_image,
          link: questionDetails.owner?.link
        }
      },
      answers: processedAnswers,
      metadata: {
        search_query: trimmedQuestion,
        total_search_results: searchResponse.data.items.length,
        filtered_questions: questions.length,
        selected_question_id: questionId,
        raw_answers_count: rawAnswers.length,
        processed_answers_count: processedAnswers.length,
        api_quota_remaining: answersResponse.data.quota_remaining,
        search_timestamp: new Date().toISOString()
      }
    };

  } catch (error) {
    console.error('💥 Stack Overflow API Error:', error);
    
    // Enhanced error handling with specific messages
    if (error.response) {
      const status = error.response.status;
      const errorData = error.response.data;
      
      switch (status) {
        case 400:
          throw new Error(`Invalid request: ${errorData?.error_message || 'Bad request parameters'}`);
        case 403:
          throw new Error('API quota exceeded. Please try again later.');
        case 404:
          throw new Error('Stack Overflow API endpoint not found');
        case 429:
          throw new Error('Rate limit exceeded. Please wait before making another request.');
        case 500:
        case 502:
        case 503:
          throw new Error('Stack Overflow API is temporarily unavailable. Please try again later.');
        default:
          throw new Error(`Stack Overflow API error (${status}): ${errorData?.error_message || 'Unknown error'}`);
      }
    } else if (error.code === 'ENOTFOUND') {
      throw new Error('Network error: Unable to reach Stack Overflow API');
    } else if (error.code === 'ETIMEDOUT') {
      throw new Error('Request timeout: Stack Overflow API is not responding');
    } else {
      throw new Error(`Stack Overflow API error: ${error.message}`);
    }
  }
}

// Helper function to count words in HTML content
function countWords(html) {
  if (!html) return 0;
  
  // Remove HTML tags and count words
  const text = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  return text ? text.split(' ').length : 0;
}

// Helper function to detect code blocks
function hasCodeBlocks(html) {
  if (!html) return false;
  
  return html.includes('<code>') || 
         html.includes('<pre>') || 
         html.includes('```') ||
         html.includes('class="snippet-code-js"') ||
         html.includes('class="snippet-code-html"') ||
         html.includes('class="snippet-code-css"');
}

// Helper function to calculate answer quality score
function calculateAnswerQuality(answer) {
  let score = 0;
  
  // Base score from votes
  score += (answer.score || 0) * 10;
  
  // Bonus for accepted answer
  if (answer.is_accepted) score += 100;
  
  // Length bonus (but not too long)
  const bodyLength = answer.body ? answer.body.length : 0;
  if (bodyLength > 200) score += 10;
  if (bodyLength > 500) score += 15;
  if (bodyLength > 1000) score += 20;
  if (bodyLength > 3000) score -= 10; // Penalty for very long answers
  
  // Owner reputation bonus
  const reputation = answer.owner?.reputation || 0;
  if (reputation > 1000) score += 5;
  if (reputation > 5000) score += 10;
  if (reputation > 20000) score += 15;
  
  // Code presence bonus
  if (hasCodeBlocks(answer.body)) score += 15;
  
  // Recent activity bonus
  if (answer.last_activity_date) {
    const daysSince = (Date.now() / 1000 - answer.last_activity_date) / (24 * 60 * 60);
    if (daysSince < 30) score += 10;
    if (daysSince < 7) score += 15;
  }
  
  return Math.max(score, 0);
}

// Export function to get recent questions (for trending/popular section)
export async function getRecentQuestions(tags = [], limit = 10) {
  try {
    console.log('📋 Fetching recent Stack Overflow questions');
    
    const response = await apiClient.get('/questions', {
      params: {
        order: 'desc',
        sort: 'activity',
        site: 'stackoverflow',
        pagesize: Math.min(limit, 50),
        tagged: tags.length > 0 ? tags.join(';') : undefined,
        filter: 'default'
      }
    });

    const questions = (response.data.items || []).map(question => ({
      question_id: question.question_id,
      title: question.title,
      tags: question.tags || [],
      score: question.score || 0,
      answer_count: question.answer_count || 0,
      view_count: question.view_count || 0,
      creation_date: question.creation_date,
      last_activity_date: question.last_activity_date,
      link: question.link,
      owner: {
        display_name: question.owner?.display_name || 'Anonymous',
        reputation: question.owner?.reputation || 0
      }
    }));

    return {
      success: true,
      questions: questions,
      metadata: {
        count: questions.length,
        tags_filter: tags,
        api_quota_remaining: response.data.quota_remaining,
        timestamp: new Date().toISOString()
      }
    };

  } catch (error) {
    console.error('❌ Error fetching recent questions:', error);
    throw new Error(`Failed to fetch recent questions: ${error.message}`);
  }
}