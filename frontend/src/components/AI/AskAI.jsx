import React, { useState, useEffect } from 'react';
import Header from '../Layout/Header';
import SemanticSearch from './SemanticSearch';
import QAChat from './QAChat';
import { aiAPI, chatroomsAPI } from '../../services/api';
import { toast } from 'react-toastify';
import { 
  FaRobot, 
  FaSearch, 
  FaQuestionCircle, 
  FaChartLine,
  FaInfoCircle,
  FaExclamationTriangle
} from 'react-icons/fa';

const AskAI = () => {
  const [activeTab, setActiveTab] = useState('semantic');
  const [chatrooms, setChatrooms] = useState([]);
  const [aiStatus, setAiStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  // Debugging: Check aiAPI import at runtime
  useEffect(() => {
    if (!aiAPI || typeof aiAPI.semanticSearch !== 'function') {
      console.error('aiAPI.semanticSearch is undefined! Check your import and export in services/api.js');
      toast.error('AI Service integration error—semanticSearch not found!');
    }
    fetchChatrooms();
    checkAIStatus();
  }, []);

  const fetchChatrooms = async () => {
    try {
      const response = await chatroomsAPI.getAll({ limit: 100 });
      setChatrooms(response.data.chatrooms);
    } catch (error) {
      console.error('Failed to fetch chatrooms:', error);
    }
  };

  const checkAIStatus = async () => {
    try {
      const response = await aiAPI.getStatus();
      setAiStatus(response.data.status);
    } catch (error) {
      console.error('Failed to check AI status:', error);
      toast.error('Failed to check AI service status');
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    {
      id: 'semantic',
      label: 'Semantic Search',
      icon: FaSearch,
      description: 'Find relevant discussions using natural language'
    },
    {
      id: 'qa',
      label: 'Q&A Chat',
      icon: FaQuestionCircle,
      description: 'Ask questions and get AI-powered answers from chat history'
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center items-center mb-4">
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-4 rounded-full">
              <FaRobot className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            AI Assistant
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Use AI to search through chat history and get intelligent answers based on past conversations
          </p>
        </div>

        {/* AI Status Alert */}
        {aiStatus && (
          <div className="mb-6">
            {!aiStatus.features?.semanticSearch || !aiStatus.features?.qaFromChats ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center">
                  <FaExclamationTriangle className="text-yellow-600 mr-3" />
                  <div>
                    <h3 className="text-sm font-medium text-yellow-800">
                      AI Features Limited
                    </h3>
                    <div className="text-sm text-yellow-700 mt-1">
                      <p>Some AI features may not be available:</p>
                      <ul className="list-disc list-inside mt-1">
                        {!aiStatus.gemini?.status && (
                          <li>Gemini API not configured</li>
                        )}
                        {aiStatus.chromadb?.status !== 'available' && (
                          <li>ChromaDB not available ({aiStatus.chromadb?.messageCount} messages indexed)</li>
                        )}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center">
                  <FaInfoCircle className="text-green-600 mr-3" />
                  <div>
                    <h3 className="text-sm font-medium text-green-800">
                      AI Services Active
                    </h3>
                    <p className="text-sm text-green-700">
                      {aiStatus.chromadb?.messageCount} messages indexed for semantic search
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === tab.id
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="mr-2" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Tab Description */}
          <div className="px-6 py-4 bg-gray-50">
            <p className="text-sm text-gray-600">
              {tabs.find(tab => tab.id === activeTab)?.description}
            </p>
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {activeTab === 'semantic' && (
            <SemanticSearch 
              chatrooms={chatrooms} 
              aiStatus={aiStatus}
            />
          )}

          {activeTab === 'qa' && (
            <QAChat 
              chatrooms={chatrooms} 
              aiStatus={aiStatus}
            />
          )}
        </div>

        {/* Features Overview */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <div className="flex items-center mb-3">
              <FaSearch className="text-blue-600 mr-2" />
              <h3 className="font-semibold text-gray-900">Semantic Search</h3>
            </div>
            <p className="text-gray-600 text-sm">
              Find relevant messages using natural language queries, powered by vector embeddings.
            </p>
          </div>

          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <div className="flex items-center mb-3">
              <FaQuestionCircle className="text-purple-600 mr-2" />
              <h3 className="font-semibold text-gray-900">Q&A Assistant</h3>
            </div>
            <p className="text-gray-600 text-sm">
              Ask questions and get intelligent answers based on chat history and context.
            </p>
          </div>

          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <div className="flex items-center mb-3">
              <FaChartLine className="text-green-600 mr-2" />
              <h3 className="font-semibold text-gray-900">Smart Analysis</h3>
            </div>
            <p className="text-gray-600 text-sm">
              Get insights, summaries, and analysis of conversations across different topics.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AskAI;
