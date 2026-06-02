import React, { useState } from 'react';
import { aiAPI } from '../../services/api';
import { toast } from 'react-toastify';
import { FaSearch, FaSpinner, FaClock, FaUser, FaComments, FaFilter } from 'react-icons/fa';
import moment from 'moment';

const SemanticSearch = ({ chatrooms, aiStatus }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState('');
  const [searchHistory, setSearchHistory] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [limit, setLimit] = useState(10);

  const handleSearch = async (e) => {
    e.preventDefault();

    if (!query.trim()) {
      toast.warning('Please enter a search query');
      return;
    }

    if (!aiStatus?.features?.semanticSearch) {
      toast.error('Semantic search is not available. Please check AI service configuration.');
      return;
    }

    setLoading(true);
    try {
      const response = await aiAPI.semanticSearch({
        query: query.trim(),
        roomId: selectedRoom || undefined,
        limit: limit,
      });

      if (response.data.success) {
        // Free Gemini returns plain text string of relevant messages
        setResults(response.data.results);
        setSearchHistory((prev) => [
          { query: query.trim(), timestamp: new Date(), resultCount: response.data.results?.length || 0 },
          ...prev.slice(0, 4), // keep last 5
        ]);

        if (!response.data.results || response.data.results.length === 0) {
          toast.info('No relevant messages found for your query');
        }
      } else {
        toast.error(response.data.message || 'Search failed');
      }
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Search failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleHistoryClick = (historicalQuery) => {
    setQuery(historicalQuery);
  };

  const formatTimestamp = (timestamp) => moment(timestamp).format('MMM D, YYYY h:mm A');

  return (
    <div className="p-6">
      {/* Search Form */}
      <form onSubmit={handleSearch} className="mb-6">
        <div className="flex flex-col space-y-4">
          <div className="relative">
            <FaSearch className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for discussions, topics, or specific messages..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={loading}
            />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
            <div className="flex items-center space-x-4">
              <button
                type="button"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center text-sm text-gray-600 hover:text-gray-900"
              >
                <FaFilter className="mr-1" />
                Filters
              </button>

              {showFilters && (
                <div className="flex items-center space-x-3">
                  <select
                    value={selectedRoom}
                    onChange={(e) => setSelectedRoom(e.target.value)}
                    className="text-sm border border-gray-300 rounded px-2 py-1"
                    disabled={loading}
                  >
                    <option value="">All rooms</option>
                    {chatrooms.map((room) => (
                      <option key={room._id} value={room._id}>
                        {room.name}
                      </option>
                    ))}
                  </select>

                  <select
                    value={limit}
                    onChange={(e) => setLimit(parseInt(e.target.value))}
                    className="text-sm border border-gray-300 rounded px-2 py-1"
                    disabled={loading}
                  >
                    <option value={5}>5 results</option>
                    <option value={10}>10 results</option>
                    <option value={20}>20 results</option>
                    <option value={50}>50 results</option>
                  </select>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || !query.trim()}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                loading || !query.trim()
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {loading ? (
                <>
                  <FaSpinner className="inline mr-2 animate-spin" />
                  Searching...
                </>
              ) : (
                'Search'
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Search History */}
      {searchHistory.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Recent Searches</h3>
          <div className="flex flex-wrap gap-2">
            {searchHistory.map((item, index) => (
              <button
                key={index}
                onClick={() => handleHistoryClick(item.query)}
                className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded-full transition-colors"
                title={`${item.resultCount} results • ${moment(item.timestamp).fromNow()}`}
              >
                {item.query}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Results Display */}
      {results && (
        <div className="mt-4 p-4 border border-gray-300 rounded bg-gray-50 whitespace-pre-wrap">
          <h3 className="text-lg font-semibold mb-2">Search Results:</h3>
          {typeof results === 'string' ? (
            <pre>{results}</pre>  // Show raw string result from Gemini
          ) : (
            results.length > 0 ? (
              results.map((result, index) => (
                <div key={index} className="mb-4 p-3 bg-white border border-gray-300 rounded">
                  <div className="flex justify-between mb-1">
                    <span className="font-semibold">{result.username || 'Unknown User'}</span>
                    <span className="text-xs text-gray-500">{formatTimestamp(result.timestamp)}</span>
                  </div>
                  <p>{result.content}</p>
                </div>
              ))
            ) : (
              <p>No results found.</p>
            )
          )}
        </div>
      )}
    </div>
  );
};

export default SemanticSearch;
