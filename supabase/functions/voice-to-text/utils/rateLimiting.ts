// Simple in-memory rate limiting (resets on function cold starts)
const MAX_REQUESTS_PER_MINUTE = 50;
const lastRequestTimes: number[] = [];

export function checkRateLimit() {
  const now = Date.now();
  const oneMinuteAgo = now - 60000;
  
  // Remove requests older than 1 minute
  while (lastRequestTimes.length > 0 && lastRequestTimes[0] < oneMinuteAgo) {
    lastRequestTimes.shift();
  }
  
  if (lastRequestTimes.length >= MAX_REQUESTS_PER_MINUTE) {
    throw new Error('Rate limit exceeded. Please try again in a minute.');
  }
  
  lastRequestTimes.push(now);
}