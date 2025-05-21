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
      const token = authHelper.getAccessToken();
      if (token) {
        try {
          // First validate the token
          const isValid = await authAPI.validateToken();
          if (!isValid.valid) {
            throw new Error('Invalid token');
          }

          // Then get user info
          const userInfo = await authAPI.getUserInfo();
          console.log('Initial user info:', userInfo); // Debug log
          if (userInfo && userInfo.user_id) {
            setUser(userInfo);
            
            // Check admin status
            const adminStatus = await authAPI.isAdmin(userInfo.user_id);
            setIsAdmin(adminStatus.is_admin);
          } else {
            throw new Error('Invalid user info received');
          }
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
      // 1. Perform login request
      const response = await authAPI.login(email, password);
      console.log('Login response:', response); // Debug log
      
      // 2. Check for tokens
      if (!response || !response.accessToken) {
        throw new Error('No access token received');
      }

      // 3. Get user info
      const userInfo = await authAPI.getUserInfo();
      console.log('User info after login:', userInfo); // Debug log
      
      if (!userInfo || !userInfo.user_id) {
        console.error('Invalid user info:', userInfo); // Debug log
        throw new Error('Failed to get user info');
      }

      // 4. Check admin status
      const adminStatus = await authAPI.isAdmin(userInfo.user_id);
      console.log('Admin status:', adminStatus); // Debug log

      // 5. Update state
      const userData = {
        id: userInfo.user_id,
        name: userInfo.name,
        email: email
      };
      console.log('Setting user data:', userData); // Debug log
      setUser(userData);
      setIsAdmin(adminStatus.is_admin);

      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      authHelper.clearAuthData(); // Clear any partial auth data
      return {
        success: false,
        message: error.message || 'Login failed'
      };
    }
  };
  
  const register = async (name, email, password) => {
    try {
      const response = await authAPI.register(name, email, password);
      console.log('Register response in context:', response); // Debug log
      
      if (!response || !response.user_id) {
        throw new Error('Registration failed - no user ID received');
      }
      
      // После успешной регистрации сразу логиним пользователя
      const loginResult = await login(email, password);
      if (!loginResult.success) {
        throw new Error('Registration successful but login failed');
      }
      
      return { success: true, user_id: response.user_id };
    } catch (error) {
      console.error('Registration error:', error);
      return {
        success: false,
        message: error.message || 'Registration failed'
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