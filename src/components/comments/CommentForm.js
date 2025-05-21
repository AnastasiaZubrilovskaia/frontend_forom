import React, { useState } from 'react';
import { forumAPI } from '../../api/forum';
import { authHelper } from '../../api/auth';

const CommentForm = ({ postId, onCommentAdded }) => {
  const [content, setContent] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const currentUserId = authHelper.getUserId();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await forumAPI.createComment(postId, content);
      setContent('');
      if (onCommentAdded) {
        onCommentAdded();
      }
    } catch (err) {
      setError(err.message || 'Failed to post comment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="comment-form" onSubmit={handleSubmit}>
      {error && <div className="error-message">{error}</div>}
      <div className="form-group">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Напишите комментарий..."
          required
        />
      </div>
      <button type="submit" disabled={loading}>
        {loading ? 'Отправка...' : 'Оставить комментарий'}
      </button>
    </form>
  );
};

export default CommentForm;