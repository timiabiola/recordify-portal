import { useState } from 'react';
import { VoiceButton } from '@/components/VoiceButton';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { BarChart3 } from 'lucide-react';

const Index = () => {
  const [isRecording, setIsRecording] = useState(false);

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
            setIsRecording={setIsRecording} 
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