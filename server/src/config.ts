import dotenv from 'dotenv';
dotenv.config();

export const CONFIG = {
  PORT: process.env.PORT || 3000,
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
};

if (!CONFIG.GEMINI_API_KEY) {
  console.warn('Warning: GEMINI_API_KEY is not set in .env');
}
if (!CONFIG.GOOGLE_CLIENT_ID) {
  console.warn('Warning: GOOGLE_CLIENT_ID is not set in .env');
}
