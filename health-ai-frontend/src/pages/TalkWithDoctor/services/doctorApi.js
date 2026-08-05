import api from '../../../services/api';

/**
 * API service for the Talk with AI Doctor module.
 * Reuses the app-wide axios instance so auth headers are applied automatically.
 */
export const doctorApi = {
  /**
   * Send the user's message to the doctor backend.
   * @param {string} message - The user's spoken/typed message.
   * @param {Array<{role: string, content: string}>} history - Recent conversation history.
   * @returns {Promise<{success: boolean, data: {message: string, timestamp: string, source: string}}>}
   */
  sendDoctorMessage: async (message, history = []) => {
    const response = await api.post('/chat/doctor', {
      message,
      history,
    });

    return response.data;
  },
};
