import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { forumAPI } from '../../api/forum';
import CommentList from '../comments/CommentList';
import CommentForm from '../comments/CommentForm';
import { useAuth } from '../../context/AuthContext';

const PostDetail = () => {
  const { id } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user, isAdmin } = useAuth();
  const [commentVersion, setCommentVersion] = useState(0); // Добавляем состояние для обновления комментариев

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const postData = await forumAPI.getPost(id);
        setPost(postData);
      } catch (err) {
        setError(err.message || 'Failed to fetch post');
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [id]);

  const handleDelete = async () => {
    try {
      await forumAPI.deletePost(id);
      window.location.href = '/';
    } catch (error) {
      setError(error.message || 'Failed to delete post');
    }
  };

  // Функция для обновления списка комментариев
  const handleCommentAdded = () => {
    setCommentVersion(prev => prev + 1);
  };

  if (loading) return <div className="loading">Loading post...</div>;
  if (error) return <div className="error">Error: {error}</div>;
  if (!post) return <div className="not-found">Post not found</div>;

  return (
    <div className="post-detail">
      <div className="post-header">
        <h1>{post.title}</h1>
        <div className="post-meta">
          <span className="post-author">{post.author_name}</span>
          <span className="post-date">
            Posted on {new Date(post.created_at).toLocaleDateString()}
          </span>
          {post.updated_at && post.updated_at !== post.created_at && (
            <span className="post-updated">
              (updated {new Date(post.updated_at).toLocaleDateString()})
            </span>
          )}
        </div>
      </div>
      <div className="post-content">{post.content}</div>
      
      {(isAdmin || (user && user.user_id === post.author_id)) && (
        <div className="post-actions">
          <button className="delete-btn" onClick={handleDelete}>
            Delete Post
          </button>
        </div>
      )}
      
      <div className="comments-section">
        <h2>Comments</h2>
        {user ? (
          <CommentForm postId={post.id} onCommentAdded={handleCommentAdded} />
        ) : (
          <div className="login-prompt">
            Please log in to leave a comment
          </div>
        )}
        <CommentList postId={post.id} commentVersion={commentVersion} />
      </div>
    </div>
  );
};

export default PostDetail;