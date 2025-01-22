import { supabase } from '@/integrations/supabase/client';
import { toast } from "sonner";
import type { RecordingHandlers } from './types';

export const createRecordingHandlers = (): RecordingHandlers => ({
  handleDataAvailable: (chunks: Blob[], event: BlobEvent) => {
    if (event.data.size > 0) {
      chunks.push(event.data);
    }
  },

  handleRecordingStop: async (chunks: Blob[], mimeType: string) => {
    try {
      const audioBlob = new Blob(chunks, { type: mimeType });
      console.log('Recording stopped, blob size:', audioBlob.size);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('No authenticated user found');
        return;
      }

      const formData = new FormData();
      formData.append('audio', audioBlob);

      const response = await fetch('/api/voice-to-text', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('Voice processing result:', result);

      if (!result.success) {
        toast.error(result.error || 'Failed to process voice recording');
      }
    } catch (error) {
      console.error('Error processing recording:', error);
      toast.error('Failed to process your recording');
    }
  }
});