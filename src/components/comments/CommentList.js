import React, { useState, useEffect } from 'react';
import { forumAPI } from '../../api/forum';
import { authHelper } from '../../api/auth';
import CommentItem from './CommentItem';

const CommentList = ({ postId, commentVersion }) => {
  const [comments, setComments] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  // Debug logs
  console.log('CommentList - isAdmin:', isAdmin);
  console.log('CommentList - postId:', postId);
  console.log('CommentList - commentVersion:', commentVersion);

  useEffect(() => {
    const checkAdmin = async () => {
      const isAdminStatus = await authHelper.isAdmin();
      console.log('CommentList - Admin status:', isAdminStatus);
      setIsAdmin(isAdminStatus);
    };
    checkAdmin();
  }, []);

  const loadComments = async () => {
    try {
      const commentsData = await forumAPI.getComments(postId);
      console.log('Comments loaded:', commentsData);
      setComments(commentsData);
    } catch (err) {
      console.error('Failed to load comments:', err);
      setError('Failed to load comments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadComments();
  }, [postId, commentVersion]);

  if (loading) {
    return <div>Loading comments...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="comments-list">
      {comments.map(comment => {
        console.log('Rendering comment:', comment);
        console.log('With isAdmin:', isAdmin);
        return (
          <CommentItem
            key={comment.id}
            comment={comment}
            onDelete={() => loadComments()}
            onUpdate={() => loadComments()}
            isAdmin={isAdmin}
          />
        );
      })}
    </div>
  );
};

export default CommentList; 