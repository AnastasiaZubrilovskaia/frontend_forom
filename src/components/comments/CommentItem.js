import React, { useState, useCallback, useRef, useEffect } from 'react';
import { format } from 'date-fns';
import { forumAPI } from '../../api/forum';
import { authHelper } from '../../api/auth';
import '../../styles/PostItem.css';

const CommentItem = ({ comment, onDelete, onUpdate, isAdmin = false }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(comment.content);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const abortControllerRef = useRef(null);
  const currentUserId = authHelper.getUserId();
  const canEdit = currentUserId === comment.author_id;
  const isAdminBoolean = Boolean(isAdmin);
  const canDelete = isAdminBoolean || currentUserId === comment.author_id;

  // Debug logs
  console.log('CommentItem - comment:', comment);
  console.log('CommentItem - currentUserId:', currentUserId);
  console.log('CommentItem - comment.author_id:', comment.author_id);
  console.log('CommentItem - isAdmin prop:', isAdmin);
  console.log('CommentItem - isAdminBoolean:', isAdminBoolean);
  console.log('CommentItem - canDelete:', canDelete);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const handleEdit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await forumAPI.updateComment(comment.id, editedContent);
      if (onUpdate) onUpdate();
      setIsEditing(false);
    } catch (err) {
      setError(err.message || 'Не удалось обновить комментарий');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = useCallback(async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    
    if (window.confirm('Вы уверены, что хотите удалить этот комментарий?')) {
      try {
        await forumAPI.deleteComment(comment.id, abortControllerRef.current.signal);
        if (onDelete) onDelete(comment.id);
      } catch (err) {
        if (err.name !== 'AbortError') {
          setError(err.message || 'Не удалось удалить комментарий');
        }
      } finally {
        abortControllerRef.current = null;
      }
    }
  }, [comment.id, onDelete]);

  const handleEditCancel = () => {
    setIsEditing(false);
    setEditedContent(comment.content);
    setError('');
  };

  if (isEditing) {
    return (
      <div className="comment-item editing">
        <form onSubmit={handleEdit}>
          <textarea
            value={editedContent}
            onChange={(e) => setEditedContent(e.target.value)}
            placeholder="Напишите комментарий..."
            required
          />
          <div className="comment-actions">
            <button type="submit" disabled={loading} className="edit-btn">
              {loading ? 'Сохраняю...' : 'Сохранить'}
            </button>
            <button type="button" onClick={handleEditCancel}>
              Отмена
            </button>
          </div>
          {error && <div className="error-message">{error}</div>}
        </form>
      </div>
    );
  }

  return (
    <div className="comment-item">
      <div className="comment-header">
        <span className="comment-author">{comment.author_name}</span>
        <span className="comment-date">
          {new Date(comment.created_at).toLocaleString()}
        </span>
      </div>
      <div className="comment-content">{comment.content}</div>
      {error && <div className="error-message">{error}</div>}
      {(canEdit || canDelete) && (
        <div className="comment-actions">
          {canEdit && (
            <button onClick={() => setIsEditing(true)} className="edit-btn">Редактировать</button>
          )}
          {canDelete && (
            <button onClick={handleDelete} className="delete-btn">Удалить</button>
          )}
        </div>
      )}
    </div>
  );
};

export default CommentItem;