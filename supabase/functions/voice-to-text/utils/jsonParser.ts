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
    
    try {
      const parsedResponse = JSON.parse(sanitizedResponse);
      console.log("Successfully parsed response:", parsedResponse);
      
      // Validate the required fields are present
      if (!parsedResponse.amount || !parsedResponse.description || !parsedResponse.category) {
        throw new Error("Missing required fields in parsed response");
      }
      
      return parsedResponse;
    } catch (parseError) {
      console.error("Error parsing OpenAI response:", {
        error: parseError,
        originalResponse: response,
        sanitizedResponse: sanitizedResponse
      });
      throw new Error("Failed to parse response from OpenAI: " + parseError.message);
    }
  } catch (sanitizeError) {
    console.error("Error sanitizing OpenAI response:", {
      error: sanitizeError,
      originalResponse: response
    });
    throw new Error("Failed to sanitize response from OpenAI: " + sanitizeError.message);
  }
}