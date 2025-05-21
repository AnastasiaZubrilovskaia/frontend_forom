import React, { useState, useEffect } from 'react';
import { forumAPI } from '../../api/forum';
import PostItem from './PostItem';
import { useAuth } from '../../context/AuthContext';

const PostList = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user, isAdmin } = useAuth();

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const postsData = await forumAPI.posts.getAll();
        setPosts(postsData);
      } catch (err) {
        setError(err.message || 'Failed to fetch posts');
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  const handleDeletePost = async (postId) => {
    try {
      await forumAPI.posts.delete(postId);
      setPosts(posts.filter(post => post.id !== postId));
    } catch (error) {
      console.error('Failed to delete post:', error);
    }
  };

  if (loading) return <div className="loading">Loading posts...</div>;
  if (error) return <div className="error">Error: {error}</div>;

  return (
    <div className="post-list">
      {posts.length === 0 ? (
        <div className="no-posts">No posts yet. Be the first to create one!</div>
      ) : (
        posts.map(post => (
          <PostItem 
            key={post.id}
            post={post}
            onDelete={handleDeletePost}
            canDelete={isAdmin || (user && post.author_id === user.user_id)}
          />
        ))
      )}
    </div>
  );
};

export default PostList;