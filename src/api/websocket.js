import { authHelper, authAPI } from './auth';

class WebSocketService {
  constructor() {
    this.socket = null;
    this.callbacks = {};
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
    this.isConnecting = false;
  }

  async connect() {
    if (this.socket?.readyState === WebSocket.OPEN) {
      console.log('WebSocket already connected');
      return;
    }

    if (this.isConnecting) {
      console.log('WebSocket connection in progress');
      return;
    }

    this.isConnecting = true;

    if (this.socket) {
      this.disconnect();
    }

    try {
      const token = authHelper.getAccessToken();
      let currentToken = token;

      // Если есть токен, проверяем его валидность
      if (token) {
        try {
          const isValid = await authAPI.validateToken();
          if (!isValid) {
            console.log('Token is invalid, attempting to refresh...');
            const { accessToken } = await authAPI.refreshToken(token);
            authHelper.setTokens(accessToken);
            currentToken = accessToken;
          }
        } catch (error) {
          console.error('Token validation/refresh failed:', error);
          // Если не удалось обновить токен, продолжаем без токена
          currentToken = null;
        }
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.hostname + ':8080';
      const wsUrl = currentToken 
        ? `${protocol}//${host}/ws?token=${encodeURIComponent(currentToken)}`
      : `${protocol}//${host}/ws`;

      console.log('Connecting to WebSocket:', wsUrl);

    this.socket = new WebSocket(wsUrl);

    this.socket.onopen = () => {
        console.log('WebSocket connection opened');
        this.isConnecting = false;
      this.reconnectAttempts = 0;
      this.reconnectDelay = 1000;
      this.callbacks['connect']?.();
    };

      this.socket.onclose = async (event) => {
        console.log('WebSocket connection closed:', event.code, event.reason);
        this.isConnecting = false;
      this.callbacks['disconnect']?.(event);
        
      if (!event.wasClean && this.reconnectAttempts < this.maxReconnectAttempts) {
          console.log(`Attempting to reconnect (${this.reconnectAttempts + 1}/${this.maxReconnectAttempts})...`);
          
          // Пробуем обновить токен перед переподключением
          try {
            const token = authHelper.getAccessToken();
            if (token) {
              const { accessToken } = await authAPI.refreshToken(token);
              authHelper.setTokens(accessToken);
            }
          } catch (error) {
            console.error('Failed to refresh token during reconnect:', error);
          }

        setTimeout(() => {
          this.reconnectAttempts++;
          this.reconnectDelay *= 2;
          this.connect();
        }, this.reconnectDelay);
      }
    };

    this.socket.onerror = (error) => {
        console.error('WebSocket error:', error);
      this.callbacks['error']?.(error);
    };

      this.socket.onmessage = async (event) => {
      try {
        const message = JSON.parse(event.data);
          // Игнорируем сообщения от dev-сервера
          if (message.type && ['hot', 'liveReload', 'reconnect', 'overlay', 'hash', 'warnings'].includes(message.type)) {
            return;
          }

          // Если получили ошибку авторизации, пробуем обновить токен
          if (message.error === 'unauthorized' || message.error === 'token_expired') {
            console.log('Received unauthorized error, attempting to refresh token...');
            try {
              const token = authHelper.getAccessToken();
              if (token) {
                const { accessToken } = await authAPI.refreshToken(token);
                authHelper.setTokens(accessToken);
                // Переподключаемся с новым токеном
                this.disconnect();
                await this.connect();
                return;
              }
            } catch (error) {
              console.error('Failed to refresh token:', error);
              // Если не удалось обновить токен, продолжаем как анонимный пользователь
              this.disconnect();
              await this.connect();
              return;
            }
          }

          console.log('WebSocket message received:', message);
        this.callbacks['message']?.(message);
      } catch (e) {
          console.error('Failed to parse WebSocket message:', e, event.data);
      }
    };
    } catch (error) {
      console.error('Failed to establish WebSocket connection:', error);
      this.isConnecting = false;
    }
  }

  disconnect() {
    if (this.socket) {
      console.log('Disconnecting WebSocket');
      this.socket.close();
      this.socket = null;
      this.isConnecting = false;
    }
  }

  sendMessage(message) {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      console.error('Cannot send message: WebSocket is not connected');
      return;
    }

    try {
      const messageStr = JSON.stringify(message);
      console.log('Sending WebSocket message:', messageStr);
      this.socket.send(messageStr);
    } catch (error) {
      console.error('Failed to send WebSocket message:', error);
    }
  }

  on(event, callback) {
    this.callbacks[event] = callback;
  }

  off(event) {
    delete this.callbacks[event];
  }
}

export const webSocketService = new WebSocketService();