// import crypto from 'crypto';
// import { redis } from '../config/cache.js';   

// const TTL = 60 * 30; 

// const LL_KEY = id => `so:llm:${id}`;

// export async function getLLM(id) {
//   const hit = await redis.get(LL_KEY(id));
//   return hit ? JSON.parse(hit) : null;
// }

// export async function setLLM(id, data) {
//   await redis.set(LL_KEY(id), JSON.stringify(data), 'EX', 60*60*24); // 24 h
// }


// function key(query) {
//   return 'so:ans:' + crypto.createHash('sha1').update(query).digest('hex');
// }

// export async function getCachedAnswers(query) {
//   const hit = await redis.get(key(query));
//   return hit ? JSON.parse(hit) : null;
// }

// export async function setCachedAnswers(query, payload) {
//   await redis.set(key(query), JSON.stringify(payload), 'EX', TTL);
// }



// const RECENT_KEY = 'so:recent';

// export async function pushRecent(doc) {
//   await redis.lpush(RECENT_KEY, JSON.stringify({
//     question_id: doc.question_id,
//     title: doc.title,
//     tags: doc.tags,
//     when: doc.last_asked
//   }));
//   await redis.ltrim(RECENT_KEY, 0, 4);        
// }

// export async function getRecent() {
//   return (await redis.lrange(RECENT_KEY, 0, 4)).map(JSON.parse);
// }


// lib/cache.js - Fixed LLM caching
import crypto from 'crypto';
import { redis } from '../config/cache.js';

const LLM_TTL = 60 * 60 * 24; // 24 hours for LLM results
const TTL = 60 * 30; // 30 minutes for regular cache

// LLM Cache functions
export async function getLLM(questionId) {
  try {
    const key = `llm:q:${questionId}`;
    const cached = await redis.get(key);
    
    if (cached) {
      console.log('🎯 LLM cache hit!');
      return JSON.parse(cached);
    }
    
    console.log('❌ LLM cache miss');
    return null;
  } catch (error) {
    console.warn('⚠️ LLM cache read error:', error.message);
    return null;
  }
}

export async function setLLM(questionId, rerankedAnswers) {
  try {
    const key = `llm:q:${questionId}`;
    
    const cacheData = {
      question_id: questionId,
      reranked_answers: rerankedAnswers,
      cached_at: new Date().toISOString(),
      answer_count: rerankedAnswers.length
    };
    
    await redis.set(key, JSON.stringify(cacheData), 'EX', LLM_TTL);
    console.log('✅ LLM result cached');
  } catch (error) {
    console.warn('⚠️ LLM cache write error:', error.message);
  }
}

// Regular cache functions (existing)
function key(query) {
  return 'so:ans:' + crypto.createHash('sha1').update(query).digest('hex');
}

export async function getCachedAnswers(query) {
  const hit = await redis.get(key(query));
  return hit ? JSON.parse(hit) : null;
}

export async function setCachedAnswers(query, payload) {
  await redis.set(key(query), JSON.stringify(payload), 'EX', TTL);
}

const RECENT_KEY = 'so:recent';

export async function pushRecent(doc) {
  await redis.lpush(RECENT_KEY, JSON.stringify({
    question_id: doc.question_id,
    title: doc.title,
    tags: doc.tags,
    when: doc.last_asked
  }));
  await redis.ltrim(RECENT_KEY, 0, 4);
}

export async function getRecent() {
  return (await redis.lrange(RECENT_KEY, 0, 4)).map(JSON.parse);
}