import { useState } from 'react';
import { VoiceButton } from '@/components/VoiceButton';

const Index = () => {
  const [isRecording, setIsRecording] = useState(false);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <VoiceButton 
          isRecording={isRecording} 
          setIsRecording={setIsRecording} 
        />
      </div>
    </div>
  );
};

export default Index;