import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { connectMongo } from './config/database.js';
import { createRedisClient } from './config/redisClient.js';
import answersRouter from './routes/questionRoutes';

const app = express();

const allowedOrigins = ['http://localhost:5173', 'http://frontend:5173']; 
app.use(cors({
  origin: (origin, callback) => {
    if (allowedOrigins.includes(origin) || !origin) {
      callback(null, true); 
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
}));




app.use(express.json());
app.use('/api/answers', answersRouter);
app.get('/', (_, res) => res.send('API is running'));
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
