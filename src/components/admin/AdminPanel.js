import React, { useState } from 'react';
import { forumAPI } from '../../api/forum';
import { useAuth } from '../../context/AuthContext';

// Панель администратора с функциями управления пользователями и контентом
const AdminPanel = () => {
  const [user_id, setuser_id] = useState('');
  const [postId, setPostId] = useState('');
  const [commentId, setCommentId] = useState('');
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const { grantAdmin } = useAuth();

  // Назначение прав администратора пользователю
  const handleGrantAdmin = async () => {
    try {
      const result = await grantAdmin(parseInt(user_id));
      if (result.success) {
        setMessage(`Пользователь ${user_id} получил права администратора`);
        setIsSuccess(true);
      }
    } catch (error) {
      setMessage(error.message);
      setIsSuccess(false);
    }
  };

  // Удаление поста
  const handleDeletePost = async () => {
    try {
      await forumAPI.posts.delete(parseInt(postId));
      setMessage(`Пост ${postId} успешно удален`);
      setIsSuccess(true);
    } catch (error) {
      setMessage(error.message);
      setIsSuccess(false);
    }
  };

  // Удаление комментария
  const handleDeleteComment = async () => {
    try {
      await forumAPI.comments.delete(parseInt(commentId));
      setMessage(`Комментарий ${commentId} успешно удален`);
      setIsSuccess(true);
    } catch (error) {
      setMessage(error.message);
      setIsSuccess(false);
    }
  };

  return (
    <div className="admin-panel">
      <h2>Панель администратора</h2>
      
      <div className="admin-section">
        <h3>Управление пользователями</h3>
        <div className="admin-control">
          <input
            type="number"
            value={user_id}
            onChange={(e) => setuser_id(e.target.value)}
            placeholder="ID пользователя"
          />
          <button onClick={handleGrantAdmin}>Назначить администратором</button>
        </div>
      </div>

      <div className="admin-section">
        <h3>Модерация контента</h3>
        <div className="admin-control">
          <input
            type="number"
            value={postId}
            onChange={(e) => setPostId(e.target.value)}
            placeholder="ID поста для удаления"
          />
          <button onClick={handleDeletePost}>Удалить пост</button>
        </div>
        
        <div className="admin-control">
          <input
            type="number"
            value={commentId}
            onChange={(e) => setCommentId(e.target.value)}
            placeholder="ID комментария для удаления"
          />
          <button onClick={handleDeleteComment}>Удалить комментарий</button>
        </div>
      </div>

      {message && (
        <div className={`admin-message ${isSuccess ? 'success' : 'error'}`}>
          {message}
        </div>
      )}
    </div>
  );
};

export default AdminPanel;