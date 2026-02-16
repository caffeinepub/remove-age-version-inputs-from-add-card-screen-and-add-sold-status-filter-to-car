/**
 * Utility to redact sensitive values from error messages and logs
 * Prevents accidental exposure of tokens and secrets in the UI
 */

const SENSITIVE_PARAM_NAMES = [
  'caffeineAdminToken',
  'adminToken',
  'token',
  'secret',
  'password',
  'apiKey',
  'api_key',
];

/**
 * Redacts sensitive parameter values from a string
 * Handles both query-string-like patterns and arbitrary occurrences
 * 
 * @param text - The text to redact
 * @returns The text with sensitive values replaced by [REDACTED]
 */
export function redactSecrets(text: string): string {
  if (!text) return text;
  
  let redacted = text;
  
  // Redact query-string-like patterns: paramName=value
  for (const paramName of SENSITIVE_PARAM_NAMES) {
    // Match paramName=value (where value is non-whitespace characters)
    const queryPattern = new RegExp(
      `${paramName}=([^&\\s#]+)`,
      'gi'
    );
    redacted = redacted.replace(queryPattern, `${paramName}=[REDACTED]`);
  }
  
  // Redact sessionStorage references
  redacted = redacted.replace(
    /sessionStorage\.getItem\(['"]([^'"]+)['"]\)/g,
    'sessionStorage.getItem("[REDACTED]")'
  );
  
  return redacted;
}

/**
 * Redacts secrets from an Error object
 * Returns a new error with redacted message and stack
 * 
 * @param error - The error to redact
 * @returns A new error with redacted information
 */
export function redactErrorSecrets(error: Error): Error {
  const redactedError = new Error(redactSecrets(error.message));
  redactedError.name = error.name;
  
  if (error.stack) {
    redactedError.stack = redactSecrets(error.stack);
  }
  
  return redactedError;
}

/**
 * Safely converts an unknown error to a string with redacted secrets
 * 
 * @param error - The error to convert
 * @returns A redacted string representation of the error
 */
export function errorToRedactedString(error: unknown): string {
  if (error instanceof Error) {
    return redactSecrets(error.message);
  }
  
  if (typeof error === 'string') {
    return redactSecrets(error);
  }
  
  try {
    return redactSecrets(String(error));
  } catch {
    return 'Unknown error';
  }
}
