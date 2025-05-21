import React from 'react';
import { format } from 'date-fns';

const ChatMessage = ({ message, isCurrentUser }) => {
  const formatTime = (timestamp) => {
    try {
      if (!timestamp) return '';
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) return '';
      return format(date, 'HH:mm');
    } catch (error) {
      console.error('Error formatting date:', error);
      return '';
    }
  };

  return (
    <div className={`message ${isCurrentUser ? 'current-user' : ''}`}>
      <div className="message-header">
        <span className="message-author">{message.author_name || 'Anonymous'}</span>
        <span className="message-time">
          {formatTime(message.created_at)}
        </span>
      </div>
      <div className="message-content">{message.content}</div>
    </div>
  );
};

export default ChatMessage;