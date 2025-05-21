import { authHelper } from './auth';

class WebSocketService {
  constructor() {
    this.socket = null;
    this.callbacks = {};
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
  }

  connect() {
    if (this.socket) {
      this.disconnect();
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const token = authHelper.getaccess_token();
    const wsUrl = token 
      ? `${protocol}//${host}/ws?token=${encodeURIComponent(token)}`
      : `${protocol}//${host}/ws`;

    this.socket = new WebSocket(wsUrl);

    this.socket.onopen = () => {
      this.reconnectAttempts = 0;
      this.reconnectDelay = 1000;
      this.callbacks['connect']?.();
    };

    this.socket.onclose = (event) => {
      this.callbacks['disconnect']?.(event);
      if (!event.wasClean && this.reconnectAttempts < this.maxReconnectAttempts) {
        setTimeout(() => {
          this.reconnectAttempts++;
          this.reconnectDelay *= 2;
          this.connect();
        }, this.reconnectDelay);
      }
    };

    this.socket.onerror = (error) => {
      this.callbacks['error']?.(error);
    };

    this.socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        this.callbacks['message']?.(message);
      } catch (e) {
        console.error('Failed to parse message:', e);
      }
    };
  }

  disconnect() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }

  sendMessage(content) {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({ content }));
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