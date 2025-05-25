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
          
          const isValid = await authAPI.validateToken();
          if (!isValid.valid) {
            throw new Error('Invalid token');
          }

          const userInfo = await authAPI.getUserInfo();
          console.log('Initial user info:', userInfo); 
          if (userInfo && userInfo.user_id) {
          setUser(userInfo);
          
         
          const adminStatus = await authAPI.isAdmin(userInfo.user_id);
          setIsAdmin(adminStatus.is_admin);
          } else {
            throw new Error('Invalid user info received');
          }
        } catch (error) {
          console.error('Auth initialization error:', error);
          authHelper.clearTokens();
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (email, password) => {
    try {
      
      const response = await authAPI.login(email, password);
      console.log('Login response:', response); 
      
    
      if (!response || !response.accessToken) {
        throw new Error('No access token received');
      }

      
      const userInfo = await authAPI.getUserInfo();
      console.log('User info after login:', userInfo); 
      
      if (!userInfo || !userInfo.user_id) {
        console.error('Invalid user info:', userInfo); 
        throw new Error('Failed to get user info');
      }

     
      const adminStatus = await authAPI.isAdmin(userInfo.user_id);
      console.log('Admin status:', adminStatus); 

    
      const userData = {
        id: userInfo.user_id,
        name: userInfo.name,
        email: email
      };
      console.log('Setting user data:', userData); 
      setUser(userData);
      setIsAdmin(adminStatus.is_admin);

      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      authHelper.clearTokens(); 
      return {
        success: false,
        message: error.message || 'Login failed'
      };
    }
  };
  
  const register = async (name, email, password) => {
    try {
      const response = await authAPI.register(name, email, password);
      console.log('Register response in context:', response); 
      
      if (!response || !response.user_id) {
        throw new Error('Registration failed - no user ID received');
      }
      
     
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
      authHelper.clearTokens();
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