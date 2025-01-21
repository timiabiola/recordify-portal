const SUPPORTED_FORMATS = ['flac', 'm4a', 'mp3', 'mp4', 'mpeg', 'mpga', 'oga', 'ogg', 'wav', 'webm'];

export function validateAudioFormat(fileName: string): boolean {
  const fileExtension = fileName.split('.').pop()?.toLowerCase();
  console.log('Validating audio format:', fileExtension);
  return fileExtension ? SUPPORTED_FORMATS.includes(fileExtension) : false;
}

export function processBase64Chunks(base64String: string, chunkSize = 32768) {
  try {
    console.log('Processing base64 string of length:', base64String.length);
    
    // Remove the data URL prefix if present and extract MIME type
    let cleanBase64 = base64String;
    let mimeType = 'audio/webm'; // Default MIME type for recording
    let format = 'webm'; // Default format
    
    const matches = base64String.match(/^data:(.+);base64,(.+)$/);
    if (matches) {
      mimeType = matches[1];
      cleanBase64 = matches[2];
      format = mimeType.split('/')[1];
      console.log('Detected MIME type:', mimeType, 'Format:', format);
    }

    // Remove any whitespace
    cleanBase64 = cleanBase64.replace(/\s/g, '');
    
    const chunks: Uint8Array[] = [];
    let position = 0;
    
    while (position < cleanBase64.length) {
      const chunk = cleanBase64.slice(position, position + chunkSize);
      console.log(`Processing chunk at position ${position}, length: ${chunk.length}`);
      
      try {
        const binaryChunk = atob(chunk);
        const bytes = new Uint8Array(binaryChunk.length);
        
        for (let i = 0; i < binaryChunk.length; i++) {
          bytes[i] = binaryChunk.charCodeAt(i);
        }
        
        chunks.push(bytes);
      } catch (chunkError) {
        console.error('Error processing chunk:', {
          position,
          chunkLength: chunk.length,
          error: chunkError.message
        });
        throw new Error(`Failed to process base64 chunk at position ${position}: ${chunkError.message}`);
      }
      
      position += chunkSize;
    }

    console.log('Successfully processed all chunks:', chunks.length);

    const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
    const result = new Uint8Array(totalLength);
    let offset = 0;

    for (const chunk of chunks) {
      result.set(chunk, offset);
      offset += chunk.length;
    }

    console.log('Successfully combined all chunks into final array');
    // Return with original MIME type to maintain format consistency
    return { data: result, mimeType, format };
  } catch (error) {
    console.error('Error in processBase64Chunks:', {
      error: error.message,
      base64Length: base64String.length,
      base64Preview: base64String.substring(0, 100) + '...'
    });
    throw error;
  }
}