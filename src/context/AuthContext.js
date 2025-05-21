import React, { createContext, useContext, useEffect, useState } from 'react';
import { authAPI, authHelper } from '../api/auth';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const initializeAuth = async () => {
      const token = authHelper.getaccess_token();
      if (token) {
        try {
          // First validate the token
          const isValid = await authAPI.validateToken();
          if (!isValid.valid) {
            throw new Error('Invalid token');
          }

          // Then get user info
          const userInfo = await authAPI.getUserInfo();
          setUser(userInfo);
          
          // Check admin status
          const adminStatus = await authAPI.isAdmin(userInfo.user_id);
          setIsAdmin(adminStatus.is_admin);
        } catch (error) {
          console.error('Auth initialization error:', error);
          authHelper.clearAuthData();
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (email, password) => {
    try {
      // 1. Выполняем запрос на вход
      const { access_token } = await authAPI.login(email, password);
      
      // 2. Проверяем наличие access_token
      if (!access_token) {
        throw new Error('No access token received');
      }

      // 3. Сохраняем только access_token
      localStorage.setItem('access_token', access_token);

      // 4. Получаем информацию о пользователе
      const userInfo = await authAPI.getUserInfo();
      if (!userInfo?.user_id) {
        throw new Error('Failed to get user info');
      }

      // 5. Проверяем админские права
      const adminStatus = await authAPI.isAdmin(userInfo.user_id);

      // 6. Обновляем состояние
      setUser({
        id: userInfo.user_id,
        name: userInfo.name,
        email: email
      });
      setIsAdmin(adminStatus.is_admin);

      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        message: error.message || 'Login failed'
      };
    }
  };
  
  const register = async (name, email, password) => {
    try {
      const response = await authAPI.register(name, email, password);
      
      if (!response.user_id) {
        throw new Error('Registration failed - no user ID received');
      }
      
      return { success: true, user_id: response.user_id };
    } catch (error) {
      console.error('Registration error:', error);
      return {
        success: false,
        message: error.response?.data?.error || error.message
      };
    }
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } finally {
      authHelper.clearAuthData();
      setUser(null);
      setIsAdmin(false);
      navigate('/');
    }
  };

  const grantAdmin = async (user_id) => {
    try {
      await authAPI.grantAdmin(user_id);
      if (user?.user_id === user_id) {
        setIsAdmin(true);
      }
      return { success: true };
    } catch (error) {
      return { success: false, message: error.message };
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAdmin, 
      loading, 
      login, 
      register, 
      logout, 
      grantAdmin 
    }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);