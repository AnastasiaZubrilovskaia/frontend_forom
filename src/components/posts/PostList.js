import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { forumAPI } from '../../api/forum';
import { authHelper, authAPI } from '../../api/auth';
import PostItem from './PostItem';

const PostList = () => {
  const [posts, setPosts] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const currentUserId = authHelper.getUserId();

  // Debug logs
  console.log('PostList - currentUserId:', currentUserId);

  useEffect(() => {
    const loadData = async () => {
      try {
        console.log('Starting to load data...');
        const postsData = await forumAPI.getPosts();
        console.log('Posts loaded:', postsData);
        
        if (currentUserId) {
          console.log('Checking admin status for user:', currentUserId);
          try {
            const adminStatus = await authAPI.isAdmin(currentUserId);
            console.log('Admin status received:', adminStatus);
            // Проверяем оба варианта: snake_case и camelCase
            const isAdminValue = adminStatus.is_admin || adminStatus.isAdmin;
            console.log('Parsed isAdmin value:', isAdminValue);
            setIsAdmin(isAdminValue);
          } catch (err) {
            console.error('Failed to check admin status:', err);
            setIsAdmin(false);
          }
        } else {
          console.log('No current user ID, setting isAdmin to false');
          setIsAdmin(false);
        }
        
        setPosts(postsData);
      } catch (err) {
        console.error('Error loading data:', err);
        setError('Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [currentUserId]);

  const handleDelete = async (postId) => {
    await loadPosts();
  };

  const handleUpdate = async () => {
    await loadPosts();
  };

  const loadPosts = async () => {
    try {
      const postsData = await forumAPI.getPosts();
      setPosts(postsData);
    } catch (err) {
      setError('Failed to load posts');
    }
  };

  if (loading) {
    return <div>Loading posts...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="posts-list">
      <div className="posts-header">
        <h2>Posts</h2>
        {authHelper.isAuthenticated() && (
          <Link to="/posts/new" className="create-post-btn">
            Create New Post
          </Link>
        )}
      </div>
      {posts.map(post => {
        // Debug logs for each post
        console.log('Post:', post);
        console.log('User:', { id: currentUserId });
        console.log('Post author ID:', post.author_id);
        console.log('User ID:', currentUserId);
        console.log('Is admin:', isAdmin);
        console.log('Can delete:', isAdmin || currentUserId === post.author_id);

        return (
          <PostItem
            key={post.id}
            post={post}
            onDelete={handleDelete}
            onUpdate={handleUpdate}
            canDelete={isAdmin || currentUserId === post.author_id}
            isAdmin={isAdmin}
          />
        );
      })}
    </div>
  );
};

export default PostList; 