export const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        console.log('Successfully converted blob to base64');
        resolve(reader.result);
      } else {
        reject(new Error('Failed to convert blob to base64'));
      }
    };
    reader.onerror = (error) => {
      console.error('Error reading blob:', error);
      reject(error);
    };
    reader.readAsDataURL(blob);
  });
};