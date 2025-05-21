import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

// Кастомный хук для удобного доступа к контексту аутентификации
const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth должен использоваться внутри AuthProvider');
  }
  return context;
};

export default useAuth;