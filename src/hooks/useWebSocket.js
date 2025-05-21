import { useEffect, useRef, useState } from 'react';

// Кастомный хук для работы с WebSocket соединением
export const useWebSocket = (onMessage) => {
  const wsRef = useRef(null);
  const [messages, setMessages] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      console.log('No token available for WebSocket connection');
      return;
    }

    // Используем ws:// для локальной разработки и wss:// для продакшена
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.hostname}:8080/ws`;
    console.log('Connecting to WebSocket:', wsUrl);

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('WebSocket connected');
      setIsConnected(true);
      setError(null);
      // Отправляем токен после подключения
      ws.send(JSON.stringify({
        type: 'auth',
        token: token
      }));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('WebSocket message received:', data);
        if (onMessage) {
          onMessage(data);
        } else {
          setMessages(prev => [...prev, data]);
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', {
        error,
        readyState: ws.readyState,
        url: wsUrl,
        isAuthenticated: !!token,
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setError('WebSocket connection error');
    };

    ws.onclose = (event) => {
      console.log('WebSocket connection closed:', event.code, event.reason);
      setIsConnected(false);
      // Попытка переподключения через 5 секунд
      setTimeout(() => {
        if (wsRef.current) {
          console.log('Attempting to reconnect WebSocket...');
          wsRef.current = new WebSocket(wsUrl);
        }
      }, 5000);
    };

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [onMessage]);

  const sendMessage = (message) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    } else {
      console.error('WebSocket is not connected');
      setError('Cannot send message: WebSocket is not connected');
    }
  };

  return { messages, sendMessage, isConnected, error };
};