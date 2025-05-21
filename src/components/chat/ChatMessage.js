import React from 'react';
import { format } from 'date-fns';

const ChatMessage = ({ message, isCurrentUser }) => {
  return (
    <div className={`message ${isCurrentUser ? 'current-user' : ''}`}>
      <div className="message-header">
        <span className="message-author">{message.author_name}</span>
        <span className="message-time">
          {format(new Date(message.created_at), 'HH:mm')}
        </span>
      </div>
      <div className="message-content">{message.content}</div>
    </div>
  );
};

export default ChatMessage;