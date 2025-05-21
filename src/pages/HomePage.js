import React from 'react';
import PostForm from '../components/posts/PostForm';
import Chat from '../components/chat/Chat';
import { useAuth } from '../context/AuthContext';
import PostList from '../components/posts/PostsList';

// Главная страница с постами и чатом
const HomePage = () => {
  const { user } = useAuth();

  return (
    <div className="home-page">
      <div className="forum-content">
        <h1>Форумные посты</h1>
        {user && <PostForm />}
        <PostList />
      </div>
      <div className="chat-sidebar">
        <Chat />
      </div>
    </div>
  );
};

export default HomePage;