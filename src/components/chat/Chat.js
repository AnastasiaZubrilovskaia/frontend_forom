import React, { useState, useEffect, useRef } from 'react';
import { forumAPI } from '../../api/forum';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import { useAuth } from '../../context/AuthContext';
import { useWebSocket } from '../../context/WebSocketContext';


const Chat = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const messagesEndRef = useRef(null);
  const { messages: wsMessages, sendMessage, isConnected } = useWebSocket();

  // // Переподключаем WebSocket при изменении пользователя
  // useEffect(() => {
  //   console.log('User changed, reconnecting WebSocket');
  //   webSocketService.disconnect();
  //   webSocketService.connect();
  // }, [user]);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const fetchedMessages = await forumAPI.getMessages();
        console.log('Fetched messages:', fetchedMessages);
        // Сортируем сообщения по времени создания (старые сверху)
        const sortedMessages = [...fetchedMessages].sort((a, b) => 
          new Date(a.created_at) - new Date(b.created_at)
        );
        setMessages(sortedMessages);
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
        // Добавляем новые сообщения в конец списка
        return [...prev, ...newMessages];
      });
    }
  }, [wsMessages]);

  useEffect(() => {
    // Прокручиваем к последнему сообщению при добавлении новых
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
      <h3>Чат форума</h3>
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
          Войдите, чтобы отправлять сообщения
        </div>
      )}
    </div>
  );
};

export default Chat;