import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { WebSocketProvider, useWebSocket } from './context/WebSocketContext';
import Layout from './components/common/Layout';
import HomePage from './pages/HomePage';
import PostPage from './pages/PostPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AdminPage from './pages/AdminPage';
import ProtectedRoute from './components/common/ProtectedRoute';
import ErrorBoundary from './components/common/ErrorBoundary';
import './styles/main.css';

// Главный компонент приложения с маршрутизацией
function App() {
  return (
    <ErrorBoundary>
      <Router>
        <AuthProvider>
          <WebSocketProvider>
            <Layout>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/posts/:id" element={<PostPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route 
                  path="/admin" 
                  element={
                    <ProtectedRoute adminOnly>
                      <AdminPage />
                    </ProtectedRoute>
                  } 
                />
              </Routes>
            </Layout>
          </WebSocketProvider>
        </AuthProvider>
      </Router>
    </ErrorBoundary>
  );
}

export default App;