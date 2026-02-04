/**
 * Client-side API Wrapper
 * Centralizes all API calls from Client Components.
 * Handles base URL, error checking, and JSON parsing.
 */

export const apiClient = {
  /**
   * Generic GET request
   * @param {string} endpoint - API endpoint (e.g., '/users')
   * @returns {Promise<any>} Response data
   */
  async get(endpoint) {
    // Ensure endpoint starts with /api if not provided (optional convenience)
    const url = endpoint.startsWith('/') ? endpoint : `/api/${endpoint}`;

    try {
      const res = await fetch(url);

      if (!res.ok) {
        throw new Error(`API Error: ${res.status} ${res.statusText}`);
      }

      const json = await res.json();

      // Our API convention wraps data in { success: true, data: ... } or just returns array/object
      // We should normalize this if possible, but for now just return the raw JSON or the inner data
      return json;
    } catch (error) {
      console.error(`[ApiClient] GET ${url} failed:`, error);
      throw error;
    }
  },

  /**
   * Generic POST request
   * @param {string} endpoint
   * @param {Object} body
   */
  async post(endpoint, body) {
    const url = endpoint.startsWith('/') ? endpoint : `/api/${endpoint}`;

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        throw new Error(`API Error: ${res.status} ${res.statusText}`);
      }

      return await res.json();
    } catch (error) {
      console.error(`[ApiClient] POST ${url} failed:`, error);
      throw error;
    }
  },
};
