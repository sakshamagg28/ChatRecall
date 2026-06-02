import React from 'react';
import moment from 'moment';

const MessageList = ({ messages, currentUser }) => {
  const formatTimestamp = (timestamp) => moment(timestamp).format('h:mm A');
  const formatDate = (timestamp) => moment(timestamp).format('MMMM Do, YYYY');

  const shouldShowDateDivider = (curr, prev) => {
    if (!prev) return true;
    const currDate = moment(curr.createdAt || curr.timestamp).startOf('day');
    const prevDate = moment(prev.createdAt || prev.timestamp).startOf('day');
    return !currDate.isSame(prevDate);
  };

  const shouldShowUserHeader = (curr, prev) => {
    if (!prev) return true;
    const timeDiff = moment(curr.createdAt || curr.timestamp).diff(
      moment(prev.createdAt || prev.timestamp),
      'minutes'
    );
    return curr.userId !== prev.userId || timeDiff > 5;
  };

  if (!messages.length) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-400 text-6xl mb-4">💬</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No messages yet</h3>
          <p className="text-gray-500">Be the first to start the conversation!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-2 space-y-1">
      {messages.map((message, index) => {
        const prevMessage = index > 0 ? messages[index - 1] : null;
        const showDateDivider = shouldShowDateDivider(message, prevMessage);
        const showUserHeader = shouldShowUserHeader(message, prevMessage);
        const isOwnMessage = message.userId === currentUser?.id;

        return (
          <React.Fragment key={message._id || `msg-${index}`}>
            {showDateDivider && (
              <div className="flex justify-center my-4">
                <div className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-sm">
                  {formatDate(message.createdAt || message.timestamp)}
                </div>
              </div>
            )}

            <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-1`}>
              <div className={`max-w-xs lg:max-w-md ${isOwnMessage ? 'order-2' : 'order-1'}`}>
                {showUserHeader && !isOwnMessage && (
                  <div className="flex items-center mb-1 px-3">
                    <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center mr-2">
                      <span className="text-white text-xs font-medium">
                        {message.username?.[0].toUpperCase() || '?'}
                      </span>
                    </div>
                    <span className="text-sm font-medium text-gray-900">{message.username || 'Unknown'}</span>
                    <span className="text-xs text-gray-500 ml-2">
                      {formatTimestamp(message.createdAt || message.timestamp)}
                    </span>
                  </div>
                )}

                <div
                  className={`px-3 py-2 rounded-lg ${
                    isOwnMessage ? 'bg-blue-600 text-white ml-4' : 'bg-white border border-gray-200 text-gray-900'
                  } ${
                    (isOwnMessage && showUserHeader && 'rounded-tr-sm') ||
                    (!isOwnMessage && showUserHeader && 'rounded-tl-sm') ||
                    ''
                  }`}
                >
                  <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                    {message.text || message.content || message.message}
                  </p>

                  {isOwnMessage && (
                    <div className="text-right mt-1">
                      <span className="text-xs opacity-70">
                        {formatTimestamp(message.createdAt || message.timestamp)}
                      </span>
                    </div>
                  )}
                </div>

                {message.edited?.isEdited && (
                  <div
                    className={`text-xs text-gray-400 mt-1 px-3 ${
                      isOwnMessage ? 'text-right' : 'text-left'
                    }`}
                  >
                    (edited)
                  </div>
                )}
              </div>
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default MessageList;
