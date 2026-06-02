import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { 
  FaComments, 
  FaUser, 
  FaSignOutAlt, 
  FaRobot, 
  FaBars,
  FaCircle,
  FaCog
} from 'react-icons/fa';

const Header = ({ onMenuClick }) => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { user, logout } = useAuth();
  const { connected } = useSocket();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logged out successfully');
      navigate('/login');
    } catch (error) {
      toast.error('Logout failed');
    }
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left side - Logo and Menu */}
          <div className="flex items-center">
            <button
              className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
              onClick={onMenuClick}
            >
              <FaBars className="w-5 h-5 text-gray-600" />
            </button>

            <Link to="/dashboard" className="flex items-center ml-2">
              <div className="bg-blue-600 p-2 rounded-lg">
                <FaComments className="w-6 h-6 text-white" />
              </div>
              <div className="ml-3 hidden sm:block">
                <h1 className="text-xl font-bold text-gray-900">Chat Recall</h1>
                <p className="text-xs text-gray-500">AI-Powered Chat</p>
              </div>
            </Link>
          </div>

          {/* Center - Navigation */}
          <nav className="hidden md:flex space-x-8">
            <Link
              to="/dashboard"
              className="text-gray-600 hover:text-blue-600 px-3 py-2 rounded-lg font-medium transition-colors"
            >
              Chatrooms
            </Link>
            <Link
              to="/ai"
              className="text-gray-600 hover:text-blue-600 px-3 py-2 rounded-lg font-medium transition-colors flex items-center"
            >
              <FaRobot className="mr-2" />
              Ask AI
            </Link>
          </nav>

          {/* Right side - Status and User menu */}
          <div className="flex items-center space-x-4">
            {/* Connection Status */}
            <div className="flex items-center">
              <FaCircle 
                className={`w-2 h-2 mr-2 ${
                  connected ? 'text-green-500' : 'text-red-500'
                }`} 
              />
              <span className="text-sm text-gray-600 hidden sm:block">
                {connected ? 'Connected' : 'Disconnected'}
              </span>
            </div>

            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-2 text-gray-700 hover:text-blue-600 p-2 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <FaUser className="w-4 h-4 text-white" />
                </div>
                <span className="font-medium hidden sm:block">{user?.username}</span>
              </button>

              {/* Dropdown Menu */}
              {showUserMenu && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowUserMenu(false)}
                  />
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900">{user?.username}</p>
                      <p className="text-sm text-gray-500 truncate">{user?.email}</p>
                    </div>

                    <div className="py-1">
                      <button
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <FaCog className="mr-3 w-4 h-4" />
                        Settings
                      </button>

                      <button
                        onClick={handleLogout}
                        className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <FaSignOutAlt className="mr-3 w-4 h-4" />
                        Sign out
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;