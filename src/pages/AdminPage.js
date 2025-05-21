import React from 'react';
import AdminPanel from '../components/admin/AdminPanel';

// Страница администратора
const AdminPage = () => {
  return (
    <div className="admin-page">
      <h1>Панель администратора</h1>
      <AdminPanel />
    </div>
  );
};

export default AdminPage;