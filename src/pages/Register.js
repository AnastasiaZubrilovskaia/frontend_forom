import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { register } from '../api/auth';
import RegisterForm from '../components/auth/RegisterForm';

const Register = () => {
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleRegister = async (name, email, password) => {
    try {
      console.log('Attempting registration with:', { name, email });
      const response = await register(name, email, password);
      console.log('Registration successful:', response);
      navigate('/login');
    } catch (err) {
      console.error('Registration error details:', err);
      
     
      const errorData = err.data || {};
      let errorMessage = '';

      
      if (err.validationErrors) {
        errorMessage = Object.entries(err.validationErrors)
          .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
          .join('\n');
      } 
     
      else if (errorData.message || errorData.error) {
        errorMessage = errorData.message || errorData.error;
      }
      
      else if (err.message) {
        errorMessage = err.message;
      } else {
        errorMessage = 'Registration failed. Please try again.';
      }

      setError(errorMessage);
    }
  };

  return (
    <div className="auth-page">
      <h2>Register</h2>
      {error && (
        <div className="error-message" style={{ 
          color: 'red', 
          marginBottom: '1rem',
          whiteSpace: 'pre-line',
          padding: '10px',
          border: '1px solid red',
          borderRadius: '4px',
          backgroundColor: '#fff5f5'
        }}>
          {error}
        </div>
      )}
      <RegisterForm onRegister={handleRegister} />
      <p className="auth-link">
        Already have an account? <a href="/login">Login here</a>
      </p>
    </div>
  );
};

export default Register;