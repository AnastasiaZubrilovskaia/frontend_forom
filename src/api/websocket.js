import { authHelper, authAPI } from './auth';


class WebSocketService {
  constructor() {
    this.socket = null;
    this.callbacks = {};
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
    this.reconnectDelay = 1000;
    this.reconnectTimeout = null;
    this.isConnecting = false;
    this.isReconnecting = false;
  }

  async connect() {

    console.log('connect() called, isConnecting:', this.isConnecting, 'isReconnecting:', this.isReconnecting);
    if (this.socket?.readyState === WebSocket.OPEN) {
      console.log('WebSocket already connected');
      return;
    }
  
    if (this.isConnecting || this.isReconnecting) {
      console.log('Already connecting or reconnecting');
      return;
    }
  
    this.isConnecting = true;
  
    if (this.socket) {
      this.disconnect();
    }
  
    try {
      let token = authHelper.getAccessToken();
      console.log('Initial token from authHelper:', token);
  
      if (token) {
        try {
          const isValid = await authAPI.validateToken();
          console.log('Token validation result:', isValid);
  
          if (!isValid) {
            console.log('Token invalid. Refreshing...');
            const { accessToken } = await authAPI.refreshToken(token);
            console.log('Received new accessToken after refresh:', accessToken);
            authHelper.setTokens(accessToken);
            token = accessToken;
          }
        } catch (e) {
          console.error('Token validation failed:', e);
          token = null;
        }
      } else {
        console.log('No token available');
      }
  
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.hostname + ':8080';
      const wsUrl = token
        ? `${protocol}//${host}/ws?token=${encodeURIComponent(token)}`
        : `${protocol}//${host}/ws`;
  
      console.log('Connecting WebSocket to URL:', wsUrl);
  
      this.socket = new WebSocket(wsUrl);
  
      this.socket.onopen = () => {
        console.log('WebSocket connected');
        this.isConnecting = false;
        this.isReconnecting = false;
        this.reconnectAttempts = 0;
        this.reconnectDelay = 1000;
  
        if (this.reconnectTimeout) {
          clearTimeout(this.reconnectTimeout);
          this.reconnectTimeout = null;
        }
  
        this.callbacks['connect']?.();
      };
  
      this.socket.onclose = async (event) => {
        console.log('WebSocket closed:', event.code, event.reason);
        this.isConnecting = false;
        this.isReconnecting = false;
  
        this.callbacks['disconnect']?.(event);
  
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          if (this.reconnectTimeout || this.isReconnecting) {
            console.log('Reconnect already scheduled.');
            return;
          }
  
          this.isReconnecting = false;
          this.reconnectAttempts++;
          const delay = this.reconnectDelay;
          this.reconnectDelay = Math.min(this.reconnectDelay * 2, 16000);
  
          console.log(`Reconnecting in ${delay}ms... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
  
          this.reconnectTimeout = setTimeout(async () => {
            this.reconnectTimeout = null;
  
            try {
              const token = authHelper.getAccessToken();
              console.log('Reconnect: current token before refresh:', token);
              if (token) {
                const { accessToken } = await authAPI.refreshToken(token);
                console.log('Reconnect: refreshed token:', accessToken);
                authHelper.setTokens(accessToken);
              }
            } catch (error) {
              console.error('Reconnect token refresh failed:', error);
            }
  
            await this.connect();
          }, delay);
        } else {
          console.warn('Max reconnect attempts reached.');
        }
      };
  
      this.socket.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.callbacks['error']?.(error);
      };
  
      this.socket.onmessage = async (event) => {
        try {
          const message = JSON.parse(event.data);
  
          if (['hot', 'liveReload', 'reconnect', 'overlay', 'hash', 'warnings'].includes(message.type)) return;
  
          if (message.error === 'unauthorized' || message.error === 'token_expired') {
            console.warn('Unauthorized WebSocket message, retrying...');
            try {
              const token = authHelper.getAccessToken();
              console.log('Unauthorized message: current token before refresh:', token);
              if (token) {
                const { accessToken } = await authAPI.refreshToken(token);
                console.log('Unauthorized message: refreshed token:', accessToken);
                authHelper.setTokens(accessToken);
                this.disconnect();
                await this.connect();
                return;
              }
            } catch (error) {
              console.error('Refresh failed:', error);
              this.disconnect();
              await this.connect();
              return;
            }
          }
  
          this.callbacks['message']?.(message);
        } catch (e) {
          console.error('Invalid message:', event.data, e);
        }
      };
    } catch (error) {
      console.error('WebSocket connection error:', error);
      this.isConnecting = false;
    }
  }
  

  disconnect() {
    if (this.socket) {
      console.log('Disconnecting WebSocket');
      this.socket.close();
      this.socket = null;
    }

    this.isConnecting = false;
    this.isReconnecting = false;

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
  }

  sendMessage(message) {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket is not connected. Message not sent.');
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
