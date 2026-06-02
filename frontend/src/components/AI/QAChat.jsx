import React, { useState } from 'react';
import { aiAPI } from '../../services/api';
import { toast } from 'react-toastify';
import { 
  FaQuestionCircle, 
  FaSpinner, 
  FaRobot, 
  FaUser, 
  FaHistory,
  FaTrash
} from 'react-icons/fa';
import moment from 'moment';
import { AI_CONTEXT_LIMIT_DEFAULT, AI_RELEVANCE_THRESHOLD_DEFAULT } from '../../utils/constants';

const QAChat = ({ chatrooms, aiStatus }) => {
  const [question, setQuestion] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState('');

  const handleAskQuestion = async (e) => {
    e.preventDefault();

    if (!question.trim()) {
      toast.warning('Please enter a question');
      return;
    }

    if (!aiStatus?.features?.qaFromChats) {
      toast.error('Q&A feature is not available. Please check AI service configuration.');
      return;
    }

    // Add user question to chat
    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: question.trim(),
      timestamp: new Date()
    };

    setChatHistory(prev => [...prev, userMessage]);
    setLoading(true);
    const currentQuestion = question.trim();
    setQuestion('');

    try {
      const response = await aiAPI.askQuestion({
        question: currentQuestion,
        roomId: selectedRoom || undefined,
        contextLimit: AI_CONTEXT_LIMIT_DEFAULT,
        relevanceThreshold: AI_RELEVANCE_THRESHOLD_DEFAULT
      });

      if (response.data.success) {
        const aiMessage = {
          id: Date.now() + 1,
          type: 'ai',
          content: response.data.answer,
          sources: response.data.sources,
          contextUsed: response.data.contextUsed,
          timestamp: new Date()
        };

        setChatHistory(prev => [...prev, aiMessage]);
      } else {
        const errorMessage = {
          id: Date.now() + 1,
          type: 'error',
          content: response.data.message || 'Sorry, I could not find relevant information to answer your question.',
          timestamp: new Date()
        };

        setChatHistory(prev => [...prev, errorMessage]);
      }
    } catch (error) {
      console.error('Q&A error:', error);

      const errorMessage = {
        id: Date.now() + 1,
        type: 'error',
        content: error.response?.data?.message || 'Sorry, there was an error processing your question. Please try again.',
        timestamp: new Date()
      };

      setChatHistory(prev => [...prev, errorMessage]);
      toast.error(error.response?.data?.message || 'Failed to process question');
    } finally {
      setLoading(false);
    }
  };

  const clearHistory = () => {
    setChatHistory([]);
  };

  const formatTimestamp = (timestamp) => {
    return moment(timestamp).format('h:mm A');
  };

  const exampleQuestions = [
    "What were the main topics discussed yesterday?",
    "Any recent updates about the project?",
    "What issues or problems were mentioned?",
    "Who participated most in the discussions?",
    "Any important decisions or conclusions?",
    "What are people saying about the new feature?",
    "Any technical problems reported recently?",
    "What events or meetings were mentioned?"
  ];

  return (
    <div className="flex flex-col h-96">
      {/* Chat Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center">
          <FaRobot className="text-purple-600 mr-2" />
          <h3 className="font-medium text-gray-900">AI Assistant</h3>
        </div>

        <div className="flex items-center space-x-3">
          {/* Room Filter */}
          <select
            value={selectedRoom}
            onChange={(e) => setSelectedRoom(e.target.value)}
            className="text-sm border border-gray-300 rounded px-2 py-1"
            disabled={loading}
          >
            <option value="">All rooms</option>
            {chatrooms.map(room => (
              <option key={room._id} value={room._id}>
                {room.name}
              </option>
            ))}
          </select>

          {/* Clear History */}
          {chatHistory.length > 0 && (
            <button
              onClick={clearHistory}
              className="text-gray-500 hover:text-red-600 transition-colors"
              title="Clear conversation"
            >
              <FaTrash className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {chatHistory.length === 0 ? (
          <div className="text-center py-8">
            <FaQuestionCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Ask me anything about your chats!
            </h3>
            <p className="text-gray-500 mb-6">
              I can help you find information from your conversation history
            </p>

            <div className="max-w-md mx-auto">
              <p className="text-sm font-medium text-gray-700 mb-3">Try asking:</p>
              <div className="grid grid-cols-1 gap-2">
                {exampleQuestions.slice(0, 4).map((example, index) => (
                  <button
                    key={index}
                    onClick={() => setQuestion(example)}
                    className="text-xs bg-white hover:bg-blue-50 text-gray-700 hover:text-blue-800 px-3 py-2 rounded-lg border border-gray-200 hover:border-blue-300 transition-colors text-left"
                  >
                    {example}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          chatHistory.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.type === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  message.type === 'user'
                    ? 'bg-blue-600 text-white'
                    : message.type === 'error'
                    ? 'bg-red-50 text-red-800 border border-red-200'
                    : 'bg-white text-gray-800 border border-gray-200 shadow-sm'
                }`}
              >
                {/* Message Header */}
                <div className="flex items-center mb-2">
                  {message.type === 'user' ? (
                    <FaUser className="mr-2 w-3 h-3" />
                  ) : message.type === 'error' ? (
                    <FaQuestionCircle className="mr-2 w-3 h-3 text-red-600" />
                  ) : (
                    <FaRobot className="mr-2 w-3 h-3 text-purple-600" />
                  )}
                  <span className="text-xs font-medium">
                    {message.type === 'user' ? 'You' : message.type === 'error' ? 'Error' : 'AI Assistant'}
                  </span>
                  <span className="text-xs opacity-70 ml-2">
                    {formatTimestamp(message.timestamp)}
                  </span>
                </div>

                {/* Message Content */}
                <div className="text-sm leading-relaxed whitespace-pre-wrap">
                  {message.content}
                </div>

                {/* Sources (for AI messages) */}
                {message.sources && message.sources.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <div className="flex items-center mb-2">
                      <FaHistory className="w-3 h-3 mr-1 text-gray-500" />
                      <span className="text-xs text-gray-600 font-medium">
                        Based on {message.contextUsed} relevant messages:
                      </span>
                    </div>
                    <div className="space-y-1">
                      {message.sources.slice(0, 3).map((source, index) => (
                        <div
                          key={index}
                          className="text-xs text-gray-600 bg-gray-50 p-2 rounded border"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium">{source.username}</span>
                            <span className="text-gray-400">
                              {Math.round(source.relevanceScore * 100)}% match
                            </span>
                          </div>
                          <div className="text-gray-700">
                            "{source.content}"
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))
        )}

        {/* Loading indicator */}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-200 rounded-lg px-4 py-3 shadow-sm">
              <div className="flex items-center">
                <FaSpinner className="animate-spin mr-2 text-purple-600" />
                <span className="text-sm text-gray-600">Thinking...</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input Form */}
      <div className="border-t border-gray-200 p-4 bg-white">
        <form onSubmit={handleAskQuestion} className="flex space-x-3">
          <div className="flex-1">
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask a question about your chat history..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading || !question.trim()}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              loading || !question.trim()
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-purple-600 text-white hover:bg-purple-700'
            }`}
          >
            {loading ? (
              <FaSpinner className="animate-spin" />
            ) : (
              'Ask'
            )}
          </button>
        </form>

        {/* Example Questions */}
        {chatHistory.length === 0 && (
          <div className="mt-3">
            <div className="flex flex-wrap gap-2">
              {exampleQuestions.slice(4, 8).map((example, index) => (
                <button
                  key={index + 4}
                  onClick={() => setQuestion(example)}
                  className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-1 rounded transition-colors"
                >
                  {example}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QAChat;
