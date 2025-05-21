import React, { useState, useEffect } from 'react';
import { forumAPI } from '../../api/forum';
import CommentItem from './CommentItem';
import { useAuth } from '../../context/AuthContext';
const CommentList = ({ postId }) => {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user, isAdmin } = useAuth();

  useEffect(() => {
    const fetchComments = async () => {
      try {
        const commentsData = await forumAPI.comments.getByPostId(postId);
        setComments(commentsData);
      } catch (err) {
        setError(err.message || 'Failed to fetch comments');
      } finally {
        setLoading(false);
      }
    };

    fetchComments();
  }, [postId]);

  const handleDeleteComment = async (commentId) => {
    try {
      await forumAPI.comments.delete(commentId);
      setComments(comments.filter(comment => comment.id !== commentId));
    } catch (error) {
      setError(error.message || 'Failed to delete comment');
    }
  };

  if (loading) return <div className="loading">Loading comments...</div>;
  if (error) return <div className="error">Error: {error}</div>;

  return (
    <div className="comment-list">
      {comments.length === 0 ? (
        <div className="no-comments">No comments yet</div>
      ) : (
        comments.map(comment => (
          <CommentItem
            key={comment.id}
            comment={comment}
            onDelete={handleDeleteComment}
            canDelete={isAdmin || (user && comment.author_id === user.user_id)}
          />
        ))
      )}
    </div>
  );
};

export default CommentList;