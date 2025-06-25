import React, { useState, useEffect } from 'react';
import { api } from './services/api';
import SearchBar from './components/SearchBar';
import QuestionCard from './components/QuestionCard';
import AnswerCard from './components/AnswerCard';
import RecentQuestionsCard from './components/RecentQuestions';
// import { Tab, TabList, TabButton, TabPanel } from './components/ui/tabs';
function App() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [activeView, setActiveView] = useState('stackoverflow'); 
  const [aiProcessing, setAiProcessing] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState('');

  useEffect(() => {
    if (results && !results.isLLMProcessed && currentQuestion) {
      setAiProcessing(true);
      const interval = setInterval(async () => {
        try {
          const response = await api.refreshAnswers(currentQuestion);
          if (response.success && response.data.isLLMProcessed) {
            setResults(response.data);
            setAiProcessing(false);
            clearInterval(interval);
            console.log('AI processing completed ,,.');
          }
        } catch (error) {
          console.error('Polling error:', error);
          setAiProcessing(false);
          clearInterval(interval);
        }
      }, 3000); 

      return () => clearInterval(interval);
    }
  }, [results, currentQuestion]);

  const handleSearch = async (question) => {
    setLoading(true);
    setResults(null);
    setActiveView('stackoverflow'); 
    setAiProcessing(false);
    setCurrentQuestion(question);

    try {
      const response = await api.searchAnswers(question);
      
      if (response.success) {
        setResults(response.data);
        console.log('✅ Got Stack Overflow results');
        
        if (!response.data.isLLMProcessed) {
          console.log('AI processing starting in background...');
        }
      } else {
        alert('Search failed: ' + response.error);
      }
    } catch (error) {
      console.error('Search error:', error);
      alert('Search failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getAnswersToShow = () => {
    if (!results) return [];
    
    if (activeView === 'ai' && results.reranked_answers?.length > 0) {
      return results.reranked_answers;
    }
    
    return results.original_answers || [];
  };

  const getAnswerCount = (type) => {
    if (!results) return 0;
    if (type === 'ai') return results.reranked_answers?.length || 0;
    return results.original_answers?.length || 0;
  };

  return (
    <div className="min-h-screen bg-white">
      <header className="bg-orange-500 text-white p-4">
        <h1 className="text-2xl font-bold">Stack Overflow Clone</h1>
        <p className="text-sm">Ask questions • Get answers • AI reranking</p>
      </header>

      <SearchBar onSearch={handleSearch} loading={loading} />

      {results && (
        <div>
          <QuestionCard question={results} />

          <div className="bg-gray-100 p-4 border-b">
            <div className="flex gap-2">
              <button
                onClick={() => setActiveView('stackoverflow')}
                className={`px-4 py-2 rounded ${
                  activeView === 'stackoverflow'
                    ? 'bg-orange-500 text-white'
                    : 'bg-white text-gray-700 border hover:bg-gray-50'
                }`}
              >
                 Stack Overflow Ranking ({getAnswerCount('so')})
              </button>

              <button
                onClick={() => setActiveView('ai')}
                className={`px-4 py-2 rounded ${
                  activeView === 'ai'
                    ? 'bg-blue-500 text-white'
                    : 'bg-white text-gray-700 border hover:bg-gray-50'
                }`}
              >
                🤖 AI Ranking ({getAnswerCount('ai')})
                {aiProcessing && (
                  <span className="ml-2 px-2 py-1 bg-yellow-400 text-black text-xs rounded">
                    Processing...
                  </span>
                )}
                {results.isLLMProcessed && !aiProcessing && (
                  <span className="ml-2 px-2 py-1 bg-green-400 text-black text-xs rounded">
                    Ready!
                  </span>
                )}
              </button>
            </div>

            <div className="mt-2 text-sm text-gray-600">
              {activeView === 'stackoverflow' ? (
                <span>Original Stack Overflow ranking by votes and acceptance</span>
              ) : (
                <span> AI reranked by technical accuracy and quality</span>
              )}
            </div>
          </div>

          <div>
            {activeView === 'ai' ? (
              <div>
                {aiProcessing ? (
                  <div className="p-8 text-center">
                    <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                    <h3 className="text-lg font-bold mb-2"> AI is analyzing answers...</h3>
                    <p className="text-gray-600">
                      Reranking by technical merit, code quality, and explanation depth
                    </p>
                    <p className="text-sm text-gray-500 mt-2">
                      This usually takes 10-30 seconds
                    </p>
                  </div>
                ) : results.reranked_answers && results.reranked_answers.length > 0 ? (
                  <div>
                    <div className="p-4 bg-blue-50 border-b">
                      <h3 className="font-bold text-blue-900">
                         AI Reranked Results
                      </h3>
                      <p className="text-sm text-blue-700">
                        Answers reordered by technical quality, not popularity
                      </p>
                    </div>
                    {getAnswersToShow().map((answer, index) => (
                      <AnswerCard
                        key={answer.answer_id}
                        answer={answer}
                        index={index}
                        showAIInfo={true}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center">
                    <h3 className="text-lg font-bold mb-2">🔄 AI Ranking Not Ready</h3>
                    <p className="text-gray-600 mb-4">
                      AI reranking is still processing or failed
                    </p>
                    <button
                      onClick={() => api.refreshAnswers(currentQuestion)}
                      className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                      Check Again
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* Stack Overflow Tab */
              <div>
                <div className="p-4 bg-orange-50 border-b">
                  <h3 className="font-bold text-orange-900">
                    Original Stack Overflow Results
                  </h3>
                  <p className="text-sm text-orange-700">
                    Sorted by votes and community acceptance
                  </p>
                </div>
                {getAnswersToShow().map((answer, index) => (
                  <AnswerCard
                    key={answer.answer_id}
                    answer={answer}
                    index={index}
                    showAIInfo={false}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {!results && !loading && (
        <div className="p-8 text-center max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold mb-4">Ask Any Programming Question</h2>
          <p className="text-gray-600 mb-6">
            Search Stack Overflow and see answers reranked by AI for technical accuracy
          </p>
          <div className="text-sm text-gray-500">
            <p>✅ Real Stack Overflow data</p>
            <p>✅ AI reranking by technical merit</p>
            <p>✅ Side-by-side comparison</p>
          </div>
        </div>
      )}

      {/* Simple Footer */}
      <footer className="mt-8 p-4 text-center text-sm text-gray-500 border-t">
        Stack Overflow Clone •  Demo • Backend + Frontend + AI
      </footer>
    </div>
  );
}

export default App;