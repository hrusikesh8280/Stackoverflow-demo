import axios from 'axios';

const STACKEX_API_URL = 'https://api.stackexchange.com/2.3';

const apiClient = axios.create({
  baseURL: STACKEX_API_URL,
  timeout: 10000,
  headers: {
    'Accept-Encoding': 'gzip, deflate',
    'User-Agent': 'StackOverflow-Clone-Assignment/1.0'
  }
});

export async function getAnswersForQuestion(question) {
  try {
    console.log('searching for question:', question);

    const searchResponse = await apiClient.get('/search/excerpts', {
      params: {
        order: 'desc',
        sort: 'relevance', 
        q: question,
        site: 'stackoverflow',
        pagesize: 10, 
        filter: 'default'
      }
    });

    console.log('search API response:', {
      quota_remaining: searchResponse.data.quota_remaining,
      has_more: searchResponse.data.has_more,
      total_found: searchResponse.data.items?.length || 0
    });

    if (!searchResponse.data.items || searchResponse.data.items.length === 0) {
      throw new Error('no questions found for your search query');
    }

    const questions = searchResponse.data.items.filter(item => 
      item.item_type === 'question' && item.question_id
    );

    if (questions.length === 0) {
      throw new Error('no questions found in search results');
    }

    console.log('found questions:', questions.map(q => ({
      id: q.question_id,
      title: q.title,
      score: q.score,
      excerpt: q.excerpt?.substring(0, 100) + '...'
    })));

    const selectedQuestion = questions[0];
    const questionId = selectedQuestion.question_id;

    const questionResponse = await apiClient.get(`/questions/${questionId}`, {
      params: {
        site: 'stackoverflow',
        filter: 'withbody' 
      }
    });

    const questionDetails = questionResponse.data.items[0];

    const answersResponse = await apiClient.get(`/questions/${questionId}/answers`, {
      params: {
        order: 'desc',
        sort: 'votes', 
        site: 'stackoverflow',
        filter: 'withbody', 
        pagesize: 15 
      }
    });

    console.log('answers found:', {
      quota_remaining: answersResponse.data.quota_remaining,
      answers_count: answersResponse.data.items?.length || 0
    });


    const answers = answersResponse.data.items.map(answer => ({
      answer_id: answer.answer_id,
      question_id: answer.question_id,
      score: answer.score,
      is_accepted: answer.is_accepted,
      body: answer.body,
      body_markdown: answer.body_markdown,
      creation_date: answer.creation_date,
      last_activity_date: answer.last_activity_date,
      owner: {
        display_name: answer.owner?.display_name || 'Anonymous',
        reputation: answer.owner?.reputation || 0,
        user_id: answer.owner?.user_id,
        profile_image: answer.owner?.profile_image
      },
      // Add computed fields for LLM processing
      body_text_length: answer.body ? answer.body.length : 0,
      upvote_score: answer.score || 0
    }));

    return {
      success: true,
      question: {
        question_id: questionDetails.question_id,
        title: questionDetails.title,
        body: questionDetails.body,
        score: questionDetails.score,
        view_count: questionDetails.view_count,
        answer_count: questionDetails.answer_count,
        creation_date: questionDetails.creation_date,
        last_activity_date: questionDetails.last_activity_date,
        link: questionDetails.link,
        tags: questionDetails.tags,
        owner: {
          display_name: questionDetails.owner?.display_name || 'Anonymous',
          reputation: questionDetails.owner?.reputation || 0,
          user_id: questionDetails.owner?.user_id
        }
      },
      answers: answers,
      metadata: {
        search_query: question,
        total_search_results: searchResponse.data.items.length,
        questions_found: questions.length,
        answers_found: answers.length,
        api_quota_remaining: answersResponse.data.quota_remaining,
        selected_question_id: questionId
      }
    };

  } catch (error) {
    console.error('stack Overflow API Error:', error.response?.data || error.message);
    
    
    if (error.response?.status === 400) {
      const errorDetail = error.response.data?.error_message || 'Bad request parameters';
      throw new Error(`Stack Overflow API: ${errorDetail}`);
    } else if (error.response?.status === 403) {
      throw new Error('API quota exceeded. Please try again later.');
    } else if (error.response?.status === 404) {
      throw new Error('Stack Overflow API endpoint not found.');
    } else if (error.response?.status >= 500) {
      throw new Error('Stack Overflow API server error. Please try again later.');
    } else if (error.code === 'ENOTFOUND' || error.code === 'ETIMEDOUT') {
      throw new Error('Network error: Unable to connect to Stack Overflow API');
    } else {
      throw new Error(`Stack Overflow API error: ${error.message}`);
    }
  }
}


export async function getRecentQuestions(tags = [], limit = 5) {
  try {
    const response = await apiClient.get('/questions', {
      params: {
        order: 'desc',
        sort: 'activity',
        site: 'stackoverflow',
        pagesize: limit,
        tagged: tags.join(';'),
        filter: 'default'
      }
    });

    return response.data.items;
  } catch (error) {
    console.error('Error fetching recent questions:', error);
    throw error;
  }
}