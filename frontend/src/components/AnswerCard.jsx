import React from 'react';

const AnswerCard = ({ answer, index, showAIInfo = false }) => {
  return (
    <div className="p-4 border-b">
      <div className="flex gap-4">
        <div className="text-center min-w-[60px]">
          <div className="text-lg font-bold">{answer.score || 0}</div>
          <div className="text-xs text-gray-500">votes</div>
          {answer.is_accepted && (
            <div className="text-green-600 text-xs mt-1">✓ Accepted</div>
          )}
        </div>

        <div className="flex-1">
          <div className="mb-2">
            <span className="text-sm text-gray-500">
              {showAIInfo ? `AI Rank #${answer.llm_rank || index + 1}` : `SO Rank #${index + 1}`}
            </span>
            {showAIInfo && answer.llm_score && (
              <span className="ml-4 text-sm text-blue-600">
                AI Score: {answer.llm_score}/100
              </span>
            )}
          </div>

          <div 
            className="mb-3"
            dangerouslySetInnerHTML={{ __html: answer.body_html }}
          />

          {showAIInfo && answer.llm_reasoning && (
            <div className="p-3 bg-blue-50 border-l-4 border-blue-400 text-sm">
              <strong>AI Analysis:</strong>
              <p className="mt-1">{answer.llm_reasoning}</p>
            </div>
          )}

          <div className="text-xs text-gray-500 mt-2">
            By: {answer.owner?.display_name || 'Anonymous'}
            {answer.owner?.reputation && ` (${answer.owner.reputation} rep)`}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnswerCard;