/**
 * Core API Client
 * Handles HTTP requests, authentication, error handling, and retries
 */

export interface ApiConfig {
  baseURL: string;
  timeout: number;
  retries: number;
  retryDelay: number;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  status?: number;
}

export interface ApiResponse<T> {
  data?: T;
  error?: ApiError;
  status: number;
  headers: Headers;
}

export class ApiClientError extends Error {
  constructor(
    public code: string,
    message: string,
    public status?: number,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'ApiClientError';
  }
}

export class ApiClient {
  private config: ApiConfig;
  private token: string | null = null;

  constructor(config: Partial<ApiConfig> = {}) {
    this.config = {
      baseURL: config.baseURL || import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/v1',
      timeout: config.timeout || 30000,
      retries: config.retries || 3,
      retryDelay: config.retryDelay || 1000,
    };
  }

  /**
   * Set authentication token
   */
  setToken(token: string | null) {
    this.token = token;
  }

  /**
   * Get authentication token
   */
  getToken(): string | null {
    return this.token;
  }

  /**
   * Build request headers
   */
  private buildHeaders(customHeaders?: HeadersInit): Headers {
    const headers = new Headers(customHeaders);
    
    if (this.token) {
      headers.set('Authorization', `Bearer ${this.token}`);
    }
    
    if (!headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }
    
    return headers;
  }

  /**
   * Parse error response
   */
  private async parseError(response: Response): Promise<ApiError> {
    try {
      const data = await response.json();
      return {
        code: data.error?.code || 'UNKNOWN_ERROR',
        message: data.error?.message || response.statusText,
        details: data.error?.details,
        status: response.status,
      };
    } catch {
      return {
        code: 'PARSE_ERROR',
        message: response.statusText || 'Unknown error',
        status: response.status,
      };
    }
  }

  /**
   * Delay helper for retries
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Check if error is retryable
   */
  private isRetryable(status: number, code?: string): boolean {
    // Retry on network errors, server errors, and rate limits
    return (
      status >= 500 ||
      status === 429 ||
      code === 'NETWORK_ERROR' ||
      code === 'TIMEOUT'
    );
  }

  /**
   * Make HTTP request with retries
   */
  private async request<T>(
    method: string,
    endpoint: string,
    options: {
      body?: unknown;
      headers?: HeadersInit;
      signal?: AbortSignal;
    } = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.config.baseURL}${endpoint}`;
    const headers = this.buildHeaders(options.headers);

    let lastError: ApiError | null = null;

    for (let attempt = 0; attempt <= this.config.retries; attempt++) {
      try {
        // Create abort controller for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

        // Combine timeout signal with user signal
        const signal = options.signal
          ? this.combineSignals(controller.signal, options.signal)
          : controller.signal;

        const requestOptions: RequestInit = {
          method,
          headers,
          signal,
        };

        if (options.body) {
          requestOptions.body = JSON.stringify(options.body);
        }

        const response = await fetch(url, requestOptions);
        clearTimeout(timeoutId);

        // Success response
        if (response.ok) {
          const data = await response.json();
          return {
            data,
            status: response.status,
            headers: response.headers,
          };
        }

        // Error response
        const error = await this.parseError(response);
        lastError = error;

        // Don't retry if not retryable
        if (!this.isRetryable(response.status, error.code) || attempt === this.config.retries) {
          return {
            error,
            status: response.status,
            headers: response.headers,
          };
        }

        // Wait before retry with exponential backoff
        await this.delay(this.config.retryDelay * Math.pow(2, attempt));
      } catch (err) {
        const error: ApiError = {
          code: (err as Error).name === 'AbortError' ? 'TIMEOUT' : 'NETWORK_ERROR',
          message: (err as Error).message,
          details: { attempt: attempt + 1 },
        };

        lastError = error;

        if (attempt === this.config.retries) {
          return { error, status: 0, headers: new Headers() };
        }

        await this.delay(this.config.retryDelay * Math.pow(2, attempt));
      }
    }

    // Should never reach here, but TypeScript needs it
    return {
      error: lastError || { code: 'UNKNOWN_ERROR', message: 'Request failed' },
      status: 0,
      headers: new Headers(),
    };
  }

  /**
   * Combine multiple abort signals
   */
  private combineSignals(signal1: AbortSignal, signal2: AbortSignal): AbortSignal {
    const controller = new AbortController();

    const abort = () => controller.abort();
    signal1.addEventListener('abort', abort);
    signal2.addEventListener('abort', abort);

    return controller.signal;
  }

  /**
   * GET request
   */
  async get<T>(endpoint: string, options?: { signal?: AbortSignal; headers?: HeadersInit }): Promise<T> {
    const response = await this.request<T>('GET', endpoint, options);
    if (response.error) {
      throw new ApiClientError(
        response.error.code,
        response.error.message,
        response.error.status,
        response.error.details
      );
    }
    return response.data!;
  }

  /**
   * POST request
   */
  async post<T>(
    endpoint: string,
    body?: unknown,
    options?: { signal?: AbortSignal; headers?: HeadersInit }
  ): Promise<T> {
    const response = await this.request<T>('POST', endpoint, { ...options, body });
    if (response.error) {
      throw new ApiClientError(
        response.error.code,
        response.error.message,
        response.error.status,
        response.error.details
      );
    }
    return response.data!;
  }

  /**
   * PUT request
   */
  async put<T>(
    endpoint: string,
    body?: unknown,
    options?: { signal?: AbortSignal; headers?: HeadersInit }
  ): Promise<T> {
    const response = await this.request<T>('PUT', endpoint, { ...options, body });
    if (response.error) {
      throw new ApiClientError(
        response.error.code,
        response.error.message,
        response.error.status,
        response.error.details
      );
    }
    return response.data!;
  }

  /**
   * DELETE request
   */
  async delete<T>(endpoint: string, options?: { signal?: AbortSignal; headers?: HeadersInit }): Promise<T> {
    const response = await this.request<T>('DELETE', endpoint, options);
    if (response.error) {
      throw new ApiClientError(
        response.error.code,
        response.error.message,
        response.error.status,
        response.error.details
      );
    }
    return response.data!;
  }

  /**
   * PATCH request
   */
  async patch<T>(
    endpoint: string,
    body?: unknown,
    options?: { signal?: AbortSignal; headers?: HeadersInit }
  ): Promise<T> {
    const response = await this.request<T>('PATCH', endpoint, { ...options, body });
    if (response.error) {
      throw new ApiClientError(
        response.error.code,
        response.error.message,
        response.error.status,
        response.error.details
      );
    }
    return response.data!;
  }
}

// Singleton instance
export const apiClient = new ApiClient();
