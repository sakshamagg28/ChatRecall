import React from 'react';
import { FaRobot, FaSpinner } from 'react-icons/fa';

const SummarizeButton = ({ onClick, loading = false, disabled = false }) => {
  return (
    <button
      onClick={onClick}
      disabled={loading || disabled}
      className={`flex items-center px-3 py-2 rounded-lg transition-colors text-sm font-medium ${
        loading || disabled
          ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
          : 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm hover:shadow-md'
      }`}
      title={loading ? 'Generating summary...' : 'Summarize last 100 messages using AI'}
    >
      {loading ? (
        <>
          <FaSpinner className="w-4 h-4 mr-2 animate-spin" />
          Summarizing...
        </>
      ) : (
        <>
          <FaRobot className="w-4 h-4 mr-2" />
          Summarize
        </>
      )}
    </button>
  );
};

export default SummarizeButton;