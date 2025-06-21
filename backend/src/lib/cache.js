import crypto from 'crypto';
import { redis } from '../config/cache.js';   

const TTL = 60 * 30; 

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
