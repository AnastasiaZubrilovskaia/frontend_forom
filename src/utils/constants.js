// Константы приложения
export const MESSAGE_LIFETIME = 24 * 60 * 60 * 1000; // 24 часа в миллисекундах
export const API_BASE_URL = process.env.API_URL_AUTH || 'http://localhost:8081/api/auth';
export const AUTH_API_URL = process.env.API_URL_FORUM || 'http://localhost:8080/api';
export const WS_URL = process.env.APP_WS || 'ws://localhost:8080';