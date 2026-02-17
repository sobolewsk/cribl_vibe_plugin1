/**
 * Utility for accessing Cribl API configuration
 * Gets values from window first, then falls back to environment variables
 */

export const getCriblApiUrl = (): string => {
  const url = (window as any).CRIBL_API_URL;
  if (!url) {
    console.warn('CRIBL_API_URL not configured');
  }
  return url || '';
};

export const getCriblAuthToken = (): string => {
  const token = (window as any).CRIBL_AUTH_TOKEN;
  if (!token) {
    console.warn('CRIBL_AUTH_TOKEN not configured');
  }
  return token || '';
};

/**
 * Get the search jobs API base URL
 */
export const getSearchJobsUrl = (): string => {
  const baseUrl = getCriblApiUrl();
  return `${baseUrl}/m/default_search/search/jobs`;
};

/**
 * Fetch with Cribl auth token
 */
export const criblFetch = async (path: string, options: RequestInit = {}): Promise<Response> => {
  const token = getCriblAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return fetch(path, {
    ...options,
    headers,
  });
};
