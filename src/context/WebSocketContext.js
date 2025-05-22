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
      console.log('Received WebSocket message:', message);
      
      // Проверяем, что это сообщение чата
      if (!message || !message.content || !message.author_id || !message.author_name) {
        console.warn('Received invalid chat message:', message);
        return;
      }

      // Проверяем, нет ли уже такого сообщения
      setMessages(prev => {
        const messageExists = prev.some(m => 
          m.id === message.id || 
          (m.content === message.content && 
           m.author_id === message.author_id && 
           m.created_at === message.created_at)
        );
        
        if (messageExists) {
          console.log('Duplicate message received, skipping:', message);
          return prev;
        }

        console.log('Adding new message to state:', message);
        return [...prev, message];
      });

      setUnreadCount(prev => prev + 1);
    });

    // Подключаемся к WebSocket независимо от авторизации
    webSocketService.connect();

    return () => {
      webSocketService.off('connect');
      webSocketService.off('disconnect');
      webSocketService.off('message');
      webSocketService.disconnect();
    };
  }, []);

  // Переподключаемся при изменении пользователя
  useEffect(() => {
    console.log('User changed in WebSocketContext, reconnecting...');
    webSocketService.disconnect();
    webSocketService.connect();
  }, [user]);

  const sendMessage = (content) => {
    if (!user) {
      console.warn('Cannot send message: user not authenticated');
      return;
    }

    if (!content || !content.content) {
      console.warn('Cannot send message: invalid content');
      return;
    }

    const message = {
      content: content.content,
      author_id: user.user_id,
      author_name: user.name
    };

    console.log('Sending message through WebSocket:', message);
    webSocketService.sendMessage(message);
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