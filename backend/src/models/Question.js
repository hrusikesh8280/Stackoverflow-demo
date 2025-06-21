import mongoose from 'mongoose';

const answerSchema = new mongoose.Schema(
  {
    answer_id: Number,
    body_html: String,
    score: Number,
    is_accepted: Boolean
  },
  { _id: false }
);

const questionSchema = new mongoose.Schema(
  {
    question_id: { type: Number, unique: true },
    query_hash: { type: String, unique: true },  // sha1 of the user query
    title: String,
    body_html: String,
    tags: [String],
    link: String,
    original_answers: [answerSchema],
    last_asked: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

questionSchema.index({ last_asked: -1 });

export default mongoose.model('Question', questionSchema);
