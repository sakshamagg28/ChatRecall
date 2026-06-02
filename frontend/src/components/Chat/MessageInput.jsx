import React, { useState, useRef, useEffect } from 'react';
import { useSocket } from '../../context/SocketContext';
import { FaPaperPlane, FaSmile } from 'react-icons/fa';
import { toast } from 'react-toastify';

const MessageInput = ({ roomId }) => {
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [sending, setSending] = useState(false);
  const { connected, sendMessage } = useSocket();
  const textareaRef = useRef(null);

  useEffect(() => {
    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [message]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const content = message.trim();
    if (!content || sending) return;

    if (!connected) {
      toast.error('Cannot send message while disconnected');
      return;
    }

    try {
      setSending(true);
      await sendMessage(roomId, content);
      setMessage('');
      setIsTyping(false);
    } catch (error) {
      toast.error(error.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleInputChange = (e) => {
    setMessage(e.target.value);
    if (!isTyping && e.target.value.length > 0) {
      setIsTyping(true);
    } else if (isTyping && e.target.value.length === 0) {
      setIsTyping(false);
    }
  };

  return (
    <div className="bg-white border-t border-gray-200 p-4">
      <form onSubmit={handleSubmit} className="flex items-end space-x-3">
        <div className="flex-1">
          <div className="relative">
            <textarea
              ref={textareaRef}
              value={message}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Type a message... (Press Enter to send, Shift+Enter for new line)"
              className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              rows={1}
              style={{ maxHeight: '120px', minHeight: '48px' }}
            />
            <button
              type="button"
              className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 transition-colors"
              title="Add emoji (coming soon)"
              disabled
            >
              <FaSmile className="w-5 h-5" />
            </button>
          </div>
          <div className="flex justify-between items-center mt-1 px-1">
            <div className="text-xs text-gray-500">
              {isTyping && message.length > 0 && (
                <span className="text-blue-600">Typing...</span>
              )}
            </div>
            <div className="text-xs text-gray-400">
              {message.length > 800 && (
                <span className={message.length > 1000 ? 'text-red-500' : 'text-orange-500'}>
                  {message.length}/1000
                </span>
              )}
            </div>
          </div>
        </div>
        <button
          type="submit"
          disabled={!message.trim() || message.length > 1000 || sending || !connected}
          className={`p-3 rounded-lg transition-all duration-200 ${
            message.trim() && message.length <= 1000 && !sending && connected
              ? 'bg-blue-600 text-white hover:bg-blue-700 transform hover:scale-105 shadow-md'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
          title={connected ? 'Send message' : 'Socket disconnected'}
        >
          <FaPaperPlane className="w-5 h-5" />
        </button>
      </form>
      {message.length > 800 && (
        <div className="mt-2 px-3 py-2 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            {message.length > 1000
              ? '⚠️ Message too long. Please keep it under 1000 characters.'
              : '💡 Consider breaking long messages into smaller parts for better readability.'
            }
          </p>
        </div>
      )}
    </div>
  );
};

export default MessageInput;
