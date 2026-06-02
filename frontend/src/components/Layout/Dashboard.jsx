import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import Header from './Header';
import { chatroomsAPI } from '../../services/api';
import { 
  FaPlus, FaUsers, FaComments, FaClock, FaGlobe, FaLock,
  FaRobot, FaSearch
} from 'react-icons/fa';

import SemanticSearch from '../AI/SemanticSearch';  // Adjust import path as needed

const Dashboard = () => {
  const [chatrooms, setChatrooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [newChatroom, setNewChatroom] = useState({
    name: '', description: '', topic: 'General', isPublic: true
  });
  const [aiStatus, setAIStatus] = useState(null);

  useEffect(() => {
    fetchChatrooms();

    // Fetch AI status on mount
    fetch('/api/ai/status')
      .then((res) => res.json())
      .then((data) => setAIStatus(data))
      .catch(() => setAIStatus(null));
  }, []);

  const fetchChatrooms = async () => {
    try {
      const response = await chatroomsAPI.getAll();
      setChatrooms(response.data.chatrooms);
    } catch (error) {
      toast.error('Failed to fetch chatrooms');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateChatroom = async (e) => {
    e.preventDefault();
    try {
      const response = await chatroomsAPI.create(newChatroom);
      setChatrooms(prev => [response.data.chatroom, ...prev]);
      setNewChatroom({ name: '', description: '', topic: 'General', isPublic: true });
      setShowCreateModal(false);
      toast.success('Chatroom created successfully!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create chatroom');
    }
  };

  const joinChatroom = async (chatroomId) => {
    try {
      await chatroomsAPI.join(chatroomId);
      toast.success('Joined chatroom successfully!');
      fetchChatrooms();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to join chatroom');
    }
  };

  const filteredChatrooms = chatrooms.filter(room =>
    room.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    room.topic.toLowerCase().includes(searchTerm.toLowerCase()) ||
    room.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

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

      {/* Semantic Search Component with AI status */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <SemanticSearch chatrooms={chatrooms} aiStatus={aiStatus} />
      </div>

      {/* Main Chatroom Dashboard */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Chat Rooms</h1>
            <p className="text-gray-600 mt-1">
              Join conversations or create your own topic-based chatroom
            </p>
          </div>
          <div className="mt-4 sm:mt-0 flex space-x-3">
            <Link
              to="/ai"
              className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <FaRobot className="mr-2" />
              Ask AI
            </Link>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <FaPlus className="mr-2" />
              Create Room
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <FaSearch className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search chatrooms by name, topic, or description..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Chatrooms Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredChatrooms.map((room) => (
            <div
              key={room._id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow overflow-hidden"
            >
              <div className="p-6">
                {/* Room Header */}
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-900 truncate">
                    {room.name}
                  </h3>
                  {room.isPublic ? (
                    <FaGlobe className="text-green-500 w-4 h-4" title="Public" />
                  ) : (
                    <FaLock className="text-gray-400 w-4 h-4" title="Private" />
                  )}
                </div>

                {/* Room Description */}
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                  {room.description || 'No description available'}
                </p>

                {/* Room Stats */}
                <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                  <div className="flex items-center">
                    <FaUsers className="mr-1" />
                    <span>{room.activeParticipantsCount || 0} members</span>
                  </div>
                  <div className="flex items-center">
                    <FaComments className="mr-1" />
                    <span>{room.messageCount || 0} messages</span>
                  </div>
                </div>

                {/* Topic and Last Activity */}
                <div className="mb-4">
                  <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">{room.topic}</span>
                  {room.lastActivity && (
                    <div className="flex items-center mt-2 text-xs text-gray-500">
                      <FaClock className="mr-1" />
                      Active {formatDate(room.lastActivity)}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex space-x-2">
                  <Link
                    to={`/chat/${room._id}`}
                    className="flex-1 bg-blue-600 text-white text-center py-2 px-3 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                  >
                    Join Chat
                  </Link>
                  <button
                    onClick={() => joinChatroom(room._id)}
                    className="bg-gray-100 text-gray-700 py-2 px-3 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                  >
                    <FaUsers />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredChatrooms.length === 0 && !loading && (
          <div className="text-center py-12">
            <FaComments className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm ? 'No matching chatrooms' : 'No chatrooms available'}
            </h3>
            <p className="text-gray-500 mb-6">
              {searchTerm 
                ? 'Try adjusting your search terms' 
                : 'Be the first to create a chatroom and start a conversation!'
              }
            </p>
            {!searchTerm && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Create First Chatroom
              </button>
            )}
          </div>
        )}
      </div>

      {/* Create Chatroom Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Create New Chatroom</h2>
            <form onSubmit={handleCreateChatroom}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Room Name *
                </label>
                <input
                  type="text"
                  required
                  value={newChatroom.name}
                  onChange={(e) => setNewChatroom(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter room name"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Topic
                </label>
                <input
                  type="text"
                  value={newChatroom.topic}
                  onChange={(e) => setNewChatroom(prev => ({ ...prev, topic: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Technology, Sports, Gaming"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={newChatroom.description}
                  onChange={(e) => setNewChatroom(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="3"
                  placeholder="Describe what this room is about"
                />
              </div>

              <div className="mb-6">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={newChatroom.isPublic}
                    onChange={(e) => setNewChatroom(prev => ({ ...prev, isPublic: e.target.checked }))}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Make this room public</span>
                </label>
              </div>

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Create Room
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
