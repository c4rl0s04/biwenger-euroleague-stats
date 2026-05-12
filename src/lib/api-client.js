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
        throw new Error(`API ${res.status} on ${url}`);
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

  /**
   * Generic DELETE request
   */
  async delete(endpoint) {
    const url = endpoint.startsWith('/') ? endpoint : `/api/${endpoint}`;

    try {
      const res = await fetch(url, {
        method: 'DELETE',
      });

      if (!res.ok) {
        throw new Error(`API Error: ${res.status} ${res.statusText}`);
      }

      return await res.json();
    } catch (error) {
      console.error(`[ApiClient] DELETE ${url} failed:`, error);
      throw error;
    }
  },

  /**
   * Sends a lineup object to the backend to be saved on Biwenger
   * @param {Object} lineup - The lineup payload { type, playersID, reservesID, captain }
   */
  async saveLineup({ userId, ...lineup }) {
    return this.post('/api/users/lineup', { lineup, userId });
  },

  /**
   * Places a player on the Biwenger market
   * @param {Object} params - { playerId, price }
   */
  async sellPlayer({ playerId, price }) {
    return this.post('/api/market/sell', { playerId, price });
  },

  /**
   * Withdraws a player from the Biwenger market
   */
  async withdrawPlayer(playerId) {
    return this.delete(`/api/market/remove?playerId=${playerId}`);
  },

  /**
   * Accepts a transfer offer
   */
  async acceptOffer(offerId) {
    return this.post('/api/market/offers/accept', { offerId });
  },

  /**
   * Rejects a transfer offer
   */
  async rejectOffer(offerId) {
    return this.delete(`/api/market/offers/reject?offerId=${offerId}`);
  },
};
