import React from 'react';
import { Mic } from 'lucide-react';

interface VoiceButtonProps {
  isRecording: boolean;
  setIsRecording: (isRecording: boolean) => void;
}

export const VoiceButton: React.FC<VoiceButtonProps> = ({ isRecording, setIsRecording }) => {
  return (
    <div className="relative">
      {/* Pulsing background */}
      <div className={`absolute inset-0 rounded-full bg-blue-500 opacity-20 transition-transform duration-1000 ${
        isRecording ? 'scale-150 animate-pulse' : 'scale-100'
      }`}></div>
      
      {/* Main button */}
      <button
        onClick={() => setIsRecording(!isRecording)}
        className={`relative z-10 rounded-full p-8 shadow-lg transition-all duration-300 ${
          isRecording 
            ? 'bg-red-600 scale-110 hover:bg-red-700' 
            : 'bg-blue-600 hover:bg-blue-700'
        }`}
      >
        <Mic className={`w-12 h-12 text-white ${isRecording ? 'animate-pulse' : ''}`} />
      </button>
      
      {/* Status text */}
      <p className={`mt-4 text-lg ${isRecording ? 'text-red-400' : 'text-gray-400'}`}>
        {isRecording ? 'Recording...' : 'Ready to Record'}
      </p>
    </div>
  );
};