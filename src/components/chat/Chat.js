import React, { useState, useEffect, useRef } from 'react';
import { forumAPI } from '../../api/forum';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import { useAuth } from '../../context/AuthContext';
import { useWebSocket } from '../../context/WebSocketContext';

const MESSAGE_LIFETIME = 24 * 60 * 60 * 1000; // 24 hours

const Chat = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const messagesEndRef = useRef(null);
  const { messages: wsMessages, sendMessage, isConnected } = useWebSocket();

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const fetchedMessages = await forumAPI.getMessages();
        console.log('Fetched messages:', fetchedMessages);
        setMessages(fetchedMessages);
      } catch (error) {
        console.error('Failed to fetch messages:', error);
      }
    };
    
    fetchMessages();
  }, []);

  useEffect(() => {
    if (wsMessages.length > 0) {
      console.log('New WebSocket messages:', wsMessages);
      setMessages(prev => {
        const newMessages = wsMessages.filter(newMsg => 
          !prev.some(existingMsg => 
            existingMsg.id === newMsg.id || 
            (existingMsg.content === newMsg.content && 
             existingMsg.author_id === newMsg.author_id && 
             existingMsg.created_at === newMsg.created_at)
          )
        );
        
        if (newMessages.length === 0) {
          console.log('No new messages to add');
          return prev;
        }

        console.log('Adding new messages:', newMessages);
        return [...prev, ...newMessages];
      });
    }
  }, [wsMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (messageText) => {
    if (!user) {
      console.warn('Cannot send message: user not authenticated');
      return;
    }
    
    console.log('Sending message:', messageText);
    sendMessage({
      content: messageText
    });
  };

  return (
    <div className="chat-container">
      <h3>Forum Chat</h3>
      <div className="messages-container">
        {messages.map((message, index) => (
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