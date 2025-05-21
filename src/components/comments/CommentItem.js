import React from 'react';
import { format } from 'date-fns';

const CommentItem = ({ comment, onDelete, canDelete }) => {
  return (
    <div className="comment-item">
      <div className="comment-header">
        <span className="comment-author">{comment.author_name}</span>
        <span className="comment-date">
          {format(new Date(comment.created_at), 'MMM d, yyyy HH:mm')}
        </span>
      </div>
      <div className="comment-content">{comment.content}</div>
      {canDelete && (
        <button 
          className="delete-comment-btn"
          onClick={() => onDelete(comment.id)}
        >
          Delete
        </button>
      )}
    </div>
  );
};

export default CommentItem;