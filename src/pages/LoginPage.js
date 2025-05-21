import React from 'react';
import { useNavigate } from 'react-router-dom';
import LoginForm from '../components/auth/LoginForm';

// Страница входа в систему
const LoginPage = () => {
  const navigate = useNavigate();

  const handleSuccess = () => {
    navigate('/');
  };

  return (
    <div className="auth-page">
      <LoginForm onSuccess={handleSuccess} />
    </div>
  );
};

export default LoginPage;