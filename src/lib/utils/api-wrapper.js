import { successResponse, errorResponse } from './response.js';

/**
 * Higher-order function to wrap API handlers with standard error handling and response formatting.
 *
 * @param {Function} handler - Async function (req, params) -> Promise<data>
 * @param {Object} options - { successStatus: 200, cache: 'must-revalidate, max-age=0' }
 * @returns {Function} Next.js standardized route handler
 *
 * @example
 * export const GET = withApiHandler(async (req) => {
 *   const data = await fetchData();
 *   return { data }; // Returns standard JSON + 200 OK
 * });
 */
export function withApiHandler(handler, options = {}) {
  // Extract options with defaults
  const { successStatus = 200, cache } = options;

  return async (request, context) => {
    try {
      // Execute the business logic
      // params are usually the second argument in Next.js App Router (req, { params })
      const result = await handler(request, context);

      // If handler returns a Response object directly (e.g. redirect), return it as is
      if (result instanceof Response) {
        return result;
      }

      // Otherwise, assume it's data and wrap in successResponse
      // Note: handler can return { status, data } to override default successStatus
      const responseData = result?.data || result;
      const status = result?.status || successStatus;
      const cacheControl = result?.cache || cache;

      return successResponse(responseData, cacheControl, status);
    } catch (error) {
      console.error(`[API Error] ${request.url}:`, error);

      // Handle expected errors (if they have a status code attached)
      const status = error.status || 500;
      const message = error.message || 'Internal Server Error';

      return errorResponse(message, status);
    }
  };
}
