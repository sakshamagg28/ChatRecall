import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { SOCKET_URL } from '../utils/constants';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

const emitWithAck = (socket, event, payload) =>
  new Promise((resolve, reject) => {
    if (!socket?.connected) {
      reject(new Error('Socket is not connected'));
      return;
    }

    socket.timeout(10000).emit(event, payload, (error, response) => {
      if (error) {
        reject(new Error('Server did not acknowledge the request'));
        return;
      }

      if (!response?.success) {
        reject(new Error(response?.message || 'Socket request failed'));
        return;
      }

      resolve(response);
    });
  });

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const { user, token, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated || !token || !user?.id || !user?.username) {
      setConnected(false);
      setOnlineUsers([]);
      setSocket((currentSocket) => {
        currentSocket?.close();
        return null;
      });
      return undefined;
    }

    const nextSocket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 500,
    });

    const handleConnect = () => setConnected(true);
    const handleDisconnect = () => setConnected(false);
    const handleConnectError = (error) => {
      console.error('Socket connection error:', error.message);
      setConnected(false);
    };

    nextSocket.on('connect', handleConnect);
    nextSocket.on('disconnect', handleDisconnect);
    nextSocket.on('connect_error', handleConnectError);
    nextSocket.on('online-users', setOnlineUsers);
    nextSocket.on('error', (error) => console.error('Socket error:', error));

    setSocket(nextSocket);

    return () => {
      nextSocket.off('connect', handleConnect);
      nextSocket.off('disconnect', handleDisconnect);
      nextSocket.off('connect_error', handleConnectError);
      nextSocket.off('online-users', setOnlineUsers);
      nextSocket.close();
      setConnected(false);
    };
  }, [isAuthenticated, token, user?.id, user?.username]);

  const joinRoom = useCallback(
    (roomId) => emitWithAck(socket, 'join-room', { roomId }),
    [socket]
  );

  const leaveRoom = useCallback(
    (roomId) => {
      if (!socket?.connected) return Promise.resolve({ success: true });
      return emitWithAck(socket, 'leave-room', { roomId });
    },
    [socket]
  );

  const sendMessage = useCallback(
    (roomId, message) => emitWithAck(socket, 'send-message', { roomId, message }),
    [socket]
  );

  const value = useMemo(
    () => ({
      socket,
      connected,
      onlineUsers,
      joinRoom,
      leaveRoom,
      sendMessage,
    }),
    [socket, connected, onlineUsers, joinRoom, leaveRoom, sendMessage]
  );

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
};
