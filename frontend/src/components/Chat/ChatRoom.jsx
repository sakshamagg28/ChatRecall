import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import Header from '../Layout/Header';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import SummarizeButton from './SummarizeButton';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import { chatroomsAPI, aiAPI } from '../../services/api';
import { 
  FaUsers, 
  FaArrowLeft, 
  FaRobot, 
  FaInfoCircle,
  FaGlobe,
  FaLock 
} from 'react-icons/fa';

const ChatRoom = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { socket, joinRoom, leaveRoom } = useSocket();

  const [chatroom, setChatroom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showParticipants, setShowParticipants] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [summary, setSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);

  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (roomId && socket && socket.connected) {
      joinRoom(roomId);
    }
    return () => {
      if (socket && socket.connected && roomId) {
        leaveRoom(roomId);
      }
    };
  }, [roomId, socket, joinRoom, leaveRoom]);

  useEffect(() => {
    if (!socket) return;

    const onNewMessage = (message) => {
      setMessages(prev => [...prev, message]);
      scrollToBottom();
    };

    const onPreviousMessages = (previousMessages) => {
      setMessages(previousMessages);
      scrollToBottom();
    };

    const onUserJoined = (data) => {
      toast.info(`${data.username} joined the room`);
    };

    const onUserLeft = (data) => {
      toast.info(`${data.username} left the room`);
    };

    socket.on('new-message', onNewMessage);
    socket.on('previous-messages', onPreviousMessages);
    socket.on('user-joined', onUserJoined);
    socket.on('user-left', onUserLeft);

    return () => {
      socket.off('new-message', onNewMessage);
      socket.off('previous-messages', onPreviousMessages);
      socket.off('user-joined', onUserJoined);
      socket.off('user-left', onUserLeft);
    };
  }, [socket]);

  const fetchChatroom = async () => {
    try {
      const response = await chatroomsAPI.getById(roomId);
      setChatroom(response.data.chatroom);
      setParticipants(response.data.chatroom.participants || []);
    } catch (error) {
      toast.error('Failed to fetch chatroom details');
      navigate('/dashboard');
    }
  };

  const fetchMessages = async () => {
    try {
      const response = await chatroomsAPI.getMessages(roomId, { limit: 50 });
      setMessages(response.data.messages);
      scrollToBottom();
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (roomId) {
      fetchChatroom();
      fetchMessages();
    }
  }, [roomId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSummarize = async () => {
    setSummaryLoading(true);
    try {
      const response = await aiAPI.summarize(roomId, 100);
      setSummary(response.data);
      setShowSummary(true);
    } catch (error) {
      toast.error('Failed to generate summary');
    } finally {
      setSummaryLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
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

  if (!chatroom) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Chatroom not found</h2>
            <button
              onClick={() => navigate('/dashboard')}
              className="text-blue-600 hover:text-blue-800"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="flex flex-col h-screen">
        {/* Chat Header */}
        <div className="bg-white border-b border-gray-200 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/dashboard')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors mr-3"
              >
                <FaArrowLeft className="w-5 h-5 text-gray-600" />
              </button>

              <div className="flex items-center">
                {chatroom.isPublic ? (
                  <FaGlobe className="text-green-500 w-4 h-4 mr-2" />
                ) : (
                  <FaLock className="text-gray-400 w-4 h-4 mr-2" />
                )}
                <div>
                  <h1 className="text-lg font-semibold text-gray-900">
                    {chatroom.name}
                  </h1>
                  <p className="text-sm text-gray-500">
                    {chatroom.topic} • {participants.length} members
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <SummarizeButton
                onClick={handleSummarize}
                loading={summaryLoading}
              />

              <button
                onClick={() => setShowParticipants(!showParticipants)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Show participants"
              >
                <FaUsers className="w-5 h-5 text-gray-600" />
              </button>

              <button
                onClick={() => navigate('/ai')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Ask AI about this chat"
              >
                <FaRobot className="w-5 h-5 text-purple-600" />
              </button>
            </div>
          </div>
        </div>

        {/* Chat Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Messages Area */}
          <div className="flex-1 flex flex-col">
            <div className="flex-1 overflow-y-auto">
              <MessageList messages={messages} currentUser={user} />
              <div ref={messagesEndRef} />
            </div>

            <MessageInput roomId={roomId} />
          </div>

          {/* Participants Sidebar */}
          {showParticipants && (
            <div className="w-64 bg-white border-l border-gray-200 p-4">
              <h3 className="font-semibold text-gray-900 mb-4">
                Participants ({participants.length})
              </h3>
              <div className="space-y-2">
                {participants.map((participant) => (
                  <div
                    key={participant.user._id}
                    className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-50"
                  >
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-medium">
                        {participant.user.username[0].toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {participant.user.username}
                      </p>
                      <div className="flex items-center">
                        <div className={`w-2 h-2 rounded-full mr-1 ${
                          participant.user.isOnline ? 'bg-green-500' : 'bg-gray-400'
                        }`} />
                        <p className="text-xs text-gray-500">
                          {participant.user.isOnline ? 'Online' : 'Offline'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Summary Modal */}
      {showSummary && summary && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900 flex items-center">
                  <FaRobot className="mr-2 text-blue-600" />
                  Chat Summary
                </h2>
                <button
                  onClick={() => setShowSummary(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✖
                </button>
              </div>

              {/* SAFE SUMMARY BLOCK */}
              <div className="bg-blue-50 rounded-lg p-4 mb-4">
                <div className="flex items-center text-blue-800 mb-2">
                  <FaInfoCircle className="mr-2" />
                  <span className="font-medium">Summary Details</span>
                </div>
                <div className="text-sm text-blue-700">
                  <p>
                    Messages analyzed: {summary?.messageCount ?? 'N/A'}
                  </p>
                  <p>
                    Time range: 
                    {summary?.timeframe?.start ? formatDate(summary.timeframe.start) : 'N/A'}
                    {" - "}
                    {summary?.timeframe?.end ? formatDate(summary.timeframe.end) : 'N/A'}
                  </p>
                </div>
              </div>

              <div className="prose max-w-none">
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">
                    {summary.summary}
                  </p>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowSummary(false)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatRoom;
