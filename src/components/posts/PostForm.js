import React, { useState } from 'react';
import { forumAPI } from '../../api/forum';
import { useAuth } from '../../context/AuthContext';

const PostForm = ({ onSuccess }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await forumAPI.createPost(title, content);
      setTitle('');
      setContent('');
      if (onSuccess) onSuccess();
    } catch (err) {
      setError(err.message || 'Failed to create post');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="post-form" onSubmit={handleSubmit}>
      <h3>Создать новый пост</h3>
      {error && <div className="error-message">{error}</div>}
      <div className="form-group">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Заголовок поста"
          required
        />
      </div>
      <div className="form-group">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Напишите текст поста..."
          required
        />
      </div>
      <button type="submit" disabled={loading}>
        {loading ? 'Сохраняю...' : 'Создать пост'}
      </button>
    </form>
  );
};

export default PostForm;