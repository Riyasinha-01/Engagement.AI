import React, { createContext, useEffect, useState, useContext } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

import { SOCKET_SERVER_URL } from '../config';

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    let socketInstance = null;

    if (isAuthenticated) {
      socketInstance = io(SOCKET_SERVER_URL);
      setSocket(socketInstance);

      socketInstance.on('connect', () => {
        console.log('Socket.io connected on frontend:', socketInstance.id);
      });

      socketInstance.on('disconnect', () => {
        console.log('Socket.io disconnected on frontend');
      });
    } else {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
    }

    return () => {
      if (socketInstance) {
        socketInstance.disconnect();
      }
    };
  }, [isAuthenticated]);

  const joinCampaign = (campaignId) => {
    if (socket) {
      socket.emit('join_campaign', campaignId);
    }
  };

  const value = {
    socket,
    joinCampaign
  };

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
