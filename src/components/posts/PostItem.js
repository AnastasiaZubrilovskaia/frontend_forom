import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { forumAPI } from '../../api/forum';
import { authHelper } from '../../api/auth';
import '../../styles/PostItem.css';
import CommentList from '../comments/CommentList';
import CommentForm from '../comments/CommentForm';

const PostItem = ({ post, onDelete, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(post.title);
  const [editedContent, setEditedContent] = useState(post.content);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleted, setIsDeleted] = useState(false);
  const [comments, setComments] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const abortControllerRef = useRef(null);
  const isAuthenticated = authHelper.isAuthenticated();
  const currentUserId = authHelper.getUserId();
  const [commentVersion, setCommentVersion] = useState(0);

  useEffect(() => {
    const checkAdmin = async () => {
      const isAdminStatus = await authHelper.isAdmin();
      setIsAdmin(isAdminStatus);
    };
    checkAdmin();
  }, []);

  const isAdminBoolean = Boolean(isAdmin);
  const canEdit = currentUserId === post.author_id;
  const canDelete = isAdminBoolean || currentUserId === post.author_id;

  
  console.log('PostItem - post:', post);
  console.log('PostItem - isAdmin (local state):', isAdmin);
  console.log('PostItem - isAdminBoolean:', isAdminBoolean);
  console.log('PostItem - currentUserId:', currentUserId);
  console.log('PostItem - isAuthenticated:', isAuthenticated);
  console.log('PostItem - canEdit:', canEdit);
  console.log('PostItem - canDelete:', canDelete);
  console.log('PostItem - post.id:', post.id);
  console.log('PostItem - post.author_id:', post.author_id);

  useEffect(() => {
    loadComments();
  }, [post.id]);

  const loadComments = async () => {
    try {
      const commentsData = await forumAPI.getComments(post.id);
      setComments(commentsData);
    } catch (err) {
      setError('Не удалось загрузить комментарии');
    }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await forumAPI.updatePost(post.id, editedTitle, editedContent);
      if (onUpdate) onUpdate();
      setIsEditing(false);
    } catch (err) {
      setError(err.message || 'Не удалось обновить пост');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = useCallback(async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    
    if (window.confirm('Вы уверены, что хотите удалить этот пост?')) {
      setIsDeleting(true);
      try {
        await forumAPI.deletePost(post.id, abortControllerRef.current.signal);
        setIsDeleted(true);
        if (onDelete) onDelete(post.id);
      } catch (err) {
        if (err.name !== 'AbortError') {
          setError(err.message || 'Не удалось удалить пост');
          setIsDeleting(false);
        }
      } finally {
        abortControllerRef.current = null;
      }
    }
  }, [post.id, onDelete]);

  const handleCommentAdded = () => {
    setCommentVersion(v => v + 1);
  };

  if (isDeleted) {
    return null;
  }

  if (isEditing) {
    return (
      <form className="post-edit-form" onSubmit={handleEdit}>
        <div className="form-group">
          <input
            type="text"
            value={editedTitle}
            onChange={(e) => setEditedTitle(e.target.value)}
            placeholder="Заголовок поста"
            required
          />
        </div>
        <div className="form-group">
          <textarea
            value={editedContent}
            onChange={(e) => setEditedContent(e.target.value)}
            placeholder="Напишите текст поста..."
            required
          />
        </div>
        <div className="form-actions">
          <button type="submit" disabled={loading}>
            {loading ? 'Сохраняю...' : 'Сохранить'}
          </button>
          <button type="button" onClick={() => setIsEditing(false)}>
            Отмена
          </button>
        </div>
        {error && <div className="error-message">{error}</div>}
      </form>
    );
  }

  return (
    <div className="post-item">
      <div className="post-header">
        <h3>
          <Link to={`/posts/${post.id}`}>{post.title}</Link>
        </h3>
        <div className="post-meta">
          <span className="post-author">{post.author_name}</span>
          <span className="post-date">
            {format(new Date(post.created_at), 'd MMM yyyy', {locale: undefined})}
          </span>
          {post.updated_at && post.updated_at !== post.created_at && (
            <span className="post-updated">
              (обновлено {format(new Date(post.updated_at), 'd MMM yyyy', {locale: undefined})})
            </span>
          )}
        </div>
      </div>
      <div className="post-content">{post.content}</div>
      {(canEdit || canDelete) && (
        <div className="post-actions">
          {canEdit && (
            <button 
              className="edit-post-btn"
              onClick={() => setIsEditing(true)}
              disabled={isDeleting}
            >
              Редактировать
            </button>
          )}
          {canDelete && (
            <button 
              className="delete-post-btn"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? 'Удаляю...' : 'Удалить'}
            </button>
          )}
        </div>
      )}
      {error && <div className="error-message">{error}</div>}

      <div className="comments-section">
        <CommentList 
          postId={post.id} 
          commentVersion={commentVersion}
        />
        {isAuthenticated && (
          <CommentForm postId={post.id} onCommentAdded={handleCommentAdded} />
        )}
      </div>
    </div>
  );
};

export default PostItem;