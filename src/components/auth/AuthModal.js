import React, { useState } from 'react';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';

const AuthModal = ({ onClose, initialMode = 'login' }) => {
  const [mode, setMode] = useState(initialMode);

  const handleSuccess = () => {
    onClose();
  };

  return (
    <div className="auth-modal">
      <div className="auth-modal-content">
        <button className="auth-modal-close" onClick={onClose}>×</button>
        {mode === 'login' ? (
          <>
            <LoginForm onSuccess={handleSuccess} />
            <p className="auth-switch-text">
              Don't have an account?{' '}
              <button className="auth-switch-btn" onClick={() => setMode('register')}>
                Register
              </button>
            </p>
          </>
        ) : (
          <>
            <RegisterForm onSuccess={handleSuccess} />
            <p className="auth-switch-text">
              Already have an account?{' '}
              <button className="auth-switch-btn" onClick={() => setMode('login')}>
                Login
              </button>
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default AuthModal;