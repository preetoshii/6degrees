/**
 * Validates and cleans LLM responses to filter out error messages
 */

// Common error patterns that indicate the LLM didn't understand
const ERROR_PATTERNS = [
  /please (provide|specify)/i,
  /what is the/i,
  /i need a specific/i,
  /could you please/i,
  /i'm sorry/i,
  /cannot generate/i,
  /unable to/i,
  /don't understand/i,
  /clarify/i,
  /which \w+ are you/i,
  /\?$/  // Ends with question mark
];

// Validate if a response looks like an error message
export function isErrorResponse(response) {
  return ERROR_PATTERNS.some(pattern => pattern.test(response));
}

// Clean a list of items, removing error responses
export function cleanResponseList(items, context = '') {
  const cleaned = items.filter(item => {
    if (isErrorResponse(item)) {
      console.warn(`Filtered error response in ${context}: "${item}"`);
      return false;
    }
    // Also filter out extremely long items (likely errors)
    if (item.length > 50) {
      console.warn(`Filtered overly long response in ${context}: "${item.substring(0, 50)}..."`);
      return false;
    }
    return true;
  });
  
  return cleaned;
}

// Validate a single response
export function validateResponse(response, expectedType = 'list') {
  // Check if it's an error response
  if (isErrorResponse(response)) {
    return {
      valid: false,
      reason: 'error_response',
      cleaned: null
    };
  }
  
  // Check for NONE response (valid for roles)
  if (response.trim().toUpperCase() === 'NONE') {
    return {
      valid: true,
      reason: 'none_response',
      cleaned: 'NONE'
    };
  }
  
  // For list responses, check if it's comma-separated
  if (expectedType === 'list' && !response.includes(',') && response.split(' ').length > 3) {
    return {
      valid: false,
      reason: 'not_comma_separated',
      cleaned: null
    };
  }
  
  return {
    valid: true,
    reason: 'ok',
    cleaned: response
  };
}