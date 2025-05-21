import React from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';

const PostItem = ({ post, onDelete, canDelete }) => {
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
        <button 
          className="delete-post-btn"
          onClick={() => onDelete(post.id)}
        >
          Delete
        </button>
      )}
    </div>
  );
};

export default PostItem;