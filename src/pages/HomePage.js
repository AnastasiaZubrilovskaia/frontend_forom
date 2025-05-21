import React, { useState } from 'react';
import PostForm from '../components/posts/PostForm';
import Chat from '../components/chat/Chat';
import { useAuth } from '../context/AuthContext';
import PostList from '../components/posts/PostsList';

// Главная страница с постами и чатом
const HomePage = () => {
  const { user } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);

  const handlePostCreated = () => {
    // Увеличиваем ключ, чтобы заставить PostList перезагрузить данные
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="home-page">
      <div className="forum-content">
        <h1>Форумные посты</h1>
        {user && <PostForm onSuccess={handlePostCreated} />}
        <PostList key={refreshKey} />
      </div>
      <div className="chat-sidebar">
        <Chat />
      </div>
    </div>
  );
};

export default HomePage;