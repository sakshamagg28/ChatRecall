// API Configuration
export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5050/api';
export const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5050';

// App Configuration
export const APP_NAME = process.env.REACT_APP_APP_NAME || 'Chat Recall';

// Message limits
export const MESSAGE_MAX_LENGTH = 1000;
export const MESSAGE_WARNING_LENGTH = 800;

// Pagination
export const MESSAGES_PER_PAGE = 50;
export const CHATROOMS_PER_PAGE = 10;

// AI Configuration
export const AI_SEARCH_LIMIT_DEFAULT = 10;
export const AI_CONTEXT_LIMIT_DEFAULT = 5;
export const AI_RELEVANCE_THRESHOLD_DEFAULT = 0;

// Socket Events
export const SOCKET_EVENTS = {
  // Connection
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  CONNECT_ERROR: 'connect_error',

  // Room Management
  JOIN_ROOM: 'join-room',
  LEAVE_ROOM: 'leave-room',

  // Messages
  SEND_MESSAGE: 'send-message',
  NEW_MESSAGE: 'new-message',
  PREVIOUS_MESSAGES: 'previous-messages',

  // Users
  USER_JOINED: 'user-joined',
  USER_LEFT: 'user-left',
  ONLINE_USERS: 'online-users',

  // Errors
  ERROR: 'error'
};

// UI Constants
export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536
};

// Theme Colors
export const COLORS = {
  primary: {
    50: '#eff6ff',
    500: '#3b82f6',
    600: '#2563eb',
    700: '#1d4ed8'
  },
  purple: {
    50: '#faf5ff',
    500: '#8b5cf6',
    600: '#7c3aed',
    700: '#6d28d9'
  },
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827'
  }
};

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  UNAUTHORIZED: 'Session expired. Please login again.',
  SERVER_ERROR: 'Server error. Please try again later.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  AI_SERVICE_UNAVAILABLE: 'AI service is currently unavailable.',
  CHATROOM_NOT_FOUND: 'Chatroom not found.',
  ACCESS_DENIED: 'Access denied to this resource.'
};

// Success Messages
export const SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: 'Welcome back!',
  REGISTER_SUCCESS: 'Account created successfully!',
  LOGOUT_SUCCESS: 'Logged out successfully',
  CHATROOM_CREATED: 'Chatroom created successfully!',
  CHATROOM_JOINED: 'Joined chatroom successfully!',
  MESSAGE_SENT: 'Message sent',
  PROFILE_UPDATED: 'Profile updated successfully!'
};

// Local Storage Keys
export const STORAGE_KEYS = {
  TOKEN: 'token',
  USER_PREFERENCES: 'userPreferences',
  THEME: 'theme',
  SEARCH_HISTORY: 'searchHistory'
};

// Date Formats
export const DATE_FORMATS = {
  MESSAGE_TIME: 'h:mm A',
  MESSAGE_DATE: 'MMMM Do, YYYY',
  FULL_DATETIME: 'MMMM Do, YYYY h:mm A',
  API_DATE: 'YYYY-MM-DD',
  API_DATETIME: 'YYYY-MM-DD HH:mm:ss'
};

// File Upload (for future use)
export const UPLOAD_LIMITS = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  ALLOWED_FILE_TYPES: ['application/pdf', 'text/plain', 'application/msword']
};

const constants = {
  API_BASE_URL,
  SOCKET_URL,
  APP_NAME,
  MESSAGE_MAX_LENGTH,
  MESSAGE_WARNING_LENGTH,
  MESSAGES_PER_PAGE,
  CHATROOMS_PER_PAGE,
  AI_SEARCH_LIMIT_DEFAULT,
  AI_CONTEXT_LIMIT_DEFAULT,
  AI_RELEVANCE_THRESHOLD_DEFAULT,
  SOCKET_EVENTS,
  BREAKPOINTS,
  COLORS,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  STORAGE_KEYS,
  DATE_FORMATS,
  UPLOAD_LIMITS
};

export default constants;
