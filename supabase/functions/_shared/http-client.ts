/**
 * HTTP Client Utilities
 * Provides fetch wrapper with retry, timeout, and error handling
 */

export interface HttpClientOptions {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  headers?: Record<string, string>;
  throwOnError?: boolean;
}

export interface HttpResponse<T = any> {
  data: T;
  status: number;
  headers: Headers;
  ok: boolean;
}

/**
 * HTTP Client with retry logic and timeout
 */
export class HttpClient {
  private defaultOptions: HttpClientOptions = {
    timeout: 30000, // 30 seconds
    retries: 3,
    retryDelay: 1000, // 1 second
    throwOnError: true,
  };

  constructor(options?: HttpClientOptions) {
    this.defaultOptions = { ...this.defaultOptions, ...options };
  }

  /**
   * Perform HTTP request with retry and timeout
   */
  async request<T = any>(
    url: string,
    options: RequestInit & HttpClientOptions = {}
  ): Promise<HttpResponse<T>> {
    const {
      timeout = this.defaultOptions.timeout!,
      retries = this.defaultOptions.retries!,
      retryDelay = this.defaultOptions.retryDelay!,
      throwOnError = this.defaultOptions.throwOnError,
      headers = {},
      ...fetchOptions
    } = options;

    let lastError: Error | null = null;
    let attempt = 0;

    while (attempt <= retries) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const response = await fetch(url, {
          ...fetchOptions,
          headers: {
            ...this.defaultOptions.headers,
            ...headers,
          },
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        // Parse response body
        let data: T;
        const contentType = response.headers.get('content-type');
        
        if (contentType?.includes('application/json')) {
          data = await response.json();
        } else if (contentType?.includes('text/')) {
          data = await response.text() as T;
        } else {
          data = await response.blob() as T;
        }

        // Handle non-OK responses
        if (!response.ok && throwOnError) {
          throw new Error(
            `HTTP ${response.status}: ${response.statusText}`
          );
        }

        return {
          data,
          status: response.status,
          headers: response.headers,
          ok: response.ok,
        };
      } catch (error) {
        lastError = error as Error;
        attempt++;

        // Don't retry on certain errors
        if (
          error instanceof Error &&
          (error.message.includes('HTTP 4') || // Client errors
           error.message.includes('abort'))     // Aborted requests
        ) {
          break;
        }

        // Wait before retry (exponential backoff)
        if (attempt <= retries) {
          const delay = retryDelay * Math.pow(2, attempt - 1);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    // All retries failed
    throw lastError || new Error('Request failed after retries');
  }

  /**
   * GET request
   */
  async get<T = any>(
    url: string,
    options?: HttpClientOptions & { params?: Record<string, string> }
  ): Promise<HttpResponse<T>> {
    const { params, ...clientOptions } = options || {};
    
    let finalUrl = url;
    if (params) {
      const searchParams = new URLSearchParams(params);
      finalUrl = `${url}?${searchParams.toString()}`;
    }

    return this.request<T>(finalUrl, {
      method: 'GET',
      ...clientOptions,
    });
  }

  /**
   * POST request
   */
  async post<T = any>(
    url: string,
    body?: any,
    options?: HttpClientOptions
  ): Promise<HttpResponse<T>> {
    return this.request<T>(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      body: body ? JSON.stringify(body) : undefined,
      ...options,
    });
  }

  /**
   * PUT request
   */
  async put<T = any>(
    url: string,
    body?: any,
    options?: HttpClientOptions
  ): Promise<HttpResponse<T>> {
    return this.request<T>(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      body: body ? JSON.stringify(body) : undefined,
      ...options,
    });
  }

  /**
   * DELETE request
   */
  async delete<T = any>(
    url: string,
    options?: HttpClientOptions
  ): Promise<HttpResponse<T>> {
    return this.request<T>(url, {
      method: 'DELETE',
      ...options,
    });
  }

  /**
   * PATCH request
   */
  async patch<T = any>(
    url: string,
    body?: any,
    options?: HttpClientOptions
  ): Promise<HttpResponse<T>> {
    return this.request<T>(url, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      body: body ? JSON.stringify(body) : undefined,
      ...options,
    });
  }
}

/**
 * Create default HTTP client instance
 */
export function createHttpClient(options?: HttpClientOptions): HttpClient {
  return new HttpClient(options);
}

/**
 * Quick fetch with retry (convenience function)
 */
export async function fetchWithRetry<T = any>(
  url: string,
  options?: RequestInit & HttpClientOptions
): Promise<HttpResponse<T>> {
  const client = createHttpClient();
  return client.request<T>(url, options);
}
