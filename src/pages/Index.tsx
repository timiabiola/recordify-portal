import { useState, useRef } from 'react';
import { VoiceButton } from '@/components/VoiceButton';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { BarChart3, LogOut } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { startRecording } from '@/lib/audioRecording';

const Index = () => {
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const { toast } = useToast();

  const handleStartRecording = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          variant: "destructive",
          title: "Authentication Required",
          description: "Please sign in to record expenses.",
        });
        return;
      }

      const recorder = await startRecording(setIsRecording);
      mediaRecorder.current = recorder;
      
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
      setIsRecording(false);
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorder.current && mediaRecorder.current.state !== 'inactive') {
      mediaRecorder.current.stop();
      setIsRecording(false);
      toast({
        title: "Processing your recording",
        description: "Please wait while we process your expense...",
      });
    }
  };

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        variant: "destructive",
        title: "Error signing out",
        description: error.message,
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 sm:p-6">
      <div className="fixed top-4 right-4">
        <Button variant="outline" size="icon" onClick={handleSignOut} className="w-10 h-10">
          <LogOut className="h-5 w-5" />
        </Button>
      </div>
      
      <div className="text-center space-y-4 max-w-md w-full px-4">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
          Record Your Expense
        </h1>
        <p className="text-base sm:text-lg text-muted-foreground">
          Simply tap the button and speak your expense
        </p>
        
        <div className="py-8 sm:py-12">
          <VoiceButton 
            isRecording={isRecording} 
            setIsRecording={(recording) => {
              if (recording) {
                handleStartRecording();
              } else {
                handleStopRecording();
              }
            }} 
          />
        </div>

        <div className="mt-6">
          <Link to="/dashboard">
            <Button variant="outline" className="gap-2">
              <BarChart3 className="h-5 w-5" />
              View Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Index;