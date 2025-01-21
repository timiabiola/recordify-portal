import { useState, useRef } from 'react';
import { VoiceButton } from '@/components/VoiceButton';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { BarChart3 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const Index = () => {
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const { toast } = useToast();

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder.current = new MediaRecorder(stream);
      audioChunks.current = [];

      mediaRecorder.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.current.push(event.data);
        }
      };

      mediaRecorder.current.onstop = async () => {
        const audioBlob = new Blob(audioChunks.current, { type: 'audio/webm' });
        await processAudio(audioBlob);
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.current.start();
      setIsRecording(true);
      
      toast({
        title: "Recording started",
        description: "Speak your expense details clearly...",
      });
    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        variant: "destructive",
        title: "Could not start recording",
        description: "Please make sure you have granted microphone permissions.",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorder.current && mediaRecorder.current.state !== 'inactive') {
      mediaRecorder.current.stop();
      setIsRecording(false);
      toast({
        title: "Processing your recording",
        description: "Please wait while we process your expense...",
      });
    }
  };

  const processAudio = async (audioBlob: Blob) => {
    try {
      // Get the current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Convert blob to base64
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      
      reader.onloadend = async () => {
        const base64Audio = reader.result as string;
        
        // Send to our Edge Function
        const { data, error } = await supabase.functions.invoke('voice-to-text', {
          body: { 
            audio: base64Audio,
            userId: user.id
          }
        });

        if (error) {
          throw error;
        }

        console.log('Processed expense:', data);
        toast({
          title: "Expense recorded!",
          description: `Added expense: ${data.expense.amount} for ${data.expense.description}`,
        });
      };
    } catch (error) {
      console.error('Error processing audio:', error);
      toast({
        variant: "destructive",
        title: "Error processing recording",
        description: "There was an error processing your expense. Please try again.",
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <div className="text-center space-y-6 max-w-md w-full">
        <h1 className="text-4xl font-bold tracking-tight text-foreground">
          Record Your Expense
        </h1>
        <p className="text-lg text-muted-foreground">
          Simply tap the button and speak your expense
        </p>
        
        <div className="py-12">
          <VoiceButton 
            isRecording={isRecording} 
            setIsRecording={(recording) => {
              if (recording) {
                startRecording();
              } else {
                stopRecording();
              }
            }} 
          />
        </div>

        <div className="mt-8">
          <Link to="/dashboard">
            <Button variant="outline" className="gap-2">
              <BarChart3 className="w-4 h-4" />
              View Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Index;