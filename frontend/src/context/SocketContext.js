import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated && user && user.id && user.username) {
      const newSocket = io(process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000', {
        auth: {
          userId: user.id,
          username: user.username
        },
        autoConnect: true
      });

      newSocket.on('connect', () => {
        console.log('Socket connected:', newSocket.id);
        setConnected(true);
      });

      newSocket.on('disconnect', () => {
        console.log('Socket disconnected');
        setConnected(false);
      });

      newSocket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        setConnected(false);
      });

      // User join/leave indication logs
      newSocket.on('user-joined', (data) => console.log('User joined:', data));
      newSocket.on('user-left', (data) => console.log('User left:', data));
      newSocket.on('online-users', (users) => setOnlineUsers(users));
      newSocket.on('error', (error) => console.error('Socket error:', error));

      setSocket(newSocket);

      return () => {
        console.log('Cleaning up socket connection');
        newSocket.close();
      };
    } else {
      if (socket) {
        socket.close();
        setSocket(null);
        setConnected(false);
      }
    }
  }, [isAuthenticated, user]);

  const joinRoom = (roomId) => {
    if (socket && connected && user && user.id && user.username) {
      socket.emit('join-room', {
        roomId,
        userId: user.id,
        username: user.username
      });
    }
  };

  const leaveRoom = (roomId) => {
    if (socket && connected && user && user.username) {
      socket.emit('leave-room', {
        roomId,
        username: user.username
      });
    }
  };

  const sendMessage = (roomId, message) => {
    if (socket && connected && user && user.id && user.username) {
      console.log('Emitting send-message with data:', {
        roomId,
        userId: user.id,
        username: user.username,
        message
      });
      socket.emit('send-message', {
        roomId,
        userId: user.id,
        username: user.username,
        message
      });
    } else {
      console.error('Cannot send message: user info is missing.', {
        user,
        connected
      });
    }
  };

  const value = {
    socket,
    connected,
    onlineUsers,
    joinRoom,
    leaveRoom,
    sendMessage
  };

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
};
