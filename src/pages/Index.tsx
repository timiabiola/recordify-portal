import { useState, useRef } from 'react';
import { VoiceButton } from '@/components/VoiceButton';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { BarChart3, LogOut, Mic, Settings } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { startRecording } from '@/lib/audioRecording';
import { signOut } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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

      console.log('Starting recording process...');
      const recorder = await startRecording({ isRecording, setIsRecording });
      mediaRecorder.current = recorder;
      
      toast({
        title: "Recording started",
        description: "Speak your expense details clearly...",
      });
    } catch (error) {
      console.error('Error in handleStartRecording:', error);
      setIsRecording(false);
    }
  };

  const handleStopRecording = () => {
    console.log('Stopping recording...');
    if (mediaRecorder.current && mediaRecorder.current.state !== 'inactive') {
      mediaRecorder.current.stop();
      setIsRecording(false);
      toast({
        title: "Processing your recording",
        description: "Please wait while we process your expense...",
      });
    }
  };

  return (
    <TooltipProvider>
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 sm:p-6">
        {/* Header with Sign Out */}
        <div className="fixed top-4 right-4">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="icon" onClick={signOut} className="w-10 h-10">
                <LogOut className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Sign Out</TooltipContent>
          </Tooltip>
        </div>
        
        <Card className="w-full max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="text-3xl sm:text-4xl font-bold tracking-tight text-center">
              Record Expense
            </CardTitle>
            <CardDescription className="text-center text-base sm:text-lg">
              Tap the microphone and speak your expense details
            </CardDescription>
          </CardHeader>
          
          <CardContent>
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

            <div className="mt-6 text-center text-sm text-muted-foreground">
              <p>Try saying something like:</p>
              <p className="mt-2 font-medium text-foreground">
                "I spent $25 on lunch at the cafe yesterday"
              </p>
            </div>

            <div className="mt-8 text-center">
              <Link to="/dashboard">
                <Button variant="outline" className="w-full sm:w-auto gap-2">
                  <BarChart3 className="h-5 w-5" />
                  View Dashboard
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
};

export default Index;