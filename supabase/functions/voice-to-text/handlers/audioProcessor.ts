export async function processAudioData(audio: string) {
  // Clean and validate the base64 audio data
  const base64Data = audio.split(',')[1] || audio;
  console.log('Processing base64 audio data of length:', base64Data.length);

  // Convert base64 to binary
  const binaryString = atob(base64Data);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  // Create audio blob with proper MIME type and format
  const audioBlob = new Blob([bytes], { type: 'audio/wav' });
  console.log('Created audio blob of size:', audioBlob.size, 'bytes');

  // Prepare form data for OpenAI
  const formData = new FormData();
  formData.append('file', audioBlob, 'audio.wav');
  formData.append('model', 'whisper-1');
  formData.append('language', 'en');
  formData.append('response_format', 'json');

  console.log('Sending request to OpenAI Whisper API...');
  const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('OpenAI API error:', errorText);
    throw new Error(`OpenAI API error: ${errorText}`);
  }

  return await response.json();
}