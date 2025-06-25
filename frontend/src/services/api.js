// const API_BASE_URL = 'http://localhost:4000/api';

// For Vite:
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api';



export const api = {
  async searchAnswers(question) {
    try {
      const response = await fetch(`${API_BASE_URL}/answers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question }),
      });
      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  async refreshAnswers(question) {
    try {
      const response = await fetch(`${API_BASE_URL}/answers/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question }),
      });
      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
};