export function sanitizeJsonResponse(response: string): string {
  return response
    .replace(/```json/g, '')  // Remove ```json
    .replace(/```/g, '')      // Remove remaining backticks
    .trim();                  // Remove extra whitespace
}

export function parseOpenAIResponse(response: string) {
  try {
    const sanitizedResponse = sanitizeJsonResponse(response);
    console.log("Sanitized response:", sanitizedResponse);
    
    const parsedResponse = JSON.parse(sanitizedResponse);
    console.log("Successfully parsed response:", parsedResponse);
    return parsedResponse;
  } catch (parseError) {
    console.error("Error parsing OpenAI response:", {
      error: parseError,
      originalResponse: response,
      sanitizedResponse: sanitizeJsonResponse(response)
    });
    throw new Error("Failed to parse response from OpenAI");
  }
}