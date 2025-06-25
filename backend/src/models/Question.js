import mongoose from 'mongoose';

const answerSchema = new mongoose.Schema(
  {
    answer_id: Number,
    body_html: String,
    score: Number,
    is_accepted: Boolean,
    llm_rank: { type: Number, default: null },
    llm_score: { type: Number, default: null },
    llm_reasoning: { type: String, default: null }
  },
  { _id: false }
);

const questionSchema = new mongoose.Schema(
  {
    question_id: { type: Number, unique: true },
    query_hash: { type: String, unique: true }, 
    title: String,
    body_html: String,
    tags: [String],
    link: String,
    original_answers: [answerSchema],
    reranked_answers: [answerSchema], 
    
 
    isLLMProcessed: { type: Boolean, default: false },
    llm_processed_at: { type: Date, default: null },
    llm_provider: { type: String, default: null },
    llm_processing_time: { type: Number, default: null },
    
    last_asked: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

questionSchema.index({ last_asked: -1 });
questionSchema.index({ isLLMProcessed: 1 });

export default mongoose.model('Question', questionSchema);