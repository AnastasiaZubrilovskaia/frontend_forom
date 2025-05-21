import { format } from 'date-fns';

// Вспомогательные функции

// Форматирование даты
export const formatDate = (dateString) => {
  return format(new Date(dateString), 'dd.MM.yyyy HH:mm');
};

// Проверка, является ли пользователь автором контента
export const isAuthor = (user, contentAuthorId) => {
  return user && user.user_id === contentAuthorId;
};

// Обрезание длинного текста с добавлением многоточия
export const truncateText = (text, maxLength = 100) => {
  if (text.length <= maxLength) return text;
  return `${text.substring(0, maxLength)}...`;
};