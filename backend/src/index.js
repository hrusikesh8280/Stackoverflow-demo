import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { connectMongo } from './config/database.js';
import { createRedisClient } from './config/redisClient.js';
import answersRouter from './routes/questionRoutes';


const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/answers', answersRouter);
app.get('/healthz', (_, res) => res.send('ok'));


const { PORT, MONGO_URI, REDIS_URL } = process.env;

async function start() {
  await connectMongo(MONGO_URI);
  createRedisClient(REDIS_URL);    
  app.listen(PORT, () => console.log(` API on :${PORT}`));
}

start().catch(err => {
  console.error(err);
  process.exit(1);
});
