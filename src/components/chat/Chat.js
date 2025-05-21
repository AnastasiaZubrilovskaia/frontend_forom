import React, { useState, useEffect, useRef } from 'react';
import { useWebSocket } from '../../hooks/useWebSocket';
import { forumAPI } from '../../api/forum';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import { useAuth } from '../../context/AuthContext';

const MESSAGE_LIFETIME = 24 * 60 * 60 * 1000; // 24 hours

const Chat = () => {
  const { user } = useAuth();
  const [initialMessages, setInitialMessages] = useState([]);
  const [allMessages, setAllMessages] = useState([]);
  const messagesEndRef = useRef(null);
  
  const wsUrl = `ws://${window.location.hostname}:8080/ws`;
  const { messages: wsMessages, sendMessage } = useWebSocket(wsUrl);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const messages = await forumAPI.messages.getAll();
        setInitialMessages(messages);
      } catch (error) {
        console.error('Failed to fetch messages:', error);
      }
    };
    
    fetchMessages();
  }, []);

  useEffect(() => {
    const now = new Date().getTime();
    const filteredMessages = initialMessages.filter(msg => {
      const messageTime = new Date(msg.created_at).getTime();
      return now - messageTime < MESSAGE_LIFETIME;
    });
    
    setAllMessages(filteredMessages);
  }, [initialMessages]);

  useEffect(() => {
    if (wsMessages.length > 0) {
      setAllMessages(prev => [...prev, ...wsMessages]);
    }
  }, [wsMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [allMessages]);

  const handleSendMessage = (messageText) => {
    if (!user) return;
    
    const newMessage = {
      author_id: user.user_id,
      author_name: user.name,
      content: messageText,
      created_at: new Date().toISOString()
    };
    
    sendMessage(newMessage);
    setAllMessages(prev => [...prev, newMessage]);
  };

  return (
    <div className="chat-container">
      <h3>Forum Chat</h3>
      <div className="messages-container">
        {allMessages.map((message, index) => (
          <ChatMessage 
            key={`${message.id || index}_${message.created_at}`}
            message={message}
            isCurrentUser={user && message.author_id === user.user_id}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>
      {user ? (
        <ChatInput onSend={handleSendMessage} />
      ) : (
        <div className="chat-login-prompt">
          Please log in to send messages
        </div>
      )}
    </div>
  );
};

export default Chat;