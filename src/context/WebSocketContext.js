import React, { createContext, useContext, useEffect, useState } from 'react';
import { webSocketService } from '../api/websocket';
import { useAuth } from './AuthContext';

const WebSocketContext = createContext();

export const WebSocketProvider = ({ children }) => {
  const [messages, setMessages] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    webSocketService.on('connect', () => {
      setIsConnected(true);
      console.log('WebSocket connected');
    });

    webSocketService.on('disconnect', () => {
      setIsConnected(false);
      console.log('WebSocket disconnected');
    });

    webSocketService.on('message', (message) => {
      setMessages(prev => [...prev, message]);
      setUnreadCount(prev => prev + 1);
    });

    webSocketService.connect();

    return () => {
      webSocketService.off('connect');
      webSocketService.off('disconnect');
      webSocketService.off('message');
      webSocketService.disconnect();
    };
  }, []);

  useEffect(() => {
    if (user) {
      // Переподключаемся при изменении пользователя
      webSocketService.connect();
    }
  }, [user]);

  const sendMessage = (content) => {
    if (user) {
      webSocketService.sendMessage(content);
    }
  };

  const clearUnread = () => {
    setUnreadCount(0);
  };

  return (
    <WebSocketContext.Provider value={{
      messages,
      unreadCount,
      isConnected,
      sendMessage,
      clearUnread,
      canSendMessages: !!user
    }}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = () => useContext(WebSocketContext);