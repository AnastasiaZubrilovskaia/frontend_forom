import React, { useState, useEffect } from 'react';
import { forumAPI } from '../../api/forum';
import PostItem from './PostItem';
import { useAuth } from '../../context/AuthContext';

const PostList = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user, isAdmin } = useAuth();

  const fetchPosts = async () => {
    try {
      const postsData = await forumAPI.getPosts();
      console.log('Fetched posts:', postsData); // Debug log
      setPosts(postsData);
    } catch (err) {
      setError(err.message || 'Failed to fetch posts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleDeletePost = async (postId) => {
    try {
      await forumAPI.deletePost(postId);
      setPosts(posts.filter(post => post.id !== postId));
    } catch (error) {
      console.error('Failed to delete post:', error);
    }
  };

  const handleUpdatePost = async () => {
    await fetchPosts();
  };

  if (loading) return <div className="loading">Loading posts...</div>;
  if (error) return <div className="error">Error: {error}</div>;

  return (
    <div className="post-list">
      {posts.length === 0 ? (
        <div className="no-posts">No posts yet. Be the first to create one!</div>
      ) : (
        posts.map(post => {
          // Преобразуем ID в числа для корректного сравнения
          const postAuthorId = Number(post.author_id);
          const userId = Number(user?.user_id);
          const canDelete = isAdmin || (user && postAuthorId === userId);
          
          console.log('Post:', post);
          console.log('User:', user);
          console.log('Post author ID:', postAuthorId);
          console.log('User ID:', userId);
          console.log('Can delete:', canDelete);
          
          return (
            <PostItem 
              key={post.id}
              post={post}
              onDelete={handleDeletePost}
              onUpdate={handleUpdatePost}
              canDelete={canDelete}
            />
          );
        })
      )}
    </div>
  );
};

export default PostList;