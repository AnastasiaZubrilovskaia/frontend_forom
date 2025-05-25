import React from 'react';
import Navbar from './Navbar';

// Основной макет приложения с навигацией и контентом
const Layout = ({ children }) => {
  return (
    <div className="app-layout">
      <Navbar />
      <main className="main-content">
        {children}
      </main>
      <footer className="app-footer">
        <p>© 2025 Форум</p>
      </footer>
    </div>
  );
};

export default Layout;