import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

// Навигационная панель приложения
const Navbar = () => {
  const { user, isAdmin, logout } = useAuth();

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/">Форум</Link>
      </div>
      <div className="navbar-links">
        {user ? (
          <>
            <Link to="/">Главная</Link>
            {isAdmin && <Link to="/admin">Админка</Link>}
            <button onClick={logout} className="logout-btn">
              Выйти ({user.name})
            </button>
          </>
        ) : (
          <>
            <Link to="/login">Войти</Link>
            <Link to="/register">Регистрация</Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;