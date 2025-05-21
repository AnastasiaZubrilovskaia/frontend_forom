import React, { useState } from 'react';
import { forumAPI } from '../../api/forum';

const CommentForm = ({ postId }) => {
  const [content, setContent] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await forumAPI.comments.create({
        post_id: postId,
        content
      });
      setContent('');
      // Trigger a refresh of comments (handled by parent)
      window.location.reload();
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
          placeholder="Write your comment here..."
          required
        />
      </div>
      <button type="submit" disabled={loading}>
        {loading ? 'Posting...' : 'Post Comment'}
      </button>
    </form>
  );
};

export default CommentForm;