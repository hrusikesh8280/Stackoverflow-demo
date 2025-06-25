import React, { useState } from 'react';

const SearchBar = ({ onSearch, loading }) => {
  const [question, setQuestion] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (question.trim()) {
      onSearch(question.trim());
    }
  };

  return (
    <div className="p-4 border-b">
      <form onSubmit={handleSubmit} className="max-w-2xl">
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask your programming question (e.g., how to reverse string in javascript)"
          className="w-full p-3 border rounded"
          rows={3}
          disabled={loading}
        />
        <div className="mt-2 flex justify-between items-center">
          <button
            type="submit"
            disabled={loading || !question.trim()}
            className="px-4 py-2 bg-orange-500 text-white rounded disabled:opacity-50"
          >
            {loading ? 'Searching...' : 'Ask Question'}
          </button>
          <span className="text-sm text-gray-500">{question.length}/500</span>
        </div>
      </form>
    </div>
  );
};

export default SearchBar;