'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Custom hook for standardized API data fetching
 * Provides loading, error, and data states with retry support
 *
 * @param {string|function} endpoint - API endpoint or function returning endpoint
 * @param {object} options - Configuration options
 * @param {boolean} options.immediate - Whether to fetch immediately (default: true)
 * @param {function} options.transform - Optional transform function for data
 * @param {Array} options.dependencies - Dependencies to trigger refetch (default: [])
 * @param {boolean} options.skip - Skip fetching if true (useful for conditional fetching)
 * @returns {object} { data, loading, error, refetch }
 *
 * @example
 * // Simple usage
 * const { data, loading } = useApiData('/api/standings');
 *
 * // With transform
 * const { data } = useApiData('/api/performance', {
 *   transform: (d) => d.volatility
 * });
 *
 * // Dynamic endpoint with dependencies
 * const { data } = useApiData(`/api/user/${userId}`, {
 *   dependencies: [userId],
 *   skip: !userId
 * });
 */
export function useApiData(endpoint, options = {}) {
  const { immediate = true, transform = null, dependencies = [], skip = false } = options;

  const [data, setData] = useState(undefined);
  const [loading, setLoading] = useState(immediate && !skip);
  const [error, setError] = useState(null);

  // Use refs for functions to avoid recreating fetchData on every render
  const endpointRef = useRef(endpoint);
  const transformRef = useRef(transform);

  // Update refs when values change
  endpointRef.current = endpoint;
  transformRef.current = transform;

  // Track if this is the initial mount
  const isMounted = useRef(true);

  const fetchData = useCallback(async () => {
    if (skip) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Support both string and function endpoints
      const currentEndpoint = endpointRef.current;
      const url = typeof currentEndpoint === 'function' ? currentEndpoint() : currentEndpoint;

      if (!url) {
        setLoading(false);
        return;
      }

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'API returned unsuccessful response');
      }

      // Only update state if component is still mounted
      if (isMounted.current) {
        const currentTransform = transformRef.current;
        const processedData = currentTransform ? currentTransform(result.data) : result.data;
        setData(processedData);
      }
    } catch (err) {
      console.error(`Error fetching data:`, err);
      if (isMounted.current) {
        setError(err.message || 'Failed to load data');
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
    // Only re-create fetchData when skip changes or dependencies change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [skip, ...dependencies]);

  useEffect(() => {
    isMounted.current = true;

    if (immediate && !skip) {
      fetchData();
    }

    return () => {
      isMounted.current = false;
    };
  }, [fetchData, immediate, skip]);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
  };
}

export default useApiData;
