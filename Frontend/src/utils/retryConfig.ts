// Centralized retry configuration for all API calls
export interface RetryConfig {
  maxRetries: number;
  baseDelayMs: number;
  backoffMultiplier: number;
  timeoutMs?: number;
  jitterMs?: number;
}

// Default retry configurations for different types of API calls
export const RETRY_CONFIGS = {
  // For swap quote API calls (Sushi)
  SWAP_QUOTES: {
    maxRetries: 5,
    baseDelayMs: 1000,
    backoffMultiplier: 1.5,
    timeoutMs: 10000,
    jitterMs: 500
  } as RetryConfig,

  // For price API calls (GeckoTerminal)
  PRICE_API: {
    maxRetries: 4,
    baseDelayMs: 1000,
    backoffMultiplier: 2,
    timeoutMs: 15000,
    jitterMs: 1000
  } as RetryConfig,

  // For RPC calls (balance queries, etc.)
  RPC_CALLS: {
    maxRetries: 3,
    baseDelayMs: 500,
    backoffMultiplier: 2,
    timeoutMs: 8000,
    jitterMs: 300
  } as RetryConfig,

  // For transaction submission
  TRANSACTIONS: {
    maxRetries: 2,
    baseDelayMs: 2000,
    backoffMultiplier: 3,
    timeoutMs: 30000,
    jitterMs: 1000
  } as RetryConfig
};

// Generic retry function that can be used by any API call
export async function withRetry<T>(
  operation: () => Promise<T>,
  config: RetryConfig,
  context: string = 'API call'
): Promise<T> {
  let attempt = 0;
  let lastError: Error;

  while (attempt <= config.maxRetries) {
    try {
      if (attempt > 0) {
        console.log(`🔄 Retrying ${context} (attempt ${attempt + 1}/${config.maxRetries + 1})`);
      }

      // Set timeout if specified
      let result: T;
      if (config.timeoutMs) {
        result = await Promise.race([
          operation(),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error(`${context} timed out after ${config.timeoutMs}ms`)), config.timeoutMs)
          )
        ]);
      } else {
        result = await operation();
      }

      if (attempt > 0) {
        console.log(`✅ ${context} succeeded on attempt ${attempt + 1}`);
      }

      return result;
    } catch (error: any) {
      lastError = error;
      console.warn(`❌ ${context} attempt ${attempt + 1} failed:`, error.message);

      if (attempt === config.maxRetries) {
        console.error(`🚨 All ${config.maxRetries + 1} attempts failed for ${context}`);
        throw new Error(`${context} failed after ${config.maxRetries + 1} attempts. Last error: ${error.message}`);
      }

      // Calculate backoff delay with jitter
      const backoffDelay = config.baseDelayMs * Math.pow(config.backoffMultiplier, attempt);
      const jitter = config.jitterMs ? Math.random() * config.jitterMs : 0;
      const waitTime = backoffDelay + jitter;

      console.log(`⏳ Retrying ${context} in ${Math.round(waitTime)}ms...`);
      await new Promise((resolve) => setTimeout(resolve, waitTime));
      attempt += 1;
    }
  }

  throw lastError;
}

// Specialized retry functions for common use cases
export const retrySwapQuote = <T>(operation: () => Promise<T>, context: string = 'swap quote') =>
  withRetry(operation, RETRY_CONFIGS.SWAP_QUOTES, context);

export const retryPriceAPI = <T>(operation: () => Promise<T>, context: string = 'price API') =>
  withRetry(operation, RETRY_CONFIGS.PRICE_API, context);

export const retryRPCCall = <T>(operation: () => Promise<T>, context: string = 'RPC call') =>
  withRetry(operation, RETRY_CONFIGS.RPC_CALLS, context);

export const retryTransaction = <T>(operation: () => Promise<T>, context: string = 'transaction') =>
  withRetry(operation, RETRY_CONFIGS.TRANSACTIONS, context);

// Utility to check if error is retryable
export function isRetryableError(error: any): boolean {
  const retryableErrors = [
    'network error',
    'timeout',
    'connection refused',
    'rate limit',
    'too many requests',
    'service unavailable',
    'internal server error',
    'bad gateway',
    'gateway timeout'
  ];

  const errorMessage = (error.message || '').toLowerCase();
  return retryableErrors.some(retryableError => errorMessage.includes(retryableError));
}

// Enhanced retry that only retries on retryable errors
export async function withSmartRetry<T>(
  operation: () => Promise<T>,
  config: RetryConfig,
  context: string = 'API call'
): Promise<T> {
  let attempt = 0;
  let lastError: Error;

  while (attempt <= config.maxRetries) {
    try {
      if (attempt > 0) {
        console.log(`🔄 Retrying ${context} (attempt ${attempt + 1}/${config.maxRetries + 1})`);
      }

      const result = await operation();

      if (attempt > 0) {
        console.log(`✅ ${context} succeeded on attempt ${attempt + 1}`);
      }

      return result;
    } catch (error: any) {
      lastError = error;
      console.warn(`❌ ${context} attempt ${attempt + 1} failed:`, error.message);

      // Check if error is retryable
      if (!isRetryableError(error)) {
        console.log(`🛑 Error is not retryable, failing immediately: ${error.message}`);
        throw error;
      }

      if (attempt === config.maxRetries) {
        console.error(`🚨 All ${config.maxRetries + 1} attempts failed for ${context}`);
        throw new Error(`${context} failed after ${config.maxRetries + 1} attempts. Last error: ${error.message}`);
      }

      // Calculate backoff delay with jitter
      const backoffDelay = config.baseDelayMs * Math.pow(config.backoffMultiplier, attempt);
      const jitter = config.jitterMs ? Math.random() * config.jitterMs : 0;
      const waitTime = backoffDelay + jitter;

      console.log(`⏳ Retrying ${context} in ${Math.round(waitTime)}ms...`);
      await new Promise((resolve) => setTimeout(resolve, waitTime));
      attempt += 1;
    }
  }

  throw lastError;
}