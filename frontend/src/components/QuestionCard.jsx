import React from 'react';

const QuestionCard = ({ question }) => {
  if (!question) return null;

  return (
    <div className="p-4 border-b bg-gray-50">
      <h2 className="text-xl font-bold mb-2">{question.title}</h2>
      <div className="flex gap-4 text-sm text-gray-600 mb-2">
        <span>Votes: {question.score || 0}</span>
        <span>Answers: {question.answer_count || 0}</span>
        <span>Views: {question.view_count || 0}</span>
      </div>
      {question.tags && (
        <div className="flex flex-wrap gap-1">
          {question.tags.map((tag, i) => (
            <span key={i} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

export default QuestionCard;