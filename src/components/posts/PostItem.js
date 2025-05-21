import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { forumAPI } from '../../api/forum';
import { authHelper } from '../../api/auth';
import '../../styles/PostItem.css';

const CommentItem = ({ comment, onDelete, onUpdate, isAdmin }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(comment.content);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const abortControllerRef = useRef(null);
  const currentUserId = authHelper.getUserId();
  const canModify = isAdmin || currentUserId === comment.author_id;

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
      setError(err.message || 'Failed to update comment');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = useCallback(async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    
    if (window.confirm('Are you sure you want to delete this comment?')) {
      try {
        await forumAPI.deleteComment(comment.id, abortControllerRef.current.signal);
        if (onDelete) onDelete(comment.id);
      } catch (err) {
        if (err.name !== 'AbortError') {
          setError(err.message || 'Failed to delete comment');
        }
      } finally {
        abortControllerRef.current = null;
      }
    }
  }, [comment.id, onDelete]);

  if (isEditing) {
    return (
      <form className="comment-edit-form" onSubmit={handleEdit}>
        <div className="form-group">
          <textarea
            value={editedContent}
            onChange={(e) => setEditedContent(e.target.value)}
            placeholder="Write your comment here..."
            required
          />
        </div>
        <div className="form-actions">
          <button type="submit" disabled={loading}>
            {loading ? 'Saving...' : 'Save'}
          </button>
          <button type="button" onClick={() => setIsEditing(false)}>
            Cancel
          </button>
        </div>
        {error && <div className="error-message">{error}</div>}
      </form>
    );
  }

  return (
    <div className="comment-item">
      <div className="comment-content">{comment.content}</div>
      <div className="comment-meta">
        <span className="comment-author">{comment.author_name}</span>
        <span className="comment-date">
          {format(new Date(comment.created_at), 'MMM d, yyyy')}
        </span>
        {comment.updated_at && comment.updated_at !== comment.created_at && (
          <span className="comment-updated">
            (updated {format(new Date(comment.updated_at), 'MMM d, yyyy')})
          </span>
        )}
      </div>
      {canModify && (
        <div className="comment-actions">
          <button 
            className="edit-comment-btn"
            onClick={() => setIsEditing(true)}
          >
            Edit
          </button>
          <button 
            className="delete-comment-btn"
            onClick={handleDelete}
          >
            Delete
          </button>
        </div>
      )}
      {error && <div className="error-message">{error}</div>}
    </div>
  );
};

const PostItem = ({ post, onDelete, canDelete, onUpdate, isAdmin }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(post.title);
  const [editedContent, setEditedContent] = useState(post.content);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleted, setIsDeleted] = useState(false);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [isCommenting, setIsCommenting] = useState(false);
  const abortControllerRef = useRef(null);
  const isAuthenticated = authHelper.isAuthenticated();
  const currentUserId = authHelper.getUserId();

  useEffect(() => {
    loadComments();
  }, [post.id]);

  const loadComments = async () => {
    try {
      const commentsData = await forumAPI.getComments(post.id);
      setComments(commentsData);
    } catch (err) {
      setError('Failed to load comments');
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setError('');
    setLoading(true);

    try {
      await forumAPI.createComment(post.id, newComment);
      setNewComment('');
      setIsCommenting(false);
      loadComments();
    } catch (err) {
      setError(err.message || 'Failed to add comment');
    } finally {
      setLoading(false);
    }
  };

  const handleCommentDelete = async (commentId) => {
    await loadComments();
  };

  const handleCommentUpdate = async () => {
    await loadComments();
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
      setError(err.message || 'Failed to update post');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = useCallback(async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    
    if (window.confirm('Are you sure you want to delete this post?')) {
      setIsDeleting(true);
      try {
        await forumAPI.deletePost(post.id, abortControllerRef.current.signal);
        setIsDeleted(true);
        if (onDelete) onDelete(post.id);
      } catch (err) {
        if (err.name !== 'AbortError') {
          setError(err.message || 'Failed to delete post');
          setIsDeleting(false);
        }
      } finally {
        abortControllerRef.current = null;
      }
    }
  }, [post.id, onDelete]);

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
            placeholder="Post title"
            required
          />
        </div>
        <div className="form-group">
          <textarea
            value={editedContent}
            onChange={(e) => setEditedContent(e.target.value)}
            placeholder="Write your post content here..."
            required
          />
        </div>
        <div className="form-actions">
          <button type="submit" disabled={loading}>
            {loading ? 'Saving...' : 'Save'}
          </button>
          <button type="button" onClick={() => setIsEditing(false)}>
            Cancel
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
            {format(new Date(post.created_at), 'MMM d, yyyy')}
          </span>
          {post.updated_at && post.updated_at !== post.created_at && (
            <span className="post-updated">
              (updated {format(new Date(post.updated_at), 'MMM d, yyyy')})
            </span>
          )}
        </div>
      </div>
      <div className="post-content">{post.content}</div>
      {canDelete && (
        <div className="post-actions">
          <button 
            className="edit-post-btn"
            onClick={() => setIsEditing(true)}
            disabled={isDeleting}
          >
            Edit
          </button>
          <button 
            className="delete-post-btn"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      )}
      {error && <div className="error-message">{error}</div>}

      {/* Comments section */}
      <div className="comments-section">
        <h4>Comments</h4>
        {isAuthenticated && !isCommenting && (
          <button 
            className="add-comment-btn"
            onClick={() => setIsCommenting(true)}
          >
            Add Comment
          </button>
        )}
        
        {isCommenting && (
          <form className="comment-form" onSubmit={handleAddComment}>
            <div className="form-group">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Write your comment here..."
                required
              />
            </div>
            <div className="form-actions">
              <button type="submit" disabled={loading}>
                {loading ? 'Posting...' : 'Post Comment'}
              </button>
              <button type="button" onClick={() => setIsCommenting(false)}>
                Cancel
              </button>
            </div>
          </form>
        )}

        <div className="comments-list">
          {comments.map(comment => (
            <CommentItem
              key={comment.id}
              comment={comment}
              onDelete={handleCommentDelete}
              onUpdate={handleCommentUpdate}
              isAdmin={isAdmin}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default PostItem;