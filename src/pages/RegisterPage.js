import React from 'react';
import { useNavigate } from 'react-router-dom';
import RegisterForm from '../components/auth/RegisterForm';

// Страница регистрации
const RegisterPage = () => {
  const navigate = useNavigate();

  const handleSuccess = () => {
    navigate('/');
  };

  return (
    <div className="auth-page">
      <RegisterForm onSuccess={handleSuccess} />
    </div>
  );
};

export default RegisterPage;