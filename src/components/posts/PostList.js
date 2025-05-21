import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { forumAPI } from '../../api/forum';
import { authHelper } from '../../api/auth';
import PostItem from './PostItem';

const PostList = () => {
  const [posts, setPosts] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const currentUserId = authHelper.getUserId();
  const isAdmin = authHelper.isAdmin();

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    try {
      const postsData = await forumAPI.getPosts();
      setPosts(postsData);
    } catch (err) {
      setError('Failed to load posts');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (postId) => {
    await loadPosts();
  };

  const handleUpdate = async () => {
    await loadPosts();
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
      {posts.map(post => (
        <PostItem
          key={post.id}
          post={post}
          onDelete={handleDelete}
          onUpdate={handleUpdate}
          canDelete={isAdmin || currentUserId === post.author_id}
          isAdmin={isAdmin}
        />
      ))}
    </div>
  );
};

export default PostList; 