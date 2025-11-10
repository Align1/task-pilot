// Network utilities for error recovery and retry logic

export interface RetryOptions {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
  retryableStatuses?: number[];
}

export interface NetworkState {
  isOnline: boolean;
  isSlowConnection: boolean;
  lastOnlineTime: number | null;
}

/**
 * Sleep for specified milliseconds
 */
const sleep = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Check if error is retryable
 */
export const isRetryableError = (error: any): boolean => {
  // Network errors
  if (error.name === 'TypeError' && error.message.includes('fetch')) {
    return true;
  }
  
  // Timeout errors
  if (error.name === 'AbortError') {
    return true;
  }
  
  // Server errors (5xx)
  if (error.status >= 500 && error.status < 600) {
    return true;
  }
  
  // Rate limiting
  if (error.status === 429) {
    return true;
  }
  
  // Connection refused, network errors
  if (error.message?.includes('Failed to fetch') || 
      error.message?.includes('Network request failed') ||
      error.message?.includes('ERR_INTERNET_DISCONNECTED') ||
      error.message?.includes('ERR_NETWORK_CHANGED')) {
    return true;
  }
  
  return false;
};

/**
 * Exponential backoff delay calculation
 */
export const calculateBackoff = (
  attemptNumber: number,
  initialDelay: number = 1000,
  maxDelay: number = 30000,
  backoffMultiplier: number = 2
): number => {
  const delay = Math.min(
    initialDelay * Math.pow(backoffMultiplier, attemptNumber),
    maxDelay
  );
  
  // Add jitter to prevent thundering herd
  const jitter = Math.random() * 0.3 * delay;
  
  return delay + jitter;
};

/**
 * Retry function with exponential backoff
 */
export const retryWithBackoff = async <T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> => {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 30000,
    backoffMultiplier = 2,
    retryableStatuses = [429, 500, 502, 503, 504]
  } = options;

  let lastError: any;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      
      // Don't retry if it's not a retryable error
      if (!isRetryableError(error)) {
        throw error;
      }
      
      // Don't retry on the last attempt
      if (attempt === maxRetries) {
        throw error;
      }
      
      // Calculate delay for next retry
      const delay = calculateBackoff(attempt, initialDelay, maxDelay, backoffMultiplier);
      
      console.log(
        `Retry attempt ${attempt + 1}/${maxRetries} after ${Math.round(delay)}ms`,
        error.message
      );
      
      // Wait before retrying
      await sleep(delay);
    }
  }

  throw lastError;
};

/**
 * Detect network status
 */
export const getNetworkState = (): NetworkState => {
  const isOnline = navigator.onLine;
  
  // Detect slow connection using Network Information API
  let isSlowConnection = false;
  if ('connection' in navigator) {
    const connection = (navigator as any).connection;
    if (connection) {
      const effectiveType = connection.effectiveType;
      isSlowConnection = effectiveType === 'slow-2g' || effectiveType === '2g';
    }
  }
  
  return {
    isOnline,
    isSlowConnection,
    lastOnlineTime: isOnline ? Date.now() : null
  };
};

/**
 * Fetch with timeout
 */
export const fetchWithTimeout = async (
  url: string,
  options: RequestInit = {},
  timeout: number = 30000
): Promise<Response> => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
};

/**
 * Queue for failed requests
 */
export class RequestQueue {
  private queue: Array<{
    id: string;
    fn: () => Promise<any>;
    timestamp: number;
    retries: number;
  }> = [];
  private maxQueueSize = 50;
  private processing = false;

  /**
   * Add request to queue
   */
  add(id: string, fn: () => Promise<any>): void {
    // Don't add if queue is full
    if (this.queue.length >= this.maxQueueSize) {
      console.warn('Request queue is full, dropping oldest request');
      this.queue.shift();
    }

    // Check if request already exists
    const existingIndex = this.queue.findIndex(item => item.id === id);
    if (existingIndex !== -1) {
      // Update existing request
      this.queue[existingIndex] = {
        id,
        fn,
        timestamp: Date.now(),
        retries: this.queue[existingIndex].retries
      };
    } else {
      // Add new request
      this.queue.push({
        id,
        fn,
        timestamp: Date.now(),
        retries: 0
      });
    }
  }

  /**
   * Process queue
   */
  async processQueue(): Promise<void> {
    if (this.processing || this.queue.length === 0) {
      return;
    }

    this.processing = true;

    while (this.queue.length > 0) {
      const item = this.queue[0];

      try {
        await item.fn();
        // Success - remove from queue
        this.queue.shift();
      } catch (error) {
        // Failed - increment retries
        item.retries++;
        
        // Remove if too many retries
        if (item.retries >= 3) {
          console.error('Request failed after 3 retries, dropping:', item.id);
          this.queue.shift();
        } else {
          // Move to back of queue
          this.queue.push(this.queue.shift()!);
          // Wait before next attempt
          await sleep(2000);
        }
      }
    }

    this.processing = false;
  }

  /**
   * Clear queue
   */
  clear(): void {
    this.queue = [];
  }

  /**
   * Get queue size
   */
  size(): number {
    return this.queue.length;
  }
}

/**
 * User-friendly error messages
 */
export const getErrorMessage = (error: any): string => {
  // Network offline
  if (!navigator.onLine) {
    return 'No internet connection. Please check your network.';
  }

  // Timeout
  if (error.name === 'AbortError') {
    return 'Request timed out. Please try again.';
  }

  // Server errors
  if (error.status >= 500) {
    return 'Server error. Our team has been notified. Please try again later.';
  }

  // Rate limiting
  if (error.status === 429) {
    return 'Too many requests. Please wait a moment and try again.';
  }

  // Authentication errors
  if (error.status === 401 || error.status === 403) {
    return 'Authentication error. Please log in again.';
  }

  // Not found
  if (error.status === 404) {
    return 'Resource not found.';
  }

  // Bad request
  if (error.status === 400) {
    return error.message || 'Invalid request. Please check your input.';
  }

  // Generic network error
  if (error.message?.includes('fetch') || error.message?.includes('network')) {
    return 'Network error. Please check your connection and try again.';
  }

  // Default
  return error.message || 'An unexpected error occurred. Please try again.';
};

/**
 * Log error for monitoring
 */
export const logError = (error: any, context: string): void => {
  const errorData = {
    timestamp: new Date().toISOString(),
    context,
    message: error.message,
    status: error.status,
    stack: error.stack,
    userAgent: navigator.userAgent,
    online: navigator.onLine
  };

  console.error('[Network Error]', errorData);

  // In production, send to error tracking service
  // Example: Sentry, LogRocket, etc.
  // if (process.env.NODE_ENV === 'production') {
  //   sendToErrorTracking(errorData);
  // }
};

